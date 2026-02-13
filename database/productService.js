/**
 * ============================================
 * PRODUCT SERVICE - WARUNG POS
 * ============================================
 *
 * File ini mengelola CRUD produk tetap (bukan jajanan kiloan)
 * Produk tetap = barang dengan nama jelas (Indomie, Teh Botol, dll)
 *
 * Fitur:
 * - Tambah produk baru
 * - Edit produk
 * - Hapus produk
 * - Cari produk
 * - Kategori produk
 */

import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "warung_pos.db";
let db = null;
let isInitialized = false;

/**
 * Fungsi untuk mendapatkan instance database
 */
const getDatabase = async () => {
  if (db && isInitialized) {
    return db;
  }

  console.log("⚠️ Product DB belum diinit, melakukan auto-init...");
  await openProductDatabase();
  return db;
};

/**
 * Fungsi untuk buka database
 * Dipanggil otomatis dari initDatabase di service.js
 */
export const openProductDatabase = async () => {
  try {
    // Skip jika sudah diinit
    if (isInitialized && db) {
      console.log("ℹ️ Product database sudah diinisialisasi sebelumnya");
      return true;
    }

    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await createProductsTable();
    await insertDefaultProducts();
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("❌ Error buka product database:", error);
    isInitialized = false;
    throw error;
  }
};

/**
 * Bikin tabel produk kalau belum ada
 * Struktur:
 * - id: ID unik produk
 * - nama: Nama produk (contoh: "Indomie Goreng")
 * - harga: Harga satuan
 * - kategori: Kategori produk (Makanan, Minuman, Rokok, dll)
 * - stok: Stok barang (opsional, bisa NULL)
 * - aktif: Status aktif/nonaktif (1 = aktif, 0 = nonaktif)
 */
const createProductsTable = async () => {
  // Langsung pakai db, jangan getDatabase() karena dipanggil dari openProductDatabase()
  const query = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      harga REAL NOT NULL,
      kategori TEXT DEFAULT 'Umum',
      stok INTEGER DEFAULT NULL,
      aktif INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  try {
    await db.execAsync(query);
    console.log("✅ Tabel products siap!");
  } catch (error) {
    console.error("❌ Error bikin tabel products:", error);
    throw error;
  }
};

/**
 * Insert produk default saat pertama kali install
 * Produk populer warung kecil
 */
const insertDefaultProducts = async () => {
  try {
    // Langsung pakai db, jangan getDatabase() karena dipanggil dari openProductDatabase()
    // Cek apakah sudah ada produk
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM products",
    );

    if (result.count > 0) {
      console.log("✅ Produk default sudah ada");
      return;
    }

    // Data produk default
    const defaultProducts = [
      // Mie Instan
      { nama: "Indomie Goreng", harga: 3000, kategori: "Makanan" },
      { nama: "Indomie Soto", harga: 3000, kategori: "Makanan" },
      { nama: "Indomie Ayam Bawang", harga: 3000, kategori: "Makanan" },
      { nama: "Mie Sedaap Goreng", harga: 3000, kategori: "Makanan" },

      // Minuman
      { nama: "Teh Botol Sosro", harga: 4000, kategori: "Minuman" },
      { nama: "Aqua 600ml", harga: 3500, kategori: "Minuman" },
      { nama: "Fruit Tea", harga: 4500, kategori: "Minuman" },
      { nama: "Coca Cola 250ml", harga: 5000, kategori: "Minuman" },

      // Susu
      { nama: "Susu Ultra 250ml", harga: 5000, kategori: "Minuman" },
      { nama: "Susu Dancow Sachet", harga: 2500, kategori: "Minuman" },

      // Snack
      { nama: "Chitato", harga: 8000, kategori: "Snack" },
      { nama: "Taro", harga: 7000, kategori: "Snack" },
      { nama: "Oreo", harga: 10000, kategori: "Snack" },

      // Kebutuhan
      { nama: "Telur 1 Butir", harga: 2500, kategori: "Kebutuhan" },
      { nama: "Gula Pasir 1kg", harga: 15000, kategori: "Kebutuhan" },
      { nama: "Kopi Kapal Api Sachet", harga: 2000, kategori: "Kebutuhan" },
    ];

    const now = new Date().toISOString();

    for (const product of defaultProducts) {
      await db.runAsync(
        "INSERT INTO products (nama, harga, kategori, aktif, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
        product.nama,
        product.harga,
        product.kategori,
        now,
        now,
      );
    }

    console.log(
      `✅ ${defaultProducts.length} produk default berhasil ditambahkan!`,
    );
  } catch (error) {
    console.error("❌ Error insert default products:", error);
  }
};

/**
 * Tambah produk baru
 *
 * @param {Object} data - Data produk
 *   { nama, harga, kategori, stok (opsional) }
 * @returns {Object} Produk yang baru ditambahkan
 */
