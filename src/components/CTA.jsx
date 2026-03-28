import React, { memo } from "react";

const CTA = memo(({ theme, onNavigate }) => (
  <div className="reveal" style={{
    margin: "2rem", borderRadius: 28, padding: "5rem 3rem", textAlign: "center",
    background: theme.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    border: `1px solid ${theme.accentBorder}`, position: "relative", overflow: "hidden", zIndex: 2,
  }}>
    {/* Orbs */}
    <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: theme.accent, filter: "blur(100px)", opacity: 0.06, top: -100, left: -50, pointerEvents: "none" }} />
    <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: theme.accent2, filter: "blur(80px)", opacity: 0.05, bottom: -50, right: -30, pointerEvents: "none" }} />

    <h2 style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800,
      fontSize: "clamp(2rem, 4vw, 3.5rem)", color: theme.text,
      marginBottom: "1rem", letterSpacing: "-0.03em", position: "relative",
    }}>
      Your Customers Are on Mobile.<br />
      <span style={{ color: theme.accent, fontStyle: "italic" }}>
        Are You?
      </span>
    </h2>
    <p style={{ color: theme.muted, fontSize: "1.05rem", marginBottom: "2.5rem", position: "relative" }}>
      Don't let competitors get ahead. Transform your digital presence today.
    </p>
    <button onClick={() => onNavigate("convert")} style={{
      background: theme.accentBtnBg,
      color: theme.accentBtnText, border: "none", cursor: "pointer",
      padding: "0.9rem 2.5rem", borderRadius: 100,
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "1.05rem",
      transition: "all 0.3s ease", position: "relative",
    }}>
      Convert My Website Now →
    </button>
  </div>
));

export default CTA;
