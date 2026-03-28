/**
 * callAI.js — Shared OpenRouter API helper + model constants
 * Used by all 8 builder agents.
 */

// ── API key ─────────────────────────────────────────────────────────────────
const OPENROUTER_API_KEY = "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";

// ── Model constants ──────────────────────────────────────────────────────────
export const MODELS = {
  primary:  "minimax/minimax-m2.5:free",             // MERN code generation
  fast:     "stepfun/step-3.5-flash:free",           // Quick tasks + fallback
  agentic:  "arcee-ai/trinity-large-preview:free",   // Planning + backend
};

/**
 * callAI — shared fetch helper for all agents.
 */
export async function callAI(model, messages, systemPrompt, attempt = 0) {
  let finalSystemPrompt = systemPrompt;
  if (typeof window !== "undefined") {
    try {
      const fbText = localStorage.getItem("ew_ai_feedback");
      if (fbText && systemPrompt) {
        const fbArr = JSON.parse(fbText);
        if (fbArr.length > 0) {
          const lastFew = fbArr.slice(-3); // Teach from latest 3 feedback items
          const fbString = lastFew.map((f, i) => `[Past Generation Rating ${i+1}]: Frontend ${f.ratings?.frontend}/5, Backend ${f.ratings?.backend}/5, Overall ${f.ratings?.overall}/5. User Comment: "${f.comment}"`).join("\n");
          finalSystemPrompt = systemPrompt + "\n\nCRITICAL CONTEXT - LEARN FROM PAST MISTAKES:\nUsers have provided the following feedback on your previous code generations. Use this to improve your current output:\n" + fbString;
        }
      }
    } catch (e) {
      // Ignore localStorage parsing errors
    }
  }

  const body = {
    model,
    messages: finalSystemPrompt
      ? [{ role: "system", content: finalSystemPrompt }, ...messages]
      : messages,
  };

  let res;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://easyway.app",
        "X-OpenRouter-Title": "EasyWay",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    return _retry(model, messages, systemPrompt, attempt, networkErr);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return _retry(model, messages, systemPrompt, attempt, new Error(`HTTP ${res.status}: ${errBody.slice(0, 120)}`));
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return _retry(model, messages, systemPrompt, attempt, new Error("Empty response from model"));
  }
  return content;
}

/** Internal retry logic — same model once, then fallback to MODELS.fast */
async function _retry(model, messages, systemPrompt, attempt, originalErr) {
  if (attempt === 0) {
    console.warn(`[callAI] Retry 1 — same model (${model})`, originalErr?.message);
    return callAI(model, messages, systemPrompt, 1);
  }
  if (attempt === 1 && model !== MODELS.fast) {
    console.warn(`[callAI] Retry 2 — fallback to MODELS.fast`, originalErr?.message);
    return callAI(MODELS.fast, messages, systemPrompt, 2);
  }
  throw originalErr;
}

/**
 * parseProjectFiles — parse delimiter-based multi-file output.
 *
 * Input format the agents must produce:
 *   [PREVIEW]
 *   <!DOCTYPE html>...</html>
 *   [/PREVIEW]
 *   [FILE path="client/src/App.jsx"]
 *   ...JSX content...
 *   [/FILE]
 *
 * @param {string} text — raw model output
 * @returns {{ preview: string, files: Record<string,string> }}
 */
export function parseProjectFiles(text) {
  const preview = text.match(/\[PREVIEW\]([\s\S]+?)\[\/PREVIEW\]/)?.[1]?.trim() ?? "";
  const files   = {};

  const fileRe = /\[FILE path="([^"]+)"\]([\s\S]+?)\[\/FILE\]/g;
  let m;
  while ((m = fileRe.exec(text)) !== null) {
    const [, filePath, content] = m;
    files[filePath.trim()] = content.trim();
  }

  return { preview, files };
}

/** Strip markdown fences and extract raw HTML if present */
export function extractHtml(text) {
  const fence = text.match(/```(?:html)?\s*([\s\S]+?)```/i);
  if (fence) return fence[1].trim();
  const doc = text.match(/<!DOCTYPE[\s\S]+/i);
  if (doc) return doc[0].trim();
  return text.trim();
}
