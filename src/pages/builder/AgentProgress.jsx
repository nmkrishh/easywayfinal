import React, { memo } from "react";

const AGENTS = [
  { key: "enhancer",   stage: 1, label: "Enhance",     model: "Trinity",   conditional: false },
  { key: "structurer", stage: 2, label: "Plan",         model: "Trinity",   conditional: false },
  { key: "frontend",   stage: 3, label: "Frontend",     model: "MiniMax",   conditional: false },
  { key: "nativeApp",  stage: 4, label: "Mobile",       model: "MiniMax",   conditional: true  },
  { key: "backend",    stage: 5, label: "Backend",      model: "Trinity",   conditional: false },
  { key: "payment",    stage: 6, label: "Payment",      model: "Trinity",   conditional: true  },
  { key: "fixer",      stage: 7, label: "Fix Errors",   model: "Step 3.5",  conditional: false },
  { key: "assembler",  stage: 8, label: "Assemble",     model: "Step 3.5",  conditional: false },
];

const AgentProgress = memo(({ c, stage, agentLog = [], activeAgentEta = null }) => {
  if (stage === 0) return null;

  const getLogStatus = (key) => agentLog.find((a) => a.id === key)?.status ?? "pending";

  return (
    <div
      style={{
        padding: "0.6rem 1rem",
        background: c.dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
        borderBottom: `1px solid ${c.border}`,
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.3rem",
          alignItems: "stretch",
          minWidth: 560,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {AGENTS.map((agent) => {
          const logStatus = getLogStatus(agent.key);
          const isDone = logStatus === "done";
          const isFailed = logStatus === "failed";
          const isActive = stage === agent.stage && logStatus === "running";
          const isPending = logStatus === "pending" && stage < agent.stage;
          const etaStr =
            isActive && activeAgentEta?.agentKey === agent.key
              ? `~${activeAgentEta.remaining}s`
              : null;

          return (
            <div
              key={agent.key}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.22rem",
                opacity: isPending ? 0.3 : 1,
                transition: "opacity 0.3s",
              }}
            >
              <div
                style={{
                  height: 2,
                  borderRadius: 100,
                  background: c.border,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 100,
                    background: isFailed
                      ? "rgba(239,68,68,0.8)"
                      : isDone
                      ? "rgba(74,222,128,0.9)"
                      : isActive
                      ? c.dark
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(0,0,0,0.7)"
                      : "transparent",
                    width: isDone || isFailed ? "100%" : isActive ? "60%" : "0%",
                    transition: "width 1.2s ease, background 0.3s",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 600,
                  color: isFailed
                    ? "rgba(239,68,68,0.9)"
                    : isDone
                    ? "rgba(74,222,128,0.9)"
                    : isActive
                    ? c.text
                    : c.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.18rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  transition: "color 0.3s",
                }}
              >
                {isDone && <span style={{ flexShrink: 0 }}>✓</span>}
                {isFailed && <span style={{ flexShrink: 0 }}>✕</span>}
                {isActive && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "currentColor",
                      display: "inline-block",
                      flexShrink: 0,
                      animation: "ewBlink 0.9s ease-in-out infinite",
                    }}
                  />
                )}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{agent.label}</span>
                {agent.conditional && (
                  <span
                    style={{
                      fontSize: "0.46rem",
                      padding: "1px 3px",
                      borderRadius: 3,
                      border: `1px solid ${c.border}`,
                      color: c.muted,
                      flexShrink: 0,
                    }}
                  >
                    opt
                  </span>
                )}
              </div>

              {isActive && (
                <div
                  style={{
                    fontSize: "0.5rem",
                    color: etaStr ? "#facc15" : c.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    gap: "0.25rem",
                  }}
                >
                  <span>{agent.model}</span>
                  {etaStr && <span style={{ fontFamily: "monospace" }}>· {etaStr}</span>}
                </div>
              )}

              {isFailed && (
                <div style={{ fontSize: "0.48rem", color: "rgba(239,68,68,0.7)", whiteSpace: "nowrap" }}>
                  retried
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stage === 9 && (
        <p
          style={{
            fontSize: "0.6rem",
            color: "rgba(74,222,128,0.9)",
            textAlign: "center",
            margin: "0.4rem 0 0",
            letterSpacing: "0.02em",
          }}
        >
          All agents completed — project ready
        </p>
      )}
    </div>
  );
});

AgentProgress.displayName = "AgentProgress";
export default AgentProgress;
