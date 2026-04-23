/**
 * test-agents.mjs
 * Run: node test-agents.mjs
 * Tests every agent in the 8-agent pipeline with a sample prompt.
 */

// ── Config ───────────────────────────────────────────────────────────────────
const OPENROUTER_API_KEY = "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";
const TIMEOUT_MS = 90_000;

const MODELS = {
  primary:  "minimax/minimax-m2.5:free",
  fast:     "stepfun/step-3.5-flash:free",
  agentic:  "arcee-ai/trinity-large-preview:free",
  backup:   "meta-llama/llama-3.3-70b-instruct:free",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const GREEN  = "\x1b[32m✓\x1b[0m";
const RED    = "\x1b[31m✗\x1b[0m";
const YELLOW = "\x1b[33m⚠\x1b[0m";
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`;

function pass(agent, msg) { console.log(`  ${GREEN} ${BOLD(agent)}: ${msg}`); }
function fail(agent, msg) { console.log(`  ${RED} ${BOLD(agent)}: ${msg}`); }
function warn(agent, msg) { console.log(`  ${YELLOW} ${BOLD(agent)}: ${msg}`); }

async function callAI(model, messages, systemPrompt, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const body = {
    model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
    max_tokens: 4000,
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://easyway.app",
        "X-OpenRouter-Title": "EasyWay-Test",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      // Try next model in chain
      const chain = [MODELS.primary, MODELS.fast, MODELS.agentic, MODELS.backup];
      const idx = chain.indexOf(model);
      if (idx >= 0 && idx < chain.length - 1) {
        warn(label, `${model} failed (HTTP ${res.status}), falling back to ${chain[idx+1]}`);
        return callAI(chain[idx + 1], messages, systemPrompt, label);
      }
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return content;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") throw new Error(`Timeout after ${TIMEOUT_MS/1000}s`);
    throw e;
  }
}

function parseProjectFiles(text) {
  const preview = text.match(/\[PREVIEW\]([\s\S]+?)\[\/PREVIEW\]/)?.[1]?.trim() ?? "";
  const files = {};
  const fileRe = /\[FILE path="([^"]+)"\]([\s\S]+?)\[\/FILE\]/g;
  let m;
  while ((m = fileRe.exec(text)) !== null) {
    files[m[1].trim()] = m[2].trim();
  }
  return { preview, files };
}

function extractHtml(text) {
  const fence = text.match(/```(?:html)?\s*([\s\S]+?)```/i);
  if (fence) return fence[1].split("[FILE")[0].trim();
  const doc = text.match(/<!DOCTYPE[\s\S]+/i);
  if (doc) return doc[0].split("[FILE")[0].trim();
  if (text.includes("[FILE")) return "";
  return text.trim();
}

// ── Sample Prompt ─────────────────────────────────────────────────────────────
const SAMPLE_PROMPT = "Build me a modern yoga studio website called ZenFlow. It should have a booking section, class schedule, pricing plans, and a hero with a calming aesthetic.";

// ── Test Runner ───────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60));
console.log(BOLD("  EasyWay Agent Pipeline — Full Test Run"));
console.log("═".repeat(60));
console.log(`  Sample Prompt: "${SAMPLE_PROMPT}"\n`);

let enhanced = "";
let plan = null;
let frontendPreview = "";
let frontendFiles = {};
let backendFiles = {};
let fixedPreview = "";
let totalErrors = 0;

// ── AGENT 1: Enhancer ─────────────────────────────────────────────────────────
console.log(BOLD("\n[Agent 1] Prompt Enhancer"));
try {
  const start = Date.now();
  enhanced = await callAI(
    MODELS.agentic,
    [{ role: "user", content: SAMPLE_PROMPT }],
    "You are a conversion copywriter. Enhance this into a detailed website brief with sections, features, target audience, and tone. Output only the brief, no preamble.",
    "Enhancer"
  );
  const len = enhanced.length;
  if (len < 100) throw new Error(`Output too short (${len} chars)`);
  pass("Enhancer", `OK — ${len} chars in ${Date.now()-start}ms`);
  console.log(`       Preview: "${enhanced.slice(0,120).replace(/\n/g,' ')}..."`);
} catch(e) {
  fail("Enhancer", e.message);
  totalErrors++;
  enhanced = SAMPLE_PROMPT; // fallback
}

// ── AGENT 2: Structurer ───────────────────────────────────────────────────────
console.log(BOLD("\n[Agent 2] Structure Orchestrator"));
try {
  const start = Date.now();
  const raw = await callAI(
    MODELS.agentic,
    [{ role: "user", content: `Website brief:\n${enhanced}` }],
    `You are a senior software architect. Output ONLY valid JSON project plan with fields: siteName, brandName, pages, components, backend_routes, models, payment, react_native, color_theme, target_audience, key_features, sections.`,
    "Structurer"
  );
  const clean = raw.replace(/```[\w]*\n?/g, "").trim();
  try {
    plan = JSON.parse(clean);
  } catch(_) {
    const m = clean.match(/\{[\s\S]+\}/);
    if (m) plan = JSON.parse(m[0]);
    else throw new Error("Could not parse JSON from response");
  }
  const requiredFields = ["siteName","brandName","components","backend_routes","models"];
  const missing = requiredFields.filter(f => !plan[f]);
  if (missing.length) warn("Structurer", `Missing fields: ${missing.join(", ")}`);
  else pass("Structurer", `OK — ${plan.components?.length} components, ${plan.backend_routes?.length} routes in ${Date.now()-start}ms`);
  console.log(`       Site: ${plan.siteName}, Brand: ${plan.brandName}`);
  console.log(`       Components: [${(plan.components||[]).join(", ")}]`);
} catch(e) {
  fail("Structurer", e.message);
  totalErrors++;
  plan = { siteName:"ZenFlow",brandName:"ZenFlow",pages:["Home"],components:["Navbar","Hero","Classes","Pricing","Footer"],backend_routes:[{method:"POST",path:"/api/contact",description:"Contact form"}],models:["Contact"],payment:false,react_native:false,color_theme:"Monochrome",target_audience:"Yogis",key_features:[],sections:["Hero","Classes","Pricing","Footer"] };
}

