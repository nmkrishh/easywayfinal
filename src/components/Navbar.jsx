import React, { useState, useEffect, memo } from "react";
import { Sun, Moon } from "lucide-react";

const Navbar = memo(({ theme, darkMode, setDarkMode, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navStyle = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
    padding: scrolled ? "0.75rem 2rem" : "1.25rem 2rem",
    transition: "all 0.4s ease",
    background: scrolled ? (theme.dark ? "rgba(8,8,8,0.88)" : "rgba(250,250,250,0.88)") : "transparent",
    backdropFilter: scrolled ? "blur(20px)" : "none",
    borderBottom: scrolled ? `1px solid ${theme.border}` : "none",
  };

  const innerStyle = {
    maxWidth: 1200, margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    width: "100%",
  };

  const logoStyle = {
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "1.5rem",
    color: theme.text,
    letterSpacing: "-0.02em", cursor: "pointer",
  };

  const linkStyle = {
    color: theme.muted, fontSize: "0.9rem", fontWeight: 500,
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", transition: "color 0.2s",
    padding: 0,
  };

  const links = [
    { label: "Services", action: () => onNavigate("services") },
    { label: "How It Works", action: () => onNavigate("how-it-works") },
    { label: "Contact", action: () => onNavigate("contact") },
  ];

  /* Toggle slider styles */
  const trackStyle = {
    width: 52, height: 32, borderRadius: 100, cursor: "pointer",
    background: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    border: `1px solid ${theme.border}`,
    position: "relative", transition: "all 0.3s ease",
    display: "flex", alignItems: "center",
    padding: "0 4px",
    flexShrink: 0,
  };

  const knobStyle = {
    width: 20, height: 20, borderRadius: "50%",
    background: theme.accentBtnBg,
    position: "absolute", top: "50%",
    transform: `translateY(-50%) translateX(${darkMode ? "0px" : "22px"})`,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.65rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
      <div style={logoStyle} onClick={() => onNavigate("home")}>EasyWay</div>

      {/* Desktop */}
      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
        {links.map(l => (
          <button key={l.label} style={linkStyle} onClick={l.action}
            onMouseEnter={e => e.target.style.color = theme.text}
            onMouseLeave={e => e.target.style.color = theme.muted}>
            {l.label}
          </button>
        ))}

        {/* Toggle slider */}
        <div style={trackStyle} onClick={() => setDarkMode(!darkMode)} role="switch" aria-checked={darkMode} aria-label="Toggle dark mode">
          <span style={{ position: "absolute", left: 8, display: "flex", opacity: darkMode ? 0.3 : 0.8, transition: "opacity 0.3s" }}>
            <Sun size={12} color={theme.text} />
          </span>
          <span style={{ position: "absolute", right: 8, display: "flex", opacity: darkMode ? 0.8 : 0.3, transition: "opacity 0.3s" }}>
            <Moon size={12} color={theme.text} />
          </span>
          <div style={knobStyle} />
        </div>

        {/* Puter auth */}
        <PuterAuthButton theme={theme} />

        <button onClick={() => onNavigate("services")} style={{
          background: theme.accentBtnBg,
          color: theme.accentBtnText, border: "none", cursor: "pointer",
          padding: "0.6rem 1.4rem", borderRadius: 100,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 500, fontSize: "0.9rem",
          transition: "all 0.3s ease",
        }}>
          Get Started
        </button>
      </div>
      </div>
    </nav>
  );
});

/**
 * PuterAuthButton — standalone component for Puter sign-in/out.
 * window.puter must be available (Puter.js loaded via <script> in index.html).
 */
function PuterAuthButton({ theme }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const p = window.puter;
        if (!p) { setLoading(false); return; }
        const ok = await p.auth.isSignedIn();
        if (ok) {
          const u = await p.auth.getUser();
          if (!cancelled) setUser(u);
        }
      } catch (_) { /* puter.js not ready yet */ }
      finally { if (!cancelled) setLoading(false); }
    };
    const t = setTimeout(check, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const signIn = async () => {
    try {
      await window.puter?.auth.signIn();
      const u = await window.puter?.auth.getUser();
      setUser(u);
    } catch (e) { console.error("Puter sign-in:", e); }
  };

  const signOut = async () => {
    try {
      await window.puter?.auth.signOut();
      setUser(null);
    } catch (e) { console.error("Puter sign-out:", e); }
  };

  if (loading) return null;

  const btnBase = {
    border: `1px solid ${theme.border}`,
    borderRadius: 100,
    padding: "0.48rem 1rem",
    cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "0.82rem",
    fontWeight: 500,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    whiteSpace: "nowrap",
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "0.8rem",
          color: theme.muted,
          maxWidth: 110,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user.username}
        </span>
        <button
          onClick={signOut}
          style={{ ...btnBase, background: "none", color: theme.muted }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"; e.currentTarget.style.color = theme.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = theme.muted; }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      style={{ ...btnBase, background: "none", color: theme.text }}
      onMouseEnter={e => { e.currentTarget.style.background = theme.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      Sign in with Puter
    </button>
  );
}

export default Navbar;