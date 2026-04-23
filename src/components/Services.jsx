import React, { memo } from "react";
import { Smartphone, Sparkles, Globe } from "lucide-react";

const SERVICES = [
  {
    n: "01",
    icon: <Smartphone size={24} strokeWidth={2} />,
    title: "URL to App",
    desc: "Convert any existing website into a native mobile app. Cross-origin handling, custom navigation, and brand consistency.",
    tags: ["WebView", "Android", "iOS"],
    route: "convert",
  },
  {
    n: "02",
    icon: <Sparkles size={24} strokeWidth={2} />,
    title: "Growth Suite",
    desc: "Plan content, automate social posting, and optimize launch campaigns from one operational dashboard.",
    tags: ["SEO", "Buffer", "Automation"],
    route: "dashboard",
  },
  {
    n: "03",
    icon: <Globe size={24} strokeWidth={2} />,
    title: "AI Website Builder",
    desc: "From prompt to live website in minutes. Full design, deployment, and custom domain - all automated.",
    tags: ["React", "Deployed", "Custom Domain"],
    route: "ai-website-builder",
  },
];

const Services = memo(({ theme, onNavigate }) => (
  <section
    id="services"
    style={{
      padding: "5rem 2rem",
      background: theme.bg,
      borderTop: `1px solid ${theme.text}`,
      borderBottom: `1px solid ${theme.text}`,
      position: "relative",
      zIndex: 2,
    }}
  >
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div className="ew-mono-label" style={{ color: theme.text, marginBottom: "0.75rem" }}>
          Our Services
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(2.4rem, 4.4vw, 4rem)",
            letterSpacing: "-0.96px",
            color: theme.text,
          }}
        >
          Three Powerful Solutions
        </h2>
      </div>

      <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem" }}>
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
        border: `1px solid ${theme.text}`,
        borderRadius: 8,
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        transitionDelay: `${i * 100}ms`,
        boxShadow: hovered ? "0 8px 18px rgba(0,0,0,0.08)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate(s.route)}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.7rem",
          fontWeight: 700,
          color: "rgba(0,0,0,0.16)",
          position: "absolute",
          top: "1.2rem",
          right: "1.5rem",
          lineHeight: 1,
        }}
      >
        {s.n}
      </div>

      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: theme.accentBg,
          border: `1px solid ${theme.text}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
          color: theme.text,
        }}
      >
        {s.icon}
      </div>

      <div style={{ fontFamily: "var(--font-display)", fontWeight: 540, fontSize: "1.5rem", color: theme.text, marginBottom: "0.65rem", letterSpacing: "-0.26px" }}>
        {s.title}
      </div>

      <div style={{ fontSize: "1rem", color: theme.muted, lineHeight: 1.45, marginBottom: "1.25rem", fontWeight: 330, letterSpacing: "-0.14px" }}>{s.desc}</div>

      <div>
        {s.tags.map((t) => (
          <span
            key={t}
            style={{
              display: "inline-block",
              padding: "0.24rem 0.66rem",
              borderRadius: 50,
              background: "transparent",
              color: theme.text,
              border: `1px solid ${theme.text}`,
              fontSize: "0.72rem",
              fontWeight: 400,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.54px",
              textTransform: "uppercase",
              marginRight: "0.4rem",
              marginBottom: "0.4rem",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        style={{
          marginTop: "1rem",
          color: theme.text,
          fontSize: "0.84rem",
          fontWeight: 400,
          display: "flex",
          alignItems: "center",
          gap: hovered ? "0.56rem" : "0.3rem",
          transition: "gap 0.2s",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.54px",
          textTransform: "uppercase",
        }}
      >
        Get Started -&gt;
      </div>
    </div>
  );
});

export default Services;
