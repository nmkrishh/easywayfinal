import { callAI, MODELS, parseProjectFiles } from "./callAI.js";

const DESIGN_THEMES = {
  "bold-energetic": "src/designs/bold-energetic/DESIGN.md",
  "dark-technical": "src/designs/dark-technical/DESIGN.md",
  "developer-docs": "src/designs/developer-docs/DESIGN.md",
  "gradient-modern": "src/designs/gradient-modern/DESIGN.md",
  "minimal-clean": "src/designs/minimal-clean/DESIGN.md",
  "vibrant-playful": "src/designs/vibrant-playful/DESIGN.md",
  "warm-editorial": "src/designs/warm-editorial/DESIGN.md",
};

const SKILLS_CONTEXT = `
SKILL CONTEXT — WEBAPP BUILDING (from .antigravity-skills/webapp-building):
Stack: React 18 + Vite + Tailwind CSS + shadcn/ui
- Functional components + hooks only (useState, useEffect, useRef, useCallback, useMemo)
- Separate component files under client/src/components/
- CSS custom properties on :root for all design tokens
- React Router v6 for multi-page apps
- Three.js r128 for 3D backgrounds (import * as THREE from 'three')
- useEffect cleanup for Three.js: renderer.dispose(), geometry.dispose(), material.dispose()
- package.json must list all deps: react, react-dom, vite, three, react-router-dom, @vitejs/plugin-react
- vite.config.js: standard Vite React plugin + path alias @/ → src/

SCRIPTS REFERENCE:
- init-webapp.sh creates a full React+Vite+Tailwind+shadcn project
- All components go in src/components/, hooks in src/hooks/, types in src/types/
- Build output: dist/index.html + dist/assets/[name]-[hash].js + dist/assets/[name]-[hash].css
`;

function buildSystemPrompt(designBibleContent) {
  const designSection = designBibleContent
    ? `\n\n═══════════════════════════════════════════════════════
 DESIGN BIBLE — FOLLOW EXACTLY AS THE LAW
═══════════════════════════════════════════════════════
${designBibleContent}
═══════════════════════════════════════════════════════`
    : "";

  return `You are a world-class Senior React Engineer and UI/UX Designer building a REAL production app.
Pure working code only. Zero comments. Zero explanations. Zero placeholder functions.
${designSection}
${SKILLS_CONTEXT}

═══════════════════════════════════════════════════════
 OUTPUT FORMAT — EXACTLY THIS, NOTHING ELSE
═══════════════════════════════════════════════════════

[PREVIEW]
<!DOCTYPE html>...complete CDN HTML with React+Babel+Three.js...
[/PREVIEW]
[FILE path="client/src/main.jsx"]
...content...
[/FILE]
[FILE path="client/src/App.jsx"]
...content...
[/FILE]
[FILE path="client/src/components/Navbar.jsx"]
...content...
[/FILE]
[FILE path="client/src/components/Hero.jsx"]
...content...
[/FILE]
[FILE path="client/src/styles/globals.css"]
...content...
[/FILE]
[FILE path="client/package.json"]
...content...
[/FILE]
[FILE path="client/vite.config.js"]
...content...
[/FILE]

═══════════════════════════════════════════════════════
 PREVIEW HTML RULES
═══════════════════════════════════════════════════════
• React 18 UMD CDN + ReactDOM + Babel standalone + Three.js r128
• All components in one <script type="text/babel"> block
• All CSS in <style> in <head>
• Must run in iframe with zero setup
• CDN:
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

MANDATORY UI REQUIREMENTS:
① Color system: CSS custom properties on :root, follow the design bible colors exactly
② 3D Hero: Three.js canvas behind hero — torus or icosahedron, slow rotation, mouse parallax. CRITICAL: Double-check syntax when instantiating Three.js classes (e.g., new THREE.WebGLRenderer({ alpha: true });) to ensure all parentheses and curly braces are properly closed.
③ Scroll animations: IntersectionObserver, .section-reveal, opacity 0→1, translateY(30px)→0
④ Google Fonts: 2 fonts via <link> — geometric sans for body + expressive for headings, fluid clamp()
⑤ Micro-interactions: buttons scale(1.03) + box-shadow, cards translateY(-6px), nav underline from center

CONTENT RULES:
• Use ONLY the brand name from the brief
• NEVER invent phone/email/address/prices — use [Phone] [Email] [Address] [Price] labels
• Images: https://picsum.photos/seed/{keyword}/{w}/{h}
• Logo: typographic SVG using exact brand name

═══════════════════════════════════════════════════════
 REACT FILES RULES
═══════════════════════════════════════════════════════
• React 18 functional components + hooks
• Each component in its own file
• CSS custom properties matching the preview color system
• Hero: import * as THREE from 'three', useEffect cleanup on unmount. CRITICAL: Double-check syntax when instantiating Three.js classes (e.g., new THREE.WebGLRenderer({ alpha: true });) to ensure all parentheses and curly braces are properly closed.
• All CSS in client/src/styles/globals.css
• React Router v6 for routing
• NO TypeScript — plain JSX
• package.json: all deps listed
• vite.config.js: standard Vite React plugin

═══════════════════════════════════════════════════════
 CRITICAL: OUTPUT NOTHING ELSE
═══════════════════════════════════════════════════════
Start immediately with [PREVIEW]. End with the last [/FILE].
No markdown. No backticks outside file content. No explanations.`;
}

