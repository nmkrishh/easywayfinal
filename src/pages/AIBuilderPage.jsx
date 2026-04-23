import React, { useState, useRef, useEffect, useCallback } from "react";
import { saveProject } from "../lib/projects";
import { getBusinessProfile } from "../lib/growth";
import AgentProgress from "./builder/AgentProgress";
import AppBuilderTopBar from "./appBuilder/AppBuilderTopBar";
import AppBuilderChatPane from "./appBuilder/AppBuilderChatPane";
import AppBuilderPreviewPane from "./appBuilder/AppBuilderPreviewPane";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const CHIPS = [
  "Build a food delivery app",
  "Build a social media app",
  "Build a booking app",
  "Build a fintech app",
];

const AGENT_ETA_SECONDS = {
  enhancer: 15,
  structurer: 20,
  frontend: 60,
  nativeApp: 50,
  backend: 40,
  payment: 30,
  fixer: 45,
  assembler: 35,
};

function buildColors(theme) {
  return {
    dark: theme?.dark ?? true,
    bg: theme?.bg || "#0b0b0c",
    text: theme?.text || "#f2f2f2",
    muted: theme?.muted || "#9a9a9f",
    border: theme?.border || "rgba(255,255,255,0.12)",
    surface: theme?.surface || "#17171a",
    accent: theme?.accent || "#d5d5d9",
    accentBg: theme?.accentBg || "rgba(255,255,255,0.07)",
    accentBorder: theme?.accentBorder || "rgba(255,255,255,0.25)",
    accentBtnBg: theme?.accentBtnBg || "rgb(255 0 64 / 44%)",
    accentBtnText: theme?.accentBtnText || "#ffffff",
    glassBar: theme?.dark ? "rgba(12,12,13,0.9)" : "rgba(255,255,255,0.9)",
  };
}

