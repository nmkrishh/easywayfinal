import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a conversion copywriter and product strategist.
Transform the raw user prompt into a detailed, marketing-focused website brief.
Include: target audience, tone of voice, key value propositions, sections, and features.
Output only the enhanced brief. No preamble. No markdown fences. No explanations. No comments.`;

export async function runEnhancer(userPrompt) {
  return callAI(MODELS.agentic, [{ role: "user", content: userPrompt }], SYSTEM);
}
