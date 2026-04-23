import React, { memo } from "react";
import { LogOut } from "lucide-react";

const DashboardSidebar = memo(function DashboardSidebar({
  theme,
  navItems,
  activeTab,
  onTabChange,
  email,
  onSignOut,
  bufferConnectedCount = 0,
}) {
  return (
    <aside
      style={{
        width: "260px",
        background: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "1.5rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.04em" }}>EasyWay</h2>
      </div>

      <nav style={{ flex: 1, padding: "1rem" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
                borderRadius: "8px",
                background: active ? theme.accentBg : "transparent",
                color: active ? theme.accent : theme.muted,
                border: active ? `1px solid ${theme.accentBorder}` : "1px solid transparent",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "1.5rem", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: theme.muted, wordBreak: "break-all" }}>
          {email}
        </div>
        <div style={{ marginBottom: "0.8rem", fontSize: "0.78rem", color: theme.muted }}>
          Buffer: {bufferConnectedCount} account{bufferConnectedCount === 1 ? "" : "s"} connected
        </div>
        <button
          onClick={onSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.5rem",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            color: theme.text,
            fontSize: "0.9rem",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
});

export default DashboardSidebar;
