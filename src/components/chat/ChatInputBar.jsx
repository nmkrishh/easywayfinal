import React, { memo } from "react";

/* Image thumbnail row */
const ImageRow = memo(({ imgs, removeImg, c }) => {
  if (imgs.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
      {imgs.map((img, i) => (
        <div key={i} style={{ position: "relative", width: 52, height: 52 }}>
          <img
            src={img.url} alt=""
            style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: `1px solid ${c.border}`, display: "block" }}
          />
          <button
            onClick={() => removeImg(i)}
            style={{
              position: "absolute", top: -6, right: -6,
              width: 18, height: 18, borderRadius: "50%",
              background: c.text, color: c.bg, border: "none",
              cursor: "pointer", fontSize: "0.55rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >x</button>
        </div>
      ))}
    </div>
  );
});

const ChatInputBar = memo(({
  c, input, setInput, imgs, removeImg,
  textRef, fileRef, onFiles, onKeyDown, send, busy,
  showTemplates, setShowTemplates, hasChat, placeholder,
}) => {
  const canSend = !busy && (input.trim().length > 0 || imgs.length > 0);

  return (
    <div style={{
      position: "sticky", bottom: 0, zIndex: 100,
      background: c.glassBar,
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${c.border}`,
      padding: "0.75rem 1.5rem 1rem",
      flexShrink: 0,
      willChange: "transform",
      contain: "layout style",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <ImageRow imgs={imgs} removeImg={removeImg} c={c} />

        <div style={{
          display: "flex", alignItems: "flex-end", gap: "0.4rem",
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 16, padding: "0.45rem 0.45rem 0.45rem 0.85rem",
        }}>
          {/* Attach button — text icon */}
          <button
            onClick={() => fileRef.current?.click()}
            title="Attach images"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: c.muted,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.72rem", fontWeight: 600,
              letterSpacing: "0.04em", padding: "6px 8px",
              display: "flex", alignItems: "center", flexShrink: 0,
              borderRadius: 8,
            }}
          >
            attach
          </button>

          <input
            ref={fileRef}
            type="file" accept="image/*" multiple
            style={{ display: "none" }}
            onChange={onFiles}
          />

          {/* Templates toggle — only visible after chat starts */}
          {hasChat && (
            <button
              onClick={() => setShowTemplates((v) => !v)}
              title={showTemplates ? "Hide templates" : "Browse templates"}
              style={{
                background: showTemplates ? c.accentBg : "none",
                border: showTemplates ? `1px solid ${c.accentBorder}` : "1px solid transparent",
                cursor: "pointer",
                color: showTemplates ? c.text : c.muted,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "0.72rem", fontWeight: 600,
                letterSpacing: "0.04em", padding: "5px 8px",
                display: "flex", alignItems: "center", flexShrink: 0,
                borderRadius: 8, transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              templates
            </button>
          )}

          <textarea
            ref={textRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder || "Describe your idea…"}
            rows={1}
            style={{
              flex: 1, border: "none", outline: "none", resize: "none",
              background: "transparent", color: c.text,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.94rem", lineHeight: 1.55,
              maxHeight: 160, overflowY: "auto", padding: "4px 0",
            }}
          />

          {/* Send button — arrow text instead of emoji */}
          <button
            onClick={send}
            disabled={!canSend}
            title="Send"
            style={{
              width: 36, height: 36, borderRadius: 10, border: "none",
              background: canSend ? c.accentBtnBg : c.border,
              color: canSend ? c.accentBtnText : c.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canSend ? "pointer" : "default",
              fontSize: "1rem", flexShrink: 0,
              fontWeight: 700,
              transition: "background 0.15s, color 0.15s",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            &uarr;
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "0.4rem" }}>
          <span style={{
            fontSize: "0.67rem", color: c.muted,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            Enter to send &middot; Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
});

ChatInputBar.displayName = "ChatInputBar";
export default ChatInputBar;
