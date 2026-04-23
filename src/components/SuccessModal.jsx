import React, { memo } from "react";
import { PartyPopper } from "lucide-react";

const SuccessModal = memo(({ theme, onClose }) => (
  <div
    style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}
    onClick={onClose}
  >
    <div
      style={{ background: theme.dark ? "#0f0f0f" : "#fff", border: `1px solid ${theme.border}`, borderRadius: 24, padding: "3rem", maxWidth: 400, textAlign: "center", animation: "modalIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", color: theme.accent }}>
        <PartyPopper size={48} strokeWidth={1.5} />
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "1.6rem", fontWeight: 800, color: theme.text, marginBottom: "0.5rem" }}>Request Submitted!</div>
      <div style={{ color: theme.muted, marginBottom: "2rem", lineHeight: 1.6 }}>We've received your request. Your app will be ready in approximately 5-15 minutes. Check your email for updates.</div>
      <button onClick={onClose} style={{
        width: "100%", padding: "0.85rem", borderRadius: 14,
        background: theme.accentBtnBg,
        color: theme.accentBtnText, border: "none", cursor: "pointer",
        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "1rem",
      }}>
        Back to Home
      </button>
    </div>
  </div>
));

export default SuccessModal;

