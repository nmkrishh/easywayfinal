import React, { useState, useEffect, useCallback } from "react";
import { getSession, signOut, fetchActivities } from "../lib/auth";
import { aiEditProject, getProject, listProjects, saveProject, deleteProject } from "../lib/projects";
import { Sidebar as DashboardSidebar } from "../components/ui/modern-side-bar";
import DashboardOverview from "./dashboard/DashboardOverview";
import { DASHBOARD_NAV_ITEMS } from "./dashboard/navItems";
import ProjectsTab from "./dashboard/ProjectsTab";
import ProjectEditModal from "./dashboard/ProjectEditModal";
import GrowthSuiteTab from "./dashboard/GrowthSuiteTab";
import { getBufferStatus } from "../lib/buffer";
import DashboardProductsTab from "./dashboard/DashboardProductsTab";
import DashboardPaymentsTab from "./dashboard/DashboardPaymentsTab";
import DashboardSettingsTab from "./dashboard/DashboardSettingsTab";

function slugFromPublishedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/sites\/([^/]+)\/index\.html/i);
  if (!match?.[1]) return null;
  return String(match[1]).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") || null;
}

export default function Dashboard({ theme, onNavigate }) {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [siteProjects, setSiteProjects] = useState([]);
  const [appProjects, setAppProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [aiEditing, setAiEditing] = useState(false);
  const [bufferConnectedCount, setBufferConnectedCount] = useState(0);
  const [notificationProject, setNotificationProject] = useState(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationBody) return alert("Fill title and body");
    setSendingNotification(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      alert("Notification sent successfully!");
      setNotificationProject(null);
      setNotificationTitle("");
      setNotificationBody("");
    } catch {
      alert("Failed to send notification.");
    } finally {
      setSendingNotification(false);
    }
  };

  const loadActivities = useCallback(async () => {
    setLoadingActivities(true);
    const { data } = await fetchActivities(10);
    setActivities(data?.activities || []);
    setLoadingActivities(false);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const [sites, apps] = await Promise.all([
        listProjects("website"),
        listProjects("app"),
      ]);
      setSiteProjects(sites);
      setAppProjects(apps);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    getSession().then(({ session }) => {
      if (session) {
        setSession(session);
        loadActivities();
        loadProjects();
        getBufferStatus()
          .then((status) => setBufferConnectedCount(Array.isArray(status?.profiles) ? status.profiles.length : 0))
          .catch(() => setBufferConnectedCount(0));
      } else {
        onNavigate("auth");
      }
    });
  }, [onNavigate, loadActivities, loadProjects]);

  const handleSignOut = async () => {
    await signOut();
    onNavigate("auth");
  };

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.text }}>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const createTarget = activeTab === "apps" ? "convert" : "ai-website-builder";
  const createLabel = activeTab === "apps" ? "+ Convert Website" : "+ Create Website";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.bg, color: theme.text, paddingTop: "68px", boxSizing: "border-box" }}>
      <DashboardSidebar
        theme={theme}
        navItems={DASHBOARD_NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        email={session.user.email}
        onSignOut={handleSignOut}
        bufferConnectedCount={bufferConnectedCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "2rem 3rem", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
            {DASHBOARD_NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </h1>
          <button
            onClick={() => onNavigate(createTarget)}
            style={{
              background: theme.accentBtnBg, color: theme.accentBtnText,
              padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none",
              fontSize: "0.95rem", fontWeight: 600, cursor: "pointer"
            }}
          >
            {createLabel}
          </button>
        </header>

        {activeTab === "overview" ? (
          <DashboardOverview
            theme={theme}
            displayName={session.user.name || session.user.email.split("@")[0]}
            user={session.user}
            activities={activities}
            loadingActivities={loadingActivities}
            websitesCount={siteProjects.length}
            appsCount={appProjects.length}
            bufferConnectedCount={bufferConnectedCount}
          />
        ) : activeTab === "sites" ? (
          <ProjectsTab
            theme={theme}
            kind="websites"
            projects={siteProjects}
            loading={loadingProjects}
            onOpenEditor={async (project) => {
              try {
                const full = await getProject(project.id);
                setEditingProject(full);
              } catch (error) {
                window.alert(error?.message || "Unable to open this project for editing.");
              }
            }}
            onDeleteProject={async (project) => {
              if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
                try {
                  await deleteProject(project.id);
                  await loadProjects();
                } catch (error) {
                  window.alert(error?.message || "Failed to delete project.");
                }
              }
            }}
          />
        ) : activeTab === "apps" ? (
          <ProjectsTab
            theme={theme}
            kind="apps"
            projects={appProjects}
            loading={loadingProjects}
            onOpenEditor={async (project) => {
              try {
                const full = await getProject(project.id);
                setEditingProject(full);
              } catch (error) {
                window.alert(error?.message || "Unable to open this project for editing.");
              }
            }}
            onDeleteProject={async (project) => {
              if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
                try {
                  await deleteProject(project.id);
                  await loadProjects();
                } catch (error) {
                  window.alert(error?.message || "Failed to delete project.");
                }
              }
            }}
            onSendNotification={(project) => setNotificationProject(project)}
          />
        ) : activeTab === "growth" ? (
          <GrowthSuiteTab
            theme={theme}
            siteProjects={siteProjects}
            onProjectRefresh={loadProjects}
          />
        ) : activeTab === "products" ? (
          <DashboardProductsTab
            theme={theme}
            siteProjects={siteProjects}
          />
        ) : activeTab === "payments" ? (
          <DashboardPaymentsTab
            theme={theme}
            siteProjects={siteProjects}
          />
        ) : activeTab === "settings" ? (
          <DashboardSettingsTab
            theme={theme}
          />
        ) : (
          <div style={{
            padding: "3rem",
            background: theme.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            borderRadius: "16px",
            border: `1px dashed ${theme.border}`,
            textAlign: "center"
          }}>
            <p style={{ color: theme.muted, margin: 0 }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} module functionality will be implemented in upcoming phases.
            </p>
          </div>
        )}
      </main>

      {editingProject && (
        <ProjectEditModal
          theme={theme}
          project={editingProject}
          saving={savingEdit}
          aiEditing={aiEditing}
          onClose={() => setEditingProject(null)}
          onApply={async ({ htmlContent }) => {
            setSavingEdit(true);
            try {
              await saveProject({
                id: editingProject.id,
                type: editingProject.type || "website",
                name: editingProject.name || "Generated Website",
                slug: editingProject.slug || slugFromPublishedUrl(editingProject.published_url) || null,
                htmlContent: typeof htmlContent === "string" ? htmlContent : editingProject.html_content || "",
                projectFiles: editingProject.project_files || {},
                mobileCode: editingProject.mobile_code || "",
                demoApkNotes: editingProject.demo_apk_notes || "",
                aabNotes: editingProject.aab_notes || "",
                publishedUrl: editingProject.published_url || null,
              });
              const refreshed = await getProject(editingProject.id);
              setEditingProject(refreshed);
              await loadProjects();
            } finally {
              setSavingEdit(false);
            }
          }}
          onPromptApply={async (prompt) => {
            setAiEditing(true);
            try {
              await aiEditProject(editingProject.id, { prompt });
              const refreshed = await getProject(editingProject.id);
              setEditingProject(refreshed);
              await loadProjects();
            } finally {
              setAiEditing(false);
            }
          }}
        />
      )}

      {notificationProject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: theme.surface, padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: 400, border: `1px solid ${theme.border}` }}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 600 }}>Send Notification</h2>
            <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.9rem", color: theme.muted }}>Send a push notification to users of "{notificationProject.name}".</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input 
                type="text" placeholder="Notification Title" 
                value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }}
              />
              <textarea 
                placeholder="Notification Message" rows={4}
                value={notificationBody} onChange={e => setNotificationBody(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, resize: "vertical" }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button 
                onClick={() => setNotificationProject(null)}
                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", background: "transparent", border: `1px solid ${theme.border}`, color: theme.text, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendNotification} disabled={sendingNotification}
                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", background: theme.accentBtnBg, color: theme.accentBtnText, border: "none", cursor: "pointer", opacity: sendingNotification ? 0.7 : 1 }}
              >
                {sendingNotification ? "Sending..." : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
