/**
 * ============================================
 * SCREEN LOGIN - WARUNG POS
 * ============================================
 *
 * Modern minimalist login dengan organic theme
 */

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../constants/theme";
import useAuthStore from "../store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { session, loginWithUsernamePin } = useAuthStore();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/(tabs)");
    }
  }, [session, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    const result = await loginWithUsernamePin(username, pin);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert("Login gagal", result.message);
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <Text style={styles.brandTitle}>WARUNG POS</Text>
          <Text style={styles.brandSubtitle}>Sistem Kasir Modern</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Selamat Datang</Text>
          <Text style={styles.instructionText}>
            Masuk dengan akun admin Anda
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.text.disabled}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="PIN"
              placeholderTextColor={Colors.text.disabled}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.primary.contrast} />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>Warung POS v1.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.main,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  logoText: {
    fontSize: Typography.fontSize["5xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  brandTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  brandSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.background.elevated,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.xl,
  },
  welcomeText: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  button: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...Shadows.md,
  },
  buttonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  buttonText: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
  footerText: {
    marginTop: Spacing["2xl"],
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});
