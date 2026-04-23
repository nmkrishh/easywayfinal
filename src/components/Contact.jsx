import React, { memo } from "react";

const Contact = memo(({ theme }) => (
  <section id="contact" style={{ padding: "5rem 2rem", borderTop: `1px solid ${theme.text}`, position: "relative", zIndex: 2, background: theme.bg }}>
    <div className="contact-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>

      <div className="reveal">
        <div className="ew-mono-label" style={{ color: theme.text, marginBottom: "0.75rem" }}>Contact</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(2.4rem, 4.4vw, 4rem)", color: theme.text, marginBottom: "1rem", letterSpacing: "-0.96px", lineHeight: 1.1 }}>Let's Build Something Amazing</h2>
        <p style={{ color: theme.muted, marginBottom: "2rem", lineHeight: 1.45, fontWeight: 330, fontSize: "1rem", letterSpacing: "-0.14px" }}>Ready to transform your business? Reach out directly.</p>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" style={{
          display: "flex", alignItems: "center", gap: "1rem",
          padding: "1rem 1.5rem",
          background: theme.surface, border: `1px solid ${theme.text}`,
          borderRadius: 8, textDecoration: "none", transition: "all 0.3s",
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: theme.accentBg, border: `1px solid ${theme.text}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.84rem", fontWeight: 400, color: theme.text, fontFamily: "var(--font-mono)", letterSpacing: "0.54px" }}>WA</div>
          <div>
            <div style={{ fontWeight: 450, color: theme.text }}>WhatsApp</div>
            <div style={{ fontSize: "0.9rem", color: theme.muted, letterSpacing: "-0.14px" }}>Chat with us instantly</div>
          </div>
        </a>
      </div>

      <div className="reveal" style={{ transitionDelay: "100ms", background: theme.surface, border: `1px solid ${theme.text}`, borderRadius: 8, padding: "2.5rem" }}>
        {[
          { label: "Your Name", type: "text", ph: "Krishna" },
          { label: "Email Address", type: "email", ph: "krishna@example.com" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 500, color: theme.text, marginBottom: "0.5rem" }}>{f.label}</label>
            <input type={f.type} placeholder={f.ph} style={{
              width: "100%", padding: "0.75rem 1rem", borderRadius: 8,
              background: "transparent",
              border: `1px solid ${theme.text}`, color: theme.text,
              fontFamily: "var(--font-body)", fontSize: "1rem", outline: "none", letterSpacing: "-0.14px", fontWeight: 330,
            }} />
          </div>
        ))}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 500, color: theme.text, marginBottom: "0.5rem" }}>Message</label>
          <textarea rows={4} placeholder="Tell us about your project..." style={{
            width: "100%", padding: "0.75rem 1rem", borderRadius: 8,
            background: "transparent",
            border: `1px solid ${theme.text}`, color: theme.text,
            fontFamily: "var(--font-body)", fontSize: "1rem", outline: "none", resize: "vertical", letterSpacing: "-0.14px", fontWeight: 330,
          }} />
        </div>
        <button style={{
          width: "100%", padding: "0.52rem 1rem 0.66rem", borderRadius: 50,
          background: theme.accentBtnBg,
          color: theme.accentBtnText, border: `1px solid ${theme.text}`, cursor: "pointer",
          fontFamily: "var(--font-body)", fontWeight: 400, fontSize: "1rem", letterSpacing: "-0.14px",
        }}>
          Send Message
        </button>
      </div>
    </div>
  </section>
));

export default Contact;
