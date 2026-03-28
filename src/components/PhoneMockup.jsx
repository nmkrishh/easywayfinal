import React, { memo } from "react";

const PhoneMockup = memo(({ theme }) => (
  <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
    {/* Phone */}
    <div style={{
      width: 220, height: 450, borderRadius: 36,
      background: `linear-gradient(160deg, ${theme.dark ? "#1a1a1a" : "#e8e8e8"} 0%, ${theme.dark ? "#0d0d0d" : "#d8d8d8"} 100%)`,
      border: `1.5px solid ${theme.accentBorder}`,
      position: "relative", overflow: "hidden",
      boxShadow: `0 40px 80px -20px ${theme.accentGlow}, 0 0 0 1px ${theme.border}`,
      animation: "phoneFloat 5s ease-in-out infinite",
    }}>
      {/* Notch */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        width: 60, height: 14, background: theme.dark ? "#000" : "#ccc",
        borderRadius: 100, zIndex: 10,
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", filter: "blur(40px)", background: theme.accent, opacity: 0.08, top: -20, right: -20 }} />
      <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", filter: "blur(40px)", background: theme.accent2, opacity: 0.06, bottom: 20, left: -10 }} />

      {/* Screen */}
      <div style={{
        position: "absolute", inset: 6, borderRadius: 30, overflow: "hidden",
        background: theme.dark ? "#0a0a0a" : "#f8f8f8",
        animation: "screenReveal 1.5s ease-out 0.5s both",
      }}>
        <div style={{ padding: "2rem 1rem 1rem" }}>
          <div style={{ height: 6, borderRadius: 3, marginBottom: 8, width: "60%", background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }} />
          <div style={{ height: 6, borderRadius: 3, marginBottom: 16, width: "40%", background: theme.border }} />
          <div style={{ height: 60, borderRadius: 10, marginBottom: 8, background: theme.accentBg, border: `1px solid ${theme.accentBorder}` }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 44, borderRadius: 8, background: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
            ))}
          </div>
          <div style={{ marginTop: 10, height: 28, borderRadius: 8, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`, opacity: 0.5 }} />
        </div>
      </div>
    </div>

    {/* Float badges */}
    {[
      { style: { top: 60, right: -30 }, delay: "0s", icon: "⚡", title: "APK Ready", sub: "in ~5-15 minutes" },
      { style: { bottom: 80, left: -40 }, delay: "1.5s", icon: "🤖", title: "AI Powered", sub: "No code needed" },
    ].map((b) => (
      <div key={b.title} style={{
        position: "absolute", ...b.style,
        background: theme.dark ? "rgba(15,15,15,0.9)" : "rgba(255,255,255,0.9)",
        border: `1px solid ${theme.border}`, borderRadius: 12,
        padding: "0.5rem 0.75rem", backdropFilter: "blur(10px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", gap: "0.4rem",
        animation: `badgeFloat 4s ease-in-out infinite`,
        animationDelay: b.delay,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: theme.accentBtnBg,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
        }}>{b.icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: theme.text }}>{b.title}</div>
          <div style={{ color: theme.muted, fontSize: "0.7rem" }}>{b.sub}</div>
        </div>
      </div>
    ))}
  </div>
));

export default PhoneMockup;
