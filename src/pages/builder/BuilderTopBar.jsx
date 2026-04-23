import React, { memo } from "react";
import { getAuthToken } from "../../lib/auth";

/**
 * BuilderTopBar
 * Sticky top bar for the split-screen builder page.
 * Shows: back button | logo + badge | publish button | live URL
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const BuilderTopBar = memo(({ c, onBack, onPublish, publishing, liveUrl, htmlContent = "", projectFiles = {}, projectId = null }) => {


  const storeZipOnServer = async () => {
    const token = getAuthToken();
    if (!projectId || !token) return;

    const res = await fetch(`${API_BASE}/api/projects/${projectId}/store-zip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectFiles, htmlContent }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to store ZIP on server");
    }
  };

  const downloadCode = async () => {
    const fileKeys = Object.keys(projectFiles);
    if (!fileKeys.length) return;
    try {
      // Store a server copy first, then continue local browser download.
      await storeZipOnServer().catch(() => {});

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
        background: "transparent",
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
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "4px 0",
            flexShrink: 0,
          }}
        >
          â† Back
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
            fontFamily: "var(--font-body)",
            flexShrink: 0,
          }}
        >
          AI Website Builder
        </div>

        <span
          style={{
            fontFamily: "var(--font-body)",
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

      {/* Right: live URL + publish button */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "var(--font-body)",
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
            âœ“ {liveUrl}
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
              fontFamily: "var(--font-body)",
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
            fontFamily: "var(--font-body)",
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
              Publishingâ€¦
            </>
          ) : (
            "Publish â†’"
          )}
        </button>
      </div>
    </div>
  );
});

BuilderTopBar.displayName = "BuilderTopBar";
export default BuilderTopBar;


