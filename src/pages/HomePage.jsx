import React, { memo } from "react";
import Hero from "../components/Hero";
import Services from "../components/Services";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import GrowthFeaturesSection from "../components/GrowthFeaturesSection";
import PricingSection from "../components/PricingSection";
import { useReveal } from "../hooks/useReveal";

const HomePage = memo(({ theme, onNavigate }) => {
  useReveal("home");

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", zIndex: 10 }}><Hero theme={theme} onNavigate={onNavigate} /></div>
      <div style={{ position: "relative", zIndex: 10 }}><Services theme={theme} onNavigate={onNavigate} /></div>
      <div style={{ position: "relative", zIndex: 10 }}><HowItWorks theme={theme} /></div>
      <div style={{ position: "relative", zIndex: 10 }}><GrowthFeaturesSection theme={theme} onNavigate={onNavigate} /></div>
      <div style={{ position: "relative", zIndex: 10 }}><PricingSection theme={theme} onNavigate={onNavigate} /></div>
      <div style={{ position: "relative", zIndex: 2 }}><CTA theme={theme} onNavigate={onNavigate} /></div>
      <div style={{ position: "relative", zIndex: 10 }}><Contact theme={theme} /></div>
      <div style={{ position: "relative", zIndex: 10 }}><Footer theme={theme} /></div>
    </div>
  );
});

export default HomePage;
