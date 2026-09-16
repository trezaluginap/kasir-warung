import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * ErrorBoundary - Crash screen handler
 *
 * Kenapa class component?
 * React error boundary HANYA bisa dibuat sebagai class component.
 * Ini satu-satunya fitur React yang tidak punya versi hook:
 * componentDidCatch / getDerivedStateFromError adalah lifecycle class.
 *
 * Cara kerja:
 * 1. Error di render anak -> getDerivedStateFromError dipanggil -> state.hasError = true
 * 2. React render ulang -> karena hasError, tampilkan fallback UI (bukan anak yang crash)
 * 3. Tombol "Coba Lagi" -> reset state -> render anak ulang
 *
 * Fallback data:
 * - error.message: pesan error asli (buat debugging)
 * - error.componentStack: lokasi komponen yang crash
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error ke console untuk debugging di development
    console.error("❌ ErrorBoundary menangkap error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>

          <Text style={styles.title}>Terjadi Kesalahan</Text>
          <Text style={styles.subtitle}>
            Maaf, aplikasi mengalami masalah. Silakan coba lagi.
          </Text>

          {/* Pesan error — ditampilkan supaya bisa lapor ke developer */}
          {this.state.error?.message ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorMessage} numberOfLines={4}>
                {this.state.error.message}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.resetBtn,
              pressed && styles.resetBtnPressed,
            ]}
            onPress={this.handleReset}
          >
            <Text style={styles.resetBtnText}>Coba Lagi</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF7F4",
    padding: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#57534E",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: "#F5F5F4",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 13,
    color: "#78716C",
    fontFamily: "monospace",
  },
  resetBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  resetBtnPressed: {
    opacity: 0.85,
  },
  resetBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});