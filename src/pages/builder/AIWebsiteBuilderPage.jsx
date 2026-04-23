import React, { useState, useCallback } from "react";
import BuilderTopBar   from "./BuilderTopBar";
import AgentProgress   from "./AgentProgress";
import ChatPanel       from "./ChatPanel";
import PreviewPanel    from "./PreviewPanel";
import PublishModal    from "./PublishModal";
import { useBuilderChat } from "./useBuilderChat";
import SchedulePostModal from "../../components/SchedulePostModal";
import { getBufferStatus } from "../../lib/buffer";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

/**
 * AIWebsiteBuilderPage
 * =====================
 * Full-screen split-layout builder:
 *    [ChatPanel] | [PreviewPanel]
 *
 * Props:
 *   theme   â€” EasyWay global theme object (passed from App.jsx via context)
 *   onBack  â€” callback to navigate back (App.jsx's own navigate function)
 */

function buildColors(theme) {
  const isDark = theme?.dark ?? true;
  return {
    dark:         isDark,
    bg:           theme?.bg           || "#0b0b0c",
    text:         theme?.text         || "#f2f2f2",
    muted:        theme?.muted        || "#9a9a9f",
    border:       theme?.border       || "rgba(255,255,255,0.12)",
    glassBar:     isDark ? "rgba(12,12,13,0.9)" : "rgba(255,255,255,0.9)",
    accent:       theme?.accent       || "#d5d5d9",
    accentBg:     theme?.accentBg     || "rgba(255,255,255,0.07)",
    accentBorder: theme?.accentBorder || "rgba(255,255,255,0.26)",
    accentBtnBg:  theme?.accentBtnBg  || "rgb(255 0 64 / 44%)",
    accentBtnText:theme?.accentBtnText|| "#ffffff",
  };
}

const SITE_TYPE_OPTIONS = [
  { value: "business", label: "Business Website" },
  { value: "ecommerce", label: "Ecommerce Website" },
  { value: "saas", label: "SaaS Platform" },
];

const ARCHITECTURE_OPTIONS = [
  { value: "single-page", label: "Single Page" },
  { value: "multi-page", label: "Multi Page" },
];

const COMPLEXITY_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "advanced", label: "Advanced" },
  { value: "enterprise", label: "Enterprise" },
];

const BACKEND_MODE_OPTIONS = [
  { value: "frontend-only", label: "Frontend Only" },
  { value: "fullstack", label: "Frontend + Backend" },
];

function specControlStyle(c) {
  return {
    width: "100%",
    minHeight: 40,
    borderRadius: 12,
    border: `1px solid ${c.border}`,
    background: c.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    color: c.text,
    padding: "0.52rem 0.72rem",
    fontSize: "0.9rem",
    fontFamily: "var(--font-body)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.45rem",
    cursor: "pointer",
    textAlign: "left",
  };
}

function specMenuStyle(c) {
  return {
    minWidth: 230,
    borderRadius: 12,
    border: `1px solid ${c.border}`,
    background: c.dark ? "rgba(18,18,20,0.97)" : "rgba(255,255,255,0.98)",
    backdropFilter: "blur(10px)",
    boxShadow: c.dark ? "0 16px 42px rgba(0,0,0,0.45)" : "0 14px 36px rgba(0,0,0,0.12)",
    padding: "0.32rem",
  };
}

function specOptionStyle(c, selected) {
  return {
    borderRadius: 9,
    padding: "0.5rem 0.58rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    color: selected ? c.text : c.muted,
    background: selected
      ? c.dark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)"
      : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    lineHeight: 1.2,
  };
}

