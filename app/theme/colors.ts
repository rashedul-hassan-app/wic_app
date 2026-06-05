const palette = {
  // Warm paper background system (not pure white)
  paper50: "#FBF7F2",
  paper100: "#F6F0E8",
  paper200: "#EDE4D6",
  paper300: "#E3D6C4",

  // Soft ink / navy-tinted text (keeps identity from dark mode)
  ink900: "#1C2430",
  ink800: "#2A3646",
  ink700: "#3A4A5C",
  ink600: "#516277",
  ink500: "#6B7F95",

  // Your gold stays core identity
  gold500: "#C9963A",
  gold400: "#D8A84E",
  gold300: "#E8B55A",
  gold100: "rgba(201, 150, 58, 0.12)",

  // Soft slate accents (less harsh than gray)
  slate200: "#D8E0EA",
  slate300: "#B9C6D6",
  slate400: "#8FA3B8",

  // Status
  angry100: "#F7E3DC",
  angry500: "#C03403",

  // Overlays (warm-tinted, not black)
  overlay10: "rgba(28, 36, 48, 0.06)",
  overlay20: "rgba(28, 36, 48, 0.12)",
  overlay50: "rgba(28, 36, 48, 0.22)",
} as const

export const colors = {
  palette,

  transparent: "rgba(0,0,0,0)",

  // Text hierarchy (soft contrast, not harsh black)
  text: palette.ink900,
  textDim: palette.ink700,
  textSubtle: palette.ink500,

  // Background system (warm paper layers)
  background: palette.paper50,
  surface: palette.paper100,
  elevated: palette.paper200,

  border: palette.paper300,
  separator: palette.paper300,

  // Accent system
  tint: palette.gold500,
  tintLight: palette.gold300,
  tintSubtle: palette.gold100,
  tintInactive: palette.slate400,

  // Status
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const