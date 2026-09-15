/**
 * Recent Store - Barang Terakhir Dibeli
 * Tracks recently sold products for quick re-add
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "warungpos_recent";
const MAX_RECENT = 8;

const loadFromStorage = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Error load recent:", error);
    return [];
  }
};

const saveToStorage = async (recent) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error("Error save recent:", error);
  }
};

export const useRecentStore = create((set, get) => ({
  recentProduk: [],

  loadRecent: async () => {
    const loaded = await loadFromStorage();
    set({ recentProduk: loaded });
  },

  addRecent: async (produk) => {
    const { recentProduk } = get();
    // Remove existing by id
    const filtered = recentProduk.filter((p) => p.id !== produk.id);
    // Add to front
    const newRecent = [
      {
        id: produk.id,
        nama: produk.nama,
        harga: produk.harga,
        kategori: produk.kategori,
        foto: produk.foto,
      },
      ...filtered,
    ].slice(0, MAX_RECENT);

    set({ recentProduk: newRecent });
    await saveToStorage(newRecent);
  },

  clearRecent: async () => {
    set({ recentProduk: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

export default useRecentStore;