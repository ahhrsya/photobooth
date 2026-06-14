export const colors = {
  background: "#FFF5F0",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#6B6B6B",
  primary: "#FF6B9D",
  primaryDark: "#E5588A",
  accent: "#FFB3DE",
  border: "#1A1A1A",
  shadow: "rgba(0,0,0,0.15)",
  overlay: "rgba(0,0,0,0.6)",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fontFamily = {
  regular: undefined as string | undefined,
  mono: "Courier",
  typewriter: "Courier",
} as const;
