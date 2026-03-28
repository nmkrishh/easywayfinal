/**
 * Agent 7 — High-Conversion Optimizer (Minimax)
 * Validates and restructures the finished website HTML to guarantee extremely high conversion rates.
 */
import { callAI, MODELS, extractHtml } from "./callAI.js";

const SYSTEM = `You are a world-class Conversion Rate Optimization (CRO) expert and Elite Web Architect.
Your job is to review the finished single-file React HTML code and ensure its structure is extremely high-converting and flawlessly laid out.

Review the HTML and make structural improvements:
1. Ensure the Hero Section has an incredibly strong, benefit-driven H1 headline and a clear CTA button above the fold.
2. Fix any unaligned or messy elements, ensuring CSS Grid / Flexbox layouts are perfectly proportioned.
3. Enhance the visual hierarchy: make primary buttons pop, soften secondary text, and add plenty of breathing room (whitespace).
4. Introduce trust signals (testimonials, guarantees, clean logos) if they are missing or poorly placed.
5. Fix any JavaScript or React component syntax errors to ensure flawless rendering.

Return ONLY the deeply optimized, high-converting raw HTML code. Do not add markdown backticks.`;

/**
 * @param {string} previewHtml — CDN preview HTML from Agent 3
 * @returns {Promise<string>} High-converting HTML
 */
export async function runFixer(previewHtml) {
  if (!previewHtml) return previewHtml;

  try {
    const raw = await callAI(
      MODELS.primary, // Using minimax primary model for deep optimization
      [{ role: "user", content: `Please optimize this React HTML structure for maximum conversion rates and fix any structural flaws:\n\n${previewHtml}` }],
      SYSTEM,
    );
    return extractHtml(raw) || previewHtml;
  } catch (e) {
    console.warn("[optimizer] Failed, using original preview:", e.message);
    return previewHtml;
  }
}
