import React, { memo } from "react";

const STEPS = [
  { n: "01", title: "Submit", desc: "Enter your website URL or describe your app idea. Upload brand assets optionally." },
  { n: "02", title: "We Build", desc: "Our AI agents generate, compile, and test your app automatically." },
  { n: "03", title: "Download", desc: "Receive your APK in ~6 hours, ready to publish on Play Store." },
];

const HowItWorks = memo(({ theme }) => (
  <section id="how-it-works" style={{ padding: "5rem 2rem", position: "relative", zIndex: 2, background: theme.bg, borderTop: `1px solid ${theme.text}` }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <div className="ew-mono-label" style={{ color: theme.text, marginBottom: "0.75rem" }}>
          Process
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(2.4rem, 4.4vw, 4rem)", letterSpacing: "-0.96px", color: theme.text, marginBottom: "0.75rem" }}>
          How It Works
        </h2>
        <p style={{ color: theme.muted, fontSize: "1rem", letterSpacing: "-0.14px", fontWeight: 330 }}>Three simple steps to your mobile app</p>
      </div>

      <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "2rem", left: "16%", right: "16%", height: 1, background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)` }} />

        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="reveal"
            style={{
              textAlign: "center",
              padding: "1rem",
              borderRadius: 8,
              background: theme.surface,
              border: `1px solid ${theme.text}`,
              transitionDelay: `${i * 140}ms`,
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                margin: "0 auto 1rem",
                background: theme.accentBg,
                border: `1px solid ${theme.text}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 480,
                fontSize: "1.2rem",
                color: theme.text,
                position: "relative",
                zIndex: 1,
              }}
            >
              {s.n}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 540, color: theme.text, marginBottom: "0.5rem", fontSize: "1.06rem", letterSpacing: "-0.26px" }}>{s.title}</div>
            <div style={{ fontSize: "0.95rem", color: theme.muted, lineHeight: 1.45, fontWeight: 330, letterSpacing: "-0.14px" }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
));

export default HowItWorks;
