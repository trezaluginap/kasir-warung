/**
 * ============================================
 * STORAGE SERVICE - Upload foto produk
 * ============================================
 *
 * Pola: LOCAL-FIRST + CLOUD KALAU ADA
 *
 * Masalah lama:
 * Foto produk disimpan sebagai URI lokal (file:///...)
 * -> HILANG saat app di-reset / reinstall / pindah device.
 *
 * Solusi:
 * 1. Foto tetap disimpan lokal (instan, offline aman) — tidak berubah
 * 2. KALAU env Supabase terisi -> otomatis upload ke bucket "product-photos"
 *    -> simpan PUBLIC URL di DB sebagai pengganti URI lokal
 * 3. Kalau env kosong -> behavior tetap seperti sekarang (URI lokal)
 *
 * Alasan local-first:
 * Warung sering offline / sinyal jelek. Upload cloud NIKMAT, bukan syarat.
 * Foto lokal = selalu ada. Foto cloud = backup + survive reset.
 */

import { supabase } from "../utils/supabaseClient";

const BUCKET = "product-photos";

/** Deteksi apakah env Supabase sudah diisi (bukan placeholder) */
export const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes(".") && !url.includes("placeholder") && key.length > 20;
};

/**
 * Upload foto ke Supabase Storage.
 * @returns {Promise<string|null>} Public URL kalau sukses, null kalau gagal/skip
 */
export async function uploadProductPhoto(uri) {
  if (!isSupabaseConfigured()) {
    console.log("📤 Supabase belum dikonfigurasi — pakai foto lokal");
    return null;
  }

  if (!uri || uri.startsWith("http")) {
    return null; // sudah URL cloud atau tidak ada foto
  }

  try {
    // Ekstrak nama file dari URI lokal
    const fileName = uri.split("/").pop() || `product_${Date.now()}.jpg`;
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg";
    const storagePath = `${Date.now()}_${fileName}`;

    // Baca file lokal jadi blob/biary
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload foto gagal:", error.message);
      return null;
    }

    // Ambil PUBLIC URL (bucket harus public-read, atau pakai token)
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    console.log("📤 Foto berhasil diupload:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("❌ Upload foto error:", error);
    return null; // gagal upload -> tetap pakai foto lokal, jangan blokir simpan
  }
}