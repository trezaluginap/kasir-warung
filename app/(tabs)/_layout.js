import { Tabs } from "expo-router";
import { Text } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.text.disabled,
        tabBarStyle: {
          backgroundColor: Colors.background.elevated,
          borderTopColor: Colors.border.light,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Kasir",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produk",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🕐</Text>,
        }}
      />
    </Tabs>
  );
}
