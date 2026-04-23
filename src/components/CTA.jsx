import React, { memo } from "react";

const CTA = memo(({ theme, onNavigate }) => (
  <div className="reveal" style={{
    margin: "2rem", borderRadius: 8, padding: "5rem 3rem", textAlign: "center",
    background: theme.bg,
    border: `1px solid ${theme.text}`, position: "relative", overflow: "hidden", zIndex: 2,
  }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(124,251,53,0.14), rgba(246,255,86,0.11) 28%, rgba(122,57,255,0.12) 64%, rgba(255,46,166,0.13))", pointerEvents: "none" }} />

    <h2 style={{
      fontFamily: "var(--font-display)", fontWeight: 400,
      fontSize: "clamp(2.8rem, 5vw, 4rem)", color: theme.text,
      marginBottom: "1rem", letterSpacing: "-0.96px", lineHeight: 1.1, position: "relative",
    }}>
      Your Customers Are on Mobile.<br />
      <span style={{ color: theme.text }}>
        Are You?
      </span>
    </h2>
    <p style={{ color: theme.muted, fontSize: "1.25rem", lineHeight: 1.4, letterSpacing: "-0.14px", fontWeight: 330, marginBottom: "2.5rem", position: "relative" }}>
      Don't let competitors get ahead. Transform your digital presence today.
    </p>
    <button onClick={() => onNavigate("convert")} style={{
      background: theme.accentBtnBg,
      color: theme.accentBtnText, border: `1px solid ${theme.text}`, cursor: "pointer",
      padding: "0.55rem 1.6rem 0.72rem", borderRadius: 50,
      fontFamily: "var(--font-body)", fontWeight: 400, fontSize: "1rem", letterSpacing: "-0.14px",
      transition: "all 0.3s ease", position: "relative",
    }}>
      Convert My Website Now →
    </button>
  </div>
));

export default CTA;