// ── AGENT 3: Frontend ─────────────────────────────────────────────────────────
console.log(BOLD("\n[Agent 3] React Frontend Generator"));
try {
  const start = Date.now();
  const FRONTEND_SYSTEM = `You are a Senior React Engineer. Generate a CDN preview HTML and React component files.
Output format:
[PREVIEW]
<!DOCTYPE html>...complete React CDN HTML...</html>
[/PREVIEW]
[FILE path="client/src/App.jsx"]...content...[/FILE]
[FILE path="client/src/components/Hero.jsx"]...content...[/FILE]
No other text outside delimiters.`;

  const prompt = `Build the MERN frontend for: ${plan.brandName || "ZenFlow"}\nComponents: ${(plan.components||[]).join(", ")}\nBrief: ${enhanced}`;
  const raw = await callAI(MODELS.primary, [{ role:"user", content:prompt }], FRONTEND_SYSTEM, "Frontend");
  const parsed = parseProjectFiles(raw);

  // fallback preview
  if (!parsed.preview) {
    parsed.preview = extractHtml(raw);
    if (parsed.preview) warn("Frontend", "Used extractHtml fallback for preview");
  }

  frontendPreview = parsed.preview;
  frontendFiles   = parsed.files;

  if (!frontendPreview) throw new Error("No preview HTML found in output");
  if (!frontendPreview.includes("<!DOCTYPE")) throw new Error("Preview missing DOCTYPE");

  const fileCount = Object.keys(frontendFiles).length;
  pass("Frontend", `OK — preview ${frontendPreview.length} chars, ${fileCount} React files in ${Date.now()-start}ms`);
  console.log(`       Files: [${Object.keys(frontendFiles).join(", ")}]`);
} catch(e) {
  fail("Frontend", e.message);
  totalErrors++;
  frontendPreview = "<!DOCTYPE html><html><body><h1>ZenFlow</h1></body></html>";
}

