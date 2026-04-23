const SYSTEM_PROMPT = `You are an expert web designer and frontend developer.
Your job is to generate a complete, beautiful, production-ready single-file HTML website.

Rules:
- Output ONLY raw HTML (no markdown fences, no explanation, no backticks).
- The HTML must be complete: <!DOCTYPE html> ... </html>
- Use inline <style> for all CSS.
- Use inline <script> for any JS.
- Fully responsive.
- Match the user's business and intent.
`;

function buildUserMessage(conversation) {
  const lines = conversation.map((m) => `${m.role.toUpperCase()}: ${m.content}`);
  lines.push("ASSISTANT:");
  return lines.join("\n\n");
}

import { runEnhancer } from "../../src/agents/enhancer.js";
import { runStructurer } from "../../src/agents/structurer.js";
import { runFrontend } from "../../src/agents/frontend.js";
import { runBackend } from "../../src/agents/backend.js";
import { runPayment } from "../../src/agents/payment.js";
import { runFixer } from "../../src/agents/fixer.js";
import { runAssembler } from "../../src/agents/assembler.js";
import { runNativeAppBuilder } from "../../src/agents/nativeAppBuilder.js";
import { runNativeApp } from "../../src/agents/nativeApp.js";

const activePipelines = new Map();

function getTs() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function updatePipeline(id, data) {
  if (!activePipelines.has(id)) return;
  const p = activePipelines.get(id);
  Object.assign(p, data);
}

function logAgentToPipeline(id, agentId, status) {
  const p = activePipelines.get(id);
  if (!p) return;
  const idx = p.agentLog.findIndex((a) => a.id === agentId);
  if (idx === -1) p.agentLog.push({ id: agentId, status });
  else p.agentLog[idx].status = status;
}

function logCodeEventToPipeline(id, agentId, fileName, codeSnippet, status) {
  const p = activePipelines.get(id);
  if (!p) return;
  const key = `${agentId}::${fileName}`;
  const idx = p.codeEvents.findIndex((e) => e.key === key);
  const newEvent = {
    key,
    agentId,
    fileName,
    preview: typeof codeSnippet === "string" ? codeSnippet.slice(0, 400) : "",
    status,
    time: getTs(),
  };
  if (idx === -1) p.codeEvents.push(newEvent);
  else p.codeEvents[idx] = newEvent;
}


