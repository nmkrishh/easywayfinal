import React, { useState, useRef, useEffect, memo } from "react";
import AIWebsiteChatInput from "../../components/builder/AIWebsiteChatInput";

/**
 * ChatPanel â€” left panel of the split-screen builder.
 * During the intake phase, renders AI-generated questions as clickable chip options.
 */

const TEMPLATES = [
  { label: "Shopify Store",    text: "Build a modern Shopify-style product landing page for a premium skincare brand. Include hero, features, product showcase, testimonials, and footer." },
  { label: "Restaurant",       text: "Create a beautiful restaurant website with a hero section, menu, photo gallery, reservation form, and footer. Warm earthy tones." },
  { label: "Portfolio",        text: "Design a minimal dark portfolio site for a UI/UX designer with hero, work showcase, skills, and contact section." },
  { label: "SaaS Landing",     text: "Build a high-converting SaaS landing page with hero, feature list, pricing table, FAQ, and CTA. Blue & purple gradient theme." },
  { label: "Creative Agency",  text: "Create a vibrant creative agency website with animated hero, services grid, team, and contact. Bold colours and modern typography." },
  { label: "Gym / Fitness",    text: "Design an energetic gym website with hero, class schedule, trainer profiles, pricing, and sign-up form. Dark theme with neon accents." },
];

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

