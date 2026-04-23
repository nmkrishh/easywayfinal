const REQUEST_TIMEOUT_MS = 120000;

const PRODUCTION_CODE_STANDARDS = `
ABSOLUTE CODING RULES — PRODUCTION LEVEL ONLY:
1. Output ONLY raw code. Zero comments, zero explanations, zero instructions in code files.
2. No placeholder functions, no TODO comments, no stub implementations.
3. Every function must be fully implemented with real working logic.
4. All error handling with try/catch where needed.
5. All imports must match exactly what is exported — no missing or broken imports.
6. No TypeScript in JSX files — plain JSX only. No 'as' keyword casts in .jsx files.
7. CSS: Use CSS custom properties on :root. No inline style blobs unless necessary.
8. React: Use functional components + hooks only. No class components.
9. All useEffect hooks must have cleanup functions where applicable (clearTimeout, removeEventListener, etc.).
10. No dead code — every variable and import must be used.

UI/UX PROFESSIONAL RULES:
- No emoji icons in UI — use SVG icons (Heroicons/Lucide patterns)
- All clickable elements have cursor:pointer
- Hover states: smooth transitions 150-300ms, no layout shift
- Contrast: body text #0F172A min on light, sufficient on dark
- Responsive at 375px, 768px, 1024px, 1440px breakpoints
- No horizontal scroll on mobile
- All images have alt attributes
- Form inputs have associated labels
- No content hidden behind fixed navbars — account for navbar height

REACT COMPONENT RULES:
- Use React.memo() for pure display components
- Use useCallback() for event handlers passed as props
- Use useMemo() for expensive computed values
- Cleanup Three.js scenes on unmount (renderer.dispose(), geometry.dispose(), material.dispose())
- No direct DOM manipulation except via refs
`;

const DESIGN_CODE_RULES = `
DESIGN IMPLEMENTATION RULES:
- Implement EVERY design token from the design system as CSS custom properties
- Pixel-perfect spacing using the design system grid (4px/8px base)
- Typography exactly as specified: font-family, size, weight, line-height
- Button styles exactly as specified: border-radius, padding, hover states
- Card/component styles exactly as the design system describes
- The design system is LAW — no deviations without explicit reason
`;

export const MODELS = {
  primary: "minimax/minimax-m2.5:free",
  fast: "google/gemma-4-26b-a4b-it:free",
  agentic: "tencent/hy3-preview:free",
  backup: "google/gemma-4-26b-a4b-it:free",
};

export async function callAI(model, messages, systemPrompt) {
  let OPENROUTER_API_KEY = "";
  if (typeof process !== "undefined" && process.env && process.env.OPEN_ROUTER_API_KEY) {
    OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
  } else {
    try {
      OPENROUTER_API_KEY = import.meta.env.VITE_OPEN_ROUTER_API_KEY;
    } catch (e) {
      OPENROUTER_API_KEY = "";
    }
  }

  let finalSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${PRODUCTION_CODE_STANDARDS}\n\n${DESIGN_CODE_RULES}`
    : `${PRODUCTION_CODE_STANDARDS}\n\n${DESIGN_CODE_RULES}`;

  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPEN_ROUTER_API_KEY. If you just added VITE_OPEN_ROUTER_API_KEY to .env, please restart your Vite dev server.");
  }

  if (typeof window !== "undefined") {
    try {
      const fbText = localStorage.getItem("ew_ai_feedback");
      if (fbText && systemPrompt) {
        const fbArr = JSON.parse(fbText);
        if (fbArr.length > 0) {
          const lastFew = fbArr.slice(-3);
          const fbString = lastFew
            .map(
              (f, i) =>
                `[Past Generation Rating ${i + 1}]: Frontend ${f.ratings?.frontend}/5, Backend ${f.ratings?.backend}/5, Overall ${f.ratings?.overall}/5. User Comment: "${f.comment}"`
            )
            .join("\n");
          finalSystemPrompt = `${finalSystemPrompt}\n\nCRITICAL CONTEXT — LEARN FROM PAST MISTAKES:\n${fbString}`;
        }
      }
    } catch {
      // intentional
    }
  }

  const chain = buildModelChain(model);
  let lastErr;

  for (let i = 0; i < chain.length; i++) {
    const currentModel = chain[i];
    const body = {
      model: currentModel,
      temperature: 1.0,
      top_p: 0.98,
      messages: finalSystemPrompt
        ? [{ role: "system", content: finalSystemPrompt }, ...messages]
        : messages,
    };

    let res;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
        signal: controller.signal,
      });
    } catch (networkErr) {
      const timeoutErr =
        networkErr?.name === "AbortError"
          ? new Error(`Timeout after ${REQUEST_TIMEOUT_MS / 1000}s on model ${currentModel}`)
          : networkErr;
      lastErr = timeoutErr;
      if (i < chain.length - 1) {
        console.warn(`[callAI] network/timeout on ${currentModel}, trying fallback`, timeoutErr?.message);
        continue;
      }
      throw timeoutErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      lastErr = err;
      if (shouldTryNextModel(res.status, errBody) && i < chain.length - 1) {
        console.warn(`[callAI] ${currentModel} unavailable, trying fallback`, err.message);
        continue;
      }
      throw err;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) return content;

    lastErr = new Error(`Empty response from model: ${currentModel}`);
    if (i < chain.length - 1) {
      console.warn(`[callAI] empty response on ${currentModel}, trying fallback`);
      continue;
    }
    throw lastErr;
  }

  throw lastErr || new Error("All model attempts failed");
}

function buildModelChain(requestedModel) {
  const codingChain = [MODELS.primary, MODELS.fast, MODELS.agentic, MODELS.backup];
  if (requestedModel === MODELS.primary || requestedModel === MODELS.fast) {
    return codingChain;
  }
  return [requestedModel, ...codingChain.filter((m) => m !== requestedModel)];
}

function shouldTryNextModel(status, bodyText = "") {
  const txt = bodyText.toLowerCase();
  return (
    status === 404 ||
    status === 429 ||
    status >= 500 ||
    txt.includes("no endpoints available") ||
    txt.includes("temporarily") ||
    txt.includes("rate limit") ||
    txt.includes("provider returned error")
  );
}

export function parseProjectFiles(text) {
  const preview = text.match(/\[PREVIEW\]([\s\S]+?)\[\/PREVIEW\]/)?.[1]?.trim() ?? "";
  const files = {};
  const fileRe = /\[FILE path="([^"]+)"\]([\s\S]+?)\[\/FILE\]/g;
  let m;
  while ((m = fileRe.exec(text)) !== null) {
    const [, filePath, content] = m;
    files[filePath.trim()] = content.trim();
  }
  return { preview, files };
}

export function extractHtml(text) {
  const fence = text.match(/```(?:html)?\s*([\s\S]+?)```/i);
  if (fence) return fence[1].trim();
  const doc = text.match(/<!DOCTYPE[\s\S]+/i);
  if (doc) return doc[0].trim();
  return text.trim();
}