function BuildSpecDropdown({ c, value, options, onValueChange }) {
  const activeOption = options.find((option) => option.value === value) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" style={specControlStyle(c)}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeOption?.label}
          </span>
          <ChevronDown size={16} style={{ opacity: 0.72, flexShrink: 0 }} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} style={specMenuStyle(c)}>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                style={specOptionStyle(c, selected)}
              >
                <span>{option.label}</span>
                <span style={{ fontSize: "0.7rem", opacity: selected ? 0.88 : 0.2 }}>
                  {selected ? "●" : "○"}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// â”€â”€ Inject global keyframe animations once â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Publish name dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          fontFamily: "var(--font-body)",
          fontWeight: 800, fontSize: "1.2rem", color: c.text,
          margin: "0 0 0.4rem", letterSpacing: "-0.02em",
        }}>
          Name your website
        </h3>
        <p style={{
          fontFamily: "var(--font-body)",
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
            fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
              fontWeight: 600, fontSize: "0.83rem",
            }}
          >
            Publish â†’
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AIWebsiteBuilderPage({ theme, onBack }) {
  const c = buildColors(theme);

  const {
    messages, htmlContent, projectFiles, stage, agentLog, generating, error,
    publishInfo, publishing,
    projectId,
    phase, intakeQuestions, codeEvents, send, submitIntakeAnswers, publish,
  } = useBuilderChat();

  const [showNameDialog,   setShowNameDialog]   = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [bufferStatus, setBufferStatus] = useState({ connected: false, profiles: [] });
  const [buildSpec, setBuildSpec] = useState({
    siteType: "business",
    complexity: "standard",
    architecture: "single-page",
    backendMode: "fullstack",
    includePayments: false,
    stack: "react-tailwind-express-mongodb",
  });

  const refreshBufferStatus = useCallback(async () => {
    try {
      const status = await getBufferStatus();
      setBufferStatus(status || { connected: false, profiles: [] });
    } catch {
      setBufferStatus({ connected: false, profiles: [] });
    }
  }, []);

  React.useEffect(() => {
    refreshBufferStatus();
  }, [refreshBufferStatus]);

  const suggestedCaption = React.useMemo(() => {
    const userMessages = messages.filter((m) => m.role === "user");
    const latest = userMessages[userMessages.length - 1]?.content || "Our new website is live with EasyWay.";
    const compact = String(latest).replace(/\s+/g, " ").slice(0, 180);
    const url = publishInfo?.url ? `\n\nLive now: ${publishInfo.url}` : "";
    return `${compact}${url}\n\n#easyway #website #launch`;
  }, [messages, publishInfo?.url]);

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

  const handleSendWithSpec = useCallback((text, imageData) => {
    send(text, imageData, buildSpec);
  }, [send, buildSpec]);

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
        paddingTop: "68px",
        boxSizing: "border-box",
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
        projectId={projectId}
      />

      {/* Agent progress strip */}
      <AgentProgress c={c} stage={stage} agentLog={agentLog} />

      <div style={{ padding: "0.55rem 0.9rem", borderBottom: `1px solid ${c.border}`, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "0.45rem", background: c.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        <BuildSpecDropdown
          c={c}
          value={buildSpec.siteType}
          options={SITE_TYPE_OPTIONS}
          onValueChange={(siteType) => setBuildSpec((s) => ({ ...s, siteType }))}
        />
        <BuildSpecDropdown
          c={c}
          value={buildSpec.architecture}
          options={ARCHITECTURE_OPTIONS}
          onValueChange={(architecture) => setBuildSpec((s) => ({ ...s, architecture }))}
        />
        <BuildSpecDropdown
          c={c}
          value={buildSpec.complexity}
          options={COMPLEXITY_OPTIONS}
          onValueChange={(complexity) => setBuildSpec((s) => ({ ...s, complexity }))}
        />
        <BuildSpecDropdown
          c={c}
          value={buildSpec.backendMode}
          options={BACKEND_MODE_OPTIONS}
          onValueChange={(backendMode) => setBuildSpec((s) => ({ ...s, backendMode }))}
        />
        <label style={{ ...specControlStyle(c), justifyContent: "flex-start", gap: "0.55rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={buildSpec.includePayments || buildSpec.siteType === "ecommerce"}
            onChange={(e) => setBuildSpec((s) => ({ ...s, includePayments: e.target.checked }))}
            style={{ accentColor: c.dark ? "#e9e9ed" : "#151515", width: 14, height: 14 }}
          />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Payment Integration
          </span>
        </label>
      </div>

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
          onSend={handleSendWithSpec}
          phase={phase}
          intakeQuestions={intakeQuestions}
          onSubmitIntake={submitIntakeAnswers}
          codeEvents={codeEvents || []}
        />
        <PreviewPanel
          c={c}
          htmlContent={htmlContent}
          projectFiles={projectFiles}
          generating={generating}
          onSchedulePost={() => setShowScheduleModal(true)}
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

      <SchedulePostModal
        theme={theme}
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        bufferStatus={bufferStatus}
        onRefreshBufferStatus={refreshBufferStatus}
        defaultCaption={suggestedCaption}
        defaultImageUrl=""
      />
    </div>
  );
}

