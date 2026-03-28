import React, { useState, useRef, memo } from "react";

/**
 * PreviewPanel — right panel of the split-screen builder.
 * Now supports Tabs: "Preview" (iframe) and "Files" (code viewer).
 */
const DEVICES = [
  { key: "desktop", label: "Desktop", width: "100%" },
  { key: "tablet",  label: "Tablet",  width: 768 },
  { key: "mobile",  label: "Mobile",  width: 375 },
];

const IconRefresh = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconExternal = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconFile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

const PreviewPanel = memo(({ c, htmlContent, projectFiles = {}, generating }) => {
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "files"
  const [device, setDevice]       = useState("desktop");
  const [key, setKey]             = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const iframeRef                 = useRef(null);

  const currentDevice = DEVICES.find(d => d.key === device);
  const iframeWidth   = currentDevice.width;
  const fileKeys      = Object.keys(projectFiles).sort();

  // Highlight first file if switching to Files tab and none selected
  React.useEffect(() => {
    if (activeTab === "files" && !selectedFile && fileKeys.length > 0) {
      setSelectedFile(fileKeys[0]);
    }
  }, [activeTab, selectedFile, fileKeys]);

  const refresh = () => {
    if (iframeRef.current) iframeRef.current.srcdoc = htmlContent || "";
    setKey(k => k + 1);
  };

  const hasFiles = fileKeys.length > 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: c.dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
        borderLeft: `1px solid ${c.border}`,
      }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.55rem 1rem",
          borderBottom: `1px solid ${c.border}`,
          background: c.glassBar,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        {/* Main Tabs */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            onClick={() => setActiveTab("preview")}
            style={{
              background: activeTab === "preview" ? (c.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") : "none",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
              color: activeTab === "preview" ? c.text : c.muted,
              fontSize: "0.8rem",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 600,
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("files")}
            disabled={!hasFiles}
            title={!hasFiles ? "Files will appear here when building completes" : "View generated MERN code"}
            style={{
              background: activeTab === "files" ? (c.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") : "none",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: hasFiles ? "pointer" : "default",
              color: activeTab === "files" ? c.text : (hasFiles ? c.muted : c.border),
              fontSize: "0.8rem",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 600,
            }}
          >
            Code ({fileKeys.length})
          </button>
        </div>

        <span style={{ flex: 1 }} />

        {/* Device switcher (only in Preview mode) */}
        {activeTab === "preview" && (
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              background: c.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              borderRadius: 8,
              padding: "2px",
            }}
          >
            {DEVICES.map(d => (
              <button
                key={d.key}
                onClick={() => setDevice(d.key)}
                title={d.label}
                style={{
                  background: device === d.key
                    ? (c.dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)")
                    : "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 10px",
                  cursor: "pointer",
                  color: device === d.key ? c.text : c.muted,
                  fontSize: "0.7rem",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: 600,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Refresh (only in Preview mode) */}
        {activeTab === "preview" && (
          <button
            onClick={refresh}
            disabled={!htmlContent}
            title="Refresh preview"
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              borderRadius: 7,
              padding: "4px 10px",
              cursor: htmlContent ? "pointer" : "default",
              color: htmlContent ? c.muted : c.border,
              fontSize: "0.72rem",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <IconRefresh /> Refresh
          </button>
        )}

        {/* Open in New Tab */}
        {activeTab === "preview" && (
          <button
            onClick={() => {
              const blob = new Blob([htmlContent || ""], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            }}
            disabled={!htmlContent}
            title="Open in new tab"
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              borderRadius: 7,
              padding: "4px 10px",
              cursor: htmlContent ? "pointer" : "default",
              color: htmlContent ? c.text : c.border,
              fontSize: "0.72rem",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <IconExternal /> New Tab
          </button>
        )}
      </div>

      {/* ── Viewport ──────────────────────────────────────────────────────── */}
      {activeTab === "preview" ? (
        // Preview iframe
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: device === "desktop" ? 0 : "1rem",
            background: device !== "desktop"
              ? (c.dark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.06)")
              : "transparent",
            transition: "background 0.3s",
          }}
        >
          {!htmlContent ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "1rem",
                minHeight: 300,
              }}
            >
              {generating ? (
                <>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `2px solid ${c.border}`,
                      borderTopColor: c.dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                      animation: "ewSpin 0.8s linear infinite",
                    }}
                  />
                  <p style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.82rem", color: c.muted, margin: 0 }}>
                    Generating your MERN project…
                  </p>
                </>
              ) : (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: 12, border: `1px solid ${c.border}`, background: c.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
                  <p style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "0.82rem", color: c.muted, textAlign: "center", maxWidth: 220, lineHeight: 1.65, margin: 0 }}>
                    Describe your site in the chat panel — your live preview will appear here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={htmlContent}
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              style={{
                width: typeof iframeWidth === "number" ? iframeWidth : "100%",
                height: "100%",
                minHeight: 400,
                border: device !== "desktop" ? `1px solid ${c.border}` : "none",
                borderRadius: device !== "desktop" ? 12 : 0,
                background: "#fff",
                transition: "width 0.3s",
              }}
            />
          )}
        </div>
      ) : (
        // Code Viewer
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* File sidebar */}
          <div style={{ width: 220, borderRight: `1px solid ${c.border}`, overflowY: "auto", padding: "0.5rem" }}>
            {fileKeys.map(filePath => (
              <button
                key={filePath}
                onClick={() => setSelectedFile(filePath)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: selectedFile === filePath ? (c.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "none",
                  border: "none",
                  borderRadius: 6,
                  color: selectedFile === filePath ? c.text : c.muted,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                <IconFile />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{filePath}</span>
              </button>
            ))}
          </div>

          {/* Editor view */}
          <div style={{ flex: 1, overflow: "auto", position: "relative", background: c.dark ? "#0e0e0e" : "#f8f9fa" }}>
            {selectedFile && projectFiles[selectedFile] ? (
              <pre style={{ margin: 0, padding: "1rem", fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem", color: c.text, lineHeight: 1.5 }}>
                {projectFiles[selectedFile]}
              </pre>
            ) : (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: c.muted, fontSize: "0.8rem", fontFamily: "-apple-system" }}>
                Select a file to view code
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

PreviewPanel.displayName = "PreviewPanel";
export default PreviewPanel;
