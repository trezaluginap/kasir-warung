/**
 * ============================================
 * SCREEN PENGATURAN - Clean
 * ============================================
 * - No emoji headers, plain text sections
 * - Minimal verification badges
 * - Material Symbols
 */

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { File, Directory, Paths } from "expo-file-system";
import { Colors, Spacing } from "../../constants/theme";
import useAuthStore from "../../store/authStore";
import usePrinterStore from "../../store/printerStore";
import { MaterialIcon } from "../../components/MaterialIcon";
import { ambilSemuaTransaksi } from "../../database/service";
import {
  showConfirm,
  showInfo,
  showSuccess,
  showError,
} from "../../utils/alertHelper";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const printerName = usePrinterStore((s) => s.printerName);

  const [autoPrint, setAutoPrint] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(true);
  const [trxCount, setTrxCount] = useState(0);
  const [backupBusy, setBackupBusy] = useState(false);

  useEffect(() => {
    usePrinterStore.getState().loadSavedPrinter();

    // Hitung transaksi real dari database lokal
    const countTrx = async () => {
      try {
        const list = await ambilSemuaTransaksi();
        setTrxCount(list.length);
      } catch (error) {
        console.error("Error count transaksi:", error);
      }
    };
    countTrx();
  }, []);

  // Supabase dikonfigurasi? (env terisi & bukan placeholder)
  const hasSupabase =
    (process.env.EXPO_PUBLIC_SUPABASE_URL || "").includes(".") &&
    !(process.env.EXPO_PUBLIC_SUPABASE_URL || "").includes("placeholder") &&
    (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").length > 20;

  // ===== Backup: ekspor data ke file JSON + share =====
  const handleBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const list = await ambilSemuaTransaksi();
      if (list.length === 0) {
        showInfo("Tidak Ada", "Belum ada transaksi untuk dibackup.");
        return;
      }

      const data = {
        app: "TRITOP JAYA",
        eksporPada: new Date().toISOString(),
        totalTransaksi: list.length,
        transaksi: list,
      };

      // Simpan ke file JSON di Documents
      const fileName = `backup_warung_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const dest = new File(Paths.document, fileName);
      await dest.write(`${JSON.stringify(data, null, 2)}\n`);

      // Buka share sheet (WhatsApp/Drive/simpan)
      const ok = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync(dest.uri, {
          mimeType: "application/json",
          dialogTitle: "Backup Data Warung",
        });
      } else {
        showSuccess("Backup Siap", `File: ${fileName}`);
      }
    } catch (error) {
      console.error("Backup error:", error);
      showError("Gagal Backup", error.message || "Terjadi kesalahan");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: "Keluar dari Akun",
      message: "Keluar dari sesi kasir?",
      confirmText: "Keluar",
      destructive: true,
      onConfirm: async () => {
        await logout();
        router.replace("/login");
      },
    });
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Pengaturan</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={s.headerMenuBtn}
        >
          <MaterialIcon name="account_circle" size={22} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Identitas */}
        <Text style={s.secLabel}>IDENTITAS TOKO</Text>
        <View style={s.cardGroup}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Nama usaha</Text>
            <Text style={s.rowValue}>TRITOP JAYA</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Pemilik</Text>
            <Text style={s.rowValue}>Pak Budi Hartono</Text>
          </View>
          <View style={s.rowLast}>
            <Text style={s.rowLabel}>Alamat</Text>
            <Text style={s.rowValueSub}>
              Jl. Raya No. 123
            </Text>
          </View>
        </View>

        {/* Section: Hardware */}
        <Text style={s.secLabel}>HARDWARE</Text>
        <View style={s.cardGroup}>
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push("/printer")}
          >
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Printer Bluetooth</Text>
              <Text style={s.rowMeta}>
                {printerName || "Belum dipilih"}
              </Text>
            </View>
            <MaterialIcon
              name="printer_outline"
              size={18}
              color="#059669"
            />
            <MaterialIcon name="arrow_forward" size={16} color="#A8A29E" />
          </TouchableOpacity>
          <View style={s.row}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Auto cetak struk</Text>
              <Text style={s.rowMeta}>Nonaktif (cetak manual)</Text>
            </View>
            <Switch
              value={autoPrint}
              onValueChange={setAutoPrint}
              disabled
              trackColor={{ false: "#E7E5E4", true: "#059669" }}
              thumbColor="#FFF"
            />
          </View>
          <View style={s.row}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Buka laci uang</Text>
              <Text style={s.rowMeta}>Trigger RJ-11 saat tunai</Text>
            </View>
            <Switch
              value={openDrawer}
              onValueChange={setOpenDrawer}
              trackColor={{ false: "#E7E5E4", true: "#059669" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Section: Kebijakan */}
        <Text style={s.secLabel}>KEBIJAKAN KASIR</Text>
        <View style={s.cardGroup}>
          <View style={s.row}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>PPN</Text>
              <Text style={s.rowMeta}>Usaha Mikro 0%</Text>
            </View>
          </View>
          <View style={s.rowLast}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Pembulatan</Text>
              <Text style={s.rowMeta}>Ke Rp 500 terdekat</Text>
            </View>
          </View>
        </View>

        {/* Section: Sinkronisasi */}
        <Text style={s.secLabel}>SINKRONISASI</Text>
        <View style={s.cardGroup}>
          <View style={s.row}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Transaksi lokal</Text>
              <Text style={s.rowMeta}>
                {trxCount} transaksi di database device ini
              </Text>
            </View>
            <Text style={[s.statusText, !hasSupabase && s.statusTextOff]}>
              {hasSupabase ? "Siap" : "Lokal"}
            </Text>
          </View>
          <TouchableOpacity
            style={s.rowLast}
            onPress={handleBackup}
          >
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Backup data</Text>
              <Text style={s.rowMeta}>
                {backupBusy
                  ? "Bersiap file JSON..."
                  : "Ekspor ke file JSON + share"}
              </Text>
            </View>
            <MaterialIcon
              name="arrow_forward"
              size={16}
              color="#A8A29E"
            />
          </TouchableOpacity>
        </View>

        {/* Section: Keamanan */}
        <Text style={s.secLabel}>KEAMANAN</Text>
        <View style={s.cardGroup}>
          <View style={s.row}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>PIN otoritas</Text>
              <Text style={s.rowMeta}>4 digit aktif</Text>
            </View>
          </View>
          <TouchableOpacity style={s.rowLast}>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Ganti PIN</Text>
            </View>
            <MaterialIcon
              name="arrow_forward"
              size={16}
              color="#A8A29E"
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={s.actionGroup}>
          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => showInfo("Tutup Shift", "Tutup shift kasir?")}
          >
            <Text style={s.btnSecondaryText}>Tutup Shift (Z-Report)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnDanger} onPress={handleLogout}>
            <MaterialIcon name="close" size={14} color="#DC2626" />
            <Text style={s.btnDangerText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF7F4" },

  // Header
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1917",
  },
  headerMenuBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },

  // Section Label
  secLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },

  // Card Group (each section)
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  rowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1917",
  },
  rowMeta: {
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#57534E",
  },
  rowValueSub: {
    fontSize: 12,
    color: "#A8A29E",
    textAlign: "right",
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  statusTextOff: {
    color: "#57534E",
  },

  // Actions
  actionGroup: {
    marginTop: 24,
    gap: 8,
  },
  btnSecondary: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1917",
  },
  btnDanger: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  btnDangerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },
});
