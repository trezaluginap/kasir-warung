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
    await migrateProductsTable();
    await insertDefaultProducts();
    await seedProductsFromJSON();
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
      hpp REAL DEFAULT 0,
      kategori TEXT DEFAULT 'Umum',
      stok INTEGER DEFAULT NULL,
      foto TEXT DEFAULT NULL,
      barcode TEXT DEFAULT NULL,
      sync_id TEXT DEFAULT NULL,
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
 * Migration tambah column foto & barcode untuk DB lama
 */
const migrateProductsTable = async () => {
  try {
    const columns = await db.getAllAsync("PRAGMA table_info(products)");
    const hasFoto = columns.some((c) => c.name === "foto");
    const hasBarcode = columns.some((c) => c.name === "barcode");
    const hasSyncId = columns.some((c) => c.name === "sync_id");
    const hasHpp = columns.some((c) => c.name === "hpp");

    if (!hasFoto) {
      await db.execAsync("ALTER TABLE products ADD COLUMN foto TEXT DEFAULT NULL");
      console.log("✅ Migration: column foto ditambahkan");
    }
    if (!hasBarcode) {
      await db.execAsync("ALTER TABLE products ADD COLUMN barcode TEXT DEFAULT NULL");
      console.log("✅ Migration: column barcode ditambahkan");
    }
    if (!hasSyncId) {
      await db.execAsync(
        "ALTER TABLE products ADD COLUMN sync_id TEXT DEFAULT NULL",
      );
      console.log("✅ Migration: column sync_id ditambahkan");
    }
    if (!hasHpp) {
      await db.execAsync("ALTER TABLE products ADD COLUMN hpp REAL DEFAULT 0");
      console.log("✅ Migration: column hpp ditambahkan");
    }

        // Backfill: produk existing tanpa sync_id -> generate
        const nullSync = await db.getAllAsync(
          "SELECT id FROM products WHERE sync_id IS NULL",
        );
        if (nullSync.length > 0) {
          for (const row of nullSync) {
            const syncId = generateSyncId();
            await db.runAsync(
              "UPDATE products SET sync_id = ? WHERE id = ?",
              syncId,
              row.id,
            );
          }
          console.log(`✅ Backfill sync_id: ${nullSync.length} produk`);
        }
  } catch (error) {
    console.error("❌ Error migrate table products:", error);
  }
};

/**
 * Insert produk default saat pertama kali install
 * Produk populer warung kecil
 */
