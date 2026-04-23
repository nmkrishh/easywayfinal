import React, { memo } from "react";

const TypingIndicator = memo(({ c }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.65rem" }}>
    {/* AI monogram avatar */}
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      background: c.surface, border: `1px solid ${c.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.04em",
      color: c.muted, fontFamily: "var(--font-body)",
    }}>AI</div>

    <div style={{
      padding: "0.7rem 1.1rem",
      borderRadius: "4px 18px 18px 18px",
      background: c.surface, border: `1px solid ${c.border}`,
      display: "flex", gap: "0.3rem", alignItems: "center",
    }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: c.muted, display: "inline-block",
          animation: "typingPulse 1.2s ease-in-out infinite",
          animationDelay: `${delay}s`,
        }} />
      ))}
    </div>
  </div>
));

TypingIndicator.displayName = "TypingIndicator";
export default TypingIndicator;

