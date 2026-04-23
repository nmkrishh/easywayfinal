import React, { memo, useState } from "react";

const AGENT_LABELS = {
  enhancer: "Prompt Enhancer",
  structurer: "Architecture Planner",
  frontend: "Frontend Builder",
  nativeApp: "Mobile Builder",
  backend: "Backend Builder",
  payment: "Payment Agent",
  fixer: "Error Fixer",
  assembler: "Assembler",
};

const STATUS_COLORS = {
  running: "#facc15",
  done: "#4ade80",
  error: "#f87171",
};

function CodeEventCard({ event, c }) {
  const [expanded, setExpanded] = useState(false);
  const isPreview = event.fileName === "[PREVIEW]";
  const statusColor = STATUS_COLORS[event.status] || c.muted;
  const agentLabel = AGENT_LABELS[event.agentId] || event.agentId;

  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${event.status === "done" ? "rgba(74,222,128,0.3)" : event.status === "running" ? "rgba(250,204,21,0.3)" : c.border}`,
        borderRadius: 8,
        marginBottom: "0.4rem",
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0.4rem 0.6rem",
          cursor: event.preview ? "pointer" : "default",
        }}
        onClick={() => event.preview && setExpanded((v) => !v)}
      >
        <span style={{ fontSize: "0.6rem", color: statusColor, flexShrink: 0 }}>
          {event.status === "done" ? "✓" : event.status === "running" ? "⟳" : "✕"}
        </span>
        <span
          style={{
            fontSize: "0.58rem",
            fontWeight: 600,
            color: c.muted,
            flexShrink: 0,
            background: "rgba(255,255,255,0.05)",
            padding: "1px 5px",
            borderRadius: 4,
          }}
        >
          {agentLabel}
        </span>
        <span
          style={{
            fontSize: "0.65rem",
            color: isPreview ? "#60a5fa" : c.text,
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {isPreview ? "index.html (preview)" : event.fileName}
        </span>
        {event.preview && (
          <span style={{ fontSize: "0.55rem", color: c.muted, flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {expanded && event.preview && (
        <div
          style={{
            borderTop: `1px solid ${c.border}`,
            padding: "0.5rem 0.6rem",
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "#a3e635",
            background: "rgba(0,0,0,0.3)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            maxHeight: 180,
            overflowY: "auto",
            lineHeight: 1.5,
          }}
        >
          {event.preview.slice(0, 400)}
          {event.preview.length > 400 && "\n... (truncated)"}
        </div>
      )}
    </div>
  );
}

const AppBuilderChatPane = memo(function AppBuilderChatPane({
  c,
  chips,
  messages,
  busy,
  error,
  input,
  setInput,
  onSend,
  endRef,
  codeEvents = [],
  activeAgentEta = null,
}) {
  const [codeFeedOpen, setCodeFeedOpen] = useState(true);

  const doneCount = codeEvents.filter((e) => e.status === "done").length;
  const totalCount = codeEvents.length;
  const hasEvents = codeEvents.length > 0;

  return (
    <div style={{ width: 420, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {messages.length === 0 && !hasEvents && (
          <div style={{ display: "grid", gap: "0.7rem" }}>
            <div
              style={{
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: "0.9rem",
                background: c.surface,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>AI App Builder</div>
              <div style={{ color: c.muted, fontSize: "0.85rem" }}>
                Describe your app idea. The pipeline runs all 8 agents and generates a complete project.
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => onSend(chip)}
                  disabled={busy}
                  style={{
                    border: `1px solid ${c.border}`,
                    background: "transparent",
                    color: c.text,
                    borderRadius: 100,
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.78rem",
                    cursor: busy ? "default" : "pointer",
                    transition: "border-color 0.2s",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginTop: "0.75rem",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  background: isUser ? c.accentBg : c.surface,
                  border: `1px solid ${isUser ? c.accentBorder : c.border}`,
                  borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "0.65rem 0.8rem",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
                {m.time && (
                  <div style={{ fontSize: "0.6rem", color: c.muted, marginTop: "0.25rem", textAlign: isUser ? "right" : "left" }}>
                    {m.time}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {(busy || hasEvents) && (
          <div
            style={{
              marginTop: "0.9rem",
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.7rem",
                background: c.surface,
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => setCodeFeedOpen((v) => !v)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.65rem" }}>🔧</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: c.text }}>Live Code Feed</span>
                {totalCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.58rem",
                      background: doneCount === totalCount && totalCount > 0 ? "rgba(74,222,128,0.2)" : "rgba(250,204,21,0.15)",
                      color: doneCount === totalCount && totalCount > 0 ? "#4ade80" : "#facc15",
                      borderRadius: 20,
                      padding: "1px 6px",
                      fontWeight: 600,
                    }}
                  >
                    {doneCount} / {totalCount} done
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {activeAgentEta && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#facc15",
                      fontFamily: "monospace",
                    }}
                  >
                    ETA ~{activeAgentEta.remaining}s
                  </span>
                )}
                <span style={{ fontSize: "0.6rem", color: c.muted }}>{codeFeedOpen ? "▲" : "▼"}</span>
              </div>
            </div>

            {codeFeedOpen && (
              <div
                style={{
                  padding: "0.6rem",
                  maxHeight: 320,
                  overflowY: "auto",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {codeEvents.length === 0 && busy && (
                  <div style={{ fontSize: "0.65rem", color: c.muted, textAlign: "center", padding: "0.5rem" }}>
                    Initializing agents...
                  </div>
                )}
                {codeEvents.map((event) => (
                  <CodeEventCard key={event.key} event={event} c={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "0.8rem",
              padding: "0.6rem 0.8rem",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 8,
              color: "#f87171",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div style={{ borderTop: `1px solid ${c.border}`, padding: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={busy}
            placeholder="Describe your app idea..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              background: c.surface,
              color: c.text,
              padding: "0.6rem 0.7rem",
              outline: "none",
              fontSize: "0.83rem",
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => onSend()}
            disabled={busy || !input.trim()}
            style={{
              border: "none",
              borderRadius: 100,
              padding: "0.45rem 0.95rem",
              fontSize: "0.76rem",
              fontWeight: 600,
              cursor: !busy && !!input.trim() ? "pointer" : "default",
              background: !busy && !!input.trim() ? c.accentBtnBg : c.border,
              color: !busy && !!input.trim() ? c.accentBtnText : c.muted,
              whiteSpace: "nowrap",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {busy ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default AppBuilderChatPane;
