import React, { memo } from "react";

/* Chip — isolated hover state so parent never re-renders from hover */
const Chip = memo(({ label, c, onClick }) => {
  const ref = React.useRef(null);

  const onEnter = () => {
    if (!ref.current) return;
    ref.current.style.background   = c.accentBg;
    ref.current.style.borderColor  = c.accentBorder;
    ref.current.style.color        = c.text;
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.background   = "transparent";
    ref.current.style.borderColor  = c.border;
    ref.current.style.color        = c.muted;
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        padding: "0.45rem 1.1rem", borderRadius: 100,
        background: "transparent",
        border: `1px solid ${c.border}`,
        color: c.muted,
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "0.83rem",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );
});

const WelcomeScreen = memo(({ c, chips, onChip, title, subtitle, badgeLabel }) => (
  <div style={{ textAlign: "center", padding: "4rem 0 2.5rem" }}>
    {/* Badge instead of emoji avatar */}
    <div style={{
      display: "inline-block",
      padding: "0.3rem 0.9rem",
      borderRadius: 100,
      background: c.accentBg,
      border: `1px solid ${c.accentBorder}`,
      fontSize: "0.72rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      color: c.accent, marginBottom: "1.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {badgeLabel || "AI Assistant"}
    </div>

    <h2 style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: 800, fontSize: "1.85rem", color: c.text,
      marginBottom: "0.6rem", letterSpacing: "-0.03em",
      margin: "0 0 0.6rem",
    }}>
      {title || "What shall we build?"}
    </h2>

    <p style={{
      color: c.muted, fontSize: "1rem", lineHeight: 1.65,
      marginBottom: "2rem", margin: "0 0 2rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {subtitle || "Describe your idea, upload screenshots, or pick a template below."}
    </p>

    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      {chips.map((chip) => (
        <Chip key={chip} label={chip} c={c} onClick={() => onChip(chip)} />
      ))}
    </div>
  </div>
));

WelcomeScreen.displayName = "WelcomeScreen";
export default WelcomeScreen;
