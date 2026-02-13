/**
 * ============================================
 * SCREEN RIWAYAT TRANSAKSI
 * ============================================
 *
 * Compact modern design with search functionality
 */

import * as Print from "expo-print";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import { ambilSemuaTransaksi } from "../../database/service";
import { buildReceiptHtml } from "../../utils/receiptTemplate";

export default function HistoryScreen() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto refresh setiap kali tab history dibuka
  useFocusEffect(
    useCallback(() => {
      loadTransaksi();
    }, []),
  );

  const loadTransaksi = async () => {
    try {
      const list = await ambilSemuaTransaksi();
      setTransaksiList(list);
      setFilteredList(list);
    } catch (error) {
      console.error("Error load transaksi:", error);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setFilteredList(transaksiList);
      return;
    }

    const query = text.toLowerCase();
    const filtered = transaksiList.filter((trx) => {
      // Search by transaction ID
      const matchId = trx.id.toString().includes(query);

      // Search by time (jam)
      const waktu = formatJam(trx.waktuTransaksi).toLowerCase();
      const matchTime = waktu.includes(query);

      // Search by date
      const tanggal = formatTanggal(trx.waktuTransaksi).toLowerCase();
      const matchDate = tanggal.includes(query);

      // Search by item names
      const itemNames = trx.daftarBarang
        .map((item) => item.nama.toLowerCase())
        .join(" ");
      const matchItems = itemNames.includes(query);

      // Search by total price
      const matchPrice = formatRupiah(trx.totalHarga)
        .toLowerCase()
        .includes(query);

      return matchId || matchTime || matchDate || matchItems || matchPrice;
    });

    setFilteredList(filtered);
  };

  const formatRupiah = (angka) => {
    return `Rp ${angka.toLocaleString("id-ID")}`;
  };

  const formatWaktu = (isoString) => {
    const tanggal = new Date(isoString);
    return tanggal.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTanggal = (isoString) => {
    const tanggal = new Date(isoString);
    return tanggal.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatJam = (isoString) => {
    const tanggal = new Date(isoString);
    return tanggal.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetail = (transaksi) => {
    setSelectedTransaksi(transaksi);
    setShowModal(true);
  };

  const closeDetail = () => {
    setSelectedTransaksi(null);
    setShowModal(false);
  };

  const handleExport = async () => {
    if (!selectedTransaksi) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Info", "Fitur share tidak tersedia di perangkat ini");
        return;
      }

      const html = buildReceiptHtml(selectedTransaksi, {
        storeName: "WARUNG POS",
        storeAddress: "Jl. Warung No. 1",
        storePhone: "Telp. 08xx-xxxx-xxxx",
      });

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error export struk:", error);
      Alert.alert("Error", "Gagal export struk");
    }
  };

  const renderSummaryItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return "Tidak ada item";
    }

    const firstTwo = items
      .slice(0, 2)
      .map((item) => item.nama)
      .join(", ");
    const more = items.length > 2 ? ` +${items.length - 2}` : "";
    return firstTwo + more;
  };

  const getTotalItems = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.qty || 0), 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.main}
      />

      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📊</Text>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Riwayat</Text>
            <Text style={styles.headerSubtitle}>
              {filteredList.length} transaksi
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari ID, jam, tanggal, item..."
            placeholderTextColor={Colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{searchQuery ? "🔍" : "📋"}</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak Ditemukan" : "Belum Ada Transaksi"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Coba kata kunci lain"
                : "Riwayat transaksi akan muncul di sini"}
            </Text>
          </View>
        ) : (
          filteredList.map((trx, index) => (
            <TouchableOpacity
              key={trx.id}
              style={styles.transactionCard}
              onPress={() => openDetail(trx)}
              activeOpacity={0.7}
            >
              {/* Compact Card Layout */}
              <View style={styles.cardRow}>
                {/* Left Section */}
                <View style={styles.cardLeft}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>#{trx.id}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.itemsPreview} numberOfLines={1}>
                      {renderSummaryItems(trx.daftarBarang)}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        {formatTanggal(trx.waktuTransaksi)}
                      </Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>
                        {formatJam(trx.waktuTransaksi)}
                      </Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>
                        {getTotalItems(trx.daftarBarang)} item
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Section */}
                <View style={styles.cardRight}>
                  <Text style={styles.totalAmount}>
                    {formatRupiah(trx.totalHarga)}
                  </Text>
                  <Text style={styles.viewArrow}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Detail Transaksi</Text>
                {selectedTransaksi && (
                  <Text style={styles.modalSubtitle}>
                    {formatWaktu(selectedTransaksi.waktuTransaksi)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeDetail}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedTransaksi && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Transaction Info Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID Transaksi</Text>
                    <Text style={styles.infoValue}>
                      #{selectedTransaksi.id}
                    </Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tanggal</Text>
                    <Text style={styles.infoValue}>
                      {formatTanggal(selectedTransaksi.waktuTransaksi)}
                    </Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Waktu</Text>
                    <Text style={styles.infoValue}>
                      {formatJam(selectedTransaksi.waktuTransaksi)}
                    </Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Item</Text>
                    <Text style={styles.infoValue}>
                      {getTotalItems(selectedTransaksi.daftarBarang)} item
                    </Text>
                  </View>
                </View>

                {/* Items Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>🛍️</Text>
                  <Text style={styles.sectionTitle}>Daftar Belanja</Text>
                </View>

                <View style={styles.itemsCard}>
                  {selectedTransaksi.daftarBarang.map((item, index) => (
                    <View key={`${item.nama}-${index}`}>
                      <View style={styles.itemRow}>
                        <View style={styles.itemLeft}>
                          <View style={styles.itemNumberBadge}>
                            <Text style={styles.itemNumberText}>
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={2}>
                              {item.nama}
                            </Text>
                            <View style={styles.itemDetails}>
                              <Text style={styles.itemPrice}>
                                {formatRupiah(item.harga)}
                              </Text>
                              <Text style={styles.itemQty}>× {item.qty}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.itemRight}>
                          <Text style={styles.itemSubtotal}>
                            {formatRupiah(item.subtotal)}
                          </Text>
                        </View>
                      </View>
                      {index < selectedTransaksi.daftarBarang.length - 1 && (
                        <View style={styles.itemDivider} />
                      )}
                    </View>
                  ))}
                </View>

                {/* Total Section */}
                <View style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalCardLabel}>Total Pembayaran</Text>
                    <Text style={styles.totalCardAmount}>
                      {formatRupiah(selectedTransaksi.totalHarga)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExport}
                activeOpacity={0.85}
              >
                <View style={styles.exportButtonContent}>
                  <Text style={styles.exportButtonIcon}>🖨️</Text>
                  <Text style={styles.exportButtonText}>Export ke PDF</Text>
                </View>
                <Text style={styles.exportButtonArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },

  // Compact Header Styles
  header: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.contrast,
    opacity: 0.85,
  },

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    ...Shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 20,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.4,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: "center",
  },

  // Compact Transaction Card
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs + 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    ...Shadows.sm,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  idBadge: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    minWidth: 44,
    alignItems: "center",
  },
  idText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  itemsPreview: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  metaDot: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    opacity: 0.5,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  totalAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  viewArrow: {
    fontSize: 14,
    color: Colors.primary.main,
    opacity: 0.6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  modalHeaderContent: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.md,
  },
  modalCloseIcon: {
    fontSize: 28,
    color: Colors.text.secondary,
    lineHeight: 28,
  },
  modalBody: {
    padding: Spacing.xl,
  },
  modalFooter: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },

  // Info Card
  infoCard: {
    backgroundColor: "#F8F9FD",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginVertical: Spacing.xs,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },

  // Items Card
  itemsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginRight: Spacing.md,
  },
  itemNumberBadge: {
    backgroundColor: Colors.primary.main,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  itemNumberText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  itemQty: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
  },
  itemRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  itemSubtotal: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginVertical: Spacing.xs,
  },

  // Total Card
  totalCard: {
    backgroundColor: "#F0F3FF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalCardLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  totalCardAmount: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },

  // Export Button
  exportButton: {
    backgroundColor: Colors.primary.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  exportButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  exportButtonIcon: {
    fontSize: 24,
  },
  exportButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  exportButtonArrow: {
    fontSize: 20,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
  },
});
