import React, { memo } from "react";

const THEMES = [
  { value: "minimal-clean", label: "Minimal Clean" },
  { value: "bold-energetic", label: "Bold Energetic" },
  { value: "dark-technical", label: "Dark Technical" },
  { value: "gradient-modern", label: "Gradient Modern" },
  { value: "vibrant-playful", label: "Vibrant Playful" },
  { value: "warm-editorial", label: "Warm Editorial" },
  { value: "developer-docs", label: "Developer Docs" },
];

function topBtn(c, enabled) {
  return {
    border: "none",
    borderRadius: 100,
    padding: "0.45rem 0.95rem",
    fontSize: "0.76rem",
    fontWeight: 600,
    cursor: enabled ? "pointer" : "default",
    background: enabled ? c.accentBtnBg : c.border,
    color: enabled ? c.accentBtnText : c.muted,
    whiteSpace: "nowrap",
    transition: "background 0.2s",
  };
}

const AppBuilderTopBar = memo(function AppBuilderTopBar({
  c,
  onBack,
  canDownload,
  onDownloadApk,
  onDownloadAab,
  demoExpiresAt,
  selectedTheme,
  onThemeChange,
}) {
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const expired = demoExpiresAt ? now > demoExpiresAt : true;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        height: 52,
        borderBottom: `1px solid ${c.border}`,
        background: c.glassBar,
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", fontSize: "0.82rem" }}
        >
          ← Back
        </button>
        <span style={{ width: 1, height: 18, background: c.border }} />
        <span
          style={{
            padding: "0.2rem 0.55rem",
            borderRadius: 7,
            border: `1px solid ${c.accentBorder}`,
            background: c.accentBg,
            color: c.accent,
            fontSize: "0.62rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          AI App Builder
        </span>

        {onThemeChange && (
          <>
            <span style={{ width: 1, height: 18, background: c.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.6rem", color: c.muted, whiteSpace: "nowrap" }}>Design:</span>
              <select
                value={selectedTheme || "minimal-clean"}
                onChange={(e) => onThemeChange(e.target.value)}
                style={{
                  background: c.surface,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  fontSize: "0.68rem",
                  padding: "0.2rem 0.4rem",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
        <button
          onClick={onDownloadApk}
          disabled={!canDownload || expired}
          style={topBtn(c, canDownload && !expired)}
          title={expired ? "Demo APK expired (24-hour validity)" : "Download demo APK (valid 1 day)"}
        >
          Download Demo APK
        </button>
        <button
          onClick={onDownloadAab}
          disabled={!canDownload}
          style={topBtn(c, canDownload)}
          title="Download AAB package (unlimited)"
        >
          Download AAB
        </button>
      </div>
    </div>
  );
});

export default AppBuilderTopBar;
