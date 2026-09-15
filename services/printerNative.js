/**
 * ============================================
 * PRINTER NATIVE BRIDGE (STUB - PHASE A)
 * ============================================
 *
 * FASE A (Expo Go): native module `expo-bluetooth-thermal-printer`
 * BELUM diinstal. File ini bertindak sebagai stub agar Metro dapat
 * men-bundle app tanpa error. Semua fungsi melempar NATIVE_UNAVAILABLE
 * dan printerService menangkapnya menjadi pesan "butuh development build".
 *
 * FASE B (dev build): ganti isi file ini menjadi:
 *
 * import { Printer, getBondedDevices, isBluetoothEnabled } from
 *   "expo-bluetooth-thermal-printer";
 *
 * export const isNativeAvailable = true;
 * export { getBondedDevices, isBluetoothEnabled };
 * export function createPrinter(width) { return new Printer(width); }
 */

export const isNativeAvailable = false;

export async function isBluetoothEnabled() {
  throw new Error("NATIVE_UNAVAILABLE");
}

export async function getBondedDevices() {
  throw new Error("NATIVE_UNAVAILABLE");
}

export function createPrinter(_width) {
  throw new Error("NATIVE_UNAVAILABLE");
}