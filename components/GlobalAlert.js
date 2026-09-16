/**
 * ============================================
 * GLOBALALERT - DIALOG KUSTOM SERAGAM
 * ============================================
 * Menggantikan Alert.alert bawaan Android.
 * - Queue FIFO dari alertStore (satu per satu)
 * - Tipe: success / error / warning / info / confirm
 * - Icon melingkar berwarna sesuai tipe
 * - Tombol: default (hitam), cancel (abu-putih), destructive (merah)
 * - Tanpa tombol => tombol "OK" standar
 */

import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import useAlertStore from "../store/alertStore";
import { MaterialIcon } from "./MaterialIcon";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

const TYPE_META = {
  success: {
    icon: "check_circle",
    color: "#059669",
    tint: "#D1FAE5",
  },
  error: {
    icon: "warning",
    color: "#DC2626",
    tint: "#FEE2E2",
  },
  warning: {
    icon: "warning",
    color: "#B45309",
    tint: "#FEF3C7",
  },
  info: {
    icon: "info",
    color: "#2563EB",
    tint: "#DBEAFE",
  },
  confirm: {
    icon: "help_circle",
    color: "#059669",
    tint: "#F5F5F4",
  },
};

const STYLE_BUTTON = {
  default: {
    bg: "#059669",
    text: "#FFFFFF",
  },
  cancel: {
    bg: "#F5F5F4",
    text: "#57534E",
  },
  destructive: {
    bg: "#DC2626",
    text: "#FFFFFF",
  },
};

export default function GlobalAlert() {
  const { queue, dismiss } = useAlertStore();
  const dialog = queue[0];

  if (!dialog) return null;

  const meta = TYPE_META[dialog.type] || TYPE_META.info;
  const buttons =
    dialog.buttons && dialog.buttons.length
      ? dialog.buttons
      : [{ text: "OK", style: "default" }];

  const handlePress = (btn) => {
    dismiss();
    if (btn && typeof btn.onPress === "function") {
      btn.onPress();
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => dismiss()}
    >
      <View style={styles.overlay}>
              <Animated.View entering={FadeInUp.duration(220).springify()} style={styles.card}>
                <Animated.View
                  entering={ZoomIn.duration(300)}
                  style={[
                    styles.iconCircle,
                    { backgroundColor: meta.tint },
                  ]}
                >
                  <MaterialIcon name={meta.icon} size={30} color={meta.color} />
                </Animated.View>

                <Text style={styles.title}>{dialog.title || "Perhatian"}</Text>

                {dialog.message ? (
                  <Text style={styles.message}>{dialog.message}</Text>
                ) : null}
                <View style={styles.btnRow}>
                  {buttons.map((btn, idx) => {
                    const btnStyle = STYLE_BUTTON[btn.style] || STYLE_BUTTON.default;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.btn, { backgroundColor: btnStyle.bg }]}
                        onPress={() => handlePress(btn)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.btnText, { color: btnStyle.text }]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1917",
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: "#57534E",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    alignSelf: "stretch",
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});