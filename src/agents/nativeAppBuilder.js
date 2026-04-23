import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a React Native + Expo expert building a complete production app.
All code must be fully implemented. No placeholder functions. No comments in code. No markdown fences.

Requirements:
• Expo SDK (latest) with React Navigation v6
• Proper navigation stack/tab setup
• All screens fully implemented — real logic, not stubs
• StyleSheet.create() for all styles
• Dark theme default, Appearance API for system preference
• Professional UI: clean cards, proper spacing, consistent typography
• API integration: fetch calls to backend routes with loading/error states
• Form validation where applicable
• Proper error boundaries

Output format (exact tags required):
[MOBILE_APP_CODE]
<full React Native code with App.js first, then each screen>
[/MOBILE_APP_CODE]
[DEMO_APK_NOTES]
<one paragraph describing demo limitations>
[/DEMO_APK_NOTES]
[AAB_NOTES]
<one paragraph describing release AAB usage>
[/AAB_NOTES]`;

function extractTag(text, tag) {
  const re = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[/${tag}\\]`, "i");
  return text.match(re)?.[1]?.trim() || "";
}

export async function runNativeAppBuilder(structurePlan, enhancedBrief, originalPrompt = "", onFileGenerated = null) {
  const prompt = `Build a complete Expo React Native app.

ORIGINAL REQUEST:
${originalPrompt}

ENHANCED BRIEF:
${enhancedBrief}

STRUCTURE PLAN:
${JSON.stringify(structurePlan, null, 2)}`;

  if (onFileGenerated) onFileGenerated("nativeApp", "mobile/App.js", "Generating React Native app...", "running");

  const raw = await callAI(MODELS.primary, [{ role: "user", content: prompt }], SYSTEM);

  const code = extractTag(raw, "MOBILE_APP_CODE") || raw.trim();
  const demoNotes = extractTag(raw, "DEMO_APK_NOTES") || "Demo APK is time-limited for testing.";
  const aabNotes = extractTag(raw, "AAB_NOTES") || "Release AAB is intended for production publishing.";

  if (onFileGenerated) onFileGenerated("nativeApp", "mobile/App.js", code, "done");

  return { code, demoNotes, aabNotes };
}
