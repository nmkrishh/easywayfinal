/**
 * Agent 1 — Prompt Enhancer (Trinity Large)
 * Raw user prompt → detailed high-conversion website brief
 */
import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a conversion copywriter and UX strategist.
Enhance this prompt into a detailed, marketing-focused brief
with sections, features, target audience, and tone defined.
Keep it concise but precise — this will be fed to a software architect next.
Output only the enhanced brief. No preamble. No fences.`;

/**
 * @param {string} userPrompt — the raw user input
 * @returns {Promise<string>} enhanced brief text
 */
export async function runEnhancer(userPrompt) {
  return callAI(
    MODELS.agentic,
    [{ role: "user", content: userPrompt }],
    SYSTEM,
  );
}
