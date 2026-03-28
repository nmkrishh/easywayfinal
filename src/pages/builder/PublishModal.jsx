import React, { memo, useState } from "react";

/**
 * PublishModal — success overlay shown after a website is successfully published.
 * Includes AI Feedback loop (RAG) to learn from user generation ratings.
 */

const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const IconExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const StarIcon = ({ filled, onClick, c }) => (
  <svg
    onClick={onClick}
    width="18" height="18" viewBox="0 0 24 24"
    fill={filled ? (c.dark ? "#fff" : "#000") : "none"}
    stroke={c.dark ? "#fff" : "#000"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ cursor: "pointer", transition: "all 0.15s" }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarRating = ({ label, rating, onChange, c }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", margin: "0.2rem 0" }}>
    <span style={{ fontSize: "0.8rem", color: c.muted }}>{label}</span>
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rating} onClick={() => onChange(star)} c={c} />
      ))}
    </div>
  </div>
);

const PublishModal = memo(({ c, url, storename, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [frontendStars, setFrontendStars] = useState(0);
  const [backendStars, setBackendStars] = useState(0);
  const [fullStars, setFullStars] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      const el = document.getElementById("ew-pub-url-input");
      if (el) { el.select(); document.execCommand("copy"); }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitFeedback = () => {
    if (frontendStars === 0 && backendStars === 0 && fullStars === 0 && !comment) return;
    
    const newFeedback = {
      timestamp: new Date().toISOString(),
      storename,
      url,
      ratings: { frontend: frontendStars, backend: backendStars, overall: fullStars },
      comment
    };

    try {
      const existing = JSON.parse(localStorage.getItem("ew_ai_feedback") || "[]");
      existing.push(newFeedback);
      localStorage.setItem("ew_ai_feedback", JSON.stringify(existing));
    } catch (e) {
      console.warn("Could not save feedback", e);
    }
    setFeedbackSubmitted(true);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: c.dark ? "rgba(12,12,12,0.98)" : "rgba(250,250,250,0.98)",
          border: `1px solid ${c.border}`, borderRadius: 20,
          padding: "2.5rem 2rem", maxWidth: 420, width: "100%",
          boxShadow: "0 32px 64px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
          maxHeight: "90vh", overflowY: "auto"
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: c.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.text,
        }}>
          <IconCheck />
        </div>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "1.35rem", color: c.text, letterSpacing: "-0.03em", margin: "0 0 0.4rem" }}>
            Your site is live
          </h2>
          <p style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.85rem", color: c.muted, margin: 0, lineHeight: 1.6 }}>
            Published at <strong style={{ color: c.text }}>{storename}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
          <input
            id="ew-pub-url-input" readOnly value={url}
            style={{
              flex: 1, background: c.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`, borderRadius: 10, padding: "0.6rem 0.85rem",
              fontFamily: "monospace", fontSize: "0.78rem", color: c.text, outline: "none", minWidth: 0,
            }}
          />
          <button
            onClick={copyUrl}
            style={{
              background: copied ? (c.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") : (c.dark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.88)"),
              color: copied ? c.text : (c.dark ? "#0a0a0a" : "#f5f5f5"),
              border: "none", borderRadius: 10, padding: "0.6rem 1rem", cursor: "pointer",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "0.8rem",
              flexShrink: 0, display: "flex", alignItems: "center", gap: "0.35rem", transition: "all 0.2s",
            }}
          >
            <IconCopy /> {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div style={{ width: "100%", height: 1, background: c.border, margin: "0.5rem 0" }} />

        {/* AI Learning Feedback Section */}
        {!feedbackSubmitted ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <h3 style={{ fontSize: "0.95rem", color: c.text, margin: 0, fontWeight: 600 }}>Help the AI Learn</h3>
            <p style={{ fontSize: "0.75rem", color: c.muted, margin: 0 }}>Rate your generated project to improve future builds.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.5rem 0" }}>
              <StarRating label="Frontend Quality" rating={frontendStars} onChange={setFrontendStars} c={c} />
              <StarRating label="Backend Quality" rating={backendStars} onChange={setBackendStars} c={c} />
              <StarRating label="Overall Working" rating={fullStars} onChange={setFullStars} c={c} />
            </div>

            <textarea
              placeholder="What should the AI do better next time?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{
                width: "100%", minHeight: "60px", padding: "0.75rem",
                background: c.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${c.border}`, borderRadius: 8,
                color: c.text, fontSize: "0.8rem", fontFamily: "inherit",
                resize: "vertical", outline: "none"
              }}
            />

            <button
              onClick={submitFeedback}
              disabled={frontendStars === 0 && backendStars === 0 && fullStars === 0 && !comment}
              style={{
                width: "100%", padding: "0.7rem", borderRadius: 8,
                background: (frontendStars > 0 || comment) ? (c.dark ? "#fff" : "#000") : "transparent",
                color: (frontendStars > 0 || comment) ? (c.dark ? "#000" : "#fff") : c.muted,
                border: `1px solid ${(frontendStars > 0 || comment) ? "transparent" : c.border}`,
                cursor: (frontendStars > 0 || comment) ? "pointer" : "default",
                fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s"
              }}
            >
              Submit Feedback
            </button>
          </div>
        ) : (
          <div style={{ padding: "1.5rem 0", color: c.muted, fontSize: "0.85rem", textAlign: "center" }}>
            Thank you! Your feedback has been saved and will train the AI on future builds.
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: "none", border: `1px solid ${c.border}`, borderRadius: 100,
            padding: "0.5rem 1.5rem", cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "0.82rem", color: c.muted, marginTop: "0.2rem",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
});

PublishModal.displayName = "PublishModal";
export default PublishModal;
