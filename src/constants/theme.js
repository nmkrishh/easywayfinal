export const getTheme = (dark) => ({
  bg: dark ? "#080808" : "#fafafa",
  bg2: dark ? "#0f0f0f" : "#f0f0f0",
  surface: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
  border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  text: dark ? "#f0f0f0" : "#111",
  muted: dark ? "#666" : "#888",
  accent: dark ? "#ffffff" : "#111111",
  accent2: dark ? "#999999" : "#555555",
  accentGlow: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
  accentBg: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
  accentBorder: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
  accentBtnBg: dark ? "#ffffff" : "#111111",
  accentBtnText: dark ? "#000000" : "#ffffff",
  dark,
});

export const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/easyway";
