import { useState, useCallback, useRef } from "react";
import { runEnhancer }   from "../../agents/enhancer.js";
import { runStructurer } from "../../agents/structurer.js";
import { runFrontend, runFrontendEdit }   from "../../agents/frontend.js";
import { runNativeApp }  from "../../agents/nativeApp.js";
import { runBackend }    from "../../agents/backend.js";
import { runPayment }    from "../../agents/payment.js";
import { runFixer }      from "../../agents/fixer.js";
import { runAssembler }  from "../../agents/assembler.js";
import { callAI, MODELS } from "../../agents/callAI.js";

/**
 * useBuilderChat — EasyWay MERN AI Website Builder
 *
 * Pipeline phases:
 *   'idle'     → waiting for first message / template pick
 *   'intake'   → intake questions shown (chips), brand name + logo collected
 *   'building' → 8-agent OpenRouter pipeline running
 *   'done'     → project generated; further messages = change requests
 *
 * Agent stages:
 *   1  Enhancing Prompt
 *   2  Planning MERN Structure
 *   3  Building React Components
 *   4  Building React Native (conditional)
 *   5  Building Express Backend
 *   6  Payment Integration (conditional)
 *   7  Fixing Preview
 *   8  Assembling Project
 *   9  Complete
 */

const PUBLISH_ENDPOINT = "http://localhost:3001/api/builder/publish";

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Intake via Minimax (OpenRouter)
// ─────────────────────────────────────────────────────────────────────────────

const INTAKE_SYSTEM = `You are an AI Website Architecture Consultant for the EasyWay platform.
A user has shared a website idea. Your job is to generate exactly 4-5 dynamic intake questions tailored to their specific project.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array of question objects. NO markdown formatting, NO conversational text.
2. Formulate questions like Store Name suggestions, Location features, Pricing models, Content categories, or Theme vibes.
3. Each question must include an array of 3-5 specific, tailored selectable options.

JSON SCHEMA:
[
  {
    "key": "unique_snake_case_id",
    "question": "Short, direct question (no emoji)",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }
]

EXAMPLE FOR A PIZZA SHOP:
[
  { "key": "store_name", "question": "What should we name your pizzeria?", "options": ["Luigi's Slice", "Crust & Co.", "Urban Pizza", "I have my own"] },
  { "key": "menu_focus", "question": "What is the focus of your menu?", "options": ["Wood-fired Neapolitan", "New York Style Slices", "Deep Dish & Wings", "Vegan & Gluten-Free"] }
]

Output ONLY the raw JSON array. NOTHING ELSE.`;

async function minimaxIntake(userIdea) {
  const responseText = await callAI(
    MODELS.primary,
    [{ role: "user", content: `Website idea: ${userIdea}` }],
    INTAKE_SYSTEM
  );
  return responseText;
}

