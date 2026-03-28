import React, { memo } from "react";

/**
 * AgentProgress
 * 8-step progress tracker for the OpenRouter pipeline.
 *
 * Stages:
 *  0 = idle (hidden)
 *  1 = Enhancing Prompt      (Trinity Large)
 *  2 = Planning Structure    (Trinity Large)
 *  3 = Building Website      (MiniMax M2.5)
 *  4 = Building React Native (MiniMax M2.5) — conditional
 *  5 = Building Backend      (Trinity Large)
 *  6 = Payment Integration   (Trinity Large) — conditional
 *  7 = Fixing Errors         (Step 3.5 Flash)
 *  8 = Assembling Final      (Step 3.5 Flash)
 *  9 = Complete
 *
 * agentLog: [{ id, status: "running"|"done"|"failed" }]
 */

const AGENTS = [
  { key: "enhancer",   stage: 1, label: "Enhancing Prompt",      model: "Trinity Large",  conditional: false },
  { key: "structurer", stage: 2, label: "Planning Structure",     model: "Trinity Large",  conditional: false },
  { key: "frontend",   stage: 3, label: "Building Website",       model: "MiniMax M2.5",   conditional: false },
  { key: "nativeApp",  stage: 4, label: "Building React Native",  model: "MiniMax M2.5",   conditional: true  },
  { key: "backend",    stage: 5, label: "Building Backend",       model: "Trinity Large",  conditional: false },
  { key: "payment",    stage: 6, label: "Payment Integration",    model: "Trinity Large",  conditional: true  },
  { key: "fixer",      stage: 7, label: "Fixing Errors",          model: "Step 3.5 Flash", conditional: false },
  { key: "assembler",  stage: 8, label: "Assembling Final",       model: "Step 3.5 Flash", conditional: false },
];

const AgentProgress = memo(({ c, stage, agentLog = [] }) => {
  if (stage === 0) return null;

  const getLogStatus = (key) =>
    agentLog.find(a => a.id === key)?.status ?? "pending";

  return (
    <div
      style={{
        padding: "0.7rem 1.25rem",
        background: c.dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
        borderBottom: `1px solid ${c.border}`,
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.35rem",
          alignItems: "stretch",
          minWidth: 600,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {AGENTS.map((agent) => {
          const logStatus = getLogStatus(agent.key);
          const isDone    = logStatus === "done";
          const isFailed  = logStatus === "failed";
          const isActive  = stage === agent.stage && logStatus === "running";
          const isPending = logStatus === "pending" && stage < agent.stage;

          return (
            <div
              key={agent.key}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.28rem",
                opacity: isPending ? 0.35 : 1,
                transition: "opacity 0.3s",
              }}
            >
              {/* Progress bar track */}
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
                      ? c.dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"
                      : "transparent",
                    width: isDone || isFailed ? "100%" : isActive ? "55%" : "0%",
                    transition: "width 1.4s ease, background 0.3s",
                    animation: isActive ? "ewPulseBar 1.6s ease-in-out infinite" : "none",
                  }}
                />
              </div>

              {/* Status icon + label */}
              <div
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  color: isFailed
                    ? "rgba(239,68,68,0.9)"
                    : isDone
                    ? "rgba(74,222,128,0.9)"
                    : isActive
                    ? c.text
                    : c.muted,
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  transition: "color 0.3s",
                }}
              >
                {/* Status icon */}
                {isDone   && <span style={{ flexShrink: 0, opacity: 0.9 }}>✓</span>}
                {isFailed && <span style={{ flexShrink: 0 }}>✕</span>}
                {isActive && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "currentColor",
                      display: "inline-block",
                      flexShrink: 0,
                      animation: "ewBlink 0.9s ease-in-out infinite",
                    }}
                  />
                )}
                {isPending && (
                  <span style={{ flexShrink: 0, opacity: 0.5, fontSize: "0.55rem" }}>⬜</span>
                )}

                {/* Label */}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {agent.label}
                </span>

                {/* Conditional badge */}
                {agent.conditional && (
                  <span
                    style={{
                      fontSize: "0.48rem",
                      padding: "1px 4px",
                      borderRadius: 4,
                      border: `1px solid ${c.border}`,
                      color: c.muted,
                      flexShrink: 0,
                    }}
                  >
                    if needed
                  </span>
                )}
              </div>

              {/* Active model label */}
              {isActive && (
                <div
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: "0.52rem",
                    color: c.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {agent.model}
                </div>
              )}

              {/* Failed retry note */}
              {isFailed && (
                <div
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: "0.52rem",
                    color: "rgba(239,68,68,0.7)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Failed + retried
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage 9 — all done */}
      {stage === 9 && (
        <p
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "0.65rem",
            color: "rgba(74,222,128,0.9)",
            textAlign: "center",
            margin: "0.5rem 0 0",
            letterSpacing: "0.02em",
          }}
        >
          All agents completed — website ready
        </p>
      )}
    </div>
  );
});

AgentProgress.displayName = "AgentProgress";
export default AgentProgress;
