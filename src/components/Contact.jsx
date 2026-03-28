import React, { memo } from "react";

const Contact = memo(({ theme }) => (
  <section id="contact" style={{ padding: "5rem 2rem", borderTop: `1px solid ${theme.border}`, position: "relative", zIndex: 2 }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>

      <div className="reveal">
        <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.accent2, marginBottom: "0.75rem" }}>✦ Contact</div>
        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "2rem", color: theme.text, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Let's Build Something Amazing</h2>
        <p style={{ color: theme.muted, marginBottom: "2rem", lineHeight: 1.7 }}>Ready to transform your business? Reach out directly.</p>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" style={{
          display: "flex", alignItems: "center", gap: "1rem",
          padding: "1rem 1.5rem",
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: 16, textDecoration: "none", transition: "all 0.3s",
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: theme.accentBg, border: `1px solid ${theme.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>💬</div>
          <div>
            <div style={{ fontWeight: 600, color: theme.text }}>WhatsApp</div>
            <div style={{ fontSize: "0.82rem", color: theme.muted }}>Chat with us instantly</div>
          </div>
        </a>
      </div>

      <div className="reveal" style={{ transitionDelay: "100ms", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 24, padding: "2.5rem" }}>
        {[
          { label: "Your Name", type: "text", ph: "Krishna" },
          { label: "Email Address", type: "email", ph: "krishna@example.com" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 500, color: theme.text, marginBottom: "0.5rem" }}>{f.label}</label>
            <input type={f.type} placeholder={f.ph} style={{
              width: "100%", padding: "0.75rem 1rem", borderRadius: 12,
              background: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${theme.border}`, color: theme.text,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.95rem", outline: "none",
            }} />
          </div>
        ))}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 500, color: theme.text, marginBottom: "0.5rem" }}>Message</label>
          <textarea rows={4} placeholder="Tell us about your project..." style={{
            width: "100%", padding: "0.75rem 1rem", borderRadius: 12,
            background: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${theme.border}`, color: theme.text,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.95rem", outline: "none", resize: "vertical",
          }} />
        </div>
        <button style={{
          width: "100%", padding: "0.85rem", borderRadius: 14,
          background: theme.accentBtnBg,
          color: theme.accentBtnText, border: "none", cursor: "pointer",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "1rem",
        }}>
          Send Message
        </button>
      </div>
    </div>
  </section>
));

export default Contact;
