/**
 * ============================================
 * DATABASE SERVICE - WARUNG POS
 * ============================================
 *
 * File ini mengelola semua operasi database SQLite
 * untuk menyimpan data transaksi warung.
 *
 * Fitur:
 * - Inisialisasi database & tabel otomatis
 * - Simpan transaksi (total, barang, waktu)
 * - Ambil riwayat transaksi
 * - Hapus transaksi lama
 */

import * as SQLite from "expo-sqlite";
import { openProductDatabase } from "./productService";

// Nama database kita
const DATABASE_NAME = "warung_pos.db";

let db = null;
let isInitialized = false;

/**
 * Fungsi untuk mendapatkan instance database
 * Otomatis inisialisasi jika belum
 */
const getDatabase = async () => {
  if (db && isInitialized) {
    return db;
  }

  // Jika belum diinit, lakukan inisialisasi
  console.log("⚠️ Database belum diinit, melakukan auto-init...");
  await initDatabase();
  return db;
};

/**
 * Fungsi untuk membuka koneksi database
 * Dipanggil otomatis saat aplikasi pertama kali jalan
 */
export const initDatabase = async () => {
  try {
    // Skip jika sudah diinit
    if (isInitialized && db) {
      console.log("ℹ️ Database sudah diinisialisasi sebelumnya");
      return true;
    }

    // Buka atau buat database baru
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    console.log("✅ Database berhasil dibuka!");

    // Buat tabel transaksi kalau belum ada
    await createTransactionsTable();

    // Inisialisasi tabel produk
    await openProductDatabase();

    isInitialized = true;

    return true;
  } catch (error) {
    console.error("❌ Error saat buka database:", error);
    isInitialized = false;
    throw error;
  }
};

/**
 * Fungsi untuk bikin tabel transaksi
 * Struktur tabel:
 * - id: nomor unik transaksi (auto increment)
 * - total_harga: total belanjaan (angka desimal)
 * - daftar_barang: list barang dalam format JSON string
 * - waktu_transaksi: kapan transaksi terjadi (format ISO string)
 */
const createTransactionsTable = async () => {
  // Langsung pakai db, jangan getDatabase() karena dipanggil dari initDatabase()
  const query = `
    CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_harga REAL NOT NULL,
      daftar_barang TEXT NOT NULL,
      waktu_transaksi TEXT NOT NULL
    );
  `;

  try {
    await db.execAsync(query);
    console.log("✅ Tabel transaksi siap digunakan!");
  } catch (error) {
    console.error("❌ Error bikin tabel:", error);
    throw error;
  }
};

/**
 * Fungsi untuk menyimpan transaksi baru
 *
 * @param {number} totalHarga - Total harga belanjaan (contoh: 25000)
 * @param {Array} daftarBarang - Array berisi barang yang dibeli
 *   Contoh: [
 *     { nama: 'Indomie Goreng', qty: 2, harga: 3000 },
 *     { nama: 'Teh Botol', qty: 1, harga: 4000 }
 *   ]
 * @returns {Object} Data transaksi yang baru disimpan
 */
export const simpanTransaksi = async (totalHarga, daftarBarang) => {
  // Validasi input
  if (typeof totalHarga !== "number" || totalHarga <= 0) {
    throw new Error("Total harga harus berupa angka positif!");
  }

  if (!Array.isArray(daftarBarang) || daftarBarang.length === 0) {
    throw new Error("Daftar barang tidak boleh kosong!");
  }

  // Pastikan database siap
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap! Coba restart aplikasi.");
  }

  // Konversi daftar barang jadi JSON string biar bisa disimpan
  const daftarBarangJSON = JSON.stringify(daftarBarang);

  // Ambil waktu sekarang dalam format ISO
  const waktuTransaksi = new Date().toISOString();

  const query = `
    INSERT INTO transaksi (total_harga, daftar_barang, waktu_transaksi)
    VALUES (?, ?, ?);
  `;

  try {
    const result = await dbInstance.runAsync(
      query,
      totalHarga,
      daftarBarangJSON,
      waktuTransaksi,
    );

    console.log("✅ Transaksi berhasil disimpan! ID:", result.lastInsertRowId);

    // Return data transaksi yang baru disimpan
    return {
      id: result.lastInsertRowId,
      totalHarga,
      daftarBarang,
      waktuTransaksi,
    };
  } catch (error) {
    console.error("❌ Error simpan transaksi:", error);
    throw error;
  }
};

/**
 * Fungsi untuk mengambil semua transaksi
 * Diurutkan dari yang terbaru
 *
 * @param {number} limit - Batasan jumlah data (opsional, default: semua)
 * @returns {Array} Array berisi data transaksi
 */
