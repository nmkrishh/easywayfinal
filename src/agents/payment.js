/**
 * Agent 6 — Payment Agent (Trinity Large)
 * Only runs if structurePlan.payment === true
 * Adds Razorpay checkout to frontend HTML + Express backend code
 */
import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a payment integration expert.
Add a complete, production-ready Razorpay checkout flow to the provided
frontend HTML and backend Express server code.

Frontend requirements:
• Load Razorpay checkout.js from CDN: https://checkout.razorpay.com/v1/checkout.js
• Add purchase buttons to appropriate sections (pricing, product cards, CTA)
• Implement the Razorpay.open() call with proper options object
• Handle payment success and failure callbacks with UI feedback
• Show order confirmation overlay on success

Backend requirements:
• Add POST /create-order route (Razorpay order creation)
• Add POST /verify-payment route (signature verification using crypto)
• Include RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as config constants at top
• Include proper error handling

Return BOTH files separated by exactly this delimiter:
===FRONTEND===
[complete HTML]
===BACKEND===
[complete server.js]`;

/**
 * @param {string} frontendHtml — HTML from Agent 3 (possibly modified by Agent 4/5)
 * @param {string} backendCode  — server.js from Agent 5
 * @returns {Promise<{frontend: string, backend: string}>}
 */
export async function runPayment(frontendHtml, backendCode) {
  const prompt = `Add Razorpay payment integration to these files.

===EXISTING FRONTEND===
${frontendHtml}

===EXISTING BACKEND===
${backendCode}`;

  const raw = await callAI(
    MODELS.agentic,
    [{ role: "user", content: prompt }],
    SYSTEM,
  );

  // Parse the delimiter-separated output
  const frontMatch = raw.match(/===FRONTEND===\s*([\s\S]+?)(?:===BACKEND===|$)/i);
  const backMatch  = raw.match(/===BACKEND===\s*([\s\S]+?)$/i);

  return {
    frontend: frontMatch ? frontMatch[1].trim() : frontendHtml,
    backend:  backMatch  ? backMatch[1].trim()  : backendCode,
  };
}
