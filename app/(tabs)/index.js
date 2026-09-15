/**
 * ============================================
 * SCREEN KASIR - Clean & Spacious
 * ============================================
 * - Search top (sticky)
 * - Barang Terakhir Dibeli row
 * - Product thumbnails (foto)
 * - Material Symbols (no emoji)
 */

import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { ambilSemuaProduk } from "../../database/productService";
import { MaterialIcon } from "../../components/MaterialIcon";
import { ProductThumb } from "../../components/ProductThumb";
import BarcodeScannerModal from "../../components/BarcodeScannerModal";
import useAuthStore from "../../store/authStore";
import { showConfirm } from "../../utils/alertHelper";
import useCartStore from "../../store/cartStore";
import { useRecentStore } from "../../store/recentStore";

const QUICK_DIALS = [
  { label: "1.000", price: 1000 },
  { label: "2.000", price: 2000 },
  { label: "5.000", price: 5000 },
  { label: "10.000", price: 10000 },
];

export default function KasirScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const {
    items,
    totalHarga,
    tambahJajanan,
    tambahProduk,
    kurangiItem,
    tambahQtyItem,
    clearKeranjang,
  } = useCartStore();
  const { recentProduk, loadRecent } = useRecentStore();

  const [allProdukList, setAllProdukList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const loadProducts = React.useCallback(async () => {
    try {
      const list = await ambilSemuaProduk({ aktifOnly: true });
      setAllProdukList(list);
    } catch (error) {
      console.error("Error load products:", error);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    // Async DB fetch; setState happens after await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
    loadRecent();
  }, []);

  // Also refresh recent AND products when screen comes back to focus
  useFocusEffect(
    React.useCallback(() => {
      loadRecent();
      loadProducts();
    }, []),
  );

  const triggerToast = (msg, isErr = false) => {
    setToastMessage(msg);
    setToastIsError(isErr);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

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

  // Search results (instant filter)
  const searchResults =
    searchQuery.trim() === ""
      ? []
      : allProdukList.filter((p) => {
          const q = searchQuery.toLowerCase().trim();
          return (
            p.nama.toLowerCase().includes(q) ||
            (p.kategori && p.kategori.toLowerCase().includes(q))
          );
        });

  const handleSelectResult = (produk) => {
    tambahProduk(produk);
    triggerToast(`${produk.nama} ditambahkan`);
    setSearchQuery("");
  };

  const handleTambahJajanan = (harga) => {
    tambahJajanan(harga);
    triggerToast(`Jajanan ${formatRupiah(harga)} ditambahkan`);
  };

  const handleCustomPriceSubmit = () => {
    const price = parseCurrencyInput(customPrice);
    if (price <= 0) {
      triggerToast("Nominal tidak valid", true);
      return;
    }
    tambahJajanan(price);
    triggerToast(`Custom ${formatRupiah(price)} ditambahkan`);
    setCustomPrice("");
    setShowCustomModal(false);
  };

  const handleGoToCheckout = () => {
    if (items.length === 0) {
      triggerToast("Keranjang masih kosong", true);
      return;
    }
    router.push("/checkout");
  };

  const handleScanProduct = (product) => {
    tambahProduk(product);
  };

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Toast */}
      {showToast && (
        <View style={[s.toast, toastIsError ? s.toastErr : s.toastOk]}>
          <MaterialIcon
            name={toastIsError ? "warning" : "check"}
            size={14}
            color="#FFF"
          />
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>TRITOP JAYA</Text>
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

      {/* Search Bar (Top, sticky) */}
      <View style={s.searchSection}>
        <View style={s.searchInputBox}>
          <MaterialIcon name="search" size={16} color="#A8A29E" />
          <TextInput
            style={s.searchInput}
            placeholder="Cari barang..."
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

        {/* Scan Barcode Button - Standalone & Prominent */}
        <TouchableOpacity
          style={s.scanBtn}
          onPress={() => setShowScanner(true)}
          activeOpacity={0.85}
        >
          <MaterialIcon name="qr_code_scanner" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Scroll Area */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Results Dropdown (Top, Natural Flow) */}
        {searchQuery.trim() !== "" && (
          <View style={s.searchDropdown}>
            <Text style={s.searchCount}>{searchResults.length} hasil</Text>
            {searchResults.length === 0 ? (
              <View style={s.emptySearchBox}>
                <MaterialIcon name="search" size={24} color="#D6D3D1" />
                <Text style={s.emptySearchText}>Produk tidak ditemukan</Text>
              </View>
            ) : (
              searchResults.slice(0, 8).map((produk) => (
                <TouchableOpacity
                  key={produk.id}
                  style={s.searchResultRow}
                  onPress={() => handleSelectResult(produk)}
                  activeOpacity={0.7}
                >
                  <ProductThumb
                    foto={produk.foto}
                    kategori={produk.kategori}
                    size={40}
                  />
                  <View style={s.searchResultInfo}>
                    <Text style={s.searchResultName} numberOfLines={1}>
                      {produk.nama}
                    </Text>
                    <Text style={s.searchResultMeta}>
                      {produk.kategori || "Umum"}
                    </Text>
                  </View>
                  <Text style={s.searchResultPrice}>
                    {formatRupiah(produk.harga)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Quick Dial Chips */}
        <View style={s.quickRow}>
          {QUICK_DIALS.map((dial) => (
            <TouchableOpacity
              key={dial.price}
              style={s.quickBtn}
              onPress={() => handleTambahJajanan(dial.price)}
              activeOpacity={0.7}
            >
              <Text style={s.quickText}>{dial.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.quickBtn, s.quickBtnCustom]}
            onPress={() => setShowCustomModal(true)}
            activeOpacity={0.7}
          >
            <MaterialIcon name="add" size={18} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Barang Terakhir Dibeli (Recent Items) */}
        {recentProduk.length > 0 && (
          <View style={s.recentSection}>
            <Text style={s.recentLabel}>Barang Terakhir Dibeli</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.recentScroll}
            >
              {recentProduk.map((produk) => (
                <TouchableOpacity
                  key={produk.id}
                  style={s.recentItem}
                  onPress={() => {
                    tambahProduk(produk);
                    triggerToast(`${produk.nama} ditambahkan`);
                  }}
                  activeOpacity={0.7}
                >
                  <ProductThumb
                    foto={produk.foto}
                    kategori={produk.kategori}
                    size={48}
                    radius={8}
                  />
                  <Text style={s.recentName} numberOfLines={1}>
                    {produk.nama}
                  </Text>
                  <Text style={s.recentPrice}>{formatRupiah(produk.harga)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cart List */}
        {items.length === 0 ? (
          <View style={s.emptyCartBox}>
            <MaterialIcon name="shopping_bag" size={28} color="#D6D3D1" />
            <Text style={s.emptyCartTitle}>Belum ada barang</Text>
            <Text style={s.emptyCartSub}>Ketik untuk mulai menambahkan</Text>
          </View>
        ) : (
          <View style={s.cartList}>
            {items.map((item) => (
              <View key={item.uniqueId} style={s.cartItemRow}>
                <ProductThumb
                  foto={item.foto}
                  kategori={item.kategori}
                  size={36}
                  radius={6}
                />
                <View style={s.cartItemLeft}>
                  <Text style={s.cartItemName} numberOfLines={1}>
                    {item.tipe === "jajanan"
                      ? `Jajanan ${formatRupiah(item.harga)}`
                      : item.nama}
                  </Text>
                  <Text style={s.cartItemMeta}>
                    {formatRupiah(item.harga)} / item
                  </Text>
                </View>
                <View style={s.cartItemRight}>
                  <TouchableOpacity
                    onPress={() => kurangiItem(item.uniqueId)}
                    style={s.qtyBtn}
                  >
                    <MaterialIcon name="remove" size={14} color="#57534E" />
                  </TouchableOpacity>
                  <Text style={s.qtyVal}>{item.qty}</Text>
                  <TouchableOpacity
                    onPress={() => tambahQtyItem(item.uniqueId)}
                    style={s.qtyBtn}
                  >
                    <MaterialIcon name="add" size={14} color="#059669" />
                  </TouchableOpacity>
                  <Text style={s.cartItemSubtotal}>
                    {formatRupiah(item.harga * item.qty)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Docked Cart Bar (Light theme) */}
      <View style={s.dockedBar}>
        <View style={s.dockedLeft}>
          <Text style={s.dockedLabel}>{totalQty} item</Text>
          <Text style={s.dockedAmount}>{formatRupiah(totalHarga)}</Text>
        </View>
        <TouchableOpacity
          style={[s.btnPay, items.length === 0 && s.btnPayOff]}
          onPress={handleGoToCheckout}
          disabled={items.length === 0}
          activeOpacity={0.85}
        >
          <Text style={s.btnPayText}>Bayar</Text>
          <MaterialIcon name="arrow_forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Custom Price Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Input Nominal</Text>
            <View style={s.inputRow}>
              <Text style={s.inputRp}>Rp</Text>
              <TextInput
                style={s.inputField}
                value={customPrice}
                onChangeText={(t) => setCustomPrice(formatCurrencyInput(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#D6D3D1"
                autoFocus
              />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.btnModalCancel}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={s.btnModalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnModalOk}
                onPress={handleCustomPriceSubmit}
              >
                <Text style={s.btnModalOkText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onProductFound={handleScanProduct}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF7F4" },

  // Toast
  toast: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastOk: { backgroundColor: "#059669" },
  toastErr: { backgroundColor: "#DC2626" },
  toastText: { fontSize: 12, fontWeight: "600", color: "#FFF" },

  // Header
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1C1917" },
  headerMenuBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },

  // Search Section
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#F5F5F4",
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1C1917", padding: 0 },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },

  // Search Dropdown (natural flow)
  searchDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#A8A29E",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchResultInfo: { flex: 1, marginRight: 8 },
  searchResultName: { fontSize: 14, fontWeight: "600", color: "#1C1917" },
  searchResultMeta: { fontSize: 11, color: "#A8A29E", marginTop: 1 },
  searchResultPrice: { fontSize: 14, fontWeight: "700", color: "#059669" },
  emptySearchBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 4,
  },
  emptySearchText: { fontSize: 13, color: "#A8A29E" },

  // Quick Dial
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  quickBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E7E5E4",
  },
  quickBtnCustom: { flex: 0, width: 44 },
  quickText: { fontSize: 14, fontWeight: "700", color: "#1C1917" },

  // Recent Section
  recentSection: { marginBottom: 20 },
  recentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8A29E",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recentScroll: { gap: 12, paddingRight: 8 },
  recentItem: {
    width: 72,
    alignItems: "center",
    gap: 4,
  },
  recentName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1C1917",
    textAlign: "center",
    marginTop: 4,
  },
  recentPrice: {
    fontSize: 10,
    color: "#A8A29E",
  },

  // Cart List
  cartList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F4",
  },
  cartItemLeft: { flex: 1, marginRight: 8 },
  cartItemName: { fontSize: 14, fontWeight: "600", color: "#1C1917" },
  cartItemMeta: { fontSize: 12, color: "#A8A29E", marginTop: 2 },
  cartItemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
    minWidth: 16,
    textAlign: "center",
  },
  cartItemSubtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
    minWidth: 60,
    textAlign: "right",
  },

  // Empty Cart
  emptyCartBox: { alignItems: "center", paddingVertical: 40, gap: 4 },
  emptyCartTitle: { fontSize: 14, fontWeight: "600", color: "#A8A29E" },
  emptyCartSub: { fontSize: 12, color: "#D6D3D1" },

  // Docked Bar
  dockedBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#F5F5F4",
  },
  dockedLeft: { flex: 1 },
  dockedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#A8A29E",
    marginBottom: 2,
  },
  dockedAmount: { fontSize: 18, fontWeight: "700", color: "#1C1917" },
  btnPay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: "#059669",
    borderRadius: 24,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPayOff: { backgroundColor: "#D6D3D1" },
  btnPayText: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E7E5E4",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1C1917", marginBottom: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF7F4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  inputRp: { fontSize: 16, fontWeight: "600", color: "#A8A29E", marginRight: 6 },
  inputField: { flex: 1, fontSize: 22, fontWeight: "700", color: "#1C1917", padding: 0 },
  modalActions: { flexDirection: "row", gap: 8 },
  btnModalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F5F5F4",
    justifyContent: "center",
    alignItems: "center",
  },
  btnModalCancelText: { fontSize: 14, fontWeight: "600", color: "#57534E" },
  btnModalOk: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  btnModalOkText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});