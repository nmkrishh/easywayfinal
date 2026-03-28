import React, { memo } from "react";
import { Smartphone, Cpu, Globe } from "lucide-react";

const SERVICES = [
  { n: "01", icon: <Smartphone size={24} strokeWidth={2} />, title: "URL to App", desc: "Convert any existing website into a native mobile app. Cross-origin handling, custom navigation, and brand consistency.", tags: ["WebView", "Android", "iOS"], route: "convert" },
  { n: "02", icon: <Cpu size={24} strokeWidth={2} />, title: "AI App Builder", desc: "Describe your app in plain English. AI generates complete native code, integrates payments, and delivers a ready APK.", tags: ["React Native", "Expo", "Razorpay"], route: "ai-builder" },
  { n: "03", icon: <Globe size={24} strokeWidth={2} />, title: "AI Website Builder", desc: "From prompt to live website in minutes. Full design, deployment, and custom domain — all automated.", tags: ["React", "Deployed", "Custom Domain"], route: "ai-website-builder" },
];

const Services = memo(({ theme, onNavigate }) => (
  <section id="services" style={{
    padding: "5rem 2rem",
    background: theme.dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
    borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`,
    position: "relative", zIndex: 2,
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.accent2, marginBottom: "0.75rem" }}>✦ Our Services</div>
        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 3.5vw, 3rem)", letterSpacing: "-0.03em", color: theme.text }}>Three Powerful Solutions</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.n} s={s} i={i} theme={theme} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  </section>
));

const ServiceCard = memo(({ s, i, theme, onNavigate }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      className="reveal"
      style={{
        background: hovered ? theme.accentBg : theme.surface,
        border: `1px solid ${hovered ? theme.accentBorder : theme.border}`,
        borderRadius: 24, padding: "2.5rem", position: "relative", overflow: "hidden",
        cursor: "pointer", transition: "all 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        transitionDelay: `${i * 100}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate(s.route)}
    >
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "3rem", fontWeight: 800, color: theme.border, position: "absolute", top: "1.5rem", right: "2rem", lineHeight: 1 }}>{s.n}</div>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: theme.accentBg, border: `1px solid ${theme.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem", color: theme.text }}>{s.icon}</div>
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: theme.text, marginBottom: "0.75rem", marginTop: "1rem" }}>{s.title}</div>
      <div style={{ fontSize: "0.95rem", color: theme.muted, lineHeight: 1.65, marginBottom: "1.5rem" }}>{s.desc}</div>
      <div>{s.tags.map(t => <span key={t} style={{ display: "inline-block", padding: "0.25rem 0.7rem", borderRadius: 100, background: theme.accentBg, color: theme.accent2, fontSize: "0.75rem", fontWeight: 500, marginRight: "0.4rem", marginBottom: "0.4rem" }}>{t}</span>)}</div>
      <div style={{ marginTop: "1.2rem", color: theme.accent, fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: hovered ? "0.6rem" : "0.3rem", transition: "gap 0.2s" }}>Get Started →</div>
    </div>
  );
});

export default Services;
