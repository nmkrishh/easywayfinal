import React, { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import PhoneMockup from "../components/PhoneMockup";

const Hero = memo(({ theme, onNavigate }) => (
  <section style={{
    minHeight: "100vh", display: "flex", alignItems: "center",
    padding: "6rem 2rem 4rem", position: "relative", overflow: "hidden", zIndex: 2,
  }}>
    <div className="hero-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "55% 45%", gap: "3rem", alignItems: "center", width: "100%" }}>

      {/* Left */}
      <div>
        <div className="reveal" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.35rem 0.85rem", borderRadius: 100,
          background: theme.surface, border: `1px solid ${theme.border}`,
          fontSize: "0.8rem", color: theme.muted, marginBottom: "1.5rem",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, animation: "pulse 2s infinite", display: "inline-block" }} />
          Trusted by 100+ growing businesses
        </div>

        <h1 className="reveal" style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800,
          fontSize: "clamp(2rem, 3.8vw, 3.6rem)", lineHeight: 1.1,
          letterSpacing: "-0.03em", marginBottom: "1.5rem", color: theme.text,
          transitionDelay: "80ms",
        }}>
          Turn Your{" "}
          <span style={{
            color: theme.accent,
            fontStyle: "italic",
          }}>
            Idea
          </span>{" "}
          Into a Mobile App in Minutes
        </h1>

        <p className="reveal" style={{ fontSize: "1.1rem", color: theme.muted, lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 480, transitionDelay: "160ms" }}>
          No coding. No complexity. Submit your website URL or describe your vision — we handle everything.
        </p>

        <div className="reveal" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem", transitionDelay: "240ms" }}>
          <button onClick={() => onNavigate("convert")} style={{
            background: theme.accentBtnBg,
            color: theme.accentBtnText, border: "none", cursor: "pointer",
            padding: "0.8rem 2rem", borderRadius: 100,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "1rem",
            transition: "all 0.3s ease",
          }}>
            Start Building →
          </button>
          <button onClick={() => onNavigate("how-it-works")} style={{
            background: "transparent", border: `1px solid ${theme.border}`,
            color: theme.text, cursor: "pointer",
            padding: "0.8rem 2rem", borderRadius: 100,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 500, fontSize: "1rem",
            transition: "all 0.3s ease",
          }}>
            ▶ How It Works
          </button>
        </div>

        <div className="reveal" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", transitionDelay: "320ms" }}>
          {["No Credit Card Required", "5-15 Minute Delivery", "100% Satisfaction"].map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: theme.muted }}>
              <CheckCircle2 size={14} color={theme.accent} strokeWidth={3} /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="phone-col reveal" style={{ transitionDelay: "400ms" }}>
        <PhoneMockup theme={theme} />
      </div>
    </div>
  </section>
));

export default Hero;