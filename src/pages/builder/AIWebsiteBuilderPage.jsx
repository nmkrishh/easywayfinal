import React, { useState, useCallback } from "react";
import BuilderTopBar   from "./BuilderTopBar";
import AgentProgress   from "./AgentProgress";
import ChatPanel       from "./ChatPanel";
import PreviewPanel    from "./PreviewPanel";
import PublishModal    from "./PublishModal";
import { useBuilderChat } from "./useBuilderChat";

/**
 * AIWebsiteBuilderPage
 * =====================
 * Full-screen split-layout builder:
 *    [ChatPanel] | [PreviewPanel]
 *
 * Props:
 *   theme   — EasyWay global theme object (passed from App.jsx via context)
 *   onBack  — callback to navigate back (App.jsx's own navigate function)
 */

// Derive a colours palette from the existing EasyWay theme object
// (falls back to dark mode if theme isn't provided)
function buildColors(theme) {
  const isDark = theme?.bg?.startsWith("#0") || theme?.bg?.startsWith("rgb(9") || true;
  return {
    dark:         isDark,
    bg:           theme?.bg           || "#090b10",
    text:         theme?.text         || "#e8eaf0",
    muted:        theme?.muted        || "rgba(200,205,220,0.5)",
    border:       theme?.border       || "rgba(255,255,255,0.09)",
    glassBar:     "rgba(9,11,16,0.88)",
    accent:       theme?.accent       || "#818cf8",
    accentBg:     theme?.accentBg     || "rgba(99,102,241,0.1)",
    accentBorder: theme?.accentBorder || "rgba(99,102,241,0.3)",
    accentBtnBg:  "linear-gradient(135deg,#6366f1,#8b5cf6)",
    accentBtnText:"#ffffff",
  };
}

// ── Inject global keyframe animations once ────────────────────────────────────
const ANIM_STYLE_ID = "ew-builder-anims";
if (!document.getElementById(ANIM_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = ANIM_STYLE_ID;
  style.textContent = `
    @keyframes ewSpin        { to { transform: rotate(360deg); } }
    @keyframes ewBlink       { 0%,100%{opacity:.3} 50%{opacity:1} }
    @keyframes ewBounce      { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
    @keyframes ewPulseBar    { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes ewFadeIn      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(style);
}

// ── Publish name dialog ───────────────────────────────────────────────────────
function PublishNameDialog({ c, onConfirm, onCancel }) {
  const [name, setName] = React.useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: c.dark ? "rgba(12,12,12,0.98)" : "rgba(250,250,250,0.98)",
          border: `1px solid ${c.border}`, borderRadius: 20,
          padding: "2rem 1.75rem", maxWidth: 380, width: "100%",
          boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          animation: "ewFadeIn 0.2s ease",
        }}
      >
        <h3 style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 800, fontSize: "1.2rem", color: c.text,
          margin: "0 0 0.4rem", letterSpacing: "-0.02em",
        }}>
          Name your website
        </h3>
        <p style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "0.82rem", color: c.muted, margin: "0 0 1.2rem",
          lineHeight: 1.6,
        }}>
          Choose a URL-friendly name. Your site will be hosted at:<br />
          <strong style={{ color: c.text, wordBreak: "break-all" }}>
            {slug ? `https://yourdomain.com/sites/${slug}` : "e.g. https://yourdomain.com/sites/my-store"}
          </strong>
        </p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && slug && onConfirm(slug)}
          placeholder="e.g. my-skincare-store"
          style={{
            width: "100%", boxSizing: "border-box",
            background: c.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${c.border}`, borderRadius: 10,
            padding: "0.65rem 0.9rem", marginBottom: "1rem",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "0.88rem", color: c.text, outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: "none", border: `1px solid ${c.border}`,
              borderRadius: 10, padding: "0.6rem",
              cursor: "pointer", color: c.muted,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.83rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => slug && onConfirm(slug)}
            disabled={!slug}
            style={{
              flex: 2,
              background: slug ? c.accentBtnBg : c.border,
              color: slug ? c.accentBtnText : c.muted,
              border: "none", borderRadius: 10, padding: "0.6rem",
              cursor: slug ? "pointer" : "default",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 600, fontSize: "0.83rem",
            }}
          >
            Publish →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIWebsiteBuilderPage({ theme, onBack }) {
  const c = buildColors(theme);

  const {
    messages, htmlContent, projectFiles, stage, agentLog, generating, error,
    publishInfo, publishing,
    phase, intakeQuestions, send, submitIntakeAnswers, publish,
  } = useBuilderChat();

  const [showNameDialog,   setShowNameDialog]   = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handlePublishClick = () => {
    if (!htmlContent) return;
    setShowNameDialog(true);
  };

  const handlePublishConfirm = useCallback(async (slug) => {
    setShowNameDialog(false);
    const result = await publish(slug);
    if (result) setShowPublishModal(true);
  }, [publish]);

  const handleBack = () => {
    const ok = messages.length === 0 || window.confirm("Discard this session and go back?");
    if (ok) onBack?.();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100%",
        background: c.bg,
        color: c.text,
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <BuilderTopBar
        c={c}
        onBack={handleBack}
        onPublish={handlePublishClick}
        publishing={publishing}
        liveUrl={publishInfo?.url}
        hasContent={!!htmlContent}
        htmlContent={htmlContent}
        projectFiles={projectFiles}
      />

      {/* Agent progress strip */}
      <AgentProgress c={c} stage={stage} agentLog={agentLog} />

      {/* Split layout */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <ChatPanel
          c={c}
          messages={messages}
          generating={generating}
          error={error}
          onSend={send}
          phase={phase}
          intakeQuestions={intakeQuestions}
          onSubmitIntake={submitIntakeAnswers}
        />
        <PreviewPanel
          c={c}
          htmlContent={htmlContent}
          projectFiles={projectFiles}
          generating={generating}
        />
      </div>

      {/* Publish name dialog */}
      {showNameDialog && (
        <PublishNameDialog
          c={c}
          onConfirm={handlePublishConfirm}
          onCancel={() => setShowNameDialog(false)}
        />
      )}

      {/* Publish success modal */}
      {showPublishModal && publishInfo && (
        <PublishModal
          c={c}
          url={publishInfo.url}
          storename={publishInfo.name}
          onClose={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
}
