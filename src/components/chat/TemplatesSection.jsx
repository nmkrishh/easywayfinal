import React, { memo } from "react";

/* App builder templates â€” text labels only, no emojis */
const APP_TEMPLATES = [
  { id: "ecommerce",  label: "Shop",      title: "E-Commerce App",    prompt: "Build me a modern e-commerce app with product listings, cart, Razorpay checkout, and order tracking." },
  { id: "restaurant", label: "Menu",      title: "Restaurant App",    prompt: "Create a restaurant app with menu browsing, table reservations, food ordering, and delivery tracking." },
  { id: "portfolio",  label: "Work",      title: "Portfolio App",     prompt: "Design a personal portfolio app with project showcase, skills section, blog, and a contact form." },
  { id: "fitness",    label: "Fit",       title: "Fitness Tracker",   prompt: "Build a fitness app with workout plans, exercise logs, progress charts, and daily reminders." },
  { id: "social",     label: "Social",    title: "Social Network",    prompt: "Create a social media app with profiles, feed, posts, likes, comments, and real-time messaging." },
  { id: "education",  label: "Learn",     title: "E-Learning App",    prompt: "Build an e-learning app with course catalog, video lessons, quizzes, progress tracking, and certificates." },
  { id: "booking",    label: "Book",      title: "Booking App",       prompt: "Build a professional booking/appointment scheduling app with calendar, reminders, and payment integration." },
  { id: "delivery",   label: "Deliver",   title: "Delivery App",      prompt: "Create a real-time delivery tracking app with order placement, driver assignment, and live map tracking." },
];

/* Web builder templates */
const WEB_TEMPLATES = [
  { id: "landing",   label: "Launch",  title: "Landing Page",    prompt: "Design a high-converting landing page with hero section, features grid, testimonials, and a clear CTA." },
  { id: "saas",      label: "SaaS",    title: "SaaS Dashboard",  prompt: "Create a modern SaaS dashboard with sidebar navigation, analytics charts, data tables, and user settings." },
  { id: "blog",      label: "Blog",    title: "Personal Blog",   prompt: "Build an SEO-optimised personal blog with article grid, author profile, newsletter signup, and dark mode." },
  { id: "agency",    label: "Agency",  title: "Agency Site",     prompt: "Design a creative agency website with past work portfolio, team section, services list, and contact form." },
  { id: "store",     label: "Store",   title: "Web Store",       prompt: "Create an online boutique store with product catalog, integrated cart, and secure checkout page." },
  { id: "event",     label: "Event",   title: "Event Page",      prompt: "Build an event registration page with schedule timeline, speaker profiles, venue map, and ticket sales." },
  { id: "linktree",  label: "Links",   title: "Link in Bio",     prompt: "Design a mobile-first 'link in bio' page with social icons, featured video, and custom animated buttons." },
  { id: "waitlist",  label: "Wait",    title: "Viral Waitlist",  prompt: "Create a viral waitlist page with email capture, referral tracking dashboard, and gamified milestones." },
];

/* Each card manages its own hover via DOM refs â€” zero parent re-renders */
const TemplateCard = memo(({ t, c, onPick }) => {
  const ref = React.useRef(null);

  const onEnter = () => {
    if (!ref.current) return;
    ref.current.style.background   = c.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
    ref.current.style.borderColor  = c.accentBorder;
    ref.current.style.transform    = "translateY(-2px)";
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.background   = "transparent";
    ref.current.style.borderColor  = c.border;
    ref.current.style.transform    = "none";
  };

  return (
    <div
      ref={ref}
      onClick={() => onPick(t)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        background: "transparent",
        border: `1px solid ${c.border}`,
        borderRadius: 12, padding: "0.9rem 1rem",
        cursor: "pointer",
        transition: "transform 0.15s, border-color 0.15s, background 0.15s",
      }}
    >
      {/* Label pill instead of emoji */}
      <div style={{
        display: "inline-block",
        padding: "0.15rem 0.55rem",
        borderRadius: 6,
        background: c.accentBg,
        border: `1px solid ${c.accentBorder}`,
        fontSize: "0.65rem", fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        color: c.accent, marginBottom: "0.55rem",
        fontFamily: "var(--font-body)",
      }}>
        {t.label}
      </div>

      <div style={{
        fontFamily: "var(--font-body)",
        fontWeight: 700, fontSize: "0.88rem", color: c.text, marginBottom: "0.2rem",
      }}>
        {t.title}
      </div>
      <div style={{
        fontSize: "0.72rem", color: c.muted,
        fontFamily: "var(--font-body)",
      }}>
        Use template
      </div>
    </div>
  );
});

/* Generic section â€” accepts a templates array via prop */
const TemplatesSection = memo(({ c, onPick, variant }) => {
  const templates = variant === "web" ? WEB_TEMPLATES : APP_TEMPLATES;
  const sectionLabel = variant === "web" ? "Web Templates" : "App Templates";

  return (
    <div style={{ padding: "2rem 0 6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem" }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700, fontSize: "0.82rem",
          color: c.text, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          {sectionLabel}
        </span>
        <span style={{ flex: 1, height: 1, background: c.border }} />
        <span style={{
          fontSize: "0.72rem", color: c.muted,
          fontFamily: "var(--font-body)",
        }}>
          Click to use
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
        gap: "0.65rem",
      }}>
        {templates.map((t) => (
          <TemplateCard key={t.id} t={t} c={c} onPick={onPick} />
        ))}
      </div>
    </div>
  );
});

TemplatesSection.displayName = "TemplatesSection";
export { APP_TEMPLATES, WEB_TEMPLATES };
export default TemplatesSection;