const ts = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function downloadBlob(filename, content) {
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AIBuilderPage({ theme, onBack }) {
  const c = buildColors(theme);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [agentLog, setAgentLog] = useState([]);
  const [error, setError] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [mobileCode, setMobileCode] = useState("");
  const [demoNotes, setDemoNotes] = useState("");
  const [aabNotes, setAabNotes] = useState("");
  const [demoExpiresAt, setDemoExpiresAt] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [appName, setAppName] = useState("EasyWay App");
  const [packageName, setPackageName] = useState("com.easyway.app");
  const [businessProfile, setBusinessProfile] = useState(null);
  const [codeEvents, setCodeEvents] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("minimal-clean");
  const [activeAgentEta, setActiveAgentEta] = useState(null);
  const etaIntervalRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, codeEvents]);

  useEffect(() => {
    getBusinessProfile()
      .then((res) => setBusinessProfile(res?.profile || null))
      .catch(() => setBusinessProfile(null));
  }, []);

  useEffect(() => {
    return () => {
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    };
  }, []);

  const startEta = useCallback((agentKey) => {
    if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    const totalSeconds = AGENT_ETA_SECONDS[agentKey] || 30;
    let remaining = totalSeconds;
    setActiveAgentEta({ agentKey, remaining, total: totalSeconds });
    etaIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(etaIntervalRef.current);
        setActiveAgentEta(null);
      } else {
        setActiveAgentEta({ agentKey, remaining, total: totalSeconds });
      }
    }, 1000);
  }, []);

  const stopEta = useCallback(() => {
    if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    setActiveAgentEta(null);
  }, []);

  const runPipeline = useCallback(
    async (prompt) => {
      setBusy(true);
      setStage(0);
      setAgentLog([]);
      setError("");
      setCodeEvents([]);

      try {
        const res = await fetch(`${API_BASE}/api/builder/pipeline/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "app",
            prompt,
            businessProfile,
            selectedTheme,
            projectId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const { pipelineId } = await res.json();
        if (!pipelineId) throw new Error("Failed to start pipeline");

        // Polling function
        return new Promise((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const stRes = await fetch(`${API_BASE}/api/builder/pipeline/${pipelineId}`);
              if (!stRes.ok) return;
              const st = await stRes.json();

              setStage(st.stage);
              setAgentLog(st.agentLog);
              setCodeEvents(st.codeEvents);
              
              // Find the active agent and update ETA
              const runningAgent = st.agentLog.find(a => a.status === "running");
              if (runningAgent && (!activeAgentEta || activeAgentEta.agentKey !== runningAgent.id)) {
                startEta(runningAgent.id);
              }

              if (st.status === "completed") {
                clearInterval(poll);
                stopEta();
                
                const assembled = st.result;
                setHtmlPreview(assembled.preview);
                setMobileCode(assembled.mobileCode);
                setDemoNotes(assembled.demoNotes);
                setAabNotes(assembled.aabNotes);
                setDemoExpiresAt(Date.now() + 24 * 60 * 60 * 1000);
                if (assembled.plan) {
                  setAppName(assembled.plan.brandName || "EasyWay App");
                  setPackageName(
                    `com.easyway.${String(assembled.plan.brandName || "app")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "")
                      .slice(0, 40) || "app"}`
                  );
                }

                try {
                  const saved = await saveProject({
                    id: projectId || undefined,
                    type: "app",
                    name: (prompt || "Generated App").slice(0, 80),
                    htmlContent: assembled.preview,
                    projectFiles: assembled.projectFiles,
                    mobileCode: assembled.mobileCode,
                    demoApkNotes: assembled.demoNotes,
                    aabNotes: assembled.aabNotes,
                  });
                  if (saved?.id) setProjectId(saved.id);
                } catch (err) {
                  console.error("Save project error:", err);
                }

                const doneCount = Object.keys(assembled.projectFiles || {}).length;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: (Date.now() + 2).toString(),
                    role: "ai",
                    text: `Build complete! Generated ${doneCount} files. Preview updated and download buttons enabled.`,
                    time: ts(),
                  },
                ]);
                setBusy(false);
                setTimeout(() => setStage(0), 2500);
                resolve();
              } else if (st.status === "error") {
                clearInterval(poll);
                stopEta();
                setError(st.error || "App build failed");
                setMessages((prev) => [
                  ...prev,
                  {
                    id: (Date.now() + 3).toString(),
                    role: "ai",
                    text: `Build failed: ${st.error || "Unknown error"}`,
                    time: ts(),
                  },
                ]);
                setBusy(false);
                reject(new Error(st.error || "App build failed"));
              }
            } catch (e) {
              clearInterval(poll);
              stopEta();
              setBusy(false);
              reject(e);
            }
          }, 2000);
        });

      } catch (e) {
        setError(e?.message || "App build failed");
        stopEta();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            role: "ai",
            text: `Build failed: ${e?.message || "Unknown error"}`,
            time: ts(),
          },
        ]);
        setBusy(false);
        setTimeout(() => setStage(0), 2500);
      }
    },
    [activeAgentEta, businessProfile, projectId, selectedTheme, startEta, stopEta]
  );

  const send = useCallback(
    async (override) => {
      const text = (typeof override === "string" ? override : input).trim();
      if (!text || busy) return;
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text, time: ts() }]);
      setInput("");
      await runPipeline(text);
    },
    [busy, input, runPipeline]
  );

  const onDownloadApk = useCallback(() => {
    if (!mobileCode || !demoExpiresAt || Date.now() > demoExpiresAt) return;
    const expires = new Date(demoExpiresAt).toISOString();
    const content = `EasyWay Demo APK Package\nExpires: ${expires}\n\n${demoNotes}\n\n=== Generated Mobile Code ===\n${mobileCode}`;
    downloadBlob(`easyway-demo-${Date.now()}.apk`, content);
  }, [mobileCode, demoNotes, demoExpiresAt]);

  const onDownloadAab = useCallback(() => {
    if (!mobileCode) return;
    const content = `EasyWay Release AAB Package\nValidity: unlimited\n\n${aabNotes}\n\n=== Generated Mobile Code ===\n${mobileCode}`;
    downloadBlob(`easyway-release-${Date.now()}.aab`, content);
  }, [mobileCode, aabNotes]);

  const canDownload = Boolean(mobileCode);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100%",
        background: c.bg,
        color: c.text,
        overflow: "hidden",
        paddingTop: "68px",
        boxSizing: "border-box",
      }}
    >
      <AppBuilderTopBar
        c={c}
        onBack={onBack}
        canDownload={canDownload}
        onDownloadApk={onDownloadApk}
        onDownloadAab={onDownloadAab}
        demoExpiresAt={demoExpiresAt}
        selectedTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
      />

      <AgentProgress c={c} stage={stage} agentLog={agentLog} activeAgentEta={activeAgentEta} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <AppBuilderChatPane
          c={c}
          chips={CHIPS}
          messages={messages}
          busy={busy}
          error={error}
          input={input}
          setInput={setInput}
          onSend={send}
          endRef={endRef}
          codeEvents={codeEvents}
          activeAgentEta={activeAgentEta}
        />

        <AppBuilderPreviewPane c={c} htmlPreview={htmlPreview} appName={appName} packageName={packageName} />
      </div>
    </div>
  );
}
