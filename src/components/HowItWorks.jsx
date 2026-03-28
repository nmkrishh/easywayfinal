import React, { memo } from "react";

const STEPS = [
  { n: "01", title: "Submit", desc: "Enter your website URL or describe your app idea. Upload brand assets optionally." },
  { n: "02", title: "We Build", desc: "Our AI agents generate, compile, and test your app automatically." },
  { n: "03", title: "Download", desc: "Receive your APK in ~6 hours, ready to publish on Play Store." },
];

const HowItWorks = memo(({ theme }) => (
  <section id="how-it-works" style={{ padding: "5rem 2rem", position: "relative", zIndex: 2 }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="reveal" style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.accent2, marginBottom: "0.75rem" }}>✦ Process</div>
        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 3.5vw, 3rem)", letterSpacing: "-0.03em", color: theme.text, marginBottom: "0.75rem" }}>How It Works</h2>
        <p style={{ color: theme.muted, fontSize: "1.05rem" }}>Three simple steps to your mobile app</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, position: "relative" }}>
        {/* Connector line */}
        <div style={{ position: "absolute", top: "2rem", left: "16%", right: "16%", height: 1, background: `linear-gradient(90deg, transparent, ${theme.accentBorder}, transparent)` }} />
        {STEPS.map((s, i) => (
          <div key={s.n} className="reveal" style={{ textAlign: "center", padding: "0 1.5rem", transitionDelay: `${i * 150}ms` }}>
            <div style={{
              width: "4rem", height: "4rem", borderRadius: 16, margin: "0 auto 1.25rem",
              background: theme.accentBtnBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "1.2rem", color: theme.accentBtnText,
              boxShadow: `0 8px 24px ${theme.accentGlow}`, position: "relative", zIndex: 1,
            }}>{s.n}</div>
            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, color: theme.text, marginBottom: "0.5rem", fontSize: "1.1rem" }}>{s.title}</div>
            <div style={{ fontSize: "0.88rem", color: theme.muted, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
));

export default HowItWorks;
