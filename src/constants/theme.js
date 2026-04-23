const BLACK = "#000000";
const WHITE = "#ffffff";
const GLASS_BLACK = "rgba(0, 0, 0, 0.08)";
const GLASS_WHITE = "rgba(255, 255, 255, 0.16)";

export const DARK_THEME = {
  dark: true,
  bg: BLACK,
  bg2: BLACK,
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.28)",
  text: WHITE,
  muted: "rgba(255, 255, 255, 0.74)",
  accent: WHITE,
  accent2: WHITE,
  accentGlow: "rgba(255, 255, 255, 0.16)",
  accentBg: GLASS_WHITE,
  accentBorder: "rgba(255, 255, 255, 0.32)",
  accentBtnBg: WHITE,
  accentBtnText: BLACK,
  glassDark: GLASS_BLACK,
  glassLight: GLASS_WHITE,
};

export const LIGHT_THEME = {
  ...DARK_THEME,
  dark: false,
  bg: WHITE,
  bg2: WHITE,
  surface: WHITE,
  border: "rgba(0, 0, 0, 0.18)",
  text: BLACK,
  muted: "rgba(0, 0, 0, 0.68)",
  accent: BLACK,
  accent2: BLACK,
  accentGlow: "rgba(0, 0, 0, 0.12)",
  accentBg: GLASS_BLACK,
  accentBorder: "rgba(0, 0, 0, 0.24)",
  accentBtnBg: BLACK,
  accentBtnText: WHITE,
  glassDark: GLASS_BLACK,
  glassLight: GLASS_WHITE,
};

export const getTheme = (dark) => (dark ? DARK_THEME : LIGHT_THEME);

export const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/android-app-builder";