function CodeEventCard({ event, c }) {
  const [expanded, setExpanded] = useState(false);
  const isPreview = event.fileName === "[PREVIEW]";
  const statusColor = event.status === "done" ? "#4ade80" : event.status === "running" ? "#facc15" : "#f87171";
  return (
    <div style={{ background: c.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${event.status === "done" ? "rgba(74,222,128,0.25)" : event.status === "running" ? "rgba(250,204,21,0.25)" : c.border}`, borderRadius: 7, marginBottom: "0.3rem", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.5rem", cursor: event.preview ? "pointer" : "default" }} onClick={() => event.preview && setExpanded(v => !v)}>
        <span style={{ fontSize: "0.55rem", color: statusColor, flexShrink: 0 }}>{event.status === "done" ? "✓" : event.status === "running" ? "⟳" : "✕"}</span>
        <span style={{ fontSize: "0.53rem", fontWeight: 600, color: c.muted, flexShrink: 0, background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>{AGENT_LABELS[event.agentId] || event.agentId}</span>
        <span style={{ fontSize: "0.6rem", color: isPreview ? "#60a5fa" : c.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{isPreview ? "index.html (preview)" : event.fileName}</span>
        {event.preview && <span style={{ fontSize: "0.5rem", color: c.muted, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>}
      </div>
      {expanded && event.preview && (
        <div style={{ borderTop: `1px solid ${c.border}`, padding: "0.4rem 0.5rem", fontFamily: "monospace", fontSize: "0.56rem", color: "#a3e635", background: "rgba(0,0,0,0.3)", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 150, overflowY: "auto", lineHeight: 1.5 }}>
          {event.preview.slice(0, 400)}{event.preview.length > 400 && "\n...(truncated)"}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Intake question card with chip options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IntakeQuestionCard = memo(({ q, selected, onSelect, c }) => (
  <div
    style={{
      background: c.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: "0.85rem 1rem",
    }}
  >
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.83rem",
        fontWeight: 600,
        color: c.text,
        margin: "0 0 0.6rem",
        lineHeight: 1.4,
      }}
    >
      {q.question}
    </p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
      {q.options.map((opt) => {
        const active = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(q.key, active ? null : opt)}
            style={{
              background: active
                ? c.dark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)"
                : "none",
              color: active
                ? c.dark ? "#0a0a0a" : "#f5f5f5"
                : c.text,
              border: `1px solid ${active ? "transparent" : c.border}`,
              borderRadius: 20,
              padding: "0.3rem 0.75rem",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.77rem",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.background = c.dark
                  ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.background = "none";
              }
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
));
IntakeQuestionCard.displayName = "IntakeQuestionCard";

// â”€â”€ Main panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ChatPanel = memo(({
  c,
  messages,
  generating,
  error,
  onSend,
  phase = "idle",
  intakeQuestions = [],
  onSubmitIntake,
  codeEvents = [],
}) => {
  const [input, setInput]         = useState("");
  const [imageData, setImageData] = useState(null);
  const [dragging, setDragging]   = useState(false);
  // Intake state
  const [answers, setAnswers]     = useState({});
  const [brandName, setBrandName] = useState("");
  const [logoData, setLogoData]   = useState(null);
  const logoInputRef              = useRef(null);
  const bottomRef                 = useRef(null);
  const textareaRef               = useRef(null);
  const fileInputRef              = useRef(null);

  // Reset intake state when a new intake round starts
  useEffect(() => {
    if (intakeQuestions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers({});
      setBrandName("");
      setLogoData(null);
    }
  }, [intakeQuestions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating, intakeQuestions]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || generating) return;
    onSend(text, imageData);
    setInput("");
    setImageData(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processImageFile(e.dataTransfer.files?.[0]);
  };

  const handleChipSelect = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const allAnswered =
    intakeQuestions.length > 0 &&
    intakeQuestions.every(q => answers[q.key] != null);

  const processLogoFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleBuildClick = () => {
    if (!allAnswered || generating) return;
    onSubmitIntake(answers, brandName, logoData);
    setAnswers({});
    setBrandName("");
    setLogoData(null);
  };

  const isEmpty = messages.length === 0;
  const showIntake = intakeQuestions.length > 0 && !generating;
  const inputPlaceholder =
    phase === "building" ? "Building your website, please wait..." :
    phase === "done" ? "Request a change — e.g. 'Make the hero taller' or 'Add a gallery section'..." :
    "Describe the website you want to build...";

  return (
    <div
      style={{
        width: 380,
        minWidth: 280,
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: c.dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)",
        borderRight: `1px solid ${c.border}`,
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            background: c.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `2px dashed ${c.border}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: c.muted,
            pointerEvents: "none",
            letterSpacing: "0.01em",
          }}
        >
          Drop image here
        </div>
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        {/* Empty state */}
        {isEmpty && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Greeting */}
            <div
              style={{
                background: c.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: "1.1rem 1.2rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: c.text,
                  margin: "0 0 0.4rem",
                  letterSpacing: "-0.01em",
                }}
              >
                AI Website Builder
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: c.muted,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Describe the website you want and our AI will ask a few quick questions before building your site â€” or pick a template to start instantly. You can also drop a reference image.
              </p>
            </div>

            {/* Template list */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: c.muted,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: "0 0 0.5rem",
                }}
              >
                Quick Templates
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => onSend(t.text, null)}
                    disabled={generating}
                    style={{
                      background: "none",
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      padding: "0.5rem 0.85rem",
                      cursor: generating ? "default" : "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8rem",
                      color: c.text,
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = c.dark
                        ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                gap: "0.25rem",
              }}
            >
              {isUser && msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="reference"
                  style={{
                    maxWidth: 140,
                    maxHeight: 100,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: `1px solid ${c.border}`,
                  }}
                />
              )}
              <div
                style={{
                  maxWidth: "85%",
                  background: isUser
                    ? (c.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")
                    : (c.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  color: c.text,
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "0.65rem 0.9rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.83rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  border: `1px solid ${c.border}`,
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* â”€â”€ Intake chip questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {showIntake && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {intakeQuestions.map(q => (
              <IntakeQuestionCard
                key={q.key}
                q={q}
                selected={answers[q.key]}
                onSelect={handleChipSelect}
                c={c}
              />
            ))}

            {/* Additional Brand/Logo fields */}
            <div
              style={{
                background: c.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", fontWeight: 600, color: c.text, margin: "0 0 0.4rem" }}>
                  Brand / Store Name (Optional)
                </p>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  style={{
                    width: "100%",
                    background: c.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    padding: "0.6rem",
                    color: c.text,
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", fontWeight: 600, color: c.text, margin: "0 0 0.4rem" }}>
                  Logo (Optional)
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      background: c.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      color: c.text,
                      border: `1px solid ${c.border}`,
                      borderRadius: 6,
                      padding: "0.4rem 0.8rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                    }}
                  >
                    Upload Logo
                  </button>
                  {logoData && (
                    <img src={logoData} alt="logo" style={{ height: 28, borderRadius: 4, objectFit: "contain" }} />
                  )}
                  {logoData && (
                    <button
                      onClick={() => setLogoData(null)}
                      style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", fontSize: "0.75rem" }}
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => processLogoFile(e.target.files?.[0])}
                  />
                </div>
              </div>
            </div>

            {/* Progress label */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                color: c.muted,
                margin: 0,
                textAlign: "center",
              }}
            >
              {Object.keys(answers).filter(k => answers[k] != null).length} / {intakeQuestions.length} answered
            </p>

            {/* Build button â€” enabled once all answered */}
            <button
              onClick={handleBuildClick}
              disabled={!allAnswered || generating}
              style={{
                background: allAnswered && !generating
                  ? c.dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)"
                  : c.border,
                color: allAnswered && !generating
                  ? c.dark ? "#0a0a0a" : "#f5f5f5"
                  : c.muted,
                border: "none",
                borderRadius: 10,
                padding: "0.7rem 1rem",
                cursor: allAnswered && !generating ? "pointer" : "default",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={e => {
                if (allAnswered && !generating) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {allAnswered ? "Build My Website â†’" : "Select all options above to continue"}
            </button>
          </div>
        )}

        {/* Typing indicator */}
        {generating && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div
              style={{
                background: c.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${c.border}`,
                borderRadius: "16px 16px 16px 4px",
                padding: "0.65rem 0.9rem",
                display: "flex",
                gap: "0.3rem",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.muted,
                    display: "inline-block",
                    animation: `ewBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live Code Feed */}
        {(generating || codeEvents.length > 0) && (
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                padding: "0.4rem 0.6rem",
                background: c.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                borderRadius: 8,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 600, color: c.text }}>🔧 Live Code Feed</span>
                {codeEvents.length > 0 && (
                  <span style={{ fontSize: "0.58rem", color: codeEvents.filter(e => e.status === "done").length === codeEvents.length ? "#4ade80" : "#facc15", fontWeight: 600 }}>
                    {codeEvents.filter(e => e.status === "done").length} / {codeEvents.length} done
                  </span>
                )}
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {codeEvents.length === 0 && generating && (
                  <div style={{ fontSize: "0.62rem", color: c.muted, textAlign: "center", padding: "0.4rem" }}>Initializing pipeline...</div>
                )}
                {codeEvents.map(event => <CodeEventCard key={event.key} event={event} c={c} />)}
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: c.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              padding: "0.65rem 0.9rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color: c.muted,
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area â€” hidden while intake chips are visible */}
      {!showIntake && (
        <AIWebsiteChatInput
          c={c}
          inputValue={input}
          setInputValue={setInput}
          imageData={imageData}
          setImageData={setImageData}
          onAttachFile={processImageFile}
          onSend={handleSubmit}
          onKeyDown={handleKeyDown}
          busy={generating}
          placeholder={inputPlaceholder}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
        />
      )}
    </div>
  );
});

ChatPanel.displayName = "ChatPanel";
export default ChatPanel;

