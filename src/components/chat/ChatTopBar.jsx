import React, { memo } from "react";

const ChatTopBar = memo(({ c, onBack, title, badge }) => (
  <div style={{
    position: "sticky", top: 0, zIndex: 100,
    background: c.glassBar,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid ${c.border}`,
    padding: "0.75rem 1.5rem",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0,
    willChange: "transform",
    contain: "layout style",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: c.muted,
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem", padding: "0.25rem 0",
          display: "flex", alignItems: "center", gap: "0.35rem",
        }}
      >
        &larr; Back
      </button>

      <span style={{ width: 1, height: 18, background: c.border, display: "inline-block" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Text monogram badge instead of emoji circle */}
        <div style={{
          padding: "0.2rem 0.6rem",
          borderRadius: 8,
          background: c.accentBg,
          border: `1px solid ${c.accentBorder}`,
          fontSize: "0.62rem", fontWeight: 700,
          letterSpacing: "0.07em", textTransform: "uppercase",
          color: c.accent,
          fontFamily: "var(--font-body)",
        }}>
          {badge || "AI"}
        </div>

        <div>
          <div style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700, fontSize: "0.95rem", color: c.text, lineHeight: 1.2,
          }}>
            {title || "AI Builder"}
          </div>
          <div style={{
            fontSize: "0.68rem", color: "#4ade80",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
          }}>
            Online
          </div>
        </div>
      </div>
    </div>

    <span style={{
      fontSize: "0.75rem", color: c.muted,
      fontFamily: "var(--font-body)",
    }}>
      Powered by EasyWay AI
    </span>
  </div>
));

ChatTopBar.displayName = "ChatTopBar";
export default ChatTopBar;

