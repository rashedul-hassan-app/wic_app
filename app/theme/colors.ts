const palette = {
  navy950: "#060D18",
  navy900: "#0C1A2E",
  navy800: "#132035",
  navy700: "#1A2B42",
  navy600: "#1E3050",
  navy500: "#2A4060",
  navy400: "#3A5575",

  gold500: "#C9963A",
  gold400: "#D8A84E",
  gold300: "#E8B55A",
  gold100: "rgba(201, 150, 58, 0.15)",

  slate100: "#FFFFFF",
  slate300: "#C8D5E8",
  slate400: "#8A9BB5",
  slate500: "#5A6B80",

  angry100: "#F2D6CD",
  angry500: "#C03403",

  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay50: "rgba(0, 0, 0, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.slate100,
  textDim: palette.slate400,
  textSubtle: palette.slate500,
  background: palette.navy900,
  surface: palette.navy800,
  elevated: palette.navy700,
  border: palette.navy600,
  tint: palette.gold500,
  tintLight: palette.gold300,
  tintSubtle: palette.gold100,
  tintInactive: palette.navy500,
  separator: palette.navy600,
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const
