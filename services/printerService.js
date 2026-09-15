/**
 * ============================================
 * PRINTER SERVICE - STRUK THERMAL 58mm
 * ============================================
 *
 * Abstraksi cetak struk ke printer Bluetooth 58mm (ESC/POS).
 *
 * FASE A (Expo Go): isPrinterAvailable() = false, printStruk() kembali
 * { code: 'NEEDS_DEV_BUILD' }. UI & builder teks tetap bisa diuji penuh.
 *
 * FASE B (dev build): ganti isi services/printerNative.js sesuai instruksi
 * di file tsb -> seluruh fungsi ini langsung berfungsi tanpa edit lain.
 */

import {
  isNativeAvailable,
  isBluetoothEnabled as nativeIsBluetoothEnabled,
  getBondedDevices as nativeGetBondedDevices,
  createPrinter,
} from "./printerNative";
import usePrinterStore from "../store/printerStore";

const CHARS = 32;

const formatRupiahCompact = (n) =>
  `Rp${(n || 0).toLocaleString("id-ID")}`;

const center = (text, width = CHARS) => {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  return " ".repeat(left) + text + " ".repeat(pad - left);
};

const padRow = (left, right, width = CHARS) => {
  const r = right.slice(0, width);
  const l = left.slice(0, Math.max(0, width - r.length));
  return l + " ".repeat(width - l.length - r.length) + r;
};

const wrapText = (text, max = CHARS) => {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length <= max) {
      line = (line + " " + word).trim();
    } else {
      if (line) lines.push(line);
      let rest = word;
      while (rest.length > max) {
        lines.push(rest.slice(0, max));
        rest = rest.slice(max);
      }
      line = rest;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const formatWaktu = (iso) => {
  if (!iso) return new Date().toLocaleString("id-ID");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Bangun teks struk ESC/POS polos (bisa dipakai untuk preview).
 * @returns {string}
 */
export function buildStrukText({ trxId, waktu, kasir = "Admin", items = [], total = 0, totalBayar = 0, kembalian = 0 }) {
  const lines = [];
  const sep = "=".repeat(CHARS);

  lines.push(sep);
  lines.push(center("WARUNG POS"));
  lines.push(center("Jl. Raya No. 123"));
  lines.push(center("Telp: 0812-3456-7890"));
  lines.push(sep);

  lines.push(`${formatWaktu(waktu)}`);
  lines.push(`#TRX-${trxId || "-"}`);
  lines.push(`Kasir: ${kasir}`);
  lines.push(sep);

  (items || []).forEach((item) => {
    const nama = item.nama || "Item";
    wrapText(nama).forEach((l) => lines.push(l));
    const qtyLine = `${item.qty} x ${formatRupiahCompact(item.harga)}`;
    const subTotal = item.subtotal ?? item.qty * item.harga;
    lines.push(padRow(qtyLine, formatRupiahCompact(subTotal)));
  });

  lines.push(sep);
  lines.push(padRow("TOTAL", formatRupiahCompact(total)));
  lines.push(padRow("BAYAR", formatRupiahCompact(totalBayar)));
  lines.push(padRow("KEMBALI", formatRupiahCompact(kembalian)));
  lines.push(sep);

  lines.push(center("Terima Kasih"));
  lines.push(center("Selamat Berbelanja"));
  lines.push("");

  return lines.join("\n");
}

export function isPrinterAvailable() {
  if (!isNativeAvailable) {
    return {
      available: false,
      message:
        "Fitur printer butuh development build.\n\nLangkah: instal expo-bluetooth-thermal-printer, tambah permission Bluetooth di app.json, lalu jalankan EAS build development.",
    };
  }
  return { available: true };
}

/**
 * @returns {Promise<{success:boolean, data?:any, code?:string, message?:string}>}
 */
export async function getBondedDevices() {
  const st = await updatePrinterStore();
  if (!st.ok) return st;
  try {
    const devices = await nativeGetBondedDevices();
    return { success: true, data: devices || [] };
  } catch (e) {
    return wrapNativeError(e);
  }
}

export async function isBluetoothEnabled() {
  const st = await updatePrinterStore();
  if (!st.ok) return st;
  try {
    const enabled = await nativeIsBluetoothEnabled();
    return { success: true, data: enabled };
  } catch (e) {
    return wrapNativeError(e);
  }
}

const updatePrinterStore = async () => {
  if (!isNativeAvailable) {
    return wrapNativeError(new Error("NATIVE_UNAVAILABLE"));
  }
  return { ok: true };
};

export async function connectPrinter(address) {
  const st = await updatePrinterStore();
  if (!st.ok) return st;
  try {
    const printer = createPrinter("58mm");
    await printer.connect(address);
    usePrinterStore.getState().setConnected(true);
    return { success: true };
  } catch (e) {
    return wrapNativeError(e);
  }
}

export async function disconnectPrinter() {
  try {
    if (isNativeAvailable) {
      const printer = createPrinter("58mm");
      printer.disconnect();
    }
  } catch (_) {}
  usePrinterStore.getState().setConnected(false);
  return { success: true };
}

/**
 * Cetak struk ke printer. Jika native belum tersedia -> NEEDS_DEV_BUILD.
 * @returns {Promise<{success:boolean, message?:string, code?:string}>}
 */
export async function printStruk({ trxId, waktu, items, total, totalBayar, kembalian }) {
  const text = buildStrukText({ trxId, waktu, items, total, totalBayar, kembalian });

  const av = isPrinterAvailable();
  if (!av.available) {
    return { success: false, code: "NEEDS_DEV_BUILD", message: av.message };
  }

  const store = usePrinterStore.getState();
  const address = store.printerAddress;
  if (!address) {
    return { success: false, message: "Belum ada printer dipilih. Pilih dulu di Pengaturan > Printer Bluetooth." };
  }

  try {
    const printer = createPrinter("58mm");
    await printer.connect(address);
    await printer.initialize();
    await printer.alignLeft();
    text.split("\n").forEach(async (line) => {
      if (line.startsWith("TOTAL") || line === "=".repeat(CHARS)) {
        // keep simple: send as-is; bold handled per-line natively
      }
      await printer.println(line || " ");
    });
    await printer.feed(4);
    await printer.cut();
    usePrinterStore.getState().setConnected(true);
    return { success: true, message: "Struk berhasil dicetak" };
  } catch (e) {
    usePrinterStore.getState().setConnected(false);
    return wrapNativeError(e);
  }
}

const wrapNativeError = (e) => {
  if (e && e.message === "NATIVE_UNAVAILABLE") {
    return { success: false, code: "NEEDS_DEV_BUILD", message: isPrinterAvailable().message };
  }
  return {
    success: false,
    message: e && e.message ? `Gagal terhubung ke printer: ${e.message}` : "Gagal terhubung ke printer.",
  };
};