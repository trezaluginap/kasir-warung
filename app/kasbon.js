/**
 * ============================================
 * SCREEN CATATAN KASBON / HUTANG PELANGGAN
 * ============================================
 * - Daftar piutang warung (Belum Lunas & Lunas)
 * - Tombol pelunasan (cicil / lunas instan)
 * - Kirim pesan tagihan via WhatsApp
 */

import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  Linking,
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
import { MaterialIcon } from "../components/MaterialIcon";
import {
  ambilSemuaHutang,
  bayarHutang,
  hapusHutang,
} from "../database/service";
import {
  showConfirm,
  showError,
  showInfo,
  showSuccess,
} from "../utils/alertHelper";

const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const formatInput = (text) => {
  const numbers = String(text || "").replace(/\D/g, "");
  return numbers === "" ? "" : parseInt(numbers, 10).toLocaleString("id-ID");
};
const parseInput = (text) => {
  const numbers = String(text || "").replace(/\D/g, "");
  return numbers === "" ? 0 : parseInt(numbers, 10);
};

export default function KasbonScreen() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [filterStatus, setFilterStatus] = useState("belum_lunas");
  const [selectedHutang, setSelectedHutang] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [nominalText, setNominalText] = useState("");

  const loadHutang = async () => {
    try {
      const data = await ambilSemuaHutang();
      setList(data);
    } catch (e) {
      console.error("Error load hutang:", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    ambilSemuaHutang().then((data) => {
      if (mounted) setList(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const totalPiutang = useMemo(() => {
    return list
      .filter((h) => h.status === "belum_lunas")
      .reduce((sum, h) => sum + (h.sisaHutang || 0), 0);
  }, [list]);

  const filteredList = useMemo(() => {
    if (filterStatus === "semua") return list;
    return list.filter((h) => h.status === filterStatus);
  }, [list, filterStatus]);

  const handleOpenPay = (item) => {
    setSelectedHutang(item);
    setNominalText(formatInput(item.sisaHutang));
    setPayModal(true);
  };

  const handleProcessPay = async () => {
    if (!selectedHutang) return;
    const nominal = parseInput(nominalText);
    if (nominal <= 0) {
      showInfo("Nominal Salah", "Masukkan nominal pelunasan valid.");
      return;
    }
    try {
      await bayarHutang(selectedHutang.id, nominal);
      setPayModal(false);
      setSelectedHutang(null);
      await loadHutang();
      showSuccess("Berhasil", "Pembayaran hutang berhasil dicatat.");
    } catch (e) {
      showError("Gagal", e.message);
    }
  };

  const handleSendWA = (item) => {
    if (!item.noHp) {
      showInfo("Tidak Ada Nomor", "Nomor HP pelanggan tidak dicatat.");
      return;
    }
    let hp = item.noHp.replace(/\D/g, "");
    if (hp.startsWith("0")) hp = "62" + hp.slice(1);

    const text = `Halo Kak ${item.namaPelanggan},\n\nCatatan kasbon di *TRITOP JAYA*:\n- Total Tagihan: ${formatRupiah(item.totalHutang)}\n- Sisa Hutang: *${formatRupiah(item.sisaHutang)}*\n\nMohon untuk konfirmasi pelunasan bila ada kelonggaran. Terima kasih! 🙏`;

    const url = `whatsapp://send?phone=${hp}&text=${encodeURIComponent(text)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          showError("Gagal", "Aplikasi WhatsApp tidak terinstall.");
        }
      })
      .catch((e) => showError("Error", e.message));
  };

  const handleDelete = (item) => {
    showConfirm({
      title: "Hapus Catatan Kasbon?",
      message: `Hapus catatan hutang atas nama ${item.namaPelanggan}?`,
      confirmText: "Hapus",
      destructive: true,
      onConfirm: async () => {
        try {
          await hapusHutang(item.id);
          await loadHutang();
          showSuccess("Terhapus", "Catatan kasbon berhasil dihapus.");
        } catch (e) {
          showError("Gagal", e.message);
        }
      },
    });
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcon name="arrow_back" size={20} color="#1C1917" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Catatan Kasbon / Piutang</Text>
        <TouchableOpacity style={s.headerMenuBtn} onPress={loadHutang}>
          <MaterialIcon name="refresh" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner}>
        {/* Total Hero Card */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>TOTAL PIUTANG BELUM LUNAS</Text>
          <Text style={s.heroAmount}>{formatRupiah(totalPiutang)}</Text>
          <Text style={s.heroMeta}>
            {list.filter((h) => h.status === "belum_lunas").length} Orang Belum Lunas
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={s.filterRow}>
          {[
            { key: "belum_lunas", label: "Belum Lunas" },
            { key: "lunas", label: "Lunas" },
            { key: "semua", label: "Semua" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterPill, filterStatus === f.key && s.filterPillOn]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text
                style={[
                  s.filterPillText,
                  filterStatus === f.key && s.filterPillTextOn,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List items */}
        {filteredList.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialIcon name="receipt_long" size={48} color="#D6D3D1" />
            <Text style={s.emptyText}>Tidak ada catatan kasbon</Text>
          </View>
        ) : (
          filteredList.map((item) => (
            <View key={item.id} style={s.card}>
              <View style={s.cardHead}>
                <View>
                  <Text style={s.cardName}>{item.namaPelanggan}</Text>
                  <Text style={s.cardPhone}>
                    {item.noHp ? `WA: ${item.noHp}` : "Tanpa Nomor HP"}
                  </Text>
                </View>
                <View
                  style={[
                    s.badge,
                    item.status === "lunas" ? s.badgeLunas : s.badgeBelum,
                  ]}
                >
                  <Text
                    style={[
                      s.badgeText,
                      item.status === "lunas" ? s.badgeTextLunas : s.badgeTextBelum,
                    ]}
                  >
                    {item.status === "lunas" ? "LUNAS" : "BELUM LUNAS"}
                  </Text>
                </View>
              </View>

              <View style={s.cardBody}>
                <View style={s.cardPriceRow}>
                  <Text style={s.cardPriceLabel}>Total Kasbon:</Text>
                  <Text style={s.cardPriceValue}>{formatRupiah(item.totalHutang)}</Text>
                </View>
                <View style={s.cardPriceRow}>
                  <Text style={s.cardPriceLabel}>Sisa Tagihan:</Text>
                  <Text style={s.cardSisaValue}>{formatRupiah(item.sisaHutang)}</Text>
                </View>
              </View>

              <View style={s.cardActions}>
                {item.status === "belum_lunas" && (
                  <TouchableOpacity
                    style={s.btnPay}
                    onPress={() => handleOpenPay(item)}
                  >
                    <Text style={s.btnPayText}>Bayar / Pelunasan</Text>
                  </TouchableOpacity>
                )}

                {item.noHp ? (
                  <TouchableOpacity
                    style={s.btnWa}
                    onPress={() => handleSendWA(item)}
                  >
                    <Text style={s.btnWaText}>Kirim WA</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={s.btnDel}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialIcon name="delete_outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Pelunasan */}
      <Modal visible={payModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Pelunasan Kasbon</Text>
            <Text style={s.modalSub}>
              {selectedHutang?.namaPelanggan} (Sisa: {formatRupiah(selectedHutang?.sisaHutang)})
            </Text>

            <View style={s.modalInputBox}>
              <Text style={s.modalRp}>Rp</Text>
              <TextInput
                style={s.modalInput}
                keyboardType="numeric"
                value={nominalText}
                onChangeText={(t) => setNominalText(formatInput(t))}
              />
            </View>

            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={s.btnCancelModal}
                onPress={() => setPayModal(false)}
              >
                <Text style={s.btnCancelModalText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.btnConfirmModal}
                onPress={handleProcessPay}
              >
                <Text style={s.btnConfirmModalText}>Simpan Pembayaran</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F4",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1C1917" },
  headerMenuBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollInner: { padding: 16 },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    marginBottom: 16,
  },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "#A8A29E", marginBottom: 4 },
  heroAmount: { fontSize: 28, fontWeight: "800", color: "#DC2626" },
  heroMeta: { fontSize: 12, color: "#57534E", marginTop: 4 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  filterPillOn: { backgroundColor: "#059669", borderColor: "#059669" },
  filterPillText: { fontSize: 13, color: "#57534E" },
  filterPillTextOn: { color: "#FFFFFF", fontWeight: "700" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyText: { color: "#A8A29E", fontSize: 14, marginTop: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1C1917" },
  cardPhone: { fontSize: 12, color: "#A8A29E", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, height: 22 },
  badgeBelum: { backgroundColor: "#FEF2F2" },
  badgeLunas: { backgroundColor: "#ECFDF5" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextBelum: { color: "#DC2626" },
  badgeTextLunas: { color: "#059669" },
  cardBody: { borderTopWidth: 1, borderTopColor: "#F5F5F4", paddingTop: 8, marginBottom: 12 },
  cardPriceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cardPriceLabel: { fontSize: 13, color: "#57534E" },
  cardPriceValue: { fontSize: 13, color: "#1C1917" },
  cardSisaValue: { fontSize: 14, fontWeight: "700", color: "#DC2626" },
  cardActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  btnPay: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  btnPayText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  btnWa: {
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  btnWaText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  btnDel: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1C1917" },
  modalSub: { fontSize: 13, color: "#57534E", marginVertical: 6 },
  modalInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 14,
    height: 46,
  },
  modalRp: { fontSize: 16, fontWeight: "700", color: "#1C1917", marginRight: 8 },
  modalInput: { flex: 1, fontSize: 18, fontWeight: "700", color: "#1C1917" },
  modalBtnRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  btnCancelModal: { paddingVertical: 10, paddingHorizontal: 16 },
  btnCancelModalText: { color: "#57534E", fontWeight: "600" },
  btnConfirmModal: {
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnConfirmModalText: { color: "#FFF", fontWeight: "700" },
});