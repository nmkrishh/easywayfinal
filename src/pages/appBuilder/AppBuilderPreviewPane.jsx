import React, { memo } from "react";
import DownloadSection from "../../components/DownloadSection";

const AppBuilderPreviewPane = memo(function AppBuilderPreviewPane({ c, htmlPreview, appName, packageName }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${c.border}`, color: c.muted, fontSize: "0.8rem" }}>
        App Preview
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "1.2rem", overflow: "auto" }}>
        <div
          style={{
            width: 320,
            height: 640,
            borderRadius: 28,
            border: `1px solid ${c.border}`,
            boxShadow: c.dark ? "0 25px 60px rgba(0,0,0,0.45)" : "0 25px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {htmlPreview ? (
            <iframe
              title="App Preview"
              srcDoc={htmlPreview}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#6b7280", padding: "1rem", textAlign: "center" }}>
              App preview will appear here after generation.
            </div>
          )}
        </div>
      </div>
      {htmlPreview ? <DownloadSection c={c} appName={appName} packageName={packageName} /> : null}
    </div>
  );
});

export default AppBuilderPreviewPane;
