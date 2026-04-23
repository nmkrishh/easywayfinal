import React, { memo } from "react";
import { Clock, Globe, Smartphone, Layers, UserRound } from "lucide-react";

function getPlanLabel(user, totalProjects) {
  const fromUser =
    user?.plan ||
    user?.subscriptionPlan ||
    user?.subscription_plan ||
    user?.tier ||
    user?.metadata?.plan ||
    user?.user_metadata?.plan ||
    null;
  if (fromUser) return String(fromUser);
  if (totalProjects >= 5) return "Growth";
  return "Starter";
}

const statCard = (theme, icon, label, value) => (
  <div
    style={{
      padding: "1rem",
      borderRadius: "14px",
      border: `1px solid ${theme.border}`,
      background: theme.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: theme.muted, fontSize: "0.8rem", marginBottom: "0.45rem" }}>
      {icon}
      {label}
    </div>
    <div style={{ fontSize: "1.55rem", fontWeight: 800, color: theme.text, lineHeight: 1 }}>{value}</div>
  </div>
);

const DashboardOverview = memo(function DashboardOverview({
  theme,
  displayName,
  user,
  activities,
  loadingActivities,
  websitesCount = 0,
  appsCount = 0,
  bufferConnectedCount = 0,
}) {
  const totalProjects = websitesCount + appsCount;
  const planLabel = getPlanLabel(user, totalProjects);
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Not available";
  const metadataRows = [
    { label: "Name", value: displayName || "Not available" },
    { label: "Email", value: user?.email || "Not available" },
    { label: "Plan", value: planLabel },
    { label: "Websites Built", value: String(websitesCount) },
    { label: "Apps Built", value: String(appsCount) },
    { label: "Buffer Accounts", value: String(bufferConnectedCount) },
    { label: "Member Since", value: memberSince },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
      <div
        style={{
          padding: "2rem",
          background: theme.surface,
          borderRadius: "16px",
          border: `1px solid ${theme.border}`,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Hello, {displayName}</h3>
        <p style={{ color: theme.muted, marginBottom: 0 }}>Your latest account activity appears in the timeline.</p>

        <div className="ew-stack-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.8rem", marginTop: "1.2rem" }}>
          {statCard(theme, <Layers size={14} />, "Total Projects", totalProjects)}
          {statCard(theme, <Globe size={14} />, "Websites", websitesCount)}
          {statCard(theme, <Smartphone size={14} />, "Apps", appsCount)}
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "14px",
            border: `1px solid ${theme.border}`,
            background: theme.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          }}
        >
          <h4 style={{ margin: "0 0 0.8rem", display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.95rem" }}>
            <UserRound size={16} /> User Metadata
          </h4>
          <div className="ew-stack-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.65rem" }}>
            {metadataRows.map((item) => (
              <div key={item.label} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "0.65rem 0.7rem" }}>
                <div style={{ color: theme.muted, fontSize: "0.74rem", marginBottom: "0.22rem" }}>{item.label}</div>
                <div style={{ color: theme.text, fontSize: "0.86rem", fontWeight: 600, wordBreak: "break-word" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "1.2rem",
          background: theme.surface,
          borderRadius: "16px",
          border: `1px solid ${theme.border}`,
        }}
      >
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={16} /> Recent Activity
        </h3>

        {loadingActivities ? (
          <p style={{ color: theme.muted, marginBottom: 0 }}>Loading activity...</p>
        ) : activities.length === 0 ? (
          <p style={{ color: theme.muted, marginBottom: 0 }}>No activity yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "0.7rem",
                  background: theme.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{activity.action}</div>
                <div style={{ color: theme.muted, fontSize: "0.75rem", marginTop: "0.2rem" }}>
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default DashboardOverview;
