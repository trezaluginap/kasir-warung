/**
 * ============================================
 * PRINTER STORE - ZUSTAND + ASYNCSTORAGE
 * ============================================
 * Menyimpan pilihan printer Bluetooth terakhir
 * + status koneksi untuk dipakai di semua layar.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRINTER_KEY = "warungpos_printer";

const usePrinterStore = create((set, get) => ({
  printerName: null,
  printerAddress: null,
  connected: false,
  busy: false,

  loadSavedPrinter: async () => {
    try {
      const raw = await AsyncStorage.getItem(PRINTER_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({
          printerName: saved.name || null,
          printerAddress: saved.address || null,
        });
      }
    } catch (error) {
      console.error("Gagal baca printer tersimpan:", error);
    }
  },

  selectPrinter: async (device) => {
    const name = typeof device === "string" ? device : device?.name || null;
    const address =
      typeof device === "string" ? device : device?.address || null;
    try {
      await AsyncStorage.setItem(
        PRINTER_KEY,
        JSON.stringify({ name, address }),
      );
    } catch (error) {
      console.error("Gagal simpan printer:", error);
    }
    set({ printerName: name, printerAddress: address });
  },

  setConnected: (connected) => set({ connected }),
  setBusy: (busy) => set({ busy }),
}));

export default usePrinterStore;