export const ambilSemuaTransaksi = async (limit = null) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  let query = `
    SELECT * FROM transaksi
    ORDER BY waktu_transaksi DESC
  `;

  // Kalau ada limit, tambahin
  if (limit && typeof limit === "number") {
    query += ` LIMIT ${limit}`;
  }

  try {
    const rows = await dbInstance.getAllAsync(query);

    // Parse JSON string jadi object lagi
    const transaksiList = rows.map((row) => ({
      id: row.id,
      totalHarga: row.total_harga,
      daftarBarang: JSON.parse(row.daftar_barang),
      waktuTransaksi: row.waktu_transaksi,
    }));

    console.log(`✅ Berhasil ambil ${transaksiList.length} transaksi`);
    return transaksiList;
  } catch (error) {
    console.error("❌ Error ambil transaksi:", error);
    throw error;
  }
};

/**
 * Fungsi untuk mengambil transaksi berdasarkan ID
 *
 * @param {number} id - ID transaksi
 * @returns {Object|null} Data transaksi atau null kalau ga ada
 */
export const ambilTransaksiById = async (id) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  const query = `
    SELECT * FROM transaksi
    WHERE id = ?
  `;

  try {
    const row = await dbInstance.getFirstAsync(query, id);

    if (!row) {
      console.log(`⚠️ Transaksi dengan ID ${id} tidak ditemukan`);
      return null;
    }

    return {
      id: row.id,
      totalHarga: row.total_harga,
      daftarBarang: JSON.parse(row.daftar_barang),
      waktuTransaksi: row.waktu_transaksi,
    };
  } catch (error) {
    console.error("❌ Error ambil transaksi by ID:", error);
    throw error;
  }
};

/**
 * Fungsi untuk menghitung total penjualan hari ini
 * Berguna buat laporan harian
 *
 * @returns {Object} Total transaksi dan total uang hari ini
 */
export const hitungPenjualanHariIni = async () => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  // Ambil tanggal hari ini (00:00:00)
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const tanggalMulai = hariIni.toISOString();

  const query = `
    SELECT 
      COUNT(*) as jumlah_transaksi,
      SUM(total_harga) as total_penjualan
    FROM transaksi
    WHERE waktu_transaksi >= ?
  `;

  try {
    const result = await dbInstance.getFirstAsync(query, tanggalMulai);

    return {
      jumlahTransaksi: result.jumlah_transaksi || 0,
      totalPenjualan: result.total_penjualan || 0,
    };
  } catch (error) {
    console.error("❌ Error hitung penjualan:", error);
    throw error;
  }
};

/**
 * Fungsi untuk hapus transaksi berdasarkan ID
 * Hati-hati, data yang dihapus ga bisa dikembalikan!
 *
 * @param {number} id - ID transaksi yang mau dihapus
 * @returns {boolean} True kalau berhasil
 */
export const hapusTransaksi = async (id) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  const query = `DELETE FROM transaksi WHERE id = ?`;

  try {
    const result = await dbInstance.runAsync(query, id);

    if (result.changes > 0) {
      console.log(`✅ Transaksi ID ${id} berhasil dihapus`);
      return true;
    } else {
      console.log(`⚠️ Transaksi ID ${id} tidak ditemukan`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error hapus transaksi:", error);
    throw error;
  }
};

/**
 * Fungsi untuk hapus transaksi yang lebih lama dari X hari
 * Berguna buat maintenance database biar ga kegedean
 *
 * @param {number} hariLalu - Hapus transaksi lebih dari X hari yang lalu
 * @returns {number} Jumlah transaksi yang dihapus
 */
export const hapusTransaksiLama = async (hariLalu = 30) => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  // Hitung tanggal X hari yang lalu
  const tanggalBatas = new Date();
  tanggalBatas.setDate(tanggalBatas.getDate() - hariLalu);
  const batasWaktu = tanggalBatas.toISOString();

  const query = `
    DELETE FROM transaksi
    WHERE waktu_transaksi < ?
  `;

  try {
    const result = await dbInstance.runAsync(query, batasWaktu);
    console.log(`✅ Berhasil hapus ${result.changes} transaksi lama`);
    return result.changes;
  } catch (error) {
    console.error("❌ Error hapus transaksi lama:", error);
    throw error;
  }
};

/**
 * Fungsi untuk reset database (hapus semua data)
 * HATI-HATI! Ini bakal hapus semua transaksi!
 * Biasanya dipake buat testing aja
 */
export const resetDatabase = async () => {
  const dbInstance = await getDatabase();

  if (!dbInstance) {
    throw new Error("Database belum siap!");
  }

  const query = `DELETE FROM transaksi`;

  try {
    const result = await dbInstance.runAsync(query);
    console.log(`⚠️ Database direset! ${result.changes} transaksi dihapus`);
    return result.changes;
  } catch (error) {
    console.error("❌ Error reset database:", error);
    throw error;
  }
};

// Export semua fungsi biar bisa dipake di file lain
export default {
  initDatabase,
  simpanTransaksi,
  ambilSemuaTransaksi,
  ambilTransaksiById,
  hitungPenjualanHariIni,
  hapusTransaksi,
  hapusTransaksiLama,
  resetDatabase,
};
