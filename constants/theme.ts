/**
 * ============================================
 * DESIGN SYSTEM TOKENS - TRITOP JAYA
 * ============================================
 * Brand: TRITOP JAYA (Warung POS)
 * Primary: Emerald Green (#059669) — trust, money, professional
 * Secondary: Warm Amber (#D97706) — complementary warm accent
 * Surface: Warm off-white (#FAF7F4) — bukan cool gray generik
 * Text: Near-black (#1C1917) — warm-tinted black, bukan pure #000
 */

import { Platform } from "react-native";

export const Colors = {
  // PRIMARY — brand color (emerald)
  primary: {
    main: "#059669",
    light: "#10B981",
    dark: "#047857",
    contrast: "#FFFFFF",
    soft: "#D1FAE5",
  },

  // SECONDARY — warm amber accent (pelengkap)
  secondary: {
    main: "#D97706",
    light: "#F59E0B",
    dark: "#B45309",
    container: "#FEF3C7",
    onContainer: "#92400E",
    contrast: "#FFFFFF",
  },

  // STATUS colors
  accent: {
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
    info: "#2563EB",
  },

  // NEUTRAL — warm-tinted scale (bukan cool blue-gray)
  neutral: {
    50: "#FAFAF9",
    100: "#F5F5F4",
    200: "#E7E5E4",
    300: "#D6D3D1",
    400: "#A8A29E",
    500: "#78716C",
    600: "#57534E",
    700: "#44403C",
    800: "#292524",
    900: "#1C1917",
  },

  text: {
    primary: "#1C1917",
    secondary: "#57534E",
    muted: "#78716C",
    disabled: "#A8A29E",
    inverse: "#FFFFFF",
  },

  background: {
    primary: "#FAF7F4",
    secondary: "#FFFFFF",
    surface: "#FAF7F4",
    elevated: "#FFFFFF",
    inverse: "#1C1917",
  },

  border: {
    light: "#E7E5E4",
    main: "#D6D3D1",
    dark: "#A8A29E",
  },

  light: {
    text: "#1C1917",
    background: "#FAF7F4",
    tint: "#059669",
    icon: "#57534E",
    tabIconDefault: "#A8A29E",
    tabIconSelected: "#059669",
  },
};

export const Typography = {
  // Level hierarki eksplisit — bukan fontSize random
  display: { fontSize: 32, fontWeight: "700", lineHeight: 38 },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  headline: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  label: { fontSize: 11, fontWeight: "700", lineHeight: 14, letterSpacing: 0.5 },

  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    "2xl": 26,
    "3xl": 32,
  },

  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Space Grotesk",
    mono: "Space Grotesk",
  },
  default: {
    sans: "sans-serif",
    mono: "monospace",
  },
});