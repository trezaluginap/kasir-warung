/**
 * ============================================
 * SCREEN PRINTER - DAFTAR & PREVIEW STRUK
 * ============================================
 * Modal route untuk menghubungkan printer Bluetooth 58mm
 * dan menguji struk.
 *
 * Di Expo Go (Fase A): Menampilkan banner petunjuk dev build +
 * tombol "Pratinjau Struk" (mencetak teks ESC/POS contoh ke alert).
 * Di Dev Build (Fase B): Menampilkan list paired devices & test print.
 */

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcon } from "../components/MaterialIcon";
import usePrinterStore from "../store/printerStore";
import {
  isPrinterAvailable,
  buildStrukText,
  getBondedDevices,
  connectPrinter,
  testPrint,
} from "../services/printerService";
import { showInfo, showSuccess, showError, showWarning } from "../utils/alertHelper";

export default function PrinterScreen() {
  const router = useRouter();
  const { printerName, printerAddress, selectPrinter } = usePrinterStore();

  const [availableInfo, setAvailableInfo] = useState({ available: false });
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBondedDevices();
      if (res.success) {
        setDevices(res.data || []);
      } else {
        showError("Gagal Baca Bluetooth", res.message);
      }
    } catch (e) {
      showError("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    usePrinterStore.getState().loadSavedPrinter();
    const check = isPrinterAvailable();
    // Sync one-time availability snapshot on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailableInfo(check);
    if (check.available) {
      loadDevices();
    }
  }, [loadDevices]);

  const handleSelect = async (dev) => {
    await selectPrinter(dev);
    const res = await connectPrinter(dev.address);
    if (res.success) {
      showSuccess("Printer Terhubung", `Terhubung ke ${dev.name || dev.address}`);
    } else {
      showError("Gagal Konek", res.message);
    }
  };

  const handleTestPrint = async () => {
    const res = await testPrint();
    if (res.success) {
      showSuccess("Struk Diagnostik", "Perintah cetak berhasil dikirim.");
    } else {
      showError("Gagal Cetak", res.message);
    }
  };

  const handlePreviewText = () => {
    const sample = buildStrukText({
      trxId: 999,
      waktu: new Date().toISOString(),
      kasir: "Admin (Demo)",
      items: [
        { nama: "Indomie Goreng Spasial Pedas", qty: 2, harga: 3500 },
        { nama: "Teh Botol Sosro 450ml", qty: 1, harga: 5000 },
        { nama: "Jajanan", qty: 3, harga: 1000 },
      ],
      total: 15000,
      totalBayar: 20000,
      kembalian: 5000,
    });

    showInfo("Pratinjau Teks ESC/POS (58mm)", sample);
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Printer Bluetooth</Text>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <MaterialIcon name="close" size={20} color="#1C1917" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Selection Banner */}
        <View style={s.card}>
          <Text style={s.cardLabel}>PRINTER AKTIF</Text>
          <Text style={s.cardName}>{printerName || "Belum ada printer"}</Text>
          <Text style={s.cardAddress}>
            {printerAddress || "Pairing printer dulu di Android Bluetooth Settings"}
          </Text>
        </View>

        {/* Expo Go Warning Banner */}
        {!availableInfo.available && (
          <View style={s.devBanner}>
            <MaterialIcon name="warning" size={24} color="#B45309" />
            <View style={s.devBannerContent}>
              <Text style={s.devBannerTitle}>Mode Expo Go Detected</Text>
              <Text style={s.devBannerText}>
                Printer Bluetooth fisik membutuhkan development build. Gunakan tombol pratinjau di bawah untuk memvalidasi teks struk.
              </Text>
            </View>
          </View>
        )}

        {/* Action: Preview */}
        <TouchableOpacity
          style={s.btnPreview}
          onPress={handlePreviewText}
          activeOpacity={0.85}
        >
          <MaterialIcon name="printer_outline" size={18} color="#059669" />
          <Text style={s.btnPreviewText}>Pratinjau Teks Struk (58mm)</Text>
        </TouchableOpacity>

        {/* Section: Bonded Devices (Dev mode) */}
        {availableInfo.available && (
          <>
            <View style={s.secHeader}>
              <Text style={s.secLabel}>PERANGKAT PAIRING</Text>
              <TouchableOpacity onPress={loadDevices} disabled={loading}>
                <MaterialIcon name="refresh" size={16} color="#57534E" />
              </TouchableOpacity>
            </View>

            {devices.length === 0 ? (
              <Text style={s.emptyText}>
                Tidak ada printer paired. Pairing printer di Pengaturan HP Anda dulu.
              </Text>
            ) : (
              <View style={s.cardGroup}>
                {devices.map((d, i) => {
                  const selected = d.address === printerAddress;
                  return (
                    <TouchableOpacity
                      key={d.address || i}
                      style={s.deviceRow}
                      onPress={() => handleSelect(d)}
                    >
                      <View style={s.deviceInfo}>
                        <Text style={s.deviceName}>{d.name || "Printer"}</Text>
                        <Text style={s.deviceAddr}>{d.address}</Text>
                      </View>
                      {selected ? (
                        <MaterialIcon name="check" size={18} color="#059669" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={s.btnTest}
              onPress={handleTestPrint}
              activeOpacity={0.85}
            >
              <Text style={s.btnTestText}>Test Cetak Diagnostik</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF7F4" },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1C1917" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F5F4",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollInner: { padding: 20, gap: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "#A8A29E", letterSpacing: 0.8 },
  cardName: { fontSize: 18, fontWeight: "700", color: "#1C1917", marginTop: 4 },
  cardAddress: { fontSize: 12, color: "#57534E", marginTop: 2 },

  devBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  devBannerContent: { flex: 1 },
  devBannerTitle: { fontSize: 14, fontWeight: "700", color: "#B45309" },
  devBannerText: { fontSize: 12, color: "#B45309", marginTop: 2, lineHeight: 17 },

  btnPreview: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnPreviewText: { fontSize: 14, fontWeight: "600", color: "#1C1917" },

  secHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  secLabel: { fontSize: 11, fontWeight: "700", color: "#A8A29E", letterSpacing: 0.8 },
  emptyText: { fontSize: 13, color: "#A8A29E", textAlign: "center", marginVertical: 16 },

  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: "600", color: "#1C1917" },
  deviceAddr: { fontSize: 12, color: "#A8A29E", marginTop: 2 },

  btnTest: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  btnTestText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});