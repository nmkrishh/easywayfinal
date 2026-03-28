import React, { memo } from "react";
import Hero from "../components/Hero";
import Services from "../components/Services";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { useReveal } from "../hooks/useReveal";

const HomePage = memo(({ theme, onNavigate }) => {
  useReveal("home");

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <Hero theme={theme} onNavigate={onNavigate} />
      <Services theme={theme} onNavigate={onNavigate} />
      <HowItWorks theme={theme} />
      <CTA theme={theme} onNavigate={onNavigate} />
      <Contact theme={theme} />
      <Footer theme={theme} />
    </div>
  );
});

export default HomePage;
