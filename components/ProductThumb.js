/**
 * ProductThumb - Reusable Product Image with Fallback
 * If foto exists: expo-image
 * If no foto: fallback MaterialIcon by kategori
 */

import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { MaterialIcon } from "./MaterialIcon";

const KATEGORI_ICON = {
  Makanan: "cat_makanan",
  Minuman: "cat_minuman",
  Snack: "cat_snack",
  Rokok: "cat_rokok",
  Kebutuhan: "cat_kebutuhan",
  Umum: "cat_umum",
};

export function ProductThumb({
  foto,
  kategori = "Umum",
  size = 40,
  radius = 8,
  style,
}) {
  const fallbackIcon = KATEGORI_ICON[kategori] || "cat_umum";

  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={[{ width: size, height: size, borderRadius: radius }, style]}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: "#F5F5F4",
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <MaterialIcon name={fallbackIcon} size={size * 0.5} color="#A8A29E" />
    </View>
  );
}