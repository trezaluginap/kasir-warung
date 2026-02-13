/**
 * ============================================
 * SCREEN KASIR - WARUNG POS
 * ============================================
 *
 * Modern minimalist kasir dengan contemporary design
 * Updated with sleek UI and better UX
 */

import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
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
import { ambilSemuaProduk } from "../../database/productService";
import useAuthStore from "../../store/authStore";
import useCartStore from "../../store/cartStore";
import { buildReceiptHtml } from "../../utils/receiptTemplate";

// Tombol harga cepat untuk jajanan (1000 - 5000 dengan interval 500)
const QUICK_PRICES = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

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
    checkout,
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [produkList, setProdukList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Load produk dari database saat component mount
  useEffect(() => {
    loadProduk();
  }, []);

  const loadProduk = async () => {
    try {
      const produk = await ambilSemuaProduk({ aktifOnly: true });
      setProdukList(produk);
    } catch (error) {
      console.error("Error load produk:", error);
      Alert.alert("Error", "Gagal load produk dari database");
    }
  };

  // Format rupiah buat tampilan
  const formatRupiah = (angka) => {
    return `Rp ${angka.toLocaleString("id-ID")}`;
  };

  // Format currency untuk input (tambahkan titik separator)
  const formatCurrencyInput = (text) => {
    const numbers = text.replace(/\D/g, "");
    if (numbers === "") return "";
    const formatted = parseInt(numbers, 10).toLocaleString("id-ID");
    return formatted;
  };

  // Parse currency input kembali ke number
  const parseCurrencyInput = (text) => {
    const numbers = text.replace(/\D/g, "");
    return numbers === "" ? 0 : parseInt(numbers, 10);
  };

  // Handle tambah jajanan (quick price)
  const handleTambahJajanan = (harga) => {
    tambahJajanan(harga);
  };

  // Handle custom price
  const handleCustomPrice = () => {
    const price = parseCurrencyInput(customPrice);
    if (price <= 0) {
      Alert.alert("Error", "Harga tidak valid");
      return;
    }
    tambahJajanan(price);
    setCustomPrice("");
    setShowCustomModal(false);
  };

  // Handle tambah produk ke keranjang
  const handleTambahProduk = (produk) => {
    tambahProduk(produk);
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin logout?", [
      { text: "Batal", onPress: () => {} },
      {
        text: "Ya, Logout",
        onPress: async () => {
          try {
            logout();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "Gagal logout: " + error.message);
          }
        },
        style: "destructive",
      },
    ]);
  };

  // Handle checkout - tampilkan modal pilihan
  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Keranjang Kosong", "Pilih barang dulu ya");
      return;
    }
    setShowCheckoutModal(true);
  };

  // Handle simpan transaksi tanpa cetak struk
  const handleSimpanTransaksi = async () => {
    setShowCheckoutModal(false);
    setIsCheckingOut(true);

    try {
      const result = await checkout();

      if (result.success) {
        Alert.alert(
          "Berhasil",
          `Transaksi berhasil disimpan\nTotal: ${formatRupiah(
            result.data.totalHarga,
          )}`,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert("Gagal", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan: " + error.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handle cetak struk
  const handleCetakStruk = async () => {
    setShowCheckoutModal(false);
    setIsCheckingOut(true);

    try {
      const result = await checkout();

      if (result.success) {
        const transaksi = result.data;

        try {
          const isAvailable = await Sharing.isAvailableAsync();
          if (!isAvailable) {
            Alert.alert(
              "Info",
              `Transaksi berhasil disimpan (${formatRupiah(transaksi.totalHarga)})\n\nFitur cetak struk tidak tersedia di perangkat ini`,
            );
            return;
          }

          const html = buildReceiptHtml(transaksi, {
            storeName: "WARUNG POS",
            storeAddress: "Jl. Warung No. 1",
            storePhone: "Telp. 08xx-xxxx-xxxx",
          });

          const { uri } = await Print.printToFileAsync({ html });
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          });

          Alert.alert(
            "Berhasil",
            `Transaksi berhasil disimpan dan struk dicetak\nTotal: ${formatRupiah(
              transaksi.totalHarga,
            )}`,
          );
        } catch (printError) {
          console.error("Error cetak struk:", printError);
          Alert.alert(
            "Peringatan",
            `Transaksi berhasil disimpan (${formatRupiah(transaksi.totalHarga)})\n\nNamun gagal mencetak struk`,
          );
        }
      } else {
        Alert.alert("Gagal", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan: " + error.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filter produk berdasarkan search
  const filteredProduk = produkList.filter((p) =>
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Render item di keranjang
  const renderCartItem = (item) => {
    const displayName =
      item.tipe === "jajanan"
        ? `Jajanan ${formatRupiah(item.harga)}`
        : item.nama;

    return (
      <View key={item.uniqueId} style={styles.cartItem}>
        <View style={styles.cartItemLeft}>
          <View style={styles.cartItemInfo}>
            <Text style={styles.cartItemName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.cartItemPrice}>
              {formatRupiah(item.harga)} × {item.qty}
            </Text>
          </View>
        </View>

        <View style={styles.cartItemRight}>
          <View style={styles.cartItemControls}>
            <TouchableOpacity
              style={styles.btnMinus}
              onPress={() => kurangiItem(item.uniqueId)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.qty}</Text>

            <TouchableOpacity
              style={styles.btnPlus}
              onPress={() => tambahQtyItem(item.uniqueId)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cartItemSubtotal}>
            {formatRupiah(item.harga * item.qty)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.main}
      />

      {/* Modern Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>🛒</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Kasir</Text>
              <Text style={styles.headerSubtitle}>Warung POS</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.cartBadgeContainer}>
              <Text style={styles.cartBadgeIcon}>🛍️</Text>
              {items.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{items.length}</Text>
                </View>
              )}
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Price Section - Modern Grid */}
        <View style={styles.quickPriceSection}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <Text style={styles.sectionTitle}>Harga Cepat</Text>
          </View>

          <View style={styles.quickPriceGrid}>
            {QUICK_PRICES.map((harga) => (
              <TouchableOpacity
                key={harga}
                style={styles.quickPriceButton}
                onPress={() => handleTambahJajanan(harga)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickPriceAmount}>
                  {harga.toLocaleString("id-ID")}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.quickPriceButton, styles.customPriceButton]}
              onPress={() => setShowCustomModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.customPriceIcon}>+</Text>
              <Text style={styles.customPriceLabel}>Lainnya</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Section - Modern Cards */}
        <View style={styles.productSection}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionIcon}>📦</Text>
            <Text style={styles.sectionTitle}>Produk Tersedia</Text>
          </View>

          {/* Search Bar */}
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
                <Text style={styles.clearIcon}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Product Grid */}
          <View style={styles.productGrid}>
            {filteredProduk.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Text style={styles.emptyIcon}>
                    {searchQuery ? "🔍" : "📦"}
                  </Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? "Produk Tidak Ditemukan" : "Belum Ada Produk"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? `Tidak ada hasil untuk "${searchQuery}"`
                    : "Tambahkan produk di menu produk"}
                </Text>
              </View>
            ) : (
              filteredProduk.map((produk) => (
                <TouchableOpacity
                  key={produk.id}
                  style={styles.productCard}
                  onPress={() => handleTambahProduk(produk)}
                  activeOpacity={0.85}
                >
                  <View style={styles.productCardContent}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {produk.nama}
                    </Text>
                    {produk.kategori && (
                      <View style={styles.productCategory}>
                        <Text style={styles.productCategoryText}>
                          {produk.kategori}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>
                      {formatRupiah(produk.harga)}
                    </Text>
                    <View style={styles.addIndicator}>
                      <Text style={styles.addIndicatorText}>+</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modern Cart Footer */}
      <View style={styles.cartFooter}>
        {/* Cart Items Preview */}
        {items.length > 0 && (
          <View style={styles.cartPreview}>
            <ScrollView
              style={styles.cartScrollView}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {items.map(renderCartItem)}
            </ScrollView>
          </View>
        )}

        {/* Checkout Bar */}
        <View style={styles.checkoutBar}>
          <View style={styles.totalSection}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalAmount}>{formatRupiah(totalHarga)}</Text>
            </View>
            {items.length > 0 && (
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{items.length} item</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              (items.length === 0 || isCheckingOut) &&
                styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={items.length === 0 || isCheckingOut}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutButtonText}>
              {isCheckingOut ? "Memproses..." : "Checkout"}
            </Text>
            {!isCheckingOut && <Text style={styles.checkoutButtonIcon}>→</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Custom Price Modal */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Harga Custom</Text>
                <Text style={styles.modalSubtitle}>
                  Masukkan nominal harga yang diinginkan
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setCustomPrice("");
                  setShowCustomModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  placeholderTextColor={Colors.text.disabled}
                  keyboardType="numeric"
                  value={customPrice}
                  onChangeText={(text) =>
                    setCustomPrice(formatCurrencyInput(text))
                  }
                  autoFocus
                />
              </View>
              {customPrice && (
                <Text style={styles.pricePreview}>
                  {formatRupiah(parseCurrencyInput(customPrice))}
                </Text>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalCancelButton]}
                onPress={() => {
                  setCustomPrice("");
                  setShowCustomModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalConfirmButton]}
                onPress={handleCustomPrice}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Tambahkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modern Checkout Modal */}
      <Modal
        visible={showCheckoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Checkout</Text>
                <Text style={styles.modalSubtitle}>
                  Pilih metode penyelesaian transaksi
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCheckoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.checkoutSummaryCard}>
                <Text style={styles.summaryLabel}>Total Pembayaran</Text>
                <Text style={styles.summaryAmount}>
                  {formatRupiah(totalHarga)}
                </Text>
                <Text style={styles.summaryItems}>
                  {items.length} item dalam keranjang
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutOption}
                onPress={handleSimpanTransaksi}
                activeOpacity={0.85}
              >
                <View style={styles.checkoutOptionIconContainer}>
                  <Text style={styles.checkoutOptionEmoji}>💾</Text>
                </View>
                <View style={styles.checkoutOptionContent}>
                  <Text style={styles.checkoutOptionTitle}>
                    Simpan Transaksi
                  </Text>
                  <Text style={styles.checkoutOptionDesc}>
                    Simpan tanpa mencetak struk
                  </Text>
                </View>
                <Text style={styles.checkoutOptionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkoutOption, styles.checkoutOptionPrimary]}
                onPress={handleCetakStruk}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkoutOptionIconContainer,
                    styles.checkoutOptionIconPrimary,
                  ]}
                >
                  <Text style={styles.checkoutOptionEmoji}>🖨️</Text>
                </View>
                <View style={styles.checkoutOptionContent}>
                  <Text
                    style={[
                      styles.checkoutOptionTitle,
                      styles.checkoutOptionTitlePrimary,
                    ]}
                  >
                    Cetak Struk
                  </Text>
                  <Text
                    style={[
                      styles.checkoutOptionDesc,
                      styles.checkoutOptionDescPrimary,
                    ]}
                  >
                    Simpan dan cetak struk pembayaran
                  </Text>
                </View>
                <Text style={styles.checkoutOptionArrowPrimary}>→</Text>
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

  // Header Styles
  header: {
    backgroundColor: Colors.primary.main,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius["2xl"],
    borderBottomRightRadius: BorderRadius["2xl"],
    ...Shadows.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.contrast,
    opacity: 0.85,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cartBadgeContainer: {
    position: "relative",
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.accent.error,
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    fontSize: 24,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Section Headers
  sectionHeaderContainer: {
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

  // Quick Price Section
  quickPriceSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  quickPriceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickPriceButton: {
    backgroundColor: "#FFFFFF",
    width: "18%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
    ...Shadows.sm,
  },
  quickPriceAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  customPriceButton: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  customPriceIcon: {
    fontSize: 24,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 2,
  },
  customPriceLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },

  // Product Section
  productSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    ...Shadows.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.xs,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  clearIcon: {
    fontSize: 20,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Product Grid
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    width: "47.5%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    ...Shadows.md,
  },
  productCardContent: {
    marginBottom: Spacing.sm,
    minHeight: 60,
  },
  productName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  productCategory: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F3FF",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  productCategoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  productPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  addIndicator: {
    backgroundColor: Colors.primary.main,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  addIndicatorText: {
    fontSize: 18,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 18,
  },

  // Empty State
  emptyState: {
    width: "100%",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F0F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: "center",
  },

  // Cart Footer
  cartFooter: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    ...Shadows.xl,
    maxHeight: "55%",
  },
  cartPreview: {
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  cartScrollView: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  // Cart Item
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  cartItemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  cartItemInfo: {
    gap: 4,
  },
  cartItemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  cartItemPrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  cartItemRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  cartItemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  btnMinus: {
    backgroundColor: Colors.accent.error,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPlus: {
    backgroundColor: Colors.accent.success,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
    lineHeight: 16,
  },
  qtyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    minWidth: 24,
    textAlign: "center",
    color: Colors.text.primary,
  },
  cartItemSubtotal: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },

  // Checkout Bar
  checkoutBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  totalSection: {
    flex: 1,
    gap: Spacing.xs,
  },
  totalInfo: {
    gap: 4,
  },
  totalLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  totalAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  itemCountBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF4E5",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  itemCountText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent.warning,
  },
  checkoutButton: {
    backgroundColor: Colors.primary.main,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  checkoutButtonIcon: {
    fontSize: 20,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
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
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
  },
  modalCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary.main,
    ...Shadows.md,
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },

  // Custom Price Modal
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  currencyPrefix: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  pricePreview: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: "center",
  },

  // Checkout Modal
  checkoutSummaryCard: {
    backgroundColor: "#F0F3FF",
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  summaryItems: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  checkoutOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  checkoutOptionPrimary: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkoutOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  checkoutOptionIconPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  checkoutOptionEmoji: {
    fontSize: 24,
  },
  checkoutOptionContent: {
    flex: 1,
    gap: 2,
  },
  checkoutOptionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  checkoutOptionTitlePrimary: {
    color: Colors.primary.contrast,
  },
  checkoutOptionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  checkoutOptionDescPrimary: {
    color: Colors.primary.contrast,
    opacity: 0.85,
  },
  checkoutOptionArrow: {
    fontSize: 20,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.bold,
  },
  checkoutOptionArrowPrimary: {
    fontSize: 20,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
  },
});
