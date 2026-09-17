/**
 * ============================================
 * SCREEN PEMBAYARAN & CHECKOUT
 * ============================================
 *
 * Clean & Spacious Checkout:
 * - 2 hero numbers (Tagihan | Uang Masuk) sejajar
 * - Direct numeric input (no chip modal barrier)
 * - Larger item rows (15-16px, breathable)
 * - Material Symbols (no emoji)
 * - No green/red background blocks
 * - Auto-print toggle moved to Settings
 */

import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../constants/theme";
import useCartStore from "../store/cartStore";
import usePrinterStore from "../store/printerStore";
import { printStruk } from "../services/printerService";
import ReceiptView from "../components/ReceiptView";
import { MaterialIcon } from "../components/MaterialIcon";
import { tambahHutang } from "../database/service";
import { showSuccess, showError, showWarning, showInfo } from "../utils/alertHelper";

const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const formatInput = (text) => {
  const numbers = String(text || "").replace(/\D/g, "");
  return numbers === "" ? "" : parseInt(numbers, 10).toLocaleString("id-ID");
};
const parseInput = (text) => {
  const numbers = String(text || "").replace(/\D/g, "");
  return numbers === "" ? 0 : parseInt(numbers, 10);
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalHarga, kurangiItem, tambahQtyItem, checkout } =
    useCartStore();
  const receiptRef = useRef(null);

  const [payMethod, setPayMethod] = useState("tunai");
  const [cashText, setCashText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const printerName = usePrinterStore((s) => s.printerName);

  useEffect(() => {
    usePrinterStore.getState().loadSavedPrinter();
  }, []);

  const handleShareReceipt = React.useCallback(async () => {
    if (!lastReceipt) return;
    const { r, kembalian } = lastReceipt;
    try {
      const uri = await captureRef(receiptRef, {
        format: "jpg",
        quality: 0.9,
      });
      setLastReceipt(null);
      await Sharing.shareAsync(uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Bagikan Struk Pembayaran",
      });
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Error capture receipt:", e);
      setLastReceipt(null);
      showError("Error", "Gagal membuat struk");
    }
  }, [lastReceipt, router]);

  useEffect(() => {
    if (lastReceipt && receiptRef.current) {
      const timer = setTimeout(() => handleShareReceipt(), 600);
      return () => clearTimeout(timer);
    }
  }, [lastReceipt, handleShareReceipt]);

  // Sync cash input with total initially
  useEffect(() => {
    if (cashText === "") {
      // Sync initial value once; guarded & stable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCashText(formatInput(totalHarga));
    }
  }, [totalHarga]);

  const cash = parseInput(cashText);
  const change = cash - totalHarga;
  const sufficient = payMethod !== "tunai" || change >= 0;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const setQuickCash = (amount) => {
    setCashText(formatInput(amount));
  };

  const finish = async (mode) => {
    if (!items.length) return;
    if (payMethod === "tunai" && cash < totalHarga) {
      showWarning("Uang Kurang", `Kurang ${formatRupiah(totalHarga - cash)}`);
      return;
    }
    if (payMethod === "kasbon" && !customerName.trim()) {
      showWarning("Nama Pelanggan", "Silakan isi nama pelanggan untuk kasbon.");
      return;
    }
    setProcessing(true);
    try {
      if (payMethod === "kasbon") {
        await tambahHutang(customerName.trim(), customerPhone.trim(), totalHarga, items);
      }
      const r = await checkout(
        payMethod === "tunai" ? cash : 0,
        payMethod === "tunai" ? Math.max(0, cash - totalHarga) : 0,
        payMethod,
        payMethod === "kasbon" ? customerName.trim() : null,
      );
      if (r.success) {
        const kembalian =
          payMethod === "tunai" ? Math.max(0, cash - totalHarga) : 0;

        if (mode === "share") {
          try {
            const ok = await Sharing.isAvailableAsync();
            if (ok) {
              setLastReceipt({ r, kembalian });
            } else {
              showSuccess(
                "Transaksi Berhasil",
                `#TRX-${r.data.id} disimpan.\nKembalian: ${formatRupiah(kembalian)}`,
                { confirmText: "OK", onConfirm: () => router.replace("/(tabs)") },
              );
            }
          } catch (_) {}
        } else if (mode === "cetak") {
          await handlePrint(r.data, kembalian);
        } else {
          showSuccess(
            "Transaksi Berhasil",
            `#TRX-${r.data.id} disimpan.\nKembalian: ${formatRupiah(kembalian)}`,
            { confirmText: "OK", onConfirm: () => router.replace("/(tabs)") },
          );
        }
      } else {
        showError("Gagal", r.message);
      }
    } catch (e) {
      showError("Error", e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = async (trx, kembalian) => {
    try {
      const res = await printStruk({
        trxId: trx.id,
        waktu: trx.waktuTransaksi,
        items: trx.daftarBarang || [],
        total: trx.totalHarga,
        totalBayar: cash,
        kembalian,
      });
      if (res.success) {
        showSuccess("Struk Tercetak", `#TRX-${trx.id} berhasil dicetak.`, {
          confirmText: "OK",
          onConfirm: () => router.replace("/(tabs)"),
        });
      } else if (res.code === "NEEDS_DEV_BUILD") {
        showInfo(
          "Printer Belum Aktif",
          res.message,
          { confirmText: "OK", onConfirm: () => router.replace("/(tabs)") },
        );
      } else {
        showError("Gagal Cetak", res.message);
      }
    } catch (e) {
      showError("Error", e.message);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Nav: minimal, no decoration */}
      <View style={s.nav}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Kembali</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Pembayaran</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO: Tagihan Total Solo (Clean & Big) */}
        <View style={s.heroRow}>
          <View style={s.heroCol}>
            <Text style={s.heroLabel}>TOTAL TAGIHAN</Text>
            <Text style={s.heroTotal}>{formatRupiah(totalHarga)}</Text>
            <Text style={s.heroMeta}>
              {totalQty} pcs • {items.length} jenis barang
            </Text>
          </View>
        </View>

        {/* METODE BAYAR */}
        <Text style={s.secLabel}>METODE BAYAR</Text>
        <View style={s.methodRow}>
          {[
            { id: "tunai", label: "Tunai" },
            { id: "qris", label: "QRIS" },
            { id: "kasbon", label: "Kasbon" },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[s.methodBtn, payMethod === m.id && s.methodBtnOn]}
              onPress={() => {
                setPayMethod(m.id);
                if (m.id === "tunai") {
                  setCashText(formatInput(totalHarga));
                } else {
                  setCashText("");
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[s.methodText, payMethod === m.id && s.methodTextOn]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INPUT UANG MASUK (Manual Input - Full Width & Larger) */}
        {payMethod === "tunai" && (
          <View style={s.cashSection}>
            <Text style={s.secLabel}>MASUKKAN UANG / BAYAR MANUAL</Text>
            <View style={s.inputBoxFull}>
              <Text style={s.inputRpFull}>Rp</Text>
              <TextInput
                style={s.inputFieldFull}
                value={cashText}
                onChangeText={(t) => setCashText(formatInput(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#D6D3D1"
                maxLength={11}
              />
            </View>

            {/* Quick Cash Shortcuts */}
            <View style={s.quickRow}>
              {[
                { id: "pas", label: "Uang Pas", value: totalHarga },
                { id: "50k", label: "50.000", value: 50000 },
                { id: "100k", label: "100.000", value: 100000 },
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={s.quickBtn}
                  onPress={() => setQuickCash(c.value)}
                  activeOpacity={0.7}
                >
                  <Text style={s.quickLabel}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Kembalian Row */}
            <View style={s.changeRow}>
              <Text style={s.changeLabel}>
                {change < 0 ? "Kurang bayar" : "Kembalian"}
              </Text>
              <Text
                style={[
                  s.changeAmount,
                  change < 0 ? s.changeAmountErr : s.changeAmountOk,
                ]}
              >
                {change < 0
                  ? `- ${formatRupiah(Math.abs(change))}`
                  : formatRupiah(change)}
              </Text>
            </View>
          </View>
        )}

        {/* INPUT KASBON (Nama & NO HP) */}
        {payMethod === "kasbon" && (
          <View style={s.cashSection}>
            <Text style={s.secLabel}>DATA PELANGGAN KASBON</Text>
            <View style={[s.inputBoxFull, { marginBottom: 12 }]}>
              <TextInput
                style={s.inputFieldFull}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Nama Pelanggan (Wajib)"
                placeholderTextColor="#A8A29E"
              />
            </View>
            <View style={s.inputBoxFull}>
              <TextInput
                style={s.inputFieldFull}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                placeholder="Nomor HP / WA (Opsional)"
                placeholderTextColor="#A8A29E"
              />
            </View>
          </View>
        )}

        {/* Spacer besar sebagai pemisah visual (no divider line) */}
        <View style={{ height: 32 }} />

        {/* Rincian Belanja (Flat List, Larger Text) */}
        <Text style={s.secLabel}>RINCIAN BELANJA</Text>
        {items.map((item) => (
          <View key={item.uniqueId} style={s.itemRow}>
            <View style={s.itemLeft}>
              <Text style={s.itemName} numberOfLines={1}>
                {item.tipe === "jajanan"
                  ? `Jajanan ${formatRupiah(item.harga)}`
                  : item.nama}
              </Text>
              <Text style={s.itemMeta}>
                {formatRupiah(item.harga)} / item
              </Text>
            </View>

            <View style={s.itemRight}>
              <TouchableOpacity
                onPress={() => kurangiItem(item.uniqueId)}
                style={s.qtyBtn}
              >
                <Text style={s.qtyMinus}>−</Text>
              </TouchableOpacity>
              <Text style={s.qtyVal}>{item.qty}</Text>
              <TouchableOpacity
                onPress={() => tambahQtyItem(item.uniqueId)}
                style={s.qtyBtn}
              >
                <Text style={s.qtyPlus}>+</Text>
              </TouchableOpacity>
              <Text style={s.itemSubtotal}>
                {formatRupiah(item.harga * item.qty)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.btnMain, (!sufficient || processing) && s.btnOff]}
          onPress={() => finish(null)}
          disabled={!sufficient || processing}
          activeOpacity={0.85}
        >
          <Text style={s.btnMainText}>
            {processing ? "Memproses..." : "Selesaikan Transaksi"}
          </Text>
        </TouchableOpacity>

        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.btnCompact, s.btnCompactPrimary, (!sufficient || processing) && s.btnOff]}
            onPress={() => finish("cetak")}
            disabled={!sufficient || processing}
            activeOpacity={0.85}
          >
            <MaterialIcon name="print" size={14} color="#FFFFFF" />
            <Text style={s.btnCompactPrimaryText}>Cetak Struk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnCompact, s.btnCompactWA, (!sufficient || processing) && s.btnOff]}
            onPress={() => finish("share")}
            disabled={!sufficient || processing}
            activeOpacity={0.85}
          >
            <MaterialIcon name="share" size={14} color="#FFFFFF" />
            <Text style={s.btnCompactWAText}>Bagikan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hidden Receipt Modal for capture */}
      {lastReceipt && (
        <View style={s.receiptCanvas}>
          <View
            ref={receiptRef}
            collapsable={false}
            style={s.receiptWrap}
          >
            <ReceiptView
              transaksi={{ total: lastReceipt.r.data.totalHarga }}
              items={lastReceipt.r.data.daftarBarang || []}
              totalBayar={cash}
              kembalian={lastReceipt.kembalian}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Nav
  nav: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 80,
  },
  backArrow: {
    fontSize: 20,
    color: "#1C1917",
  },
  backLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1917",
  },
  navTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollInner: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 140,
  },

  // Hero 1-col
  heroRow: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  heroCol: {
    gap: 4,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: 1,
  },
  heroTotal: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1C1917",
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontSize: 12,
    color: "#57534E",
  },

  // Cash Section (Under Metode Bayar)
  cashSection: {
    marginTop: 20,
  },
  inputBoxFull: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF7F4",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E7E5E4",
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  inputRpFull: {
    fontSize: 18,
    fontWeight: "700",
    color: "#A8A29E",
    marginRight: 8,
  },
  inputFieldFull: {
    flex: 1,
    fontSize: 26,
    fontWeight: "800",
    color: "#1C1917",
    padding: 0,
    margin: 0,
  },

  // Change Row (clean text only)
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 16,
  },
  changeLabel: {
    fontSize: 14,
    color: "#57534E",
  },
  changeAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  changeAmountOk: {
    color: "#059669",
  },
  changeAmountErr: {
    color: "#DC2626",
  },

  // Quick Cash (text only, no card)
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F4",
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  // Section Label
  secLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Method Row
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  methodBtnOn: {
    backgroundColor: "#059669",
  },
  methodText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  methodTextOn: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Item List
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
  },
  itemMeta: {
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 2,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyMinus: {
    fontSize: 16,
    fontWeight: "600",
    color: "#57534E",
    lineHeight: 18,
  },
  qtyPlus: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    lineHeight: 18,
  },
  qtyVal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
    minWidth: 18,
    textAlign: "center",
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
    minWidth: 70,
    textAlign: "right",
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#F5F5F4",
    gap: 8,
  },
  btnMain: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  btnMainText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
  },
  btnCompact: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  btnCompactPrimary: {
    backgroundColor: "#059669",
  },
  btnCompactPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  btnCompactWA: {
    backgroundColor: "#25D366",
  },
  btnCompactWAText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  btnOff: {
    opacity: 0.3,
  },
  receiptCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
    zIndex: -1,
  },
  receiptWrap: {
    backgroundColor: "#FFFFFF",
  },
});
