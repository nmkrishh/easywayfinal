import React, { useState, memo } from "react";
import { N8N_WEBHOOK_URL } from "../constants/theme";
import { Paperclip, CheckCircle2, Rocket } from "lucide-react";

const inputStyle = (theme) => ({
  width: "100%", padding: "0.75rem 1rem", borderRadius: 12,
  background: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
  border: `1px solid ${theme.border}`, color: theme.text,
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.95rem", outline: "none",
});

const ConvertPage = memo(({ theme, onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ appName: "", websiteUrl: "", name: "", email: "", phone: "" });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }
    setSelectedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("submitted_at", new Date().toISOString());
      if (selectedFile) fd.append("icon", selectedFile, selectedFile.name);
      await fetch(N8N_WEBHOOK_URL, { method: "POST", body: fd });
      onSuccess();
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (field, label, type = "text", ph = "") => (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 500, color: theme.text, marginBottom: "0.5rem" }}>{label}</label>
      <input
        type={type} placeholder={ph}
        value={form[field]}
        onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
        style={inputStyle(theme)}
        readOnly={step === 2 && (field === "appName" || field === "websiteUrl")}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "7rem 2rem 4rem", zIndex: 2, position: "relative" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.9rem" }}>
          ← Back
        </button>

        <h1 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "2.5rem", fontWeight: 800, color: theme.text, marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>Convert Your Website</h1>
        <p style={{ color: theme.muted, marginBottom: "2.5rem" }}>Fill in the details below and we'll start building your app.</p>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          {[1, 2].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: step >= s ? theme.accent : theme.border, boxShadow: step >= s ? `0 0 8px ${theme.accentGlow}` : "none", transition: "all 0.3s" }} />
              {i === 0 && <div style={{ width: 40, height: 1, background: step >= 2 ? theme.accent : theme.border, transition: "background 0.3s" }} />}
            </React.Fragment>
          ))}
          <span style={{ marginLeft: "0.75rem", fontSize: "0.82rem", color: theme.muted }}>Step {step} of 2</span>
        </div>

        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 24, padding: "2.5rem" }}>
          {step === 1 ? (
            <>
              {inp("appName", "App Name *", "text", "My Awesome App")}
              {inp("websiteUrl", "Website URL *", "url", "https://yourwebsite.com")}

              {/* Upload */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 500, color: theme.text, marginBottom: "0.5rem" }}>App Icon (Optional)</label>
                {!previewUrl ? (
                  <label htmlFor="icon-upload" style={{ display: "block", border: `2px dashed ${theme.border}`, borderRadius: 14, padding: "2rem", textAlign: "center", cursor: "pointer", color: theme.muted, transition: "all 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}><Paperclip size={32} strokeWidth={1.5} /></div>
                    <div style={{ fontWeight: 500, marginBottom: "0.25rem", marginTop: "0.5rem" }}>Drop your icon here</div>
                    <div style={{ fontSize: "0.8rem" }}>PNG, JPG up to 2MB</div>
                    <input id="icon-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
                    <img src={previewUrl} alt="preview" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                    <div style={{ flex: 1, fontWeight: 500, color: theme.text, fontSize: "0.9rem" }}>{selectedFile?.name}</div>
                    <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: theme.muted }}>✕</button>
                  </div>
                )}
              </div>

              <button onClick={() => { if (!form.appName || !form.websiteUrl) { alert("Fill required fields"); return; } setStep(2); }} style={{
                width: "100%", padding: "0.85rem", borderRadius: 14,
                background: theme.accentBtnBg,
                color: theme.accentBtnText, border: "none", cursor: "pointer",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "1rem",
              }}>
                Continue →
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: theme.accentBg, border: `1px solid ${theme.accentBorder}`, borderRadius: 12, marginBottom: "1.5rem", fontSize: "0.88rem", color: theme.muted }}>
                <CheckCircle2 size={16} color="#10b981" /> App details saved. Now add your contact info.
              </div>
              {inp("name", "Your Name *", "text", "Krishna")}
              {inp("email", "Email Address *", "email", "krishna@example.com")}
              {inp("phone", "Phone Number *", "tel", "+91 9999999999")}
              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: "0.85rem", borderRadius: 14,
                  background: "transparent", border: `1px solid ${theme.border}`,
                  color: theme.text, cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "1rem",
                }}>
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={submitting} style={{
                  flex: 2, padding: "0.85rem", borderRadius: 14,
                  background: theme.accentBtnBg,
                  color: theme.accentBtnText, border: "none", cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "1rem",
                  opacity: submitting ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                }}>
                  {submitting ? "Submitting..." : (
                    <>Submit Request <Rocket size={16} strokeWidth={2.5} /></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConvertPage;
