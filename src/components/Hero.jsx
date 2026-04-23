import React, { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import PhoneMockup from "../components/PhoneMockup";
import HeroWave from "./ui/dynamic-wave-canvas-background";

const Hero = memo(({ theme, onNavigate }) => (
  <section style={{
    minHeight: "92vh",
    display: "flex",
    alignItems: "center",
    padding: "7rem 2rem 4rem",
    position: "relative",
    overflow: "hidden",
    zIndex: 2,
    borderBottom: `1px solid ${theme.text}`,
  }}>
    <HeroWave />
    <div
      className="hero-grid"
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "56% 44%",
        gap: "3rem",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div>
        <div
          className="reveal"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.32rem 0.8rem",
            borderRadius: 50,
            background: "rgba(255, 255, 255, 0.16)",
            border: "1px solid rgba(255, 255, 255, 0.34)",
            fontSize: "0.75rem",
            color: "#ffffff",
            marginBottom: "1.5rem",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#ffffff",
              animation: "pulse 2s infinite",
              display: "inline-block",
            }}
          />
          Trusted by 100+ growing businesses
        </div>

        <h1
          className="reveal"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(3rem, 8vw, 5.38rem)",
            lineHeight: 1,
            letterSpacing: "-1.72px",
            marginBottom: "1.5rem",
            color: "#ffffff",
            transitionDelay: "80ms",
            textWrap: "balance",
          }}
        >
          Turn Your Idea Into a
          <br />
          Mobile App in Minutes
        </h1>

        <p
          className="reveal"
          style={{
            fontSize: "1.25rem",
            color: "rgba(255, 255, 255, 0.92)",
            lineHeight: 1.4,
            fontWeight: 330,
            letterSpacing: "-0.14px",
            marginBottom: "2.5rem",
            maxWidth: 620,
            transitionDelay: "160ms",
          }}
        >
          No coding. No complexity. Submit your website URL or describe your vision - we handle everything.
        </p>

        <div
          className="reveal"
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem", transitionDelay: "240ms" }}
        >
          <button
            onClick={() => onNavigate("services")}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "1px solid #ffffff",
              cursor: "pointer",
              padding: "0.5rem 1.2rem 0.65rem",
              borderRadius: 50,
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: "1rem",
              letterSpacing: "-0.14px",
              transition: "all 0.3s ease",
              boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
            }}
          >
            Start Building -&gt;
          </button>
          <button
            onClick={() => onNavigate("how-it-works")}
            style={{
              background: "rgba(255, 255, 255, 0.16)",
              border: "1px solid rgba(255,255,255,0.34)",
              color: "#ffffff",
              cursor: "pointer",
              padding: "0.5rem 1.2rem 0.65rem",
              borderRadius: 50,
              fontFamily: "var(--font-body)",
              fontWeight: 340,
              fontSize: "1rem",
              letterSpacing: "-0.14px",
              transition: "all 0.3s ease",
            }}
          >
            View How It Works
          </button>
        </div>

        <div className="reveal" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", transitionDelay: "320ms" }}>
          {["No Credit Card Required", "5-15 Minute Delivery", "100% Satisfaction"].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.92)", fontFamily: "var(--font-body)", letterSpacing: "-0.14px" }}>
              <CheckCircle2 size={14} color="#ffffff" strokeWidth={3} /> {t}
            </span>
          ))}
        </div>
      </div>

      <div className="phone-col reveal" style={{ transitionDelay: "400ms", padding: "1rem", borderRadius: 8, background: "transparent", border: "0px solid rgba(255,255,255,0.34)" }}>
        <PhoneMockup theme={theme} />
      </div>
    </div>
  </section>
));

export default Hero;
