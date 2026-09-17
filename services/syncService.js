/**
 * ============================================
 * SYNC SERVICE - Produk antara device (via Supabase)
 * ============================================
 *
 * Arsitektur: Supabase Postgres = source ngot.
 * Semua HP upload+download produk lewat table `products` di Supabase.
 *
 * Local id (AUTOINCREMENT) berbeda per device — makanya pakai
 * `sync_id` (global unique) sebagai key di cloud.
 *
 * Merge rule (last-write-wins by updated_at):
 * - lokal.updated_at > remote.updated_at -> upload (lokal win)
 * - remote.updated_at > lokal.updated_at -> download (remote win)
 * - hapus: soft-delete (aktif=0) propagasi via sync
 *
 * Env supabase kosong -> fungsi balikin {success:false, reason:"no_config"}
 * (offline-first: app jalan normal tanpa cloud).
 */

import { supabase } from "../utils/supabaseClient";
import {
  ambilSemuaProduk,
  tambahProduk,
  updateProduk,
  hapusProduk,
} from "../database/productService";

const TABLE = "products";

export const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes(".") && !url.includes("placeholder") && key.length > 20;
};

/**
 * Upload semua produk lokal yang lebih baru ke cloud
 * @returns {Object} {success, uploaded, skipped}
 */
export const syncProdukUpload = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: "no_config" };
  }

  try {
    const local = await ambilSemuaProduk({ aktifOnly: false });
    let uploaded = 0;
    let skipped = 0;

    for (const p of local) {
      if (!p.sync_id) continue; // harus punya sync_id

      const { data: remote, error: fetchErr } = await supabase
        .from(TABLE)
        .select("updated_at")
        .eq("sync_id", p.sync_id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const localTs = new Date(p.updated_at).getTime();
      const remoteTs = remote ? new Date(remote.updated_at).getTime() : 0;

      if (!remote || localTs > remoteTs) {
        const { error } = await supabase
          .from(TABLE)
          .upsert(
            {
              sync_id: p.sync_id,
              nama: p.nama,
              harga: p.harga,
              kategori: p.kategori,
              stok: p.stok,
              foto: p.foto,
              barcode: p.barcode,
              aktif: p.aktif,
              created_at: p.created_at,
              updated_at: p.updated_at,
            },
            { onConflict: "sync_id" },
          );
        if (error) throw error;
        uploaded++;
      } else {
        skipped++;
      }
    }

    console.log(
      `📤 Sync upload: ${uploaded} upload, ${skipped} skip (konsisten)`,
    );
    return { success: true, uploaded, skipped };
  } catch (error) {
    if (error?.code === "PGRST205" || error?.message?.includes("PGRST205")) {
      console.warn("⚠️ Sync upload skipped: Tabel 'products' belum dibuat di Supabase.");
      return { success: false, reason: "table_missing", message: "Tabel 'products' belum ada di Supabase" };
    }
    console.error("❌ Sync upload error:", error);
    return { success: false, reason: "error", message: error.message };
  }
};

/**
 * Download semua produk cloud yang lebih baru ke lokal
 * @returns {Object} {success, downloaded, deleted, skipped}
 */
export const syncProdukDownload = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: "no_config" };
  }

  try {
    const local = await ambilSemuaProduk({ aktifOnly: false });
    const localBySyncId = new Map(
      local.filter((p) => p.sync_id).map((p) => [p.sync_id, p]),
    );

    const { data: remoteAll, error } = await supabase
      .from(TABLE)
      .select("sync_id, nama, harga, kategori, stok, foto, barcode, aktif, created_at, updated_at")
      .limit(1000);

    if (error) throw error;

    let downloaded = 0;
    let deleted = 0;
    let skipped = 0;

    for (const remote of remoteAll || []) {
      const localP = localBySyncId.get(remote.sync_id);
      const remoteTs = new Date(remote.updated_at).getTime();
      const localTs = localP ? new Date(localP.updated_at).getTime() : 0;

      if (!localP) {
        // Produk hanya di cloud -> insert lokal (sync_id tetap dari cloud)
        await tambahProduk({
          nama: remote.nama,
          harga: remote.harga,
          kategori: remote.kategori,
          stok: remote.stok,
          foto: remote.foto,
          barcode: remote.barcode,
          sync_id: remote.sync_id,
        });
        downloaded++;
      } else if (remoteTs > localTs) {
        if (remote.aktif === 0) {
          await hapusProduk(localP.id); // soft delete
          deleted++;
        } else {
          await updateProduk(localP.id, {
            nama: remote.nama,
            harga: remote.harga,
            kategori: remote.kategori,
            stok: remote.stok,
            foto: remote.foto,
            barcode: remote.barcode,
          });
          downloaded++;
        }
      } else {
        skipped++;
      }
    }

    console.log(
      `📥 Sync download: ${downloaded} download, ${deleted} hapus, ${skipped} skip`,
    );
    return { success: true, downloaded, deleted, skipped };
  } catch (error) {
    if (error?.code === "PGRST205" || error?.message?.includes("PGRST205")) {
      console.warn("⚠️ Sync download skipped: Tabel 'products' belum dibuat di Supabase.");
      return { success: false, reason: "table_missing", message: "Tabel 'products' belum ada di Supabase" };
    }
    console.error("❌ Sync download error:", error);
    return { success: false, reason: "error", message: error.message };
  }
};