const insertDefaultProducts = async () => {
  try {
    const now = new Date().toISOString();

    const defaultProducts = [
      { nama: "Indomie Goreng", harga: 3000, kategori: "Makanan", foto: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCH95pyAkkxYrXELprico0XKHb8rj2TvuuKsp82bPWMl13J5dI1qLgk-8K_4oZ5SrRhqcmayLfCIdv79QTe-_HoQtep6ZaiA77fV6aQgHsdb22twlktAkNTO4H_RLDG0f3afIllHZLX4wpqX3jnjxvQR0AJialpbCNT7m41lK58fyDYL7zaLvUVXIjkTfbU0DEdUyK5s6lX-sQ5taTFhqwjYcxKdG3lCN6wSAZ4OCUUhlqdlYpO30aZQ" },
      { nama: "Indomie Soto", harga: 3000, kategori: "Makanan" },
      { nama: "Indomie Ayam Bawang", harga: 3000, kategori: "Makanan" },
      { nama: "Mie Sedaap Goreng", harga: 3000, kategori: "Makanan" },
      { nama: "Teh Botol Sosro", harga: 4000, kategori: "Minuman", foto: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwagmObpED3xK7MXbDwlbiz0aRMEvH1YhL20TAx6K5f7sOff7SzU5eZO6YOs4TWGjradMk9_5A_zvMarwxv59J35NMOGT3hvP3DkjwraC62R_4zJ-AkBmYsCslE-x6EPrzrCa-2KbR2lePx3bU7aPUWYpYFcdqHikQ1IZ6mLZkG4FXHfa3TY9fE3sncV6AZ3WQphBBil1rq_64WxJtQ-NNFxsQlAIlDPdfQ183UZSeLXnhBNjaRkz8gw" },
      { nama: "Aqua 600ml", harga: 3500, kategori: "Minuman" },
      { nama: "Fruit Tea", harga: 4500, kategori: "Minuman" },
      { nama: "Coca Cola 250ml", harga: 5000, kategori: "Minuman" },
      { nama: "Susu Ultra 250ml", harga: 5000, kategori: "Minuman" },
      { nama: "Susu Dancow Sachet", harga: 2500, kategori: "Minuman" },
      { nama: "Chitato", harga: 8000, kategori: "Snack", foto: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9FJuzMfLPs0IpVmJIiYcAAVM_Jp4KuCZXWzXQ7YU1KL5oxZ9PzFpTIuBzbbyIWorWk52M98KH29Kb0rNa8Xxi_QoQM8ewhjn_bCOa6z1xRyRvxmmnjaeZWZz9C7wLC2R1AMsfJLNr1V9U1BlBqa2EkBLK4uBcEg2fO5ciHt6Yl6TeqGQXgmUSOOxAnN5eoIYBurrcOr-Ibfax5NpDZP2uL5n7GgUPOSIGvwMNDEELr5KP3UKAUyuoRw" },
      { nama: "Taro", harga: 7000, kategori: "Snack", foto: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6Qp1-g3--vgbDbTsAF3VACf5e63xGslfGquKC83XOqFt3fKlO_JxhxQvDwNB0_wisjpcmFCDPc1FVO3RSDMHULEIOYlsl0ghiYSrwLjlqBAN2ijXIBiYNq-xDJO8ByLDZ2JHdpiolQNOmH-p4zAQeJXB_9sp2s7-CNFCpboeOL_u2wrgUDQAthL_pZGZklHE0PZp2xqfBVDCGK2UrBRnUHxUA-fHxXJ9ZVXaLZwVdAPVHY0WJUthE4g" },
      { nama: "Oreo", harga: 10000, kategori: "Snack" },
      { nama: "Telur 1 Butir", harga: 2500, kategori: "Kebutuhan" },
      { nama: "Gula Pasir 1kg", harga: 15000, kategori: "Kebutuhan" },
      { nama: "Kopi Kapal Api Sachet", harga: 2000, kategori: "Kebutuhan", foto: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWZvirK39X8lO5LuKeeAvERTuNUlb9XNqMxylNGbdgb92L-3tCDUS3gik9KvWpKitQ4AQK__7CyddU73KPsRQT91da9QZXTpKA6XBNF3nGoDcQmIrF63TFQHElBrF2dkeIbC5eaKDCwcz4aQMe7tld0Ncj_d-GcapL5VCVLlh5o5Nxx3cVDXanO-iV8Ob-_WnX7am0xe6zXMKErZ_Cn1yOtXevN7g7hVaOvRbJdwjsWMjWkd98EVobcQ" },
    ];

    for (const product of defaultProducts) {
      await db.runAsync(
        `INSERT INTO products (nama, harga, kategori, stok, foto, aktif, created_at, updated_at)
         SELECT ?, ?, ?, NULL, ?, 1, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM products WHERE nama = ? AND kategori = ?
         )`,
        product.nama,
        product.harga,
        product.kategori,
        product.foto,
        now,
        now,
        product.nama,
        product.kategori,
      );
    }

    console.log(`✅ Default products sync done`);
  } catch (error) {
    console.error("❌ Error insert default products:", error);
  }
};

/**
 * Seed 232 produk dari warung_products_2026-09-14.json
 * Dipanggil setelah insertDefaultProducts
 */
const seedProductsFromJSON = async () => {
  try {
    const jsonData = require("./warung_products_2026-09-14.json");
    const products = jsonData.products || [];
    
    const activeProducts = products.filter(p => p.aktif === 1 && p.kategori !== "Test");
    
    const seen = new Set();
    const uniqueProducts = [];
    for (const p of activeProducts) {
      const key = `${p.nama}-${p.kategori}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProducts.push(p);
      }
    }
    
    console.log(`📦 Seed JSON: ${uniqueProducts.length} produk unik dari ${products.length} total`);
    
    const now = new Date().toISOString();
    let inserted = 0;
    
    for (const product of uniqueProducts) {
      const result = await db.runAsync(
        `INSERT INTO products (nama, harga, kategori, stok, foto, barcode, aktif, created_at, updated_at)
         SELECT ?, ?, ?, NULL, NULL, NULL, 1, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM products WHERE nama = ? AND kategori = ?
         )`,
        product.nama,
        product.harga,
        product.kategori,
        now,
        now,
        product.nama,
        product.kategori,
      );
      
      if (result.changes > 0) inserted++;
    }
    
    console.log(`✅ JSON seed done: ${inserted} produk baru ditambahkan`);
  } catch (error) {
    console.error("❌ Error seed JSON products:", error);
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

  const { nama, harga, hpp = 0, kategori = "Umum", stok = null, foto = null, barcode = null, sync_id = null } = data;

  if (!nama || !harga) {
    throw new Error("Nama dan harga wajib diisi!");
  }

  const now = new Date().toISOString();
  // sync_id global unik — set kalao tidak ada
  const syncId = sync_id || generateSyncId();

  try {
    const result = await dbInstance.runAsync(
      "INSERT INTO products (nama, harga, hpp, kategori, stok, foto, barcode, sync_id, aktif, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
      nama,
      harga,
      hpp || 0,
      kategori,
      stok,
      foto,
      barcode,
      syncId,
      now,
      now,
    );

    console.log("✅ Produk ditambahkan:", nama);

    return {
      id: result.lastInsertRowId,
      nama,
      harga,
      hpp: hpp || 0,
      kategori,
      stok,
      foto,
      barcode,
      sync_id: syncId,
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

  const { nama, harga, hpp, kategori, stok, foto, barcode, sync_id } = data;
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
    if (hpp !== undefined) {
      updates.push("hpp = ?");
      params.push(hpp);
    }
    if (kategori !== undefined) {
      updates.push("kategori = ?");
      params.push(kategori);
    }
    if (stok !== undefined) {
      updates.push("stok = ?");
      params.push(stok);
    }
    if (foto !== undefined) {
      updates.push("foto = ?");
      params.push(foto);
    }
    if (barcode !== undefined) {
      updates.push("barcode = ?");
      params.push(barcode);
    }
    if (sync_id !== undefined) {
      updates.push("sync_id = ?");
      params.push(sync_id);
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
 * Generate sync_id global unique untuk sync multi-device
 * (id local AUTOINCREMENT berbeda per device — tidak bisa untuk cloud key)
 */
export const generateSyncId = () =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Set sync_id untuk produk (dipakai saat sync download
 * supaya idempotent — produk dari cloud punya sync_id tetap)
 */
export const setProdukSyncId = async (id, syncId) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  try {
    await dbInstance.runAsync(
      "UPDATE products SET sync_id = ?, updated_at = ? WHERE id = ?",
      syncId,
      new Date().toISOString(),
      id,
    );
    return true;
  } catch (error) {
    console.error("❌ Error set sync_id:", error);
    throw error;
  }
};

/**
 * Fungsi untuk hapus produk (soft delete - set aktif = 0)
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

/**
 * Cari produk berdasarkan barcode
 * Untuk fitur scanner
 */
export const cariProdukByBarcode = async (barcode) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  if (!barcode || barcode.trim() === "") {
    return null;
  }

  try {
    const row = await dbInstance.getFirstAsync(
      "SELECT * FROM products WHERE barcode = ? AND aktif = 1",
      barcode.trim(),
    );
    return row || null;
  } catch (error) {
    console.error("❌ Error cari produk by barcode:", error);
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
  cariProdukByBarcode,
  generateSyncId,
  setProdukSyncId,
};