export const tambahProduk = async (data) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  const { nama, harga, kategori = "Umum", stok = null } = data;

  if (!nama || !harga) {
    throw new Error("Nama dan harga wajib diisi!");
  }

  const now = new Date().toISOString();

  try {
    const result = await dbInstance.runAsync(
      "INSERT INTO products (nama, harga, kategori, stok, aktif, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)",
      nama,
      harga,
      kategori,
      stok,
      now,
      now,
    );

    console.log("✅ Produk ditambahkan:", nama);

    return {
      id: result.lastInsertRowId,
      nama,
      harga,
      kategori,
      stok,
      aktif: 1,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    console.error("❌ Error tambah produk:", error);
    throw error;
  }
};

/**
 * Ambil semua produk aktif
 *
 * @param {Object} options - Filter options
 *   { kategori, search, aktifOnly }
 * @returns {Array} List produk
 */
export const ambilSemuaProduk = async (options = {}) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  const { kategori = null, search = null, aktifOnly = true } = options;

  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (aktifOnly) {
    query += " AND aktif = 1";
  }

  if (kategori) {
    query += " AND kategori = ?";
    params.push(kategori);
  }

  if (search) {
    query += " AND nama LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY nama ASC";

  try {
    const rows = await dbInstance.getAllAsync(query, ...params);
    console.log(`✅ Ditemukan ${rows.length} produk`);
    return rows;
  } catch (error) {
    console.error("❌ Error ambil produk:", error);
    throw error;
  }
};

/**
 * Ambil produk berdasarkan ID
 */
export const ambilProdukById = async (id) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  try {
    const row = await dbInstance.getFirstAsync(
      "SELECT * FROM products WHERE id = ?",
      id,
    );
    return row || null;
  } catch (error) {
    console.error("❌ Error ambil produk by ID:", error);
    throw error;
  }
};

/**
 * Update produk
 *
 * @param {number} id - ID produk
 * @param {Object} data - Data yang mau diupdate
 * @returns {boolean} Success status
 */
export const updateProduk = async (id, data) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  const { nama, harga, kategori, stok } = data;
  const now = new Date().toISOString();

  const updates = [];
  const params = [];

  if (nama !== undefined) {
    updates.push("nama = ?");
    params.push(nama);
  }
  if (harga !== undefined) {
    updates.push("harga = ?");
    params.push(harga);
  }
  if (kategori !== undefined) {
    updates.push("kategori = ?");
    params.push(kategori);
  }
  if (stok !== undefined) {
    updates.push("stok = ?");
    params.push(stok);
  }

  updates.push("updated_at = ?");
  params.push(now);
  params.push(id);

  const query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;

  try {
    const result = await dbInstance.runAsync(query, ...params);

    if (result.changes > 0) {
      console.log(`✅ Produk ID ${id} berhasil diupdate`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error update produk:", error);
    throw error;
  }
};

/**
 * Hapus produk (soft delete - set aktif = 0)
 *
 * @param {number} id - ID produk
 * @returns {boolean} Success status
 */
export const hapusProduk = async (id) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  try {
    const result = await dbInstance.runAsync(
      "UPDATE products SET aktif = 0, updated_at = ? WHERE id = ?",
      new Date().toISOString(),
      id,
    );

    if (result.changes > 0) {
      console.log(`✅ Produk ID ${id} dihapus (soft delete)`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error hapus produk:", error);
    throw error;
  }
};

/**
 * Hapus produk permanent (hard delete)
 * Hati-hati! Data tidak bisa dikembalikan
 */
export const hapusProdukPermanent = async (id) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  try {
    const result = await dbInstance.runAsync(
      "DELETE FROM products WHERE id = ?",
      id,
    );

    if (result.changes > 0) {
      console.log(`⚠️ Produk ID ${id} dihapus permanent!`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error hapus produk permanent:", error);
    throw error;
  }
};

/**
 * Ambil semua kategori yang ada
 *
 * @returns {Array} List kategori unik
 */
export const ambilKategori = async () => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  try {
    const rows = await dbInstance.getAllAsync(
      "SELECT DISTINCT kategori FROM products WHERE aktif = 1 ORDER BY kategori ASC",
    );
    return rows.map((row) => row.kategori);
  } catch (error) {
    console.error("❌ Error ambil kategori:", error);
    throw error;
  }
};

/**
 * Update stok produk
 * Berguna kalau mau tracking stok barang
 */
export const updateStok = async (id, jumlahPerubahan) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  try {
    const product = await ambilProdukById(id);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    const stokBaru = (product.stok || 0) + jumlahPerubahan;

    await dbInstance.runAsync(
      "UPDATE products SET stok = ?, updated_at = ? WHERE id = ?",
      stokBaru,
      new Date().toISOString(),
      id,
    );

    console.log(
      `✅ Stok produk ${product.nama} diupdate: ${product.stok} → ${stokBaru}`,
    );
    return stokBaru;
  } catch (error) {
    console.error("❌ Error update stok:", error);
    throw error;
  }
};

export default {
  openProductDatabase,
  tambahProduk,
  ambilSemuaProduk,
  ambilProdukById,
  updateProduk,
  hapusProduk,
  hapusProdukPermanent,
  ambilKategori,
  updateStok,
};
