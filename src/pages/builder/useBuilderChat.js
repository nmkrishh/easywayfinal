import { useState, useCallback, useRef, useEffect } from "react";
import { runFrontendEdit } from "../../agents/frontend.js";
import { callAI, MODELS } from "../../agents/callAI.js";
import { getAuthToken, logActivity } from "../../lib/auth";
import { saveProject } from "../../lib/projects";
import { getBusinessProfile } from "../../lib/growth";
import darkTechnicalDesign from "../../designs/dark-technical/DESIGN.md?raw";
import minimalCleanDesign from "../../designs/minimal-clean/DESIGN.md?raw";
import boldEnergeticDesign from "../../designs/bold-energetic/DESIGN.md?raw";
import warmEditorialDesign from "../../designs/warm-editorial/DESIGN.md?raw";
import vibrantPlayfulDesign from "../../designs/vibrant-playful/DESIGN.md?raw";
import gradientModernDesign from "../../designs/gradient-modern/DESIGN.md?raw";
import developerDocsDesign from "../../designs/developer-docs/DESIGN.md?raw";


const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const PUBLISH_ENDPOINT = `${API_BASE}/api/builder/publish`;

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Intake via Minimax (OpenRouter)
// ─────────────────────────────────────────────────────────────────────────────

const INTAKE_SYSTEM = `You are an AI Website Architecture Consultant for the EasyWay platform.
A user has shared a website idea. Your job is to generate exactly 4-5 dynamic intake questions tailored to their specific project.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array of question objects. NO markdown formatting, NO conversational text.
2. Formulate questions like Store Name suggestions, Location features, Pricing models, Content categories, or Theme vibes.
2.1 Include at least one question about business location or service area.
2.2 Include one question that helps map data integration (e.g. map listing/profile info usage).
3. Each question must include an array of 3-5 specific, tailored selectable options.

JSON SCHEMA:
{
  "questions": [
    {
      "key": "unique_snake_case_id",
      "question": "Short, direct question (no emoji)",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}

EXAMPLE FOR A PIZZA SHOP:
{
  "questions": [
    { "key": "store_name", "question": "What should we name your pizzeria?", "options": ["Luigi's Slice", "Crust & Co.", "Urban Pizza", "I have my own"] },
    { "key": "menu_focus", "question": "What is the focus of your menu?", "options": ["Wood-fired Neapolitan", "New York Style Slices", "Deep Dish & Wings", "Vegan & Gluten-Free"] }
  ]
}

Output ONLY the raw JSON object. NOTHING ELSE.`;

async function minimaxIntake(userIdea) {
  const responseText = await callAI(
    MODELS.fast, // Use fast model for quick intake questions
    [{ role: "user", content: `Website idea: ${userIdea}` }],
    INTAKE_SYSTEM
  );
  return responseText;
}

function parseIntakeJson(raw) {
  try {
    const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
    const obj = JSON.parse(clean);
    if (obj && Array.isArray(obj.questions)) return obj.questions;
  } catch {
    // ignore malformed JSON and try fallback extraction
  }
  // Try extracting JSON object from text
  const m = raw.match(/\{[\s\S]+\}/);
  if (m) {
    try { 
      const parsed = JSON.parse(m[0]);
      if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    } catch {
      // ignore malformed fallback JSON
    }
  }
  return [];
}

const THEME_QUESTION_KEY = "theme_design";
const THEME_OPTIONS = [
  "Dark & Technical",
  "Minimal & Clean",
  "Bold & Energetic",
  "Warm & Editorial",
  "Vibrant & Playful",
  "Gradient & Modern",
  "Developer / Docs",
];

const THEME_FOLDER_BY_LABEL = {
  "Dark & Technical": "dark-technical",
  "Minimal & Clean": "minimal-clean",
  "Bold & Energetic": "bold-energetic",
  "Warm & Editorial": "warm-editorial",
  "Vibrant & Playful": "vibrant-playful",
  "Gradient & Modern": "gradient-modern",
  "Developer / Docs": "developer-docs",
};

const THEME_MD_BY_FOLDER = {
  "dark-technical": darkTechnicalDesign,
  "minimal-clean": minimalCleanDesign,
  "bold-energetic": boldEnergeticDesign,
  "warm-editorial": warmEditorialDesign,
  "vibrant-playful": vibrantPlayfulDesign,
  "gradient-modern": gradientModernDesign,
  "developer-docs": developerDocsDesign,
};

const THEME_INTAKE_QUESTION = {
  key: THEME_QUESTION_KEY,
  question: "Which type of theme design do you want?",
  options: THEME_OPTIONS,
};

const THEME_SPEC_MAX_CHARS = 12000;