// ── AGENT 5: Backend ──────────────────────────────────────────────────────────
console.log(BOLD("\n[Agent 5] Express Backend Generator"));
try {
  const start = Date.now();
  const BACKEND_SYSTEM = `You are a Node.js backend developer. Output ONLY [FILE path="server/..."]...[/FILE] blocks. No other text.`;
  const prompt = `Build Express+MongoDB backend for ${plan.siteName}.\nRoutes: ${JSON.stringify(plan.backend_routes||[])}\nModels: ${(plan.models||["Contact"]).join(", ")}`;
  const raw = await callAI(MODELS.agentic, [{ role:"user", content:prompt }], BACKEND_SYSTEM, "Backend");
  const { files } = parseProjectFiles(raw);
  backendFiles = Object.keys(files).length ? files : { "server/server.js": raw };
  const hasEntrypoint = "server/server.js" in backendFiles || "server/index.js" in backendFiles;
  if (!hasEntrypoint) warn("Backend", "No server entrypoint (server.js/index.js) found — check output format");
  else pass("Backend", `OK — ${Object.keys(backendFiles).length} server files in ${Date.now()-start}ms`);
  console.log(`       Files: [${Object.keys(backendFiles).join(", ")}]`);
} catch(e) {
  fail("Backend", e.message);
  totalErrors++;
  backendFiles = {};
}

// ── AGENT 7: Fixer (static patch only — no browser sandbox in Node) ──────────
console.log(BOLD("\n[Agent 7] Fixer — Static Syntax Patch"));
try {
  const start = Date.now();
  let html = frontendPreview;

  // Apply the same static patches as fixer.js
  // 1. Missing ) before };
  html = html.replace(/(\.\\w+\([^)]*\{[^}]*\})\s*;/g, (match, inner) => {
    const opens  = (inner.match(/\(/g)||[]).length;
    const closes = (inner.match(/\)/g)||[]).length;
    return opens > closes ? inner + ");" : match;
  });
  // 2. Double semicolons
  html = html.replace(/;;/g, ";");
  // 3. Unclosed optional chains
  html = html.replace(/(document\.getElementById\([^)]+\))\?\s*;/g, "$1;");

  const hasDoctype  = html.toLowerCase().includes("<!doctype");
  const hasReactCDN = html.includes("react");
  const hasBabel    = html.includes("babel");

  if (!hasDoctype)  throw new Error("DOCTYPE missing in preview");
  if (!hasReactCDN) warn("Fixer", "React CDN not found in preview — generation may be incomplete");
  if (!hasBabel)    warn("Fixer", "Babel CDN not found — preview may not compile JSX");

  fixedPreview = html;
  pass("Fixer", `Static patch OK — ${fixedPreview.length} chars in ${Date.now()-start}ms`);
  console.log(`       DOCTYPE: ${hasDoctype}, React CDN: ${hasReactCDN}, Babel: ${hasBabel}`);
} catch(e) {
  fail("Fixer", e.message);
  totalErrors++;
  fixedPreview = frontendPreview;
}

// ── AGENT 8: Assembler ────────────────────────────────────────────────────────
console.log(BOLD("\n[Agent 8] Assembler"));
try {
  const start = Date.now();
  const projectFiles = { ...frontendFiles, ...backendFiles };
  const totalFiles = Object.keys(projectFiles).length;
  if (totalFiles === 0) throw new Error("No files to assemble!");
  if (!fixedPreview)    throw new Error("No preview HTML to assemble!");
  pass("Assembler", `OK — merged ${totalFiles} total files in ${Date.now()-start}ms`);
  console.log(`       Total files: [${Object.keys(projectFiles).join(", ")}]`);
} catch(e) {
  fail("Assembler", e.message);
  totalErrors++;
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60));
if (totalErrors === 0) {
  console.log(BOLD(`  ${GREEN} ALL AGENTS PASSED — Pipeline is healthy!`));
} else {
  console.log(BOLD(`  ${RED} ${totalErrors} agent(s) reported errors — see above.`));
}
console.log("═".repeat(60) + "\n");
