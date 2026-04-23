import React from "react";

export default function ProjectsTab({ theme, kind, projects, loading, onOpenEditor, onDeleteProject, onSendNotification }) {
  if (loading) {
    return <p style={{ color: theme.muted }}>Loading {kind}...</p>;
  }

  if (!projects.length) {
    return (
      <div
        style={{
          padding: "2rem",
          border: `1px dashed ${theme.border}`,
          borderRadius: 12,
          color: theme.muted,
          textAlign: "center",
        }}
      >
        No {kind} yet. Generate and publish from builder pages to see them here.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
      {projects.map((project) => {
        const canEdit = Number(project.has_editable_html) === 1;
        return (
          <div
            key={project.id}
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              background: theme.surface,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* iframe preview container - tap to edit */}
            <div 
               style={{ height: 200, width: "100%", position: "relative", cursor: canEdit ? "pointer" : "default", background: theme.bg }}
               onClick={() => { if (canEdit) onOpenEditor(project); }}
            >
               <div style={{ position: "absolute", inset: 0, zIndex: 10 }} title={canEdit ? "Tap to edit" : ""} />
               {project.published_url || project.html_content ? (
                 <iframe 
                   src={project.published_url || undefined} 
                   srcDoc={!project.published_url ? project.html_content : undefined}
                   sandbox="allow-scripts allow-same-origin"
                   style={{ width: "400%", height: "400%", transform: "scale(0.25)", transformOrigin: "0 0", border: "none", pointerEvents: "none" }} 
                   title={project.name}
                 />
               ) : (
                 <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", borderBottom: `1px solid ${theme.border}`, color: theme.muted }}>
                   No Preview Available
                 </div>
               )}
               {canEdit && (
                 <div style={{
                   position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 20,
                   background: "rgba(0,0,0,0.6)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: "bold"
                 }}>
                   Tap to Edit
                 </div>
               )}
            </div>
            
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{project.name}</div>
                <div style={{ color: theme.muted, fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  Updated: {new Date(project.updated_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "auto" }}>
                {project.published_url && (
                  <a
                    href={project.published_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: "0.42rem 0.7rem",
                      textDecoration: "none",
                      color: theme.text,
                      fontSize: "0.8rem",
                    }}
                  >
                    Open
                  </a>
                )}
                {!canEdit && (
                  <span
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: "0.45rem 0.65rem",
                      color: theme.muted,
                      fontSize: "0.78rem",
                    }}
                  >
                    No editable HTML
                  </span>
                )}
                <button
                  disabled={!canEdit}
                  onClick={() => onOpenEditor(project)}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "0.45rem 0.78rem",
                    background: canEdit ? theme.accentBtnBg : theme.border,
                    color: canEdit ? theme.accentBtnText : theme.muted,
                    cursor: canEdit ? "pointer" : "default",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  Edit Content
                </button>
                {onSendNotification && (
                  <button
                    onClick={() => onSendNotification(project)}
                    style={{
                      border: "none",
                      borderRadius: 8,
                      padding: "0.45rem 0.78rem",
                      background: theme.accent,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Send Notification
                  </button>
                )}
                {onDeleteProject && (
                  <button
                    onClick={() => onDeleteProject(project)}
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: "0.45rem 0.78rem",
                      background: "transparent",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginLeft: "auto"
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

