/**
 * ============================================
 * SCREEN PRODUK - CRUD
 * ============================================
 *
 * Compact modern product management with efficient layout
 */

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import {
  ambilKategori,
  ambilSemuaProduk,
  hapusProduk,
  tambahProduk,
  updateProduk,
} from "../../database/productService";
import useAuthStore from "../../store/authStore";

export default function ProductsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState(["Semua"]);
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [kategori, setKategori] = useState("");

  const loadKategori = useCallback(async () => {
    try {
      const list = await ambilKategori();
      setKategoriList(["Semua", ...list]);
    } catch (error) {
      console.error("Error load kategori:", error);
    }
  }, []);

  const loadProduk = useCallback(async () => {
    try {
      const options = { aktifOnly: true };

      if (selectedKategori !== "Semua") {
        options.kategori = selectedKategori;
      }

      if (searchQuery.trim()) {
        options.search = searchQuery.trim();
      }

      const list = await ambilSemuaProduk(options);
      setProdukList(list);
    } catch (error) {
      console.error("Error load produk:", error);
      Alert.alert("Error", "Gagal load produk");
    }
  }, [selectedKategori, searchQuery]);

  const loadAll = useCallback(async () => {
    await loadKategori();
    await loadProduk();
  }, [loadKategori, loadProduk]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadProduk();
  }, [loadProduk]);

  const resetForm = () => {
    setNama("");
    setHarga("");
    setKategori("");
    setEditingId(null);
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (produk) => {
    setNama(produk.nama);
    setHarga(formatCurrencyInput(String(produk.harga)));
    setKategori(produk.kategori || "");
    setEditingId(produk.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      Alert.alert("Validasi", "Nama produk wajib diisi");
      return;
    }

    const hargaNumber = parseCurrencyInput(harga);
    if (hargaNumber <= 0) {
      Alert.alert("Validasi", "Harga tidak valid");
      return;
    }

    try {
      if (isEditMode && editingId) {
        await updateProduk(editingId, {
          nama: nama.trim(),
          harga: hargaNumber,
          kategori: kategori.trim() || "Umum",
        });
        Alert.alert("Sukses", "Produk berhasil diupdate");
      } else {
        await tambahProduk({
          nama: nama.trim(),
          harga: hargaNumber,
          kategori: kategori.trim() || "Umum",
        });
        Alert.alert("Sukses", "Produk berhasil ditambahkan");
      }

      setShowModal(false);
      resetForm();
      await loadAll();
    } catch (error) {
      console.error("Error simpan produk:", error);
      Alert.alert("Error", "Gagal menyimpan produk");
    }
  };

  const handleDelete = (produk) => {
    Alert.alert("Konfirmasi", `Hapus produk ${produk.nama}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await hapusProduk(produk.id);
            await loadAll();
          } catch (error) {
            console.error("Error hapus produk:", error);
            Alert.alert("Error", "Gagal menghapus produk");
          }
        },
      },
    ]);
  };

  const formatRupiah = (angka) => {
    return `Rp ${angka.toLocaleString("id-ID")}`;
  };

  const formatCurrencyInput = (text) => {
    const numbers = text.replace(/\D/g, "");
    if (numbers === "") return "";
    const formatted = parseInt(numbers, 10).toLocaleString("id-ID");
    return formatted;
  };

  const parseCurrencyInput = (text) => {
    const numbers = text.replace(/\D/g, "");
    return numbers === "" ? 0 : parseInt(numbers, 10);
  };

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Keluar dari akun?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
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
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>📦</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Produk</Text>
              <Text style={styles.headerSubtitle}>
                {produkList.length} produk
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Add Section */}
      <View style={styles.actionSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor={Colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {kategoriList.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryPill,
              selectedKategori === item && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedKategori(item)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedKategori === item && styles.categoryPillTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      <ScrollView
        style={styles.productContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productScrollContent}
      >
        {produkList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{searchQuery ? "🔍" : "📦"}</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak Ditemukan" : "Belum Ada Produk"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Coba kata kunci lain"
                : "Mulai tambahkan produk pertama Anda"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>+ Tambah Produk</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {produkList.map((produk) => (
              <View key={produk.id} style={styles.productCard}>
                {/* Compact Card Header */}
                <View style={styles.productHeader}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {produk.nama}
                  </Text>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>
                      {produk.kategori || "Umum"}
                    </Text>
                  </View>
                </View>

                {/* Price */}
                <Text style={styles.productPrice}>
                  {formatRupiah(produk.harga)}
                </Text>

                {/* Actions */}
                <View style={styles.productFooter}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(produk)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteActionButton]}
                    onPress={() => handleDelete(produk)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteActionText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>
                  {isEditMode ? "Edit Produk" : "Tambah Produk"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditMode
                    ? "Perbarui informasi produk"
                    : "Isi detail produk baru"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Form */}
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Produk</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🏷️</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan nama produk"
                    placeholderTextColor={Colors.text.disabled}
                    value={nama}
                    onChangeText={setNama}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Harga</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>💰</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={Colors.text.disabled}
                    keyboardType="numeric"
                    value={harga}
                    onChangeText={(text) => setHarga(formatCurrencyInput(text))}
                  />
                </View>
                {harga && (
                  <Text style={styles.inputHelper}>
                    {formatRupiah(parseCurrencyInput(harga))}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📁</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Masukkan kategori (opsional)"
                    placeholderTextColor={Colors.text.disabled}
                    value={kategori}
                    onChangeText={setKategori}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  {isEditMode ? "Update" : "Simpan"}
                </Text>
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

  // Compact Header
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
    justifyContent: "space-between",
  },
  headerLeft: {
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
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    fontSize: 20,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
  },

  // Action Section
  actionSection: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
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
  addButton: {
    backgroundColor: Colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  addIcon: {
    fontSize: 24,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 24,
  },

  // Category Pills
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  categoryPill: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  categoryPillActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  categoryPillText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  categoryPillTextActive: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
  },

  // Product List
  productContainer: {
    flex: 1,
    marginTop: Spacing.sm,
  },
  productScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
    marginBottom: Spacing.lg,
  },
  emptyActionButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  emptyActionText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },

  // Compact Product Card
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    ...Shadows.sm,
    width: "48.5%",
  },
  productHeader: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  productName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F3FF",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryTagText: {
    fontSize: 10,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.bold,
  },
  productPrice: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  productFooter: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F3FF",
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  deleteActionButton: {
    backgroundColor: "#FFF0F0",
    borderColor: Colors.accent.error,
  },
  actionButtonText: {
    fontSize: 16,
  },
  deleteActionText: {
    fontSize: 16,
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
    maxHeight: "85%",
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
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inputIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  inputHelper: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: 4,
    marginLeft: 4,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    ...Shadows.md,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
});
