/**
 * ============================================
 * ALERT STORE - GLOBAL DIALOG QUEUE (ZUSTAND)
 * ============================================
 *
 * Menggantikan Alert.alert bawaan Android dengan dialog
 * kustom yang konsisten (success / error / warning / info / confirm).
 *
 * queue: antrean dialog FIFO, satu tampil berturut-turut.
 * show(config) menambah; dismiss() menutup yang sedang tampil.
 *
 * Config shape:
 * {
 *   type: 'info' | 'success' | 'error' | 'warning' | 'confirm',
 *   title: string,
 *   message: string,
 *   buttons: [{ text, style: 'default'|'cancel'|'destructive', onPress }]
 * }
 */

import { create } from "zustand";

const useAlertStore = create((set, get) => ({
  queue: [],

  show: (config) => {
    const current = get().queue;
    set({ queue: [...current, config] });
  },

  dismiss: () => {
    const [, ...rest] = get().queue;
    set({ queue: rest });
  },

  clear: () => set({ queue: [] }),
}));

export default useAlertStore;