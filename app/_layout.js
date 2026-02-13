import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initDatabase } from "../database/service";
import useAuthStore from "../store/authStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);
  const { session, isAuthReady, loadSession } = useAuthStore();

  // Inisialisasi database saat app pertama kali load
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log("Menginisialisasi database...");
        await initDatabase();
        setIsDbReady(true);
        console.log("Database siap digunakan");
      } catch (error) {
        console.error("Error setup database:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setDbError(errorMessage);
      }
    };

    setupDatabase();
  }, []);

  // Load session login dari storage
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Redirect berdasarkan status login
  useEffect(() => {
    if (!isAuthReady) return;

    const inLogin = segments[0] === "login";

    if (!session && !inLogin) {
      router.replace("/login");
    }

    if (session && inLogin) {
      router.replace("/(tabs)");
    }
  }, [session, isAuthReady, segments, router]);

  // Tampilkan loading screen sambil setup database
  if (!isDbReady || !isAuthReady) {
    return (
      <View style={styles.loadingContainer}>
        {dbError ? (
          <>
            <Text style={styles.errorText}>Database Error</Text>
            <Text style={styles.errorDetail}>{dbError}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Menyiapkan database...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff3b30",
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
