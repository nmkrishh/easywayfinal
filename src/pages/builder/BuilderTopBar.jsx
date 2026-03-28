import React, { memo, useState, useEffect } from "react";

/**
 * BuilderTopBar
 * Sticky top bar for the split-screen builder page.
 * Shows: back button | logo + badge | puter auth | publish button | live URL
 */
const BuilderTopBar = memo(({ c, onBack, onPublish, publishing, liveUrl, hasContent, htmlContent = "", projectFiles = {} }) => {

  const downloadCode = async () => {
    const fileKeys = Object.keys(projectFiles);
    if (!fileKeys.length) return;
    try {
      const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
      const zip = new JSZip();
      
      // Add all project files (frontend + backend) to the zip
      for (const [path, content] of Object.entries(projectFiles)) {
        zip.file(path, content);
      }
      
      // Also include the preview HTML as index.html at root just in case
      if (htmlContent) {
        zip.file("preview.html", htmlContent);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "easyway-mern-project.zip";
      a.click();
    } catch (err) {
      alert("Failed to create ZIP: " + err.message);
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.25rem",
        height: 52,
        background: c.glassBar,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${c.border}`,
        flexShrink: 0,
        gap: "1rem",
      }}
    >
      {/* Left: back + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: c.muted,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "4px 0",
            flexShrink: 0,
          }}
        >
          ← Back
        </button>

        <span style={{ width: 1, height: 18, background: c.border, display: "inline-block", flexShrink: 0 }} />

        {/* Badge */}
        <div
          style={{
            padding: "0.18rem 0.55rem",
            borderRadius: 7,
            background: c.accentBg,
            border: `1px solid ${c.accentBorder}`,
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: c.accent,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            flexShrink: 0,
          }}
        >
          AI Website Builder
        </div>

        <span
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 700,
            fontSize: "0.9rem",
            color: c.text,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          EasyWay
        </span>
      </div>

      {/* Right: puter auth + live URL + publish button */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

        {/* Puter auth */}
        <BuilderPuterAuth c={c} />

        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.75rem",
              color: "#4ade80",
              textDecoration: "none",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
            title={liveUrl}
          >
            ✓ {liveUrl}
          </a>
        )}

        {/* Download button */}
        {Object.keys(projectFiles).length > 0 && (
          <button
            onClick={downloadCode}
            title="Download MERN project as ZIP"
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              borderRadius: 100,
              padding: "0.35rem 0.8rem",
              cursor: "pointer",
              color: c.muted,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 500,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.borderColor = c.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = c.muted; e.currentTarget.style.borderColor = c.border; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download ZIP
          </button>
        )}

        <button
          onClick={onPublish}
          disabled={publishing}
          style={{
            background: publishing ? c.border : c.accentBtnBg,
            color: publishing ? c.muted : c.accentBtnText,
            border: "none",
            borderRadius: 100,
            padding: "0.45rem 1.1rem",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: publishing ? "default" : "pointer",
            letterSpacing: "0.01em",
            transition: "background 0.2s, color 0.2s",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          {publishing ? (
            <>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: `2px solid ${c.muted}`,
                  borderTopColor: "transparent",
                  display: "inline-block",
                  animation: "ewSpin 0.7s linear infinite",
                }}
              />
              Publishing…
            </>
          ) : (
            "Publish →"
          )}
        </button>
      </div>
    </div>
  );
});

/** Puter auth button styled for the dark builder bar. */
function BuilderPuterAuth({ c }) {
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
      } catch (_) { /* puter.js not ready */ }
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

  const btnStyle = {
    background: "none",
    border: `1px solid ${c.border}`,
    borderRadius: 100,
    padding: "0.35rem 0.85rem",
    cursor: "pointer",
    color: c.muted,
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "0.78rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
        <span style={{
          fontSize: "0.75rem",
          color: c.muted,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          maxWidth: 90,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user.username}
        </span>
        <button
          onClick={signOut}
          style={btnStyle}
          onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.borderColor = c.accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = c.muted; e.currentTarget.style.borderColor = c.border; }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      style={{ ...btnStyle, color: c.text }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text; }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      Sign in with Puter
    </button>
  );
}

BuilderTopBar.displayName = "BuilderTopBar";
export default BuilderTopBar;

