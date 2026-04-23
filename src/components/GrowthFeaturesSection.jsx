import React, { memo } from "react";
import { BellRing, CalendarClock, SearchCheck, Globe, Sparkles, Share2 } from "lucide-react";
import RadialOrbitalTimeline from "./ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "One-Tap Notifications",
    date: "Available",
    content: "Enable or disable launch alerts and notify your audience in one tap across web and app channels.",
    category: "Notifications",
    icon: BellRing,
    relatedIds: [2, 3],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    title: "AI SEO (Trinity)",
    date: "Available",
    content: "Generate metadata, tags, and structured ranking-ready SEO content directly from your website context.",
    category: "SEO",
    icon: SearchCheck,
    relatedIds: [1, 5],
    status: "completed",
    energy: 90,
  },
  {
    id: 3,
    title: "Social Launch Automation",
    date: "Available",
    content: "Generate social post copy and hashtags, then schedule publishing windows for launch announcements.",
    category: "Social",
    icon: Share2,
    relatedIds: [4, 1],
    status: "completed",
    energy: 85,
  },
  {
    id: 4,
    title: "Buffer Scheduling",
    date: "Available",
    content: "Connect social profiles and schedule Instagram/LinkedIn posts from inside EasyWay without manual steps.",
    category: "Social",
    icon: CalendarClock,
    relatedIds: [3],
    status: "in-progress",
    energy: 70,
  },
  {
    id: 5,
    title: "Custom Domain Mapping",
    date: "Available",
    content: "Attach, verify, and manage custom domains so your generated site can go live on your own brand URL.",
    category: "Domains",
    icon: Globe,
    relatedIds: [2, 6],
    status: "completed",
    energy: 95,
  },
  {
    id: 6,
    title: "Business Context Intake",
    date: "Available",
    content: "Capture map/business profile details once, then reuse that context across website and app generation flows.",
    category: "Context",
    icon: Sparkles,
    relatedIds: [5],
    status: "completed",
    energy: 80,
  },
];

const GrowthFeaturesSection = memo(({ theme, onNavigate }) => (
  <section
    style={{
      padding: "5rem 0rem",
      borderTop: `1px solid ${theme.text}`,
      borderBottom: `1px solid ${theme.text}`,
      background: theme.bg,
      position: "relative",
      zIndex: 2,
    }}
  >
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
      <div className="reveal" style={{ marginBottom: "2.2rem", textAlign: "center" }}>
        <div className="ew-mono-label" style={{ color: theme.text, marginBottom: "0.7rem", zIndex: 10, position: "relative" }}>
          New Feature Stack
        </div>
        <h2 style={{ margin: 0, color: theme.text, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(2.4rem, 4.4vw, 4rem)", letterSpacing: "-0.96px", zIndex: 10, position: "relative" }}>
          Growth Suite for Website Launch
        </h2>
      </div>
    </div>
    
    <div className="relative w-full -mt-10 overflow-hidden" style={{ zIndex: 5 }}>
      <RadialOrbitalTimeline timelineData={timelineData} onCenterClick={() => onNavigate("dashboard")} />
    </div>
  </section>
));

export default GrowthFeaturesSection;
