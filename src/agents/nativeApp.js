import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a React Native + Expo expert.
Build a complete, production-ready Expo app. All screens fully implemented. No placeholders. No comments in code output.

Requirements:
- Expo SDK (latest) + React Navigation v6
- Complete navigation stack/tab setup
- All screens implemented with real logic
- StyleSheet.create for all styles
- Dark theme default, Appearance API for system preference
- Professional UI: clean cards, proper spacing, consistent typography
- API calls to backend with loading/error states

Output: complete App.js first, then each screen as separate section.
No markdown. No backticks. Pure React Native code only.`;

export async function runNativeApp(structurePlan, enhancedBrief) {
  const prompt = `Build a complete Expo React Native app.

BRIEF:
${enhancedBrief}

STRUCTURE PLAN:
${JSON.stringify(structurePlan, null, 2)}`;

  return callAI(MODELS.primary, [{ role: "user", content: prompt }], SYSTEM);
}
