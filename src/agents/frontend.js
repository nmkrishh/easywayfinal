/**
 * Agent 3 — MERN Frontend Agent (MiniMax M2.5)
 * Generates a complete React project (separate components) + CDN preview HTML
 *
 * Output format (must be exact — parsed by parseProjectFiles):
 *
 *   [PREVIEW]
 *   <!DOCTYPE html>...</html>
 *   [/PREVIEW]
 *   [FILE path="client/src/App.jsx"]
 *   ...
 *   [/FILE]
 *   [FILE path="client/src/components/Navbar.jsx"]
 *   ...
 *   [/FILE]
 *   ... (all components)
 */
import { callAI, MODELS, parseProjectFiles } from "./callAI.js";

const SYSTEM = `You are a world-class Senior React Engineer and UI/UX Designer.
Build a complete MERN stack frontend as SEPARATE React components.
This is for a REAL production project — no placeholders, no shortcuts.

═══════════════════════════════════════════════════════
 OUTPUT FORMAT — STRICTLY REQUIRED
═══════════════════════════════════════════════════════

Output EXACTLY in this format with these delimiters:

1. First the CDN preview HTML (runs in iframe without a bundler):
[PREVIEW]
<!DOCTYPE html>...complete HTML with React CDN + Babel + ThreeJS...</html>
[/PREVIEW]

2. Then each React project file:
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
... (ALL components from the plan)
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
 PREVIEW HTML RULES (inside [PREVIEW]...[/PREVIEW])
═══════════════════════════════════════════════════════
• Use React 18 UMD CDN + ReactDOM + Babel standalone + Three.js r128
• All components inlined in one <script type="text/babel"> block
• All CSS in a <style> block in <head>
• Must render in iframe with zero setup

CDN links to include:
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

─── MANDATORY UI FEATURES ────────────────────────────

① MONOCHROME COLOR SYSTEM
  • Use CSS custom properties on :root
  • Stick to a clean, professional monochrome palette unless the brand strictly dictates otherwise.
  • Default: --bg:#0a0a0a; --surface:#111; --border:#222; --text:#f0f0f0; --muted:#888; --accent:#ffffff

② 3D HERO BACKGROUND (Three.js r128)
  • Create a Three.js canvas behind the hero section
  • Add a floating 3D geometric shape (torus, sphere, or icosahedron)
  • Animate with requestAnimationFrame (slow rotation)
  • Mouse parallax: slight camera offset on mousemove
  • Use monochrome materials (MeshStandardMaterial, white/grey wireframe)

③ SCROLL ANIMATIONS
  • IntersectionObserver: every section .section-reveal fades + slides up on enter
  • CSS: opacity 0 → 1, translateY(30px) → 0, transition 0.6s ease
  • Stagger children with nth-child delay

④ GOOGLE FONTS
  • Import 2 fonts via <link> (geometric sans for body + expressive for headings)
  • Fluid typography with clamp()

⑤ MICRO-INTERACTIONS
  • Buttons: scale(1.03) + box-shadow on hover
  • Cards: translateY(-6px) + deeper shadow on hover
  • Nav links: underline animation from center

─── CONTENT RULES (CRITICAL) ─────────────────────────
• Use ONLY the brand name and details from the brief + user answers
• NEVER invent phone numbers, emails, addresses, or prices
• Use [Phone] [Email] [Address] [Price] as visible placeholders
• Images: https://picsum.photos/seed/{keyword}/{w}/{h}
• Logo: typographic SVG using the exact brand name provided

═══════════════════════════════════════════════════════
 REACT PROJECT FILES RULES
═══════════════════════════════════════════════════════
• Use React 18 functional components + hooks (useState, useEffect, useRef)
• Each component in its own file under client/src/components/
• Use CSS custom properties (matching the preview's color system)
• Include Three.js import at top of Hero component: import * as THREE from 'three'
• Use useEffect with proper cleanup for Three.js (dispose on unmount)
• All CSS in client/src/styles/globals.css (matches preview CSS variables)
• React Router v6 for routing (if multi-page)
• NO TypeScript — plain JSX only
• package.json must list all dependencies (react, react-dom, vite, three, react-router-dom)
• vite.config.js with standard Vite React plugin setup

═══════════════════════════════════════════════════════
 IMPORTANT — OUTPUT NOTHING ELSE
═══════════════════════════════════════════════════════
No explanations. No markdown. No comments outside the delimiters.
Start immediately with [PREVIEW] and end with the last [/FILE].`;

