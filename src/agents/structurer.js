/**
 * Agent 2 — Structure Orchestrator (Trinity Large)
 * Enhanced prompt → strict JSON MERN project plan
 */
import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a senior software architect specialising in MERN stack applications.
Given an enhanced website brief, output a strictly valid JSON project plan.
Output ONLY valid JSON — no explanation, no markdown, no backticks, no extra text.

The JSON must have exactly these fields:
{
  "siteName": "Brand/project name from the brief",
  "brandName": "Exact brand name from the brief",
  "pages": ["Home", "About", ...],
  "components": ["Navbar", "Hero", "Features", "Footer", ...],
  "backend_routes": [
    { "method": "POST", "path": "/api/contact", "description": "Contact form" }
  ],
  "models": ["Contact"],
  "payment": false,
  "react_native": false,
  "color_theme": "Monochrome",
  "target_audience": "...",
  "key_features": ["..."],
  "sections": ["Hero", "Features", "About", "Contact", "Footer"]
}

Rules:
- "components" = all React components needed (Navbar, Hero, each section, Footer, shared UI)
- "models" = MongoDB Mongoose models needed (Contact, Product, Newsletter, etc.)
- "backend_routes" = REST API endpoints that match the components/features
- "color_theme" = "Monochrome" by default unless brief explicitly specifies colors
- Set "react_native" to true ONLY if brief explicitly mentions a mobile app
- Set "payment" to true ONLY if brief explicitly mentions payments or ecommerce
- Component names must be PascalCase, single words or short phrases
- Keep "brandName" exact from the brief (never invent a name)`;

/**
 * @param {string} enhancedBrief
 * @returns {Promise<object>} Parsed MERN project plan
 */
export async function runStructurer(enhancedBrief) {
  const raw = await callAI(
    MODELS.agentic,
    [{ role: "user", content: `Website brief:\n${enhancedBrief}` }],
    SYSTEM,
  );

  const clean = raw.replace(/```[\w]*\n?/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (_) {
    const match = clean.match(/\{[\s\S]+\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) {}
    }
    console.warn("[structurer] JSON parse failed, using defaults");
    return {
      siteName: "My Website",
      brandName: "My Brand",
      pages: ["Home"],
      components: ["Navbar", "Hero", "Features", "Footer"],
      backend_routes: [{ method: "POST", path: "/api/contact", description: "Contact form" }],
      models: ["Contact"],
      payment: false,
      react_native: false,
      color_theme: "Monochrome",
      target_audience: "General",
      key_features: [],
      sections: ["Hero", "Features", "Contact", "Footer"],
    };
  }
}
