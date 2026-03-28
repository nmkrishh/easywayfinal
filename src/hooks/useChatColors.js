import { useMemo } from "react";

/**
 * Derives a stable set of chatbot color tokens from the theme.
 * Only recomputes when dark mode toggles — never on every parent render.
 */
export function useChatColors(theme) {
  return useMemo(() => ({
    dark:         theme.dark,
    bg:           theme.bg,
    surface:      theme.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    border:       theme.border,
    text:         theme.text,
    muted:        theme.muted,
    accent:       theme.accent,
    accent2:      theme.accent2,
    accentBg:     theme.accentBg,
    accentBorder: theme.accentBorder,
    accentBtnBg:  theme.accentBtnBg,
    accentBtnText: theme.accentBtnText,
    glassBar:     theme.dark ? "rgba(8,8,8,0.88)" : "rgba(250,250,250,0.88)",
    userBubble:   theme.accentBtnBg,
    userText:     theme.accentBtnText,
    aiBubble:     theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    aiBorder:     theme.border,
    inputBg:      theme.dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)",
    btnBg:        theme.accentBtnBg,
    btnText:      theme.accentBtnText,
    chip:         theme.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    cardBg:       theme.dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
  }), [theme.dark]);
}
