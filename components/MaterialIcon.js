/**
 * MaterialIcon - Cross-platform vector icon
 * Uses @expo/vector-icons (MaterialCommunityIcons TTF, bundled)
 * Works on Android, iOS, and web.
 */

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ICONS } from "../constants/icons";

export function MaterialIcon({ name, size = 20, color = "#1C1917", style }) {
  const glyph = ICONS[name] || name;
  return (
    <MaterialCommunityIcons
      name={glyph}
      size={size}
      color={color}
      style={style}
    />
  );
}