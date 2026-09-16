/**
 * ============================================
 * SCREEN RIWAYAT TRANSAKSI - Clean
 * ============================================
 * - Minimal header
 * - No badge spam, no emoji
 * - Clean text status (no green block)
 * - Material Symbols
 */

import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
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
import { Colors, Spacing } from "../../constants/theme";
import { ambilSemuaTransaksi, hapusTransaksi, hapusTransaksiLama } from "../../database/service";
import useAuthStore from "../../store/authStore";
import { MaterialIcon } from "../../components/MaterialIcon";
import ReceiptView from "../../components/ReceiptView";
import { printStruk } from "../../services/printerService";
import usePrinterStore from "../../store/printerStore";
import { showSuccess, showError, showInfo, showConfirm } from "../../utils/alertHelper";

export default function HistoryScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const receiptRef = useRef(null);
  const [transaksiList, setTransaksiList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all | 1 | 7 | 30
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shareTrx, setShareTrx] = useState(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (shareTrx && receiptRef.current && !capturing) {
      setCapturing(true);
      const timer = setTimeout(async () => {
        try {
          const uri = await captureRef(receiptRef, {
            format: "jpg",
            quality: 0.9,
          });
          const ok = await Sharing.isAvailableAsync();
          if (ok) {
            await Sharing.shareAsync(uri, {
              mimeType: "image/jpeg",
              dialogTitle: "Struk Pembayaran",
            });
          }
        } catch (e) {
          console.error("Error cetak struk:", e);
          showError("Error", "Gagal cetak struk");
        } finally {
          setShareTrx(null);
          setCapturing(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [shareTrx]);

  const loadTransaksi = useCallback(async () => {
    try {
      const list = await ambilSemuaTransaksi();
      // Precompute timestamp sekali (hindari new Date() di render body)
      const enriched = list.map((trx) => ({
        ...trx,
        _ts: new Date(trx.waktuTransaksi).getTime() || 0,
      }));
      setTransaksiList(enriched);
    } catch (error) {
      console.error("Error load:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransaksi();
    }, [loadTransaksi]),
  );

  const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

  const formatWaktu = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatJam = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter (date + search)
  // NOTE: Hindari Date.now() saat render (impure).
  // Cutoff = max timestamp dari data (bukan jam sekarang) —
  // konsisten untuk "7 hari terakhir" relatif data terbaru.
  const latestTs = transaksiList.reduce(
    (max, t) => (t._ts > max ? t._ts : max),
    0,
  );

  const filteredList = transaksiList.filter((trx) => {
    // Filter tanggal
    if (dateFilter !== "all" && latestTs > 0) {
      const days = parseInt(dateFilter, 10);
      const cutoff = latestTs - days * 24 * 60 * 60 * 1000;
      if (trx._ts < cutoff) return false;
    }

    // Filter search
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchId = trx.id.toString().includes(q);
    const matchTime = formatJam(trx.waktuTransaksi).toLowerCase().includes(q);
    const matchItems = (trx.daftarBarang || [])
      .map((i) => i.nama.toLowerCase())
      .join(" ")
      .includes(q);
    const matchPrice = formatRupiah(trx.totalHarga).toLowerCase().includes(q);
    return matchId || matchTime || matchItems || matchPrice;
  });

  // Summary berdasarkan filter (omzet sesuai apa yang terlihat)
  const totalOmset = filteredList.reduce(
    (sum, t) => sum + (t.totalHarga || 0),
    0,
  );
  const totalQty = filteredList.reduce(
    (sum, t) =>
      sum + (t.daftarBarang || []).reduce((s, i) => s + (i.qty || 0), 0),
    0,
  );

  const openDetail = (trx) => {
    setSelectedTrx(trx);
    setShowModal(true);
  };

  const handlePrint = async (trx) => {
    if (!trx) return;
    try {
      const ok = await Sharing.isAvailableAsync();
      if (!ok) {
        showInfo("Info", "Fitur share tidak tersedia");
        return;
      }
      setShareTrx(trx);
    } catch (e) {
      showError("Error", "Gagal cetak struk");
    }
  };

  const handleDirectPrint = async (trx) => {
    if (!trx) return;
    try {
      const res = await printStruk({
        trxId: trx.id,
        waktu: trx.waktuTransaksi,
        items: trx.daftarBarang || [],
        total: trx.totalHarga,
        totalBayar: trx.uangBayar || trx.totalHarga,
        kembalian: trx.uangKembali || 0,
      });
      if (res.success) {
        showSuccess("Struk Tercetak", `#TRX-${trx.id} berhasil dicetak.`);
      } else if (res.code === "NEEDS_DEV_BUILD") {
        showInfo("Printer Belum Aktif", res.message);
      } else {
        showError("Gagal Cetak", res.message);
      }
    } catch (e) {
      showError("Error", e.message);
    }
  };

  // ===== Hapus satu transaksi (dari detail modal) =====
  const handleDelete = (trx) => {
    showConfirm({
      title: "Hapus Transaksi?",
      message: `#TRX-${trx.id} akan dihapus permanen. Tidak bisa dikembalikan.`,
      confirmText: "Hapus",
      destructive: true,
      onConfirm: async () => {
        try {
          await hapusTransaksi(trx.id);
          setShowModal(false);
          setSelectedTrx(null);
          await loadTransaksi();
          showSuccess("Terhapus", `#TRX-${trx.id} dihapus dari riwayat.`);
        } catch (e) {
          showError("Gagal Hapus", e.message);
        }
      },
    });
  };

  // ===== Cleanup manual: hapus transaksi > 90 hari =====
  const handleCleanup = () => {
    showConfirm({
      title: "Bersihkan Riwayat Lama?",
      message:
        "Semua transaksi lebih dari 90 hari akan dihapus permanen. Data tidak bisa dikembalikan.",
      confirmText: "Bersihkan",
      destructive: true,
      onConfirm: async () => {
        try {
          const c = await hapusTransaksiLama(90);
          await loadTransaksi();
          if (c > 0) {
            showSuccess("Selesai", `${c} transaksi lama dibersihkan.`);
          } else {
            showInfo("Tidak Ada", "Tidak ada transaksi lebih dari 90 hari.");
          }
        } catch (e) {
          showError("Gagal Bersihkan", e.message);
        }
      },
    });
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Riwayat Transaksi</Text>
        <View style={s.headerRight}>
          <TouchableOpacity
            onPress={() => {
              loadTransaksi();
            }}
            style={s.headerMenuBtn}
          >
            <MaterialIcon name="refresh" size={18} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCleanup}
            style={s.headerMenuBtn}
          >
            <MaterialIcon name="delete_sweep" size={18} color="#DC2626" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              showConfirm({
                title: "Keluar",
                message: "Keluar dari sesi kasir?",
                confirmText: "Keluar",
                destructive: true,
                onConfirm: () => {
                  logout();
                  router.replace("/login");
                },
              });
            }}
            style={s.headerMenuBtn}
          >
            <MaterialIcon name="account_circle" size={22} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary */}
        <View style={s.summaryBox}>
          <Text style={s.summaryLabel}>
          {dateFilter === "1"
            ? "OMZET HARI INI"
            : dateFilter === "7"
              ? "OMZET 7 HARI"
              : dateFilter === "30"
                ? "OMZET 30 HARI"
                : "TOTAL OMZET"}
        </Text>
          <Text style={s.summaryAmount}>
            {formatRupiah(totalOmset)}
          </Text>
          <Text style={s.summaryMeta}>
            {transaksiList.length} transaksi • {totalQty} item
          </Text>
        </View>

        {/* Filter Tanggal */}
        <View style={s.filterRow}>
          {[
            { key: "all", label: "Semua" },
            { key: "1", label: "Hari Ini" },
            { key: "7", label: "7 Hari" },
            { key: "30", label: "30 Hari" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterPill, dateFilter === f.key && s.filterPillOn]}
              onPress={() => setDateFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  s.filterPillText,
                  dateFilter === f.key && s.filterPillTextOn,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <MaterialIcon name="search" size={16} color="#A8A29E" />
          <TextInput
            style={s.searchInput}
            placeholder="Cari struk, item, atau jam..."
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcon name="close" size={16} color="#A8A29E" />
            </TouchableOpacity>
          )}
        </View>

        {/* Transaction List */}
        {filteredList.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialIcon name="receipt_long" size={28} color="#D6D3D1" />
            <Text style={s.emptyTitle}>Belum ada transaksi</Text>
          </View>
        ) : (
          <View style={s.trxList}>
            {filteredList.map((trx) => (
              <TouchableOpacity
                key={trx.id}
                style={s.trxRow}
                onPress={() => openDetail(trx)}
                activeOpacity={0.7}
              >
                <View style={s.trxLeft}>
                  <Text style={s.trxId}>#TRX-{trx.id}</Text>
                  <Text style={s.trxMeta}>
                    {formatJam(trx.waktuTransaksi)} •{" "}
                    {(trx.daftarBarang || [])
                      .map((i) => `${i.nama} (${i.qty}x)`)
                      .slice(0, 2)
                      .join(", ")}
                    {trx.daftarBarang && trx.daftarBarang.length > 2
                      ? ` +${trx.daftarBarang.length - 2}`
                      : ""}
                  </Text>
                </View>
                <Text style={s.trxAmount}>
                  {formatRupiah(trx.totalHarga)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeaderRow}>
              <View>
                <Text style={s.modalTitle}>
                  #TRX-{selectedTrx?.id}
                </Text>
                <Text style={s.modalSubtitle}>
                  {formatWaktu(selectedTrx?.waktuTransaksi)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={s.iconBtn}
              >
                <MaterialIcon name="close" size={18} color="#57534E" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={s.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.modalInfoRow}>
                <Text style={s.modalInfoLabel}>Total</Text>
                <Text style={s.modalInfoValue}>
                  {formatRupiah(selectedTrx?.totalHarga)}
                </Text>
              </View>

              <Text style={s.modalSectionTitle}>RINCIAN ITEM</Text>
              {(selectedTrx?.daftarBarang || []).map((item, idx) => (
                <View key={idx} style={s.modalItemRow}>
                  <View style={s.modalItemLeft}>
                    <Text style={s.modalItemName}>
                      {item.nama}
                    </Text>
                    <Text style={s.modalItemMeta}>
                      {formatRupiah(item.harga)} x {item.qty}
                    </Text>
                  </View>
                  <Text style={s.modalItemSubtotal}>
                    {formatRupiah(item.subtotal || item.harga * item.qty)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={s.btnModalPrint}
              onPress={() => {
                setShowModal(false);
                handleDirectPrint(selectedTrx);
              }}
            >
              <MaterialIcon name="print" size={16} color="#FFF" />
              <Text style={s.btnModalPrintText}>Cetak Struk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btnModalShare}
              onPress={() => {
                setShowModal(false);
                handlePrint(selectedTrx);
              }}
            >
              <MaterialIcon name="share" size={16} color="#FFF" />
              <Text style={s.btnModalShareText}>Bagikan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btnModalDelete}
              onPress={() => handleDelete(selectedTrx)}
            >
              <MaterialIcon name="delete" size={16} color="#DC2626" />
              <Text style={s.btnModalDeleteText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hidden Receipt for capture */}
      {shareTrx && (
        <View style={s.receiptCanvas}>
          <View ref={receiptRef} collapsable={false} style={s.receiptWrap}>
            <ReceiptView
              transaksi={{ total: shareTrx.totalHarga }}
              items={shareTrx.daftarBarang || []}
              totalBayar={shareTrx.uangBayar || shareTrx.totalHarga}
              kembalian={shareTrx.uangKembali || 0}
            />
          </View>
        </View>
      )}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    paddingBottom: 100,
  },

  // Summary
  summaryBox: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1C1917",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  summaryMeta: {
    fontSize: 12,
    color: "#A8A29E",
  },

  // Filter Tanggal
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  filterPillOn: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#57534E",
  },
  filterPillTextOn: {
    color: "#FFFFFF",
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1C1917",
    padding: 0,
  },

  // Transaction List
  trxList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  trxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  trxLeft: { flex: 1, marginRight: 12 },
  trxId: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
  },
  trxMeta: {
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 2,
  },
  trxAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1917",
  },

  // Empty
  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A8A29E",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E7E5E4",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1917",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { maxHeight: 360 },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: "#57534E",
  },
  modalInfoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1917",
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 8,
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  modalItemLeft: { flex: 1, marginRight: 12 },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1917",
  },
  modalItemMeta: {
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 2,
  },
  modalItemSubtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
  },
  btnModalPrint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#059669",
    marginTop: 16,
  },
  btnModalPrintText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  btnModalShare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#25D366",
    marginTop: 8,
    marginBottom: 8,
  },
  btnModalShareText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    btnModalDelete: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 44,
      borderRadius: 10,
      backgroundColor: "#FEE2E2",
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    btnModalDeleteText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#DC2626",
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