function clampThemeSpec(content) {
  const normalized = String(content || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  if (normalized.length <= THEME_SPEC_MAX_CHARS) return normalized;
  return `${normalized.slice(0, THEME_SPEC_MAX_CHARS)}\n\n...[truncated for prompt budget]`;
}

function resolveSelectedTheme(selectedOption) {
  const label = String(selectedOption || "").trim();
  if (!label) return null;

  const folder = THEME_FOLDER_BY_LABEL[label];
  if (!folder) return null;

  const spec = clampThemeSpec(THEME_MD_BY_FOLDER[folder]);
  return {
    label,
    folder,
    filePath: `src/designs/${folder}/DESIGN.md`,
    spec,
  };
}



// ─────────────────────────────────────────────────────────────────────────────
export function useBuilderChat() {
  const [messages, setMessages] = useState([]);
  const [htmlContent, setHtmlContent] = useState("");
  const [projectFiles, setProjectFiles] = useState({});
  const [stage, setStage] = useState(0);
  const [agentLog, setAgentLog] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [publishInfo, setPublishInfo] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [intakeQuestions, setIntakeQuestions] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [projectId, setProjectId] = useState(null);
  const [codeEvents, setCodeEvents] = useState([]);

  const originalPromptRef = useRef("");
  const brandNameRef = useRef("");
  const logoDataRef = useRef("");
  const businessProfileRef = useRef(null);
  const buildSpecRef = useRef({
    siteType: "business",
    complexity: "standard",
    architecture: "single-page",
    backendMode: "fullstack",
    includePayments: false,
    stack: "react-tailwind-express-mongodb",
  });
  const selectedThemeRef = useRef(null);

  const buildTechIntentBlock = useCallback((spec) => {
    const s = spec || buildSpecRef.current || {};
    return [
      "TECHNICAL BUILD REQUIREMENTS:",
      `Target Stack: ${s.stack || "react-tailwind-express-mongodb"}`,
      `Site Type: ${s.siteType || "business"}`,
      `Complexity: ${s.complexity || "standard"}`,
      `Architecture: ${s.architecture || "single-page"}`,
      `Backend Mode: ${s.backendMode || "fullstack"}`,
      `Payments Required: ${s.includePayments ? "yes" : "no"}`,
      "Must generate developer-replaceable code with frontend + backend + data models where needed.",
    ].join("\n");
  }, []);

  useEffect(() => {
    getBusinessProfile()
      .then((res) => { businessProfileRef.current = res?.profile || null; })
      .catch(() => { businessProfileRef.current = null; });

    const pid = localStorage.getItem("ew_builder_pipeline_id");
    if (pid) {
      setPhase("building");
      const poll = setInterval(async () => {
        try {
          const stRes = await fetch(`${API_BASE}/api/builder/pipeline/${pid}`);
          if (!stRes.ok) {
            if (stRes.status === 404) {
              clearInterval(poll);
              localStorage.removeItem("ew_builder_pipeline_id");
              setPhase("idle");
            }
            return;
          }
          const st = await stRes.json();
          setStage(st.stage);
          setAgentLog(st.agentLog);
          setCodeEvents(st.codeEvents);

          if (st.status === "completed") {
            clearInterval(poll);
            localStorage.removeItem("ew_builder_pipeline_id");
            
            const assembledResult = st.result;
            setHtmlContent(assembledResult.preview);
            setProjectFiles(assembledResult.projectFiles);
            setPhase("done");
            if (st.projectId) setProjectId(st.projectId);
            
            if (st.messages && st.messages.length > 0) {
              appendMsg("assistant", st.messages[st.messages.length - 1].text);
            }
          } else if (st.status === "error") {
            clearInterval(poll);
            localStorage.removeItem("ew_builder_pipeline_id");
            setError(st.error || "Pipeline failed");
            setPhase("idle");
          }
        } catch (e) {
          clearInterval(poll);
          localStorage.removeItem("ew_builder_pipeline_id");
        }
      }, 2000);
      return () => clearInterval(poll);
    }
  }, [appendMsg]);
  
  const deriveProjectName = useCallback((prompt, brandName, plan) => {
    const fromPlan = typeof plan?.siteName === "string" ? plan.siteName.trim() : "";
    const fromBrand = typeof brandName === "string" ? brandName.trim() : "";
    const fromPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const candidate = fromPlan || fromBrand || fromPrompt || "Generated Website";
    return candidate.slice(0, 80);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const appendMsg = useCallback((role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);



  const logAgent = useCallback((id, status) => {
    setAgentLog(prev => {
      const next = [...prev];
      const idx = next.findIndex(a => a.id === id);
      if (idx >= 0) next[idx] = { ...next[idx], status };
      else next.push({ id, status });
      return next;
    });
  }, []);


  // ── 8-agent MERN pipeline via backend ─────────────────────────────────────────
  const runPipeline = useCallback(async (userPrompt, intakeAnswers) => {
    setCodeEvents([]);
    setPhase("building");
    setAgentLog([]);

    const brandName = brandNameRef.current;
    const logoData = logoDataRef.current;
    const selectedTheme = selectedThemeRef.current;
    const profile = businessProfileRef.current;

    // Build contextual prompt with brand + intake answers
    const fullPrompt = [
      userPrompt,
      brandName ? `BRAND NAME: ${brandName}` : "",
      intakeAnswers ? `USER PREFERENCES:\n${intakeAnswers}` : "",
      buildTechIntentBlock(buildSpecRef.current),
    ].filter(Boolean).join("\n\n");

    try {
      const res = await fetch(`${API_BASE}/api/builder/pipeline/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "website",
          prompt: fullPrompt,
          brandName,
          logoData,
          selectedTheme,
          buildSpec: buildSpecRef.current,
          projectId,
          businessProfile: profile,
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
            if (!stRes.ok) return; // Keep trying if transient error
            const st = await stRes.json();

            setStage(st.stage);
            setAgentLog(st.agentLog);
            setCodeEvents(st.codeEvents);

            if (st.status === "completed") {
              clearInterval(poll);
              
              const assembledResult = st.result;
              console.log("[pipeline] Final assembled preview length:", assembledResult.preview?.length);
              setHtmlContent(assembledResult.preview);
              setProjectFiles(assembledResult.projectFiles);
              setPhase("done");
              
              logActivity("Generated website", {
                files: Object.keys(assembledResult.projectFiles || {}).length,
              }).catch(() => {});
              
              try {
                const saved = await saveProject({
                  id: projectId || undefined,
                  type: "website",
                  name: deriveProjectName(userPrompt, brandName, assembledResult.plan),
                  slug: null,
                  htmlContent: assembledResult.preview,
                  projectFiles: assembledResult.projectFiles,
                  publishedUrl: null,
                });
                if (saved?.id) {
                  setProjectId(saved.id);
                }
              } catch {
                // Non-blocking
              }

              if (st.messages && st.messages.length > 0) {
                appendMsg("assistant", st.messages[st.messages.length - 1].text);
              }
              resolve();
            } else if (st.status === "error") {
              clearInterval(poll);
              localStorage.removeItem("ew_builder_pipeline_id");
              throw new Error(st.error || "Pipeline failed");
            }
          } catch (e) {
            clearInterval(poll);
            localStorage.removeItem("ew_builder_pipeline_id");
            reject(e);
          }
        }, 2000);
      });
    } catch (err) {
      console.error("[useBuilderChat] Pipeline start error:", err);
      throw err;
    }
  }, [appendMsg, buildTechIntentBlock, deriveProjectName, projectId]);

  // ── Main send ──────────────────────────────────────────────────────────────
  const send = useCallback(async (userText, buildSpec = null) => {
    if (!userText.trim() || generating) return;
    setError(null);
    setGenerating(true);
    appendMsg("user", userText);

    try {
      if (phase === "idle") {
        if (buildSpec && typeof buildSpec === "object") {
          buildSpecRef.current = { ...buildSpecRef.current, ...buildSpec };
        }
        originalPromptRef.current = userText;
        setPhase("intake");

        // Try Minimax intake, but always prepend the mandatory theme question first.
        try {
          const raw = await minimaxIntake(userText);
          const parsed = parseIntakeJson(raw);
          const dynamicQuestions = parsed.filter(
            (q) => q?.key && q.key !== THEME_QUESTION_KEY && !/theme/i.test(String(q.question || "")),
          );
          setIntakeQuestions([THEME_INTAKE_QUESTION, ...dynamicQuestions]);
          appendMsg("assistant", "Before I build, a few quick questions — select an option for each:");
        } catch (intakeErr) {
          console.warn("[useBuilderChat] intake failed, using mandatory theme question only:", intakeErr.message);
          setIntakeQuestions([THEME_INTAKE_QUESTION]);
          appendMsg("assistant", "Before I build, first choose your theme design:");
        }

      } else if (phase === "done") {
        // Change request (RAG Chatbot Iterative Edit)
        setStage(7);
        logAgent("editor", "running");

        try {
          const editedResult = await runFrontendEdit(
            htmlContent,
            projectFiles,
            userText,
            brandNameRef.current,
            logoDataRef.current,
            selectedThemeRef.current,
          );

          setHtmlContent(editedResult.preview);
          setProjectFiles(editedResult.files);

          try {
            if (projectId) {
              await saveProject({
                id: projectId,
                type: "website",
                name: deriveProjectName(originalPromptRef.current, brandNameRef.current, null),
                slug: null,
                htmlContent: editedResult.preview,
                projectFiles: editedResult.files,
              });
            }
          } catch {
            // Keep chat responsive even when save fails.
          }

          appendMsg("assistant", "I've updated the code based on your request. Check the preview to see the changes!");
          logAgent("editor", "done");
        } catch (editErr) {
          logAgent("editor", "failed");
          throw editErr;
        }
      }
    } catch (err) {
      console.error("[useBuilderChat] error:", err);
      setStage(0);
      setPhase(phase === "building" ? "done" : phase);
      setError(`Something went wrong: ${err?.message || String(err)}`);
      appendMsg("assistant", `Error: ${err?.message || String(err)}`);
    } finally {
      setGenerating(false);
      if (stage === 9) setTimeout(() => setStage(0), 3000);
    }
  }, [appendMsg, deriveProjectName, generating, htmlContent, phase, projectFiles, projectId, stage, logAgent]);

  // ── Submit intake (called by ChatPanel "Build" button) ─────────────────────
  // answersMap — chip answers, brandName — text field, logoData — data URL
  const submitIntakeAnswers = useCallback(async (answersMap, brandName = "", logoData = "") => {
    if (generating) return;

    // Store brand + logo in refs for pipeline use
    brandNameRef.current = brandName.trim();
    logoDataRef.current = logoData;
    selectedThemeRef.current = resolveSelectedTheme(answersMap[THEME_QUESTION_KEY]);

    setError(null);
    setGenerating(true);

    const formatted = intakeQuestions
      .map(q => `${q.question}\nAnswer: ${answersMap[q.key] ?? "(skipped)"}`)
      .join("\n\n");

    const brandLabel = brandName.trim()
      ? `Brand name: ${brandName.trim()}`
      : "Brand name: (not specified — user will fill later)";

    const logoLabel = logoData
      ? "Logo: uploaded by user"
      : "Logo: generate typographic logo from brand name";

    const themeLabel = selectedThemeRef.current
      ? `Theme Design: ${selectedThemeRef.current.label} (${selectedThemeRef.current.filePath})`
      : "Theme Design: (not selected)";

    const summary = [brandLabel, logoLabel, themeLabel, formatted].join("\n");

    appendMsg("user", summary);
    setIntakeQuestions([]);

    try {
      await runPipeline(originalPromptRef.current, summary);
    } catch (err) {
      console.error("[useBuilderChat] submitIntakeAnswers error:", err);
      setStage(0);
      setPhase("intake");
      setError(`Something went wrong: ${err?.message || String(err)}`);
      appendMsg("assistant", `Error: ${err?.message || String(err)}`);
    } finally {
      setGenerating(false);
    }
  }, [generating, intakeQuestions, appendMsg, runPipeline]);

  // ── Publish (publishes the preview HTML to the server) ────────────────────
  const publish = useCallback(async (slug) => {
    if (!htmlContent || Object.keys(projectFiles).length === 0 || publishing) return null;
    setPublishing(true);
    try {
      const res = await fetch(PUBLISH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: JSON.stringify({ slug, html: htmlContent, projectFiles, projectId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      const info = { url: data.url, name: data.name || slug };
      if (data?.projectId) {
        setProjectId(data.projectId);
      }
      setPublishInfo(info);
      logActivity("Published website", { name: info.name, url: info.url }).catch(() => {});
      return info;
    } catch (err) {
      const msg = `Publish failed: ${err.message}`;
      setError(msg);
      appendMsg("assistant", msg);
      return null;
    } finally {
      setPublishing(false);
    }
  }, [appendMsg, htmlContent, projectFiles, projectId, publishing]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    originalPromptRef.current = "";
    brandNameRef.current = "";
    logoDataRef.current = "";
    selectedThemeRef.current = null;
    setMessages([]);
    setHtmlContent("");
    setProjectFiles({});
    setStage(0);
    setPhase("idle");
    setGenerating(false);
    setError(null);
    setPublishInfo(null);
    setIntakeQuestions([]);
    setAgentLog([]);
    setProjectId(null);
  }, []);

  return {
    messages,
    htmlContent,
    projectFiles,
    stage,
    agentLog,
    generating,
    error,
    publishInfo,
    publishing,
    projectId,
    phase,
    intakeQuestions,
    codeEvents,
    send,
    submitIntakeAnswers,
    publish,
    reset,
  };
}


