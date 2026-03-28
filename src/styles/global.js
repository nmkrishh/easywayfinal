export const globalStyles = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html, body { width: 100%; overflow-x: hidden; scroll-behavior: smooth; }
  body { cursor: none; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  #root { width: 100%; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${theme.bg}; }
  ::-webkit-scrollbar-thumb { background: ${theme.accent}; border-radius: 2px; }

  .reveal {
    opacity: 0;
    transform: translateY(28px);
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
    .steps-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
    .steps-grid::before { display: none !important; }
    .contact-grid { grid-template-columns: 1fr !important; }
    .services-grid { grid-template-columns: 1fr !important; }
  }
`;