/**
 * ============================================
 * MODERN DESIGN SYSTEM - WARUNG POS
 * ============================================
 *
 * Minimalist & Modern theme dengan organic color palette
 */

import { Platform } from "react-native";

// ============================================
// COLOR PALETTE
// ============================================
export const Colors = {
  // Primary Colors (Organic Green Palette)
  primary: {
    main: "#9CAB84", // Medium olive green - Main brand color
    light: "#C5D89D", // Light sage green
    dark: "#89986D", // Dark moss green
    contrast: "#FFFFFF", // White text on primary
  },

  // Secondary & Accent
  secondary: {
    main: "#F6F0D7", // Cream/beige - Soft background
    light: "#FFFEF9", // Almost white cream
    dark: "#E8DFC0", // Darker cream
  },

  accent: {
    success: "#6FBA82", // Modern green for success
    warning: "#F4A259", // Warm orange
    error: "#E76F5A", // Soft red
    info: "#5B9BD5", // Calm blue
  },

  // Neutral Colors
  neutral: {
    50: "#FAFAFA", // Almost white
    100: "#F5F5F5", // Very light gray
    200: "#EEEEEE", // Light gray
    300: "#E0E0E0", // Gray
    400: "#BDBDBD", // Medium gray
    500: "#9E9E9E", // Dark gray
    600: "#757575", // Darker gray
    700: "#616161", // Very dark gray
    800: "#424242", // Almost black
    900: "#212121", // Black
  },

  // Text Colors
  text: {
    primary: "#2C3E2C", // Dark green-black for main text
    secondary: "#5F6F5F", // Medium gray-green
    disabled: "#A8B5A8", // Light gray-green
    inverse: "#FFFFFF", // White text
  },

  // Background Colors
  background: {
    primary: "#FFFFFF", // Pure white
    secondary: "#F6F0D7", // Cream background
    tertiary: "#FAFAF8", // Off-white
    elevated: "#FFFFFF", // Cards/elevated surfaces
  },

  // Border Colors
  border: {
    light: "#E8E8E0", // Very light border
    main: "#D4D4C8", // Main border color
    dark: "#B8B8A8", // Dark border
  },

  // Legacy support (for compatibility)
  light: {
    text: "#2C3E2C",
    background: "#F6F0D7",
    tint: "#9CAB84",
    icon: "#5F6F5F",
    tabIconDefault: "#A8B5A8",
    tabIconSelected: "#9CAB84",
  },
};

// ============================================
// TYPOGRAPHY SCALE
// ============================================
export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 40,
  },

  // Font Weights
  fontWeight: {
    light: "300" as const,
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================
// SPACING SYSTEM (8px base)
// ============================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 64,
};

// ============================================
// BORDER RADIUS
// ============================================
export const BorderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  full: 9999,
};

// ============================================
// SHADOWS (Elevation)
// ============================================
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============================================
// ANIMATION TIMINGS
// ============================================
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// ============================================
// FONTS (Platform specific)
// ============================================
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ============================================
// COMPONENT PRESETS
// ============================================
export const ComponentStyles = {
  button: {
    primary: {
      backgroundColor: Colors.primary.main,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    secondary: {
      backgroundColor: Colors.secondary.main,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
  },
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
};