export async function runFrontend(plan, brief, brandName = "", logoData = "", selectedTheme = "minimal-clean", onFileGenerated = null) {
  const themePath = DESIGN_THEMES[selectedTheme] || DESIGN_THEMES["minimal-clean"];
  let designBibleContent = "";
  try {
    const resp = await fetch(`/${themePath}`);
    if (resp.ok) {
      designBibleContent = await resp.text();
    }
  } catch {
    // intentional
  }

  const logoNote = logoData
    ? `User provided a logo. In Navbar, use <img src="EASYWAY_INJECTED_LOGO_DATA_URL" alt="${brandName || plan.brandName} logo" />. Never use picsum for logo.`
    : `Generate a clean typographic SVG logo for "${brandName || plan.brandName || "Brand"}".`;

  const prompt = `Build the complete MERN frontend for:

BRAND: ${brandName || plan.brandName || "Not specified"}
THEME: ${selectedTheme}
LOGO: ${logoNote}

BRIEF:
${brief}

MERN PROJECT PLAN:
${JSON.stringify(plan, null, 2)}

ALL COMPONENTS TO GENERATE AS SEPARATE FILES:
${(plan.components || []).join(", ")}

CRITICAL: YOU MUST GENERATE A SEPARATE FILE FOR EVERY COMPONENT LISTED ABOVE. Do not skip any sections. Specifically ensure the Footer and Navbar are included and implemented fully.

CRITICAL: NEVER invent phone, email, address, or prices. Use [Phone] [Email] [Address] labels.`;

  if (onFileGenerated) onFileGenerated("frontend", "preview", "Generating CDN preview HTML...", "running");

  let raw = await callAI("minimax/minimax-m2.5:free", [{ role: "user", content: prompt }], buildSystemPrompt(designBibleContent));

  if (logoData) {
    raw = raw.replace(/EASYWAY_INJECTED_LOGO_DATA_URL/g, logoData);
  }

  const parsed = parseProjectFiles(raw);

  if (onFileGenerated && parsed.files) {
    for (const [filePath, content] of Object.entries(parsed.files)) {
      onFileGenerated("frontend", filePath, content, "done");
    }
    if (parsed.preview) onFileGenerated("frontend", "[PREVIEW]", parsed.preview, "done");
  }

  if (!parsed.preview && !Object.keys(parsed.files).length) {
    const { extractHtml } = await import("./callAI.js");
    return { preview: extractHtml(raw), files: {} };
  }

  return parsed;
}

export async function runFrontendEdit(existingPreview, existingFiles, changeRequest, brandName = "", logoData = "", selectedTheme = "minimal-clean") {
  const themePath = DESIGN_THEMES[selectedTheme] || DESIGN_THEMES["minimal-clean"];
  void brandName; // intentional
  let designBibleContent = "";
  try {
    const resp = await fetch(`/${themePath}`);
    if (resp.ok) {
      designBibleContent = await resp.text();
    }
  } catch {
    // intentional
  }

  let fileContext = "";
  for (const [path, content] of Object.entries(existingFiles)) {
    if (path.startsWith("client/")) {
      fileContext += `\n[FILE path="${path}"]\n${content}\n[/FILE]`;
    }
  }

  const prompt = `Modify the existing React frontend based on the user request.

USER CHANGE REQUEST:
"${changeRequest}"

EXISTING PREVIEW HTML:
[PREVIEW]
${existingPreview}
[/PREVIEW]

EXISTING REACT FILES:
${fileContext}

Regenerate the FULL modified HTML preview AND all required React files.
Keep the exact same strict output delimiters ([PREVIEW]...[/PREVIEW] and [FILE path="..."]).
Only change what is requested. Keep the design system consistent unless told otherwise.`;

  let raw = await callAI("minimax/minimax-m2.5:free", [{ role: "user", content: prompt }], buildSystemPrompt(designBibleContent));

  if (logoData) {
    raw = raw.replace(/EASYWAY_INJECTED_LOGO_DATA_URL/g, logoData);
  }

  const parsed = parseProjectFiles(raw);

  if (!parsed.preview && !Object.keys(parsed.files).length) {
    const { extractHtml } = await import("./callAI.js");
    return { preview: extractHtml(raw), files: existingFiles };
  }

  const mergedFiles = { ...existingFiles };
  for (const [path, content] of Object.entries(parsed.files)) {
    mergedFiles[path] = content;
  }

  return { preview: parsed.preview || existingPreview, files: mergedFiles };
}
