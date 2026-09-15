/**
 * ============================================
 * DESIGN SYSTEM TOKENS - WARUNG POS
 * ============================================
 */

import { Platform } from "react-native";

export const Colors = {
  primary: {
    main: "#1A1D1F",
    light: "#2E3133",
    dark: "#101113",
    contrast: "#FFFFFF",
    soft: "#F1F5F9",
  },

  secondary: {
    main: "#059669",
    light: "#0EA476",
    dark: "#047857",
    container: "#D1FAE5",
    onContainer: "#065F46",
    contrast: "#FFFFFF",
  },

  accent: {
    success: "#059669",
    warning: "#B45309",
    error: "#DC2626",
    info: "#2563EB",
  },

  neutral: {
    50: "#FAFBFC",
    100: "#F8F9FC",
    200: "#F1F5F9",
    300: "#E2E8F0",
    400: "#CBD5E1",
    500: "#94A3B8",
    600: "#64748B",
    700: "#475569",
    800: "#334155",
    900: "#191C1E",
  },

  text: {
    primary: "#191C1E",
    secondary: "#64748B",
    muted: "#94A3B8",
    disabled: "#CBD5E1",
    inverse: "#FFFFFF",
  },

  background: {
    primary: "#F8F9FC",
    secondary: "#FFFFFF",
    surface: "#F8F9FC",
    elevated: "#FFFFFF",
    inverse: "#1A1D1F",
  },

  border: {
    light: "#F1F5F9",
    main: "#E2E8F0",
    dark: "#CBD5E1",
  },

  light: {
    text: "#191C1E",
    background: "#F8F9FC",
    tint: "#1A1D1F",
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#1A1D1F",
  },
};

export const Typography = {
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