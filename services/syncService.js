/**
 * ============================================
 * SYNC SERVICE - Produk antara device (via Supabase)
 * ============================================
 *
 * Arsitektur: Supabase Postgres = source ngot.
 * Semua HP upload+download produk lewat table `products` di Supabase.
 *
 * Local id (AUTOINCREMENT) berbeda per device — makanya pakai
 * `sync_id` (global unique) sebagai key di cloud.
 *
 * Merge rule (last-write-wins by updated_at):
 * - lokal.updated_at > remote.updated_at -> upload (lokal win)
 * - remote.updated_at > lokal.updated_at -> download (remote win)
 * - hapus: soft-delete (aktif=0) propagasi via sync
 *
 * Env supabase kosong -> fungsi balikin {success:false, reason:"no_config"}
 * (offline-first: app jalan normal tanpa cloud).
 */

import { supabase } from "../utils/supabaseClient";
import {
  ambilSemuaProduk,
  tambahProduk,
  updateProduk,
  setProdukSyncId,
  hapusProduk,
} from "../database/productService";

const TABLE = "products";
const productKey = (p) => `${String(p.nama || "").trim().toLowerCase()}\u0000${String(p.kategori || "Umum").trim().toLowerCase()}`;

export const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes(".") && !url.includes("placeholder") && key.length > 20;
};

/**
 * Upload semua produk lokal yang lebih baru ke cloud
 * @returns {Object} {success, uploaded, skipped}
 */
export const syncProdukUpload = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: "no_config" };
  }

  try {
    const local = await ambilSemuaProduk({ aktifOnly: false });
    const { data: remoteAll, error: remoteErr } = await supabase
      .from(TABLE)
      .select("sync_id, nama, kategori, barcode, updated_at")
      .limit(1000);
    if (remoteErr) throw remoteErr;

    const remoteBySyncId = new Map((remoteAll || []).map((p) => [p.sync_id, p]));
    const remoteByKey = new Map((remoteAll || []).map((p) => [productKey(p), p]));
    let uploaded = 0;
    let skipped = 0;

    for (const product of local) {
      let p = product;
      let remote = remoteBySyncId.get(p.sync_id);

      // Produk seed lama punya sync_id berbeda per instalasi. Cocokkan nama+kategori
      // sekali agar barcode hasil scan tidak membuat produk cloud duplikat.
      if (!remote) {
        const sameProduct = remoteByKey.get(productKey(p));
        if (sameProduct) {
          await setProdukSyncId(p.id, sameProduct.sync_id);
          p = { ...p, sync_id: sameProduct.sync_id };
          remote = sameProduct;
        }
      }

      const localTs = new Date(p.updated_at).getTime();
      const remoteTs = remote ? new Date(remote.updated_at).getTime() : 0;
      const barcodeChanged = Boolean(p.barcode) && p.barcode !== remote?.barcode;

      if (!remote || localTs > remoteTs || barcodeChanged) {
        const { error } = await supabase
          .from(TABLE)
          .upsert(
            {
              sync_id: p.sync_id,
              nama: p.nama,
              harga: p.harga,
              kategori: p.kategori,
              stok: p.stok,
              foto: p.foto,
              barcode: p.barcode,
              aktif: p.aktif,
              created_at: p.created_at,
              updated_at: p.updated_at,
            },
            { onConflict: "sync_id" },
          );
        if (error) throw error;
        uploaded++;
      } else {
        skipped++;
      }
    }

    console.log(
      `📤 Sync upload: ${uploaded} upload, ${skipped} skip (konsisten)`,
    );
    return { success: true, uploaded, skipped };
  } catch (error) {
    if (error?.code === "PGRST205" || error?.message?.includes("PGRST205")) {
      console.warn("⚠️ Sync upload skipped: Tabel 'products' belum dibuat di Supabase.");
      return { success: false, reason: "table_missing", message: "Tabel 'products' belum ada di Supabase" };
    }
    console.error("❌ Sync upload error:", error);
    return { success: false, reason: "error", message: error.message };
  }
};

/**
 * Download semua produk cloud yang lebih baru ke lokal
 * @returns {Object} {success, downloaded, deleted, skipped}
 */
export const syncProdukDownload = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: "no_config" };
  }

  try {
    const local = await ambilSemuaProduk({ aktifOnly: false });
    const localBySyncId = new Map(
      local.filter((p) => p.sync_id).map((p) => [p.sync_id, p]),
    );
    const localByKey = new Map(local.map((p) => [productKey(p), p]));

    const { data: remoteAll, error } = await supabase
      .from(TABLE)
      .select("sync_id, nama, harga, kategori, stok, foto, barcode, aktif, created_at, updated_at")
      .limit(1000);

    if (error) throw error;

    let downloaded = 0;
    let deleted = 0;
    let skipped = 0;

    for (const remote of remoteAll || []) {
      let localP = localBySyncId.get(remote.sync_id);
      // Seed lama punya sync_id berbeda antar instalasi. Satukan berdasarkan
      // nama+kategori agar barcode dan data edit tidak menjadi produk duplikat.
      if (!localP) {
        const sameProduct = localByKey.get(productKey(remote));
        if (sameProduct) {
          await setProdukSyncId(sameProduct.id, remote.sync_id);
          localP = { ...sameProduct, sync_id: remote.sync_id };
          localBySyncId.set(remote.sync_id, localP);
        }
      }
      const remoteTs = new Date(remote.updated_at).getTime();
      const localTs = localP ? new Date(localP.updated_at).getTime() : 0;

      if (!localP) {
        // Produk hanya di cloud -> insert lokal (sync_id tetap dari cloud)
        await tambahProduk({
          nama: remote.nama,
          harga: remote.harga,
          kategori: remote.kategori,
          stok: remote.stok,
          foto: remote.foto,
          barcode: remote.barcode,
          sync_id: remote.sync_id,
        });
        downloaded++;
      } else if (remoteTs > localTs) {
        if (remote.aktif === 0) {
          await hapusProduk(localP.id); // soft delete
          deleted++;
        } else {
          await updateProduk(localP.id, {
            nama: remote.nama,
            harga: remote.harga,
            kategori: remote.kategori,
            stok: remote.stok,
            foto: remote.foto,
            barcode: remote.barcode,
          });
          downloaded++;
        }
      } else {
        skipped++;
      }
    }

    console.log(
      `📥 Sync download: ${downloaded} download, ${deleted} hapus, ${skipped} skip`,
    );
    return { success: true, downloaded, deleted, skipped };
  } catch (error) {
    if (error?.code === "PGRST205" || error?.message?.includes("PGRST205")) {
      console.warn("⚠️ Sync download skipped: Tabel 'products' belum dibuat di Supabase.");
      return { success: false, reason: "table_missing", message: "Tabel 'products' belum ada di Supabase" };
    }
    console.error("❌ Sync download error:", error);
    return { success: false, reason: "error", message: error.message };
  }
};