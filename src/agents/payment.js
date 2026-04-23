import { callAI, MODELS } from "./callAI.js";

const SYSTEM = `You are a payment integration expert.
Add a complete, production-ready Razorpay checkout flow.
Output ONLY the two files. No explanations. No comments. No markdown.

Frontend requirements:
• Load Razorpay: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
• Add purchase buttons to pricing/product/CTA sections
• Implement Razorpay.open() with options object
• Handle success/failure callbacks with UI feedback
• Show order confirmation overlay on success

Backend requirements:
• POST /create-order (Razorpay order creation)
• POST /verify-payment (signature verification using crypto)
• RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as env vars
• Proper error handling on both routes

Separator format:
===FRONTEND===
[complete HTML]
===BACKEND===
[complete server.js]`;

export async function runPayment(frontendHtml, backendCode) {
  const prompt = `Add Razorpay payment integration to these files.

===EXISTING FRONTEND===
${frontendHtml}

===EXISTING BACKEND===
${backendCode}`;

  const raw = await callAI(MODELS.agentic, [{ role: "user", content: prompt }], SYSTEM);

  const frontMatch = raw.match(/===FRONTEND===\s*([\s\S]+?)(?:===BACKEND===|$)/i);
  const backMatch = raw.match(/===BACKEND===\s*([\s\S]+?)$/i);

  return {
    frontend: frontMatch ? frontMatch[1].trim() : frontendHtml,
    backend: backMatch ? backMatch[1].trim() : backendCode,
  };
}
