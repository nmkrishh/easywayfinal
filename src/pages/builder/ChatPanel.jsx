import React, { useState, useRef, useEffect, memo } from "react";

/**
 * ChatPanel — left panel of the split-screen builder.
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

// ── Intake question card with chip options ─────────────────────────────────
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
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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

// ── Main panel ─────────────────────────────────────────────────────────────
const ChatPanel = memo(({
  c,
  messages,
  generating,
  error,
  onSend,
  phase = "idle",
  intakeQuestions = [],
  onSubmitIntake,
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
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: "0.8rem",
                  color: c.muted,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Describe the website you want and our AI will ask a few quick questions before building your site — or pick a template to start instantly. You can also drop a reference image.
              </p>
            </div>

            {/* Template list */}
            <div>
              <p
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
                      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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

        {/* ── Intake chip questions ─────────────────────────────────────── */}
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
                <p style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.83rem", fontWeight: 600, color: c.text, margin: "0 0 0.4rem" }}>
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
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <p style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.83rem", fontWeight: 600, color: c.text, margin: "0 0 0.4rem" }}>
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
                      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "0.72rem",
                color: c.muted,
                margin: 0,
                textAlign: "center",
              }}
            >
              {Object.keys(answers).filter(k => answers[k] != null).length} / {intakeQuestions.length} answered
            </p>

            {/* Build button — enabled once all answered */}
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
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
              {allAnswered ? "Build My Website →" : "Select all options above to continue"}
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

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: c.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              padding: "0.65rem 0.9rem",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.8rem",
              color: c.muted,
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area — hidden while intake chips are visible */}
      {!showIntake && (
        <div
          style={{
            borderTop: `1px solid ${c.border}`,
            padding: "0.75rem 0.9rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            background: c.dark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            flexShrink: 0,
          }}
        >
          {/* Image preview strip */}
          {imageData && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img
                src={imageData}
                alt="attached"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: `1px solid ${c.border}`,
                }}
              />
              <button
                onClick={() => setImageData(null)}
                style={{
                  background: "none",
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  padding: "2px 10px",
                  color: c.muted,
                  cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: "0.72rem",
                }}
              >
                Remove
              </button>
            </div>
          )}

          {/* Textarea + buttons */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={generating}
              rows={2}
              placeholder={
                phase === "building" ? "Building your website, please wait…" :
                phase === "done"     ? "Request a change — e.g. 'Make the hero taller' or 'Add a gallery section'…" :
                "Describe the website you want to build…"
              }
              style={{
                flex: 1,
                background: c.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: "0.6rem 0.85rem",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "0.83rem",
                color: c.text,
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: "auto",
              }}
            />

            {/* Attach image — paperclip SVG */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach reference image"
              style={{
                background: imageData
                  ? (c.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")
                  : "none",
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.muted,
                flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            {/* Send — arrow SVG */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || generating}
              style={{
                background: (input.trim() && !generating)
                  ? (c.dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)")
                  : c.border,
                color: (input.trim() && !generating)
                  ? (c.dark ? "#0a0a0a" : "#f5f5f5")
                  : c.muted,
                border: "none",
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: (input.trim() && !generating) ? "pointer" : "default",
                transition: "background 0.2s, color 0.2s",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => processImageFile(e.target.files?.[0])}
          />

          <p
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.62rem",
              color: c.muted,
              margin: 0,
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
          >
            Enter to send · Shift+Enter for new line · Drop an image to attach
          </p>
        </div>
      )}
    </div>
  );
});

ChatPanel.displayName = "ChatPanel";
export default ChatPanel;
