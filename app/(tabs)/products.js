/**
 * ============================================
 * SCREEN KATALOG PRODUK - Clean
 * ============================================
 * - Minimal header (no subtitle)
 * - Plain product list (no category tag spam)
 * - Material Symbols (no emoji)
 * - FAB for add product
 */

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
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
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { Colors, Spacing } from "../../constants/theme";
import {
  ambilKategori,
  ambilSemuaProduk,
  hapusProduk,
  tambahProduk,
  updateProduk,
} from "../../database/productService";
import useAuthStore from "../../store/authStore";
import { MaterialIcon } from "../../components/MaterialIcon";
import { ProductThumb } from "../../components/ProductThumb";
import BarcodeScannerModal from "../../components/BarcodeScannerModal";
import { showWarning, showError, showConfirm } from "../../utils/alertHelper";

export default function ProductsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [allProdukList, setAllProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState(["Semua"]);
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [kategori, setKategori] = useState("Makanan");
  const [stok, setStok] = useState("24");
  const [foto, setFoto] = useState("");
  const [barcode, setBarcode] = useState("");

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
      const list = await ambilSemuaProduk({ aktifOnly: true });
      setAllProdukList(list);
    } catch (error) {
      console.error("Error load produk:", error);
    }
  }, []);

  useEffect(() => {
    // Async DB fetches; setState occurs post-await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKategori();
    loadProduk();
  }, [loadKategori, loadProduk]);

  // Filter — memoized: hanya re-run saat allProdukList / kategori / search berubah
  const filteredList = useMemo(() => {
    let list = allProdukList;
    if (selectedKategori !== "Semua") {
      list = list.filter((p) => p.kategori === selectedKategori);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          (p.kategori && p.kategori.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allProdukList, selectedKategori, searchQuery]);

  const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

  const formatCurrencyInput = (text) => {
    const numbers = String(text || "").replace(/\D/g, "");
    if (numbers === "") return "";
    return parseInt(numbers, 10).toLocaleString("id-ID");
  };

  const parseCurrencyInput = (text) => {
    const numbers = String(text || "").replace(/\D/g, "");
    return numbers === "" ? 0 : parseInt(numbers, 10);
  };

  const resetForm = () => {
    setNama("");
    setHarga("");
    setKategori("Makanan");
    setStok("24");
    setFoto("");
    setBarcode("");
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
    setKategori(produk.kategori || "Makanan");
    setStok(produk.stok ? String(produk.stok) : "24");
    setFoto(produk.foto || "");
    setBarcode(produk.barcode || "");
    setEditingId(produk.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      showWarning("Nama wajib diisi", "Silakan isi nama produk terlebih dahulu.");
      return;
    }
    const hargaNum = parseCurrencyInput(harga);
    if (hargaNum <= 0) {
      showWarning("Harga tidak valid", "Harga jual harus lebih dari 0.");
      return;
    }
    const stokNum = parseInt(stok) || 0;
    const fotoVal = foto.trim() ? foto.trim() : null;
    const barcodeVal = barcode.trim() ? barcode.trim() : null;
    try {
      if (isEditMode && editingId) {
        await updateProduk(editingId, {
          nama: nama.trim(),
          harga: hargaNum,
          kategori: kategori.trim() || "Makanan",
          foto: fotoVal,
          barcode: barcodeVal,
        });
      } else {
        await tambahProduk({
          nama: nama.trim(),
          harga: hargaNum,
          kategori: kategori.trim() || "Makanan",
          stok: stokNum,
          foto: fotoVal,
          barcode: barcodeVal,
        });
      }
      setShowModal(false);
      resetForm();
      await loadProduk();
    } catch (error) {
      showError("Gagal menyimpan", "Terjadi kesalahan saat menyimpan produk.");
    }
  };

  const handleDelete = (produk) => {
    showConfirm({
      title: "Hapus Produk",
      message: `Yakin ingin menghapus "${produk.nama}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Hapus",
      destructive: true,
      onConfirm: async () => {
        try {
          await hapusProduk(produk.id);
          await loadProduk();
        } catch (error) {
          showError("Gagal menghapus", "Terjadi kesalahan saat menghapus produk.");
        }
      },
    });
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showWarning(
        "Izin Diperlukan",
        "Aplikasi membutuhkan akses ke galeri foto untuk menambahkan gambar produk.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      const fileName = `product_${Date.now()}.jpg`;

      try {
        const source = new File(uri);
        const dest = new File(Paths.document, fileName);
        await source.copy(dest, { overwrite: true });
        setFoto(dest.uri);
      } catch (error) {
        console.error("Error copy image:", error);
        showError("Gagal menyimpan foto", "Terjadi kesalahan saat menyalin foto.");
      }
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Katalog Produk</Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={s.headerMenuBtn}
        >
          <MaterialIcon name="account_circle" size={22} color="#1A1D1F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Counter */}
        <Text style={s.counterText}>
          {allProdukList.length} produk terdaftar
        </Text>

        {/* Search Bar */}
        <View style={s.searchBox}>
          <MaterialIcon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={s.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcon name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catScroll}
          style={s.catContainer}
        >
          {kategoriList.map((kat) => (
            <TouchableOpacity
              key={kat}
              style={[s.catPill, selectedKategori === kat && s.catPillOn]}
              onPress={() => setSelectedKategori(kat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  s.catPillText,
                  selectedKategori === kat && s.catPillTextOn,
                ]}
              >
                {kat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product List — FlatList: virtualisasi, render hanya item yang terlihat */}
        <FlatList
          data={filteredList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[s.scrollInner, s.productList]}
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialIcon name="inventory_2" size={28} color="#CBD5E1" />
              <Text style={s.emptyTitle}>Belum ada produk</Text>
              <Text style={s.emptySub}>Tap + untuk tambah</Text>
            </View>
          }
          renderItem={({ item, index: i, separators }) => (
            <View key={String(item.id)} style={s.productRow}>
              <ProductThumb
                foto={item.foto}
                kategori={item.kategori}
                size={40}
                radius={8}
              />
              <View style={s.productLeft}>
                <Text style={s.productName} numberOfLines={1}>
                  {item.nama}
                </Text>
                <Text style={s.productMeta}>
                  {item.kategori || "Umum"} • Stok {item.stok || 0}
                </Text>
              </View>
              <View style={s.productRight}>
                <Text style={s.productPrice}>{formatRupiah(item.harga)}</Text>
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={s.btnAction}
                    onPress={() => openEditModal(item)}
                  >
                    <MaterialIcon name="edit" size={14} color="#64748B" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.btnAction}
                    onPress={() => handleDelete(item)}
                  >
                    <MaterialIcon name="delete" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      </ScrollView>

      {/* FAB Tambah Produk */}
      <TouchableOpacity
        style={s.fab}
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <MaterialIcon name="add" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {isEditMode ? "Edit Produk" : "Tambah Produk"}
            </Text>

            <ScrollView
              style={s.modalForm}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>NAMA PRODUK</Text>
                <View style={s.fieldInput}>
                  <TextInput
                    style={s.fieldText}
                    placeholder="Contoh: Indomie Goreng"
                    placeholderTextColor="#CBD5E1"
                    value={nama}
                    onChangeText={setNama}
                  />
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>HARGA JUAL</Text>
                <View style={s.fieldInput}>
                  <Text style={s.fieldRp}>Rp</Text>
                  <TextInput
                    style={[s.fieldText, s.fieldTextBold]}
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    value={harga}
                    onChangeText={(t) => setHarga(formatCurrencyInput(t))}
                  />
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>KATEGORI</Text>
                <View style={s.catChipRow}>
                  {["Makanan", "Minuman", "Rokok", "Snack", "Kebutuhan"].map(
                    (c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          s.catChip,
                          kategori === c && s.catChipOn,
                        ]}
                        onPress={() => setKategori(c)}
                      >
                        <Text
                          style={[
                            s.catChipText,
                            kategori === c && s.catChipTextOn,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>STOK</Text>
                <View style={s.fieldInput}>
                  <TextInput
                    style={s.fieldText}
                    placeholder="24"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    value={stok}
                    onChangeText={setStok}
                  />
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>BARCODE (OPSIONAL)</Text>
                <View style={s.fieldInput}>
                  <TextInput
                    style={s.fieldText}
                    placeholder="Nomor barcode produk"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    value={barcode}
                    onChangeText={setBarcode}
                  />
                  <TouchableOpacity
                    onPress={() => setShowBarcodeScanner(true)}
                    style={s.btnScanBarcode}
                  >
                    <MaterialIcon
                      name="qr_code_scanner"
                      size={18}
                      color="#1A1D1F"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>FOTO PRODUK (OPSIONAL)</Text>
                <TouchableOpacity style={s.btnPickPhoto} onPress={handlePickImage}>
                  <MaterialIcon name="image" size={18} color="#64748B" />
                  <Text style={s.btnPickPhotoText}>Pilih dari Galeri</Text>
                </TouchableOpacity>
                {foto ? (
                  <View style={s.photoPreview}>
                    <ProductThumb foto={foto} kategori={kategori} size={60} />
                    <Text style={s.photoPreviewText} numberOfLines={1}>
                      {foto.length > 40 ? `...${foto.slice(-37)}` : foto}
                    </Text>
                    <TouchableOpacity onPress={() => setFoto("")}>
                      <MaterialIcon name="close" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.btnCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={s.btnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSave} onPress={handleSave}>
                <Text style={s.btnSaveText}>
                  {isEditMode ? "Simpan" : "Tambah"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal (input kode) */}
      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanCode={(code) => setBarcode(code)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FC" },

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
    color: "#191C1E",
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
    paddingTop: 12,
    paddingBottom: 100,
  },

  // Counter
  counterText: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 12,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#191C1E",
    padding: 0,
  },

  // Category Pills
  catContainer: { marginBottom: 20 },
  catScroll: { gap: 6 },
  catPill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  catPillOn: {
    backgroundColor: "#1A1D1F",
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  catPillTextOn: {
    color: "#FFF",
    fontWeight: "700",
  },

  // Product List
  productList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  productLeft: { flex: 1, marginRight: 12 },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#191C1E",
  },
  productMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  productRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: "auto",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191C1E",
  },
  actionRow: {
    flexDirection: "row",
    gap: 4,
  },
  btnAction: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty
  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  emptySub: {
    fontSize: 12,
    color: "#CBD5E1",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1A1D1F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191C1E",
    marginBottom: 16,
  },
  modalForm: { maxHeight: 380 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  fieldRp: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginRight: 6,
  },
  fieldText: {
    flex: 1,
    fontSize: 14,
    color: "#191C1E",
    padding: 0,
  },
  fieldTextBold: {
    fontWeight: "700",
    fontSize: 16,
  },
  btnScanBarcode: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  catChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  catChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  catChipOn: {
    backgroundColor: "#1A1D1F",
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  catChipTextOn: {
    color: "#FFF",
    fontWeight: "700",
  },
  btnPickPhoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  btnPickPhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  photoPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#F8F9FC",
    borderRadius: 8,
  },
  photoPreviewText: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
  },

  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  btnCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  btnSave: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1A1D1F",
    justifyContent: "center",
    alignItems: "center",
  },
  btnSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
