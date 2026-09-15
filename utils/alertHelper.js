/**
 * ============================================
 * ALERT HELPER - API PRAKTIS UNTUK DIALOG KUSTOM
 * ============================================
 * Pengganti Alert.alert bawaan Android.
 *
 * showAlert(config)     -> { type, title, message, buttons }
 * showSuccess/Error/Warning/Info(title, message[, options])
 *   - tanpa opsi tambahan => tombol "OK" otomatis.
 *   - dengan { confirmText, onConfirm, cancelText, onCancel }
 *     => dua tombol (default vs cancel).
 * showConfirm({...})    -> konfirmasi explicit (destructive support).
 */

import useAlertStore from "../store/alertStore";

const push = (config) => useAlertStore.getState().show(config);

const buildButtons = (options = {}) => {
  const buttons = [];
  if (options.cancelText || options.onCancel) {
    buttons.push({
      text: options.cancelText || "Batal",
      style: "cancel",
      onPress: options.onCancel,
    });
  }
  buttons.push({
    text: options.confirmText || "OK",
    style: options.confirm ? "destructive" : "default",
    onPress: options.onConfirm,
  });
  return buttons;
};

export const showAlert = (config) =>
  push({
    type: "info",
    ...config,
  });

export const showSuccess = (title, message, options) =>
  push({
    type: "success",
    title,
    message,
    buttons: buildButtons(options),
  });

export const showError = (title, message, options) =>
  push({
    type: "error",
    title,
    message,
    buttons: buildButtons(options),
  });

export const showWarning = (title, message, options) =>
  push({
    type: "warning",
    title,
    message,
    buttons: buildButtons(options),
  });

export const showInfo = (title, message, options) =>
  push({
    type: "info",
    title,
    message,
    buttons: buildButtons(options),
  });

export const showConfirm = ({ title, message, confirmText, cancelText, destructive, onConfirm, onCancel }) =>
  push({
    type: "confirm",
    title,
    message,
    buttons: buildButtons({ confirmText, cancelText, destructive, onConfirm, onCancel }),
  });