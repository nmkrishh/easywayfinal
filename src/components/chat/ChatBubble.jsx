import React, { memo } from "react";

/* AI avatar â€” clean monogram instead of emoji */
const AIAvatar = ({ c }) => (
  <div style={{
    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
    background: c.surface, border: `1px solid ${c.border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.04em",
    color: c.muted, fontFamily: "var(--font-body)",
  }}>AI</div>
);

/* User avatar â€” clean monogram */
const UserAvatar = ({ c }) => (
  <div style={{
    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
    background: c.accentBg, border: `1px solid ${c.accentBorder}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.04em",
    color: c.text, fontFamily: "var(--font-body)",
  }}>You</div>
);

const ChatBubble = memo(({ msg, c }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: "0.65rem", alignItems: "flex-end" }}>
      {!isUser && <AIAvatar c={c} />}
      <div style={{ maxWidth: "74%" }}>
        {isUser && msg.imgUrls?.length > 0 && (
          <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {msg.imgUrls.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: 70, height: 70, borderRadius: 10, objectFit: "cover", border: `1px solid ${c.border}` }} />
            ))}
          </div>
        )}
        {msg.text ? (
          <div style={{
            padding: "0.7rem 1rem",
            borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
            background: isUser ? c.accentBtnBg : c.surface,
            border: isUser ? "none" : `1px solid ${c.border}`,
            color: isUser ? c.accentBtnText : c.text,
            fontSize: "0.92rem", lineHeight: 1.65,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "var(--font-body)",
          }}>
            {msg.text}
          </div>
        ) : null}
        <div style={{
          fontSize: "0.67rem", color: c.muted, marginTop: "0.25rem",
          textAlign: isUser ? "right" : "left",
          fontFamily: "var(--font-body)",
        }}>
          {msg.time}
        </div>
      </div>
      {isUser && <UserAvatar c={c} />}
    </div>
  );
});

ChatBubble.displayName = "ChatBubble";
export default ChatBubble;

