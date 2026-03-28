/**
 * Agent 4 — React Native App Agent (MiniMax M2.5)
 * Only runs if structurePlan.react_native === true
 * Structure JSON → complete Expo React Native app code
 */
import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a React Native expert specialising in Expo apps.
Write a complete, production-ready Expo React Native app with all screens,
navigation (React Navigation), and components needed for the website concept.

Requirements:
• Use Expo SDK (latest) with React Navigation v6
• Include proper navigation stack / tab setup
• All screens fully implemented — no placeholder code
• Use StyleSheet.create for all styles
• Dark theme by default; use Appearance API for system preference
• Professional UI — clean cards, proper spacing, typography

Output the complete App.js and all required screen files as a single code block.
Format: first write App.js, then each screen as a commented section.
No markdown other than the code block. Pure React Native code only.`;

/**
 * @param {object} structurePlan — JSON from Agent 2
 * @param {string} enhancedBrief — text from Agent 1
 * @returns {Promise<string>} React Native app code
 */
export async function runNativeApp(structurePlan, enhancedBrief) {
  const prompt = `Build a complete Expo React Native app for this concept.

BRIEF:
${enhancedBrief}

STRUCTURE PLAN:
${JSON.stringify(structurePlan, null, 2)}`;

  return callAI(
    MODELS.primary,
    [{ role: "user", content: prompt }],
    SYSTEM,
  );
}
