/**
 * ============================================
 * CART STORE - ZUSTAND STATE MANAGEMENT
 * ============================================
 *
 * File ini mengatur state keranjang belanja secara global.
 * Support 2 tipe item:
 * 1. Jajanan (quick price) - tipe: 'jajanan', hanya punya harga
 * 2. Produk tetap - tipe: 'produk', punya id, nama, harga
 *
 * Fitur:
 * - Tambah jajanan (by harga)
 * - Tambah produk (by data lengkap)
 * - Kurangi atau hapus item
 * - Hitung total harga otomatis
 * - Clear keranjang setelah checkout
 * - Simpan transaksi ke database
 */

import { create } from "zustand";
import { simpanTransaksi } from "../database/service";

/**
 * Store utama untuk keranjang belanja
 *
 * State yang disimpan:
 * - items: Array barang di keranjang
 *   Format item jajanan: { tipe: 'jajanan', harga: 500, qty: 2, uniqueId: 'jajanan_500_timestamp' }
 *   Format item produk: { tipe: 'produk', id: 1, nama: 'Indomie', harga: 3000, qty: 1, uniqueId: 'produk_1' }
 * - totalHarga: Total harga semua barang
 */
const useCartStore = create((set, get) => ({
  // State awal
  items: [],
  totalHarga: 0,

  /**
   * Fungsi untuk tambah JAJANAN (quick price) ke keranjang
   * Item jajanan tidak punya nama, hanya harga
   *
   * @param {number} harga - Harga jajanan (contoh: 500, 1000, 2000)
   */
  tambahJajanan: (harga) => {
    const { items } = get();

    // Cari jajanan dengan harga yang sama
    const existingIndex = items.findIndex(
      (item) => item.tipe === "jajanan" && item.harga === harga,
    );

    let newItems;

    if (existingIndex >= 0) {
      // Jajanan sudah ada, tambah qty
      newItems = items.map((item, index) =>
        index === existingIndex ? { ...item, qty: item.qty + 1 } : item,
      );
    } else {
      // Jajanan baru, tambahkan
      const uniqueId = `jajanan_${harga}_${Date.now()}`;
      newItems = [
        ...items,
        {
          tipe: "jajanan",
          harga,
          qty: 1,
          uniqueId,
        },
      ];
    }

    set({
      items: newItems,
      totalHarga: hitungTotal(newItems),
    });

    console.log(`✅ Jajanan Rp ${harga} ditambahkan`);
  },

  /**
   * Fungsi untuk tambah PRODUK ke keranjang
   * Kalau produk sudah ada, qty-nya ditambah
   * Kalau belum ada, produk baru ditambahkan
   *
   * @param {Object} produk - Data produk yang mau ditambah
   *   Format: { id, nama, harga }
   */
  tambahProduk: (produk) => {
    const { items } = get();
    const existingIndex = items.findIndex(
      (item) => item.tipe === "produk" && item.id === produk.id,
    );

    let newItems;

    if (existingIndex >= 0) {
      // Produk sudah ada, tambah qty-nya
      newItems = items.map((item, index) =>
        index === existingIndex ? { ...item, qty: item.qty + 1 } : item,
      );
    } else {
      // Produk baru, tambahin ke keranjang
      const uniqueId = `produk_${produk.id}`;
      newItems = [
        ...items,
        {
          tipe: "produk",
          id: produk.id,
          nama: produk.nama,
          harga: produk.harga,
          qty: 1,
          uniqueId,
        },
      ];
    }

    set({
      items: newItems,
      totalHarga: hitungTotal(newItems),
    });

    console.log("✅ Produk ditambahkan:", produk.nama);
  },

  /**
   * Fungsi untuk kurangi qty item
   * Kalau qty jadi 0, item akan dihapus dari keranjang
   *
   * @param {string} uniqueId - Unique ID item yang mau dikurangi
   */
  kurangiItem: (uniqueId) => {
    const { items } = get();
    let newItems = items.map((item) =>
      item.uniqueId === uniqueId ? { ...item, qty: item.qty - 1 } : item,
    );

    // Hapus item kalau qty jadi 0
    newItems = newItems.filter((item) => item.qty > 0);

    set({
      items: newItems,
      totalHarga: hitungTotal(newItems),
    });

    console.log("➖ Item dikurangi");
  },

  /**
   * Fungsi untuk tambah qty item (untuk tombol +)
   *
   * @param {string} uniqueId - Unique ID item
   */
  tambahQtyItem: (uniqueId) => {
    const { items } = get();
    const item = items.find((i) => i.uniqueId === uniqueId);

    if (!item) return;

    // Kalau jajanan, panggil tambahJajanan
    // Kalau produk, panggil tambahProduk
    if (item.tipe === "jajanan") {
      get().tambahJajanan(item.harga);
    } else {
      get().tambahProduk({ id: item.id, nama: item.nama, harga: item.harga });
    }
  },

  /**
   * Fungsi untuk hapus item dari keranjang langsung
   * Ga peduli qty-nya berapa
   *
   * @param {string} uniqueId - Unique ID item yang mau dihapus
   */
  hapusItem: (uniqueId) => {
    const { items } = get();
    const newItems = items.filter((item) => item.uniqueId !== uniqueId);

    set({
      items: newItems,
      totalHarga: hitungTotal(newItems),
    });

    console.log("🗑️ Item dihapus dari keranjang");
  },

  /**
   * Fungsi untuk kosongkan seluruh keranjang
   * Biasanya dipanggil setelah checkout berhasil
   */
  clearKeranjang: () => {
    set({
      items: [],
      totalHarga: 0,
    });

    console.log("🧹 Keranjang dikosongkan");
  },

  /**
   * Fungsi untuk checkout dan simpan transaksi ke database
   *
   * @returns {Object} Result dengan status dan data transaksi
   */
  checkout: async () => {
    const { items, totalHarga } = get();

    // Validasi: keranjang ga boleh kosong
    if (items.length === 0) {
      return {
        success: false,
        message: "Keranjang masih kosong!",
      };
    }

    try {
      // Format data barang untuk disimpan (model struk Indomaret)
      const daftarBarang = items.map((item) => {
        if (item.tipe === "jajanan") {
          return {
            tipe: "jajanan",
            nama: `Jajanan Rp ${item.harga.toLocaleString("id-ID")}`,
            qty: item.qty,
            harga: item.harga,
            subtotal: item.qty * item.harga,
          };
        } else {
          return {
            tipe: "produk",
            nama: item.nama,
            qty: item.qty,
            harga: item.harga,
            subtotal: item.qty * item.harga,
          };
        }
      });

      // Simpan ke database
      const transaksi = await simpanTransaksi(totalHarga, daftarBarang);

      // Kosongkan keranjang setelah berhasil
      get().clearKeranjang();

      console.log("🎉 Checkout berhasil! ID:", transaksi.id);

      return {
        success: true,
        message: "Transaksi berhasil disimpan!",
        data: transaksi,
      };
    } catch (error) {
      console.error("❌ Error checkout:", error);

      return {
        success: false,
        message: "Gagal menyimpan transaksi: " + error.message,
      };
    }
  },

  /**
   * Fungsi untuk update qty item secara langsung
   * Buat input manual qty
   *
   * @param {string} uniqueId - Unique ID item
   * @param {number} newQty - Qty baru (harus > 0)
   */
  updateQty: (uniqueId, newQty) => {
    if (newQty < 1) {
      // Kalau qty di bawah 1, hapus item
      get().hapusItem(uniqueId);
      return;
    }

    const { items } = get();
    const newItems = items.map((item) =>
      item.uniqueId === uniqueId ? { ...item, qty: newQty } : item,
    );

    set({
      items: newItems,
      totalHarga: hitungTotal(newItems),
    });
  },
}));

/**
 * Helper function untuk hitung total harga
 *
 * @param {Array} items - Array barang di keranjang
 * @returns {number} Total harga keseluruhan
 */
const hitungTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.harga * item.qty;
  }, 0);
};

export default useCartStore;