export function registerBuilderRoutes({
  app,
  ai,
  fs,
  path,
  SITES_DIR,
  BASE_URL,
  getUserFromAuthHeader,
  statements,
  saveActivity,
  persistProjectZip,
}) {
  app.post("/api/builder/generate", async (req, res) => {
    const { conversation } = req.body || {};
    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({ error: "conversation is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };

    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
        contents: [{ role: "user", parts: [{ text: buildUserMessage(conversation) }] }],
      });

      for await (const chunk of stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) send("chunk", text);
      }

      send("done", "");
      res.end();
    } catch (err) {
      send("error", err?.message || "Generation failed");
      res.end();
    }
  });

  app.post("/api/builder/publish", async (req, res) => {
    const { slug, html, projectFiles = {}, projectId = null } = req.body || {};
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "slug is required" });
    }
    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "html is required" });
    }

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!safeSlug) return res.status(400).json({ error: "invalid slug" });

    const dir = path.join(SITES_DIR, safeSlug);
    const indexPath = path.join(dir, "index.html");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(indexPath, html, "utf-8");

    const actor = getUserFromAuthHeader(req.headers.authorization || "");
    let persistedProjectId = null;
    let zipPath = null;
    if (actor) {
      const projectName = safeSlug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
      const publishedUrl = `${BASE_URL}/sites/${safeSlug}/index.html`;
      const existing = projectId ? statements.getProjectById.get(Number(projectId), actor.id) : null;

      if (existing && existing.type === "website") {
        statements.updateProject.run(
          existing.name || projectName || safeSlug,
          safeSlug,
          html,
          JSON.stringify(projectFiles || {}),
          existing.mobile_code || "",
          existing.demo_apk_notes || "",
          existing.aab_notes || "",
          publishedUrl,
          Number(existing.id),
          actor.id,
        );
        persistedProjectId = Number(existing.id);
      } else {
        const insert = statements.insertProject.run(
          actor.id,
          "website",
          projectName || safeSlug,
          safeSlug,
          html,
          JSON.stringify(projectFiles || {}),
          "",
          "",
          "",
          publishedUrl,
        );
        persistedProjectId = Number(insert.lastInsertRowid);
      }

      try {
        zipPath = await persistProjectZip({
          projectId: persistedProjectId,
          userId: actor.id,
          slug: safeSlug,
          projectFiles,
          htmlContent: html,
        });
      } catch {
        // Keep publish successful even if zip storage fails.
      }

      saveActivity(actor.id, "Published website", { slug: safeSlug, projectId: persistedProjectId });
    }

    return res.json({
      url: `${BASE_URL}/sites/${safeSlug}/index.html`,
      name: safeSlug,
      projectId: persistedProjectId,
      zipPath,
      publishedAt: new Date().toISOString(),
    });
  });

  app.get("/api/builder/sites", async (_req, res) => {
    try {
      const entries = await fs.readdir(SITES_DIR, { withFileTypes: true });
      const sites = entries
        .filter((e) => e.isDirectory())
        .map((e) => ({ name: e.name, url: `${BASE_URL}/sites/${e.name}/index.html` }));
      return res.json({ sites });
    } catch {
      return res.json({ sites: [] });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/builder/pipeline/start", async (req, res) => {
    const {
      type = "website",
      prompt,
      businessProfile,
      selectedTheme,
      projectId,
      brandName,
      logoData,
      buildSpec
    } = req.body || {};

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const pipelineId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    activePipelines.set(pipelineId, {
      id: pipelineId,
      type,
      status: "running",
      stage: 1,
      agentLog: [],
      codeEvents: [],
      result: null,
      error: null,
      messages: [],
      projectId: projectId || null,
      appName: brandName || "EasyWay App",
      packageName: brandName ? `com.easyway.${brandName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40)}` : "com.easyway.app",
    });

    res.json({ pipelineId });

    // Run asynchronously
    (async () => {
      const p = activePipelines.get(pipelineId);
      const logEv = (a, f, c, s) => logCodeEventToPipeline(pipelineId, a, f, c, s);

      try {
        let enhanced;
        updatePipeline(pipelineId, { stage: 1 });
        logAgentToPipeline(pipelineId, "enhancer", "running");
        
        if (type === "app") {
          const profileBlock = businessProfile
            ? [
                "BUSINESS PROFILE CONTEXT:",
                `Business Name: ${businessProfile.businessName || ""}`,
                `Industry: ${businessProfile.industry || ""}`,
                `Location: ${[businessProfile.city, businessProfile.country].filter(Boolean).join(", ")}`,
                `Map Profile URL: ${businessProfile.mapProfileUrl || ""}`,
                `Audience: ${businessProfile.audience || ""}`,
                `Brand Tone: ${businessProfile.brandTone || ""}`,
                `Goals: ${Array.isArray(businessProfile.goals) ? businessProfile.goals.join(", ") : ""}`,
              ].join("\n")
            : "";
          enhanced = await runEnhancer([prompt, profileBlock].filter(Boolean).join("\n\n"));
        } else {
          enhanced = await runEnhancer(prompt);
        }
        logAgentToPipeline(pipelineId, "enhancer", "done");

        updatePipeline(pipelineId, { stage: 2 });
        logAgentToPipeline(pipelineId, "structurer", "running");
        let plan;
        if (type === "app") {
          plan = await runStructurer(`${enhanced}\n\nThis request is for a mobile app build.`);
          plan.react_native = true;
          const appName = plan.brandName || "EasyWay App";
          const packageName = `com.easyway.${String(plan.brandName || "app").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40) || "app"}`;
          updatePipeline(pipelineId, { appName, packageName });
        } else {
          plan = await runStructurer(enhanced);
          if (brandName) plan.brandName = brandName;
          const spec = buildSpec || {};
          if (spec.architecture === "multi-page" && (!Array.isArray(plan.pages) || plan.pages.length < 2)) {
            plan.pages = ["Home", "Products", "About", "Contact"];
          }
          if (spec.siteType === "ecommerce") {
            plan.payment = true;
            plan.models = Array.from(new Set([...(plan.models || []), "Product", "Customer", "Order"]));
            const routeSeed = [
              { method: "GET", path: "/api/products", description: "List products" },
              { method: "POST", path: "/api/orders", description: "Create order" },
              { method: "GET", path: "/api/orders", description: "List orders" },
              { method: "GET", path: "/api/customers", description: "List customers" },
            ];
            plan.backend_routes = [...(plan.backend_routes || []), ...routeSeed];
          }
          if (spec.includePayments) plan.payment = true;
        }
        logAgentToPipeline(pipelineId, "structurer", "done");

        updatePipeline(pipelineId, { stage: 3 });
        logAgentToPipeline(pipelineId, "frontend", "running");
        let frontend;
        if (type === "app") {
          frontend = await runFrontend(plan, enhanced, p.appName, "", selectedTheme, logEv);
        } else {
          frontend = await runFrontend(plan, enhanced, brandName, logoData, selectedTheme?.folder || "minimal-clean", logEv);
        }
        logAgentToPipeline(pipelineId, "frontend", "done");

        updatePipeline(pipelineId, { stage: 4 });
        let native = { code: "", demoNotes: "", aabNotes: "" };
        if (type === "app") {
          logAgentToPipeline(pipelineId, "nativeApp", "running");
          native = await runNativeAppBuilder(plan, enhanced, prompt, logEv);
          logAgentToPipeline(pipelineId, "nativeApp", "done");
        } else if (plan.react_native) {
          logAgentToPipeline(pipelineId, "nativeApp", "running");
          try {
            native.code = await runNativeApp(plan, enhanced);
            logAgentToPipeline(pipelineId, "nativeApp", "done");
          } catch {
            logAgentToPipeline(pipelineId, "nativeApp", "failed");
          }
        }

        updatePipeline(pipelineId, { stage: 5 });
        logAgentToPipeline(pipelineId, "backend", "running");
        let backend = {};
        try {
          backend = await runBackend(plan, logEv);
          logAgentToPipeline(pipelineId, "backend", "done");
        } catch {
          logAgentToPipeline(pipelineId, "backend", "failed");
        }

        let preview = frontend.preview;
        if (plan.payment && preview) {
          updatePipeline(pipelineId, { stage: 6 });
          logAgentToPipeline(pipelineId, "payment", "running");
          try {
            const updated = await runPayment(preview, backend["server/server.js"] || "");
            preview = updated.frontend || preview;
            if (updated.backend) backend["server/server.js"] = updated.backend;
            logAgentToPipeline(pipelineId, "payment", "done");
          } catch {
            logAgentToPipeline(pipelineId, "payment", "failed");
          }
        }

        updatePipeline(pipelineId, { stage: 7 });
        logAgentToPipeline(pipelineId, "fixer", "running");
        let fixed = preview;
        try {
          fixed = await runFixer(preview, logEv);
          if (!fixed && preview) fixed = preview;
          logAgentToPipeline(pipelineId, "fixer", "done");
        } catch {
          logAgentToPipeline(pipelineId, "fixer", "failed");
        }

        updatePipeline(pipelineId, { stage: 8 });
        logAgentToPipeline(pipelineId, "assembler", "running");
        let assembled;
        try {
          assembled = await runAssembler(fixed, frontend.files, backend, native.code, logEv);
          logAgentToPipeline(pipelineId, "assembler", "done");
        } catch {
          logAgentToPipeline(pipelineId, "assembler", "failed");
          assembled = { preview: fixed, projectFiles: { ...frontend.files, ...backend } };
        }

        const doneCount = Object.keys(assembled.projectFiles || {}).length;
        
        updatePipeline(pipelineId, {
          stage: 9,
          status: "completed",
          result: {
            preview: assembled.preview,
            mobileCode: native.code,
            demoNotes: native.demoNotes,
            aabNotes: native.aabNotes,
            projectFiles: assembled.projectFiles,
            plan,
          },
          messages: [
            {
              id: (Date.now() + 2).toString(),
              role: "ai",
              text: type === "app" ? `Build complete! Generated ${doneCount} files. Preview updated and download buttons enabled.` : `Your MERN project is ready with ${doneCount} files.\n\nPreview panel shows the live site. Switch to the "Files" tab to browse all React components and backend code.\n\nWant changes? Describe them and I'll update the project.`,
              time: getTs(),
            }
          ]
        });

      } catch (e) {
        console.error("Pipeline failed:", e);
        updatePipeline(pipelineId, {
          status: "error",
          error: e?.message || "App build failed",
          messages: [
            {
              id: (Date.now() + 3).toString(),
              role: "ai",
              text: `Build failed: ${e?.message || "Unknown error"}`,
              time: getTs(),
            }
          ]
        });
      }
    })();
  });

  app.get("/api/builder/pipeline/:id", (req, res) => {
    const p = activePipelines.get(req.params.id);
    if (!p) return res.status(404).json({ error: "Pipeline not found" });
    res.json(p);
  });

  app.delete("/api/builder/pipeline/:id", (req, res) => {
    activePipelines.delete(req.params.id);
    res.json({ success: true });
  });

}
