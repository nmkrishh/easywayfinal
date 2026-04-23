export const globalStyles = (theme) => `
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html, body { width: 100%; overflow-x: hidden; scroll-behavior: smooth; }
  :root {
    --font-display: "figmaSans", "figmaSans Fallback", "SF Pro Display", system-ui, helvetica, sans-serif;
    --font-section: "figmaSans", "figmaSans Fallback", "SF Pro Display", system-ui, helvetica, sans-serif;
    --font-body: "figmaSans", "figmaSans Fallback", "SF Pro Display", system-ui, helvetica, sans-serif;
    --font-mono: "figmaMono", "figmaMono Fallback", "SF Mono", menlo, monospace;
    --hero-gradient: linear-gradient(135deg, #7cfb35 0%, #f6ff56 28%, #7a39ff 64%, #ff2ea6 100%);

    --ew-void: ${theme.bg};
    --ew-text: ${theme.text};
    --ew-muted: ${theme.muted};
    --ew-frost: ${theme.border};
    --ew-frost-alt: ${theme.accentBorder};
    --ew-accent-blue: ${theme.accent};
    --ew-accent-orange: ${theme.accent2};
  }

  @media (hover: hover) and (pointer: fine) {
    html, body, body * { cursor: none !important; }
  }

  body {
    font-family: var(--font-body);
    font-weight: 330;
    line-height: 1.45;
    letter-spacing: -0.14px;
    font-feature-settings: "kern" 1;
    color-scheme: ${theme.dark ? "dark" : "light"};
    background: ${theme.bg};
    color: ${theme.text};
  }
  #root { width: 100%; min-height: 100vh; overflow-x: hidden; }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
    font-feature-settings: "kern" 1;
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.96px;
  }

  .ew-hero-display {
    font-family: var(--font-display);
    font-size: clamp(3rem, 8vw, 5.38rem);
    font-weight: 400;
    line-height: 1;
    letter-spacing: -1.72px;
    font-feature-settings: "kern" 1;
  }

  .ew-mono-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  button, input, textarea, select {
    font-family: var(--font-body);
    font-feature-settings: "kern" 1;
    letter-spacing: -0.14px;
  }

  button, a, [role="button"], input, textarea, select {
    outline-offset: 2px;
  }

  button:focus-visible,
  a:focus-visible,
  [role="button"]:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px dashed ${theme.text};
  }

  code, pre {
    font-family: var(--font-mono);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${theme.bg}; }
  ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 999px; }

  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
  @keyframes shine { to { background-position: 200% center; } }
  @keyframes phoneFloat { 0%,100%{transform:translateY(0) rotateY(-4deg)} 50%{transform:translateY(-14px) rotateY(4deg)} }
  @keyframes badgeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes screenReveal { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }

  @media (max-width: 900px) {
    .hero-grid { grid-template-columns: 1fr !important; }
    .phone-col { display: none !important; }
    .contact-grid { grid-template-columns: 1fr !important; }
    .steps-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
    .steps-grid::before { display: none !important; }
    .services-grid { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 760px) {
    .ew-stack-3 { grid-template-columns: 1fr !important; }
    .ew-stack-2 { grid-template-columns: 1fr !important; }
  }
`;