/**
 * @param {object} plan         — JSON from structurer
 * @param {string} brief        — enhanced brief from enhancer
 * @param {string} [brandName]  — brand name from intake
 * @param {string} [logoData]   — uploaded logo as data URL (optional)
 * @returns {Promise<{ preview: string, files: Record<string,string> }>}
 */
export async function runFrontend(plan, brief, brandName = "", logoData = "") {
  const logoNote = logoData
    ? `The user has uploaded a logo. Include it in the Navbar exactly as an <img> tag with src="EASYWAY_INJECTED_LOGO_DATA_URL". Do NOT use picsum for the logo.`
    : `Generate a clean typographic SVG logo for "${brandName || plan.brandName || "Brand"}".`;

  const prompt = `Build the complete MERN frontend for:

BRAND NAME: ${brandName || plan.brandName || "Not specified"}
LOGO: ${logoNote}

BRIEF:
${brief}

MERN PROJECT PLAN:
${JSON.stringify(plan, null, 2)}

Generate ALL these components as separate files:
${(plan.components || []).join(", ")}

Remember: NEVER invent phone numbers, emails, addresses, or prices.
Use placeholder labels like [Phone], [Email], [Address] where user data would go.`;

  let raw = await callAI(
    MODELS.primary,
    [{ role: "user", content: prompt }],
    SYSTEM,
  );

  // Re-inject the massive base64 logo data back into the raw output to bypass AI token limits
  if (logoData) {
    raw = raw.replace(/EASYWAY_INJECTED_LOGO_DATA_URL/g, logoData);
  }

  const parsed = parseProjectFiles(raw);

  // Fallback if delimiter parsing failed — treat entire output as preview
  if (!parsed.preview && !Object.keys(parsed.files).length) {
    const { extractHtml } = await import("./callAI.js");
    return { preview: extractHtml(raw), files: {} };
  }

  return parsed;
}

/**
 * runFrontendEdit — Chatbot iterative RAG editor
 * @param {string} existingPreview 
 * @param {Record<string,string>} existingFiles
 * @param {string} changeRequest
 * @param {string} brandName
 * @param {string} logoData
 */
export async function runFrontendEdit(existingPreview, existingFiles, changeRequest, brandName = "", logoData = "") {
  let fileContext = "";
  for (const [path, content] of Object.entries(existingFiles)) {
    if (path.startsWith("client/")) { // Only send frontend files into context
      fileContext += `\n[FILE path="${path}"]\n${content}\n[/FILE]`;
    }
  }

  const prompt = `You previously generated this React frontend site.
The user wants you to act like a chatbot modifying the existing code based on their request.

USER CHANGE REQUEST:
"${changeRequest}"

EXISTING PREVIEW HTML:
[PREVIEW]
${existingPreview}
[/PREVIEW]

EXISTING REACT FILES:
${fileContext}

Based on their request, regenerate the FULL modified HTML preview AND all the required React files.
Keep the exact same strict output delimiters ([PREVIEW] ... [/PREVIEW] and [FILE path="..."]).
Only change what is requested, keeping the design consistent unless told otherwise.
If they ask for UI iterations, integrate them seamlessly into the monochrome aesthetic.`;

  let raw = await callAI(
    MODELS.primary,
    [{ role: "user", content: prompt }],
    SYSTEM
  );

  if (logoData) {
    raw = raw.replace(/EASYWAY_INJECTED_LOGO_DATA_URL/g, logoData);
  }

  const parsed = parseProjectFiles(raw);

  if (!parsed.preview && !Object.keys(parsed.files).length) {
    const { extractHtml } = await import("./callAI.js");
    return { preview: extractHtml(raw), files: existingFiles };
  }

  // Merge the updated frontend files with any files the agent didn't touch
  const mergedFiles = { ...existingFiles };
  for (const [path, content] of Object.entries(parsed.files)) {
    mergedFiles[path] = content;
  }

  return { preview: parsed.preview || existingPreview, files: mergedFiles };
}
