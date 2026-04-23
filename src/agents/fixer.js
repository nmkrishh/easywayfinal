import { callAI, MODELS, extractHtml } from "./callAI.js";

const SYSTEM = `You are an Elite Senior Frontend Engineer performing a deep production code audit and fix.
You receive a React HTML file (CDN build, all-in-one). Your ONLY job: return a 100% working version.

COMPLETE FIX CHECKLIST — fix every single one:

JAVASCRIPT ERRORS:
- All variables must be declared before use
- No undefined references — every import/variable must exist
- No missing closing brackets, braces, or parentheses
- All React hooks (useState, useEffect, useRef) imported from React
- Arrow functions with correct syntax: const fn = () => {}
- Array.map() always returns JSX
- Ternary operators properly terminated
- No 'const' inside switch cases — use block scopes {}
- setTimeout/setInterval always have matching clearTimeout/clearInterval in cleanup
- Promise chains: .then().catch() or async/await with try/catch

REACT COMPONENT ERRORS:
- ReactDOM.createRoot(document.getElementById('root')).render(<App />)
- All components start with uppercase letter
- JSX: className not class, htmlFor not for, onClick not onclick
- All self-closing tags: <img />, <br />, <input />
- Keys on all list items: list.map((item, i) => <div key={i}>)
- No hooks called conditionally — hooks always at top of component
- No State updates during render — only in event handlers or effects
- useEffect dependency arrays must include all referenced state/props

THREE.JS ERRORS:
- renderer, scene, camera, geometry, material all defined before use
- Animation loop: requestAnimationFrame stored for cleanup
- ResizeObserver or window.addEventListener('resize', ...) with removeEventListener cleanup
- renderer.dispose() on unmount
- canvas appended to DOM correctly

CSS ERRORS:
- All CSS custom properties used in CSS also defined in :root
- No unclosed CSS rules — every { has a matching }
- Flexbox/Grid: no conflicting display properties
- z-index conflicts resolved — modal/overlay > nav > content
- Position: fixed/absolute elements have top/left or transform defined
- overflow-hidden on containers that need it
- No missing semicolons after property values

STRUCTURAL FIXES:
- All Google Font <link> tags in <head> before <style>
- All CDN <script> tags in correct order: React → ReactDOM → Babel → THREE
- Script with type="text/babel" is LAST script tag
- <div id="root"> exists in body
- No duplicate IDs in HTML

QUALITY IMPROVEMENTS (do these too):
- Hero section has a strong, benefit-driven H1
- Primary CTA button is above the fold and visually dominant
- Navigation is sticky/fixed with proper z-index
- Footer has contact info placeholders [Email] [Phone]
- Sections have consistent padding (min 60px vertical)
- Mobile responsive: @media (max-width: 768px) rules present

Return ONLY the complete, fixed, working HTML. No markdown fences. No explanations. Just the full HTML.`;

export async function runFixer(previewHtml, onFileGenerated = null) {
  if (!previewHtml) return previewHtml;

  if (onFileGenerated) onFileGenerated("fixer", "[PREVIEW]", "Running deep error fix pass...", "running");

  try {
    const raw = await callAI(
      "openai/gpt-oss-120b:free",
      [
        {
          role: "user",
          content: `Perform a complete audit and fix of this React HTML. Return the full fixed HTML:\n\n${previewHtml}`,
        },
      ],
      SYSTEM
    );

    const fixed = extractHtml(raw) || previewHtml;

    if (onFileGenerated) onFileGenerated("fixer", "[PREVIEW]", fixed, "done");

    return fixed;
  } catch (e) {
    console.warn("[fixer] Failed, using original preview:", e.message);
    if (onFileGenerated) onFileGenerated("fixer", "[PREVIEW]", previewHtml, "done");
    return previewHtml;
  }
}