function parseIntakeJson(raw) {
  try {
    const clean = raw.replace(/```[\w]*\n?/g, "").trim();
    const arr = JSON.parse(clean);
    if (Array.isArray(arr)) return arr;
  } catch (_) {}
  // Try extracting JSON array from text
  const m = raw.match(/\[[\s\S]+\]/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (_) {}
  }
  return [];
}


// ─────────────────────────────────────────────────────────────────────────────
export function useBuilderChat() {
  const [messages,        setMessages]        = useState([]);
  const [htmlContent,     setHtmlContent]     = useState("");  // CDN preview HTML → iframe
  const [projectFiles,    setProjectFiles]    = useState({}); // { [path]: content }
  const [stage,           setStage]           = useState(0);
  const [agentLog,        setAgentLog]        = useState([]);
  const [generating,      setGenerating]      = useState(false);
  const [error,           setError]           = useState(null);
  const [publishInfo,     setPublishInfo]     = useState(null);
  const [publishing,      setPublishing]      = useState(false);
  const [intakeQuestions, setIntakeQuestions] = useState([]);
  const [phase,           setPhase]           = useState("idle");

  const originalPromptRef = useRef("");
  const brandNameRef      = useRef("");
  const logoDataRef       = useRef("");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const appendMsg = useCallback((role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);

  const logAgent = useCallback((id, status) => {
    setAgentLog(prev => {
      const next = [...prev];
      const idx  = next.findIndex(a => a.id === id);
      if (idx >= 0) next[idx] = { ...next[idx], status };
      else next.push({ id, status });
      return next;
    });
  }, []);

  // ── 8-agent MERN pipeline ─────────────────────────────────────────────────
  const runPipeline = useCallback(async (userPrompt, intakeAnswers) => {
    setPhase("building");
    setAgentLog([]);

    const brandName = brandNameRef.current;
    const logoData  = logoDataRef.current;

    // Build contextual prompt with brand + intake answers
    const fullPrompt = [
      userPrompt,
      brandName    ? `BRAND NAME: ${brandName}` : "",
      intakeAnswers ? `USER PREFERENCES:\n${intakeAnswers}` : "",
    ].filter(Boolean).join("\n\n");

    try {
      // ── Agent 1: Enhance ──────────────────────────────────────────────────
      setStage(1); logAgent("enhancer", "running");
      let enhanced;
      try {
        enhanced = await runEnhancer(fullPrompt);
        logAgent("enhancer", "done");
      } catch (e) { logAgent("enhancer", "failed"); throw e; }

      // ── Agent 2: Structure ────────────────────────────────────────────────
      setStage(2); logAgent("structurer", "running");
      let plan;
      try {
        plan = await runStructurer(enhanced);
        // Inject brand name from intake into the plan (trust user over AI)
        if (brandName) plan.brandName = brandName;
        logAgent("structurer", "done");
      } catch (e) { logAgent("structurer", "failed"); throw e; }

      // ── Agent 3: React Frontend ───────────────────────────────────────────
      setStage(3); logAgent("frontend", "running");
      let frontendResult = { preview: "", files: {} };
      try {
        frontendResult = await runFrontend(plan, enhanced, brandName, logoData);
        logAgent("frontend", "done");
      } catch (e) { logAgent("frontend", "failed"); throw e; }

      // ── Agent 4: React Native (conditional) ──────────────────────────────
      let rnCode = "";
      if (plan.react_native) {
        setStage(4); logAgent("nativeApp", "running");
        try {
          rnCode = await runNativeApp(plan, enhanced);
          logAgent("nativeApp", "done");
        } catch (e) {
          logAgent("nativeApp", "failed");
          console.warn("[pipeline] RN agent failed:", e.message);
        }
      }

      // ── Agent 5: Express + MongoDB Backend ────────────────────────────────
      setStage(5); logAgent("backend", "running");
      let backendFiles = {};
      try {
        backendFiles = await runBackend(plan);
        logAgent("backend", "done");
      } catch (e) {
        logAgent("backend", "failed");
        console.warn("[pipeline] Backend agent failed:", e.message);
      }

      // ── Agent 6: Payment (conditional) ───────────────────────────────────
      let updatedPreview = frontendResult.preview;
      if (plan.payment && updatedPreview) {
        setStage(6); logAgent("payment", "running");
        try {
          // Payment agent gets the preview HTML + server.js content
          const serverJs = backendFiles["server/server.js"] || "";
          const result   = await runPayment(updatedPreview, serverJs);
          updatedPreview = result.frontend;
          if (result.backend) {
            backendFiles["server/server.js"] = result.backend;
          }
          logAgent("payment", "done");
        } catch (e) {
          logAgent("payment", "failed");
          console.warn("[pipeline] Payment agent failed:", e.message);
        }
      }

      // ── Agent 7: Fix Preview HTML ─────────────────────────────────────────
      setStage(7); logAgent("fixer", "running");
      let fixedPreview = updatedPreview;
      try {
        fixedPreview = await runFixer(updatedPreview);
        logAgent("fixer", "done");
      } catch (e) {
        logAgent("fixer", "failed");
        fixedPreview = updatedPreview;
      }

      // ── Agent 8: Assemble all files ───────────────────────────────────────
      setStage(8); logAgent("assembler", "running");
      let assembledResult;
      try {
        assembledResult = await runAssembler(
          fixedPreview,
          frontendResult.files,
          backendFiles,
          rnCode,
        );
        logAgent("assembler", "done");
      } catch (e) {
        logAgent("assembler", "failed");
        assembledResult = { preview: fixedPreview, projectFiles: { ...frontendResult.files, ...backendFiles } };
      }

      // ── Done ───────────────────────────────────────────────────────────────
      setStage(9);
      setHtmlContent(assembledResult.preview);
      setProjectFiles(assembledResult.projectFiles);
      setPhase("done");

      const fileCount = Object.keys(assembledResult.projectFiles).length;
      appendMsg(
        "assistant",
        `Your MERN project is ready with ${fileCount} files.\n\nPreview panel shows the live site. Switch to the "Files" tab to browse all React components and backend code.\n\nWant changes? Describe them and I'll update the project.`,
      );
    } catch (err) {
      throw err;
    }
  }, [appendMsg, logAgent]);

  // ── Main send ──────────────────────────────────────────────────────────────
  const send = useCallback(async (userText) => {
    if (!userText.trim() || generating) return;
    setError(null);
    setGenerating(true);
    appendMsg("user", userText);

    try {
      if (phase === "idle") {
        originalPromptRef.current = userText;
        setPhase("intake");

        // Try Minimax intake
        try {
          const raw    = await minimaxIntake(userText);
          const parsed = parseIntakeJson(raw);
          if (parsed.length > 0) {
            setIntakeQuestions(parsed);
            appendMsg("assistant", "Before I build, a few quick questions — select an option for each:");
          } else {
            setIntakeQuestions([]);
            await runPipeline(userText, null);
          }
        } catch (intakeErr) {
          console.warn("[useBuilderChat] intake failed, running pipeline directly:", intakeErr.message);
          setIntakeQuestions([]);
          await runPipeline(userText, null);
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
            logoDataRef.current
          );
          
          setHtmlContent(editedResult.preview);
          setProjectFiles(editedResult.files);
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
  }, [phase, generating, stage, appendMsg, runPipeline]);

  // ── Submit intake (called by ChatPanel "Build" button) ─────────────────────
  // answersMap — chip answers, brandName — text field, logoData — data URL
  const submitIntakeAnswers = useCallback(async (answersMap, brandName = "", logoData = "") => {
    if (generating) return;

    // Store brand + logo in refs for pipeline use
    brandNameRef.current  = brandName.trim();
    logoDataRef.current   = logoData;

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

    const summary = [brandLabel, logoLabel, formatted].join("\n");

    appendMsg("user", summary);
    setIntakeQuestions([]);

    try {
      await runPipeline(originalPromptRef.current, summary);
    } catch (err) {
      console.error("[useBuilderChat] submitIntakeAnswers error:", err);
      setStage(0);
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
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slug, html: htmlContent, projectFiles }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      const info = { url: data.url, name: data.name || slug };
      setPublishInfo(info);
      return info;
    } catch (err) {
      const msg = `Publish failed: ${err.message}`;
      setError(msg);
      appendMsg("assistant", msg);
      return null;
    } finally {
      setPublishing(false);
    }
  }, [htmlContent, projectFiles, publishing, appendMsg]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    originalPromptRef.current = "";
    brandNameRef.current      = "";
    logoDataRef.current       = "";
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
    phase,
    intakeQuestions,
    send,
    submitIntakeAnswers,
    publish,
    reset,
  };
}
