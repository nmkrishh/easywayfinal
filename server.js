/**
 * EasyWay AI Website Builder – Backend Server
 * ============================================
 * Express server that:
 *   1. Receives a prompt from the frontend
 *   2. Calls the Gemini API (google/gemini-2.5-flash) to generate a full HTML website
 *   3. Streams rendered HTML back to the client (SSE)
 *   4. Handles publish requests (saves to /sites/ directory, returns public URL)
 *
 * Usage:
 *   npm install express cors dotenv @google/genai multer
 *   node server.js
 *
 * .env variables:
 *   GEMINI_API_KEY=your_key_here
 *   PORT=3001
 *   SITES_DIR=./public/sites       (absolute path to where published sites are saved)
 *   BASE_URL=http://localhost:3001  (base URL for published site links)
 */

import express      from "express";
import cors         from "cors";
import dotenv       from "dotenv";
import fs           from "fs/promises";
import path         from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI }   from "@google/genai";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app   = express();
const PORT  = process.env.PORT     || 3001;
const SITES = process.env.SITES_DIR || path.join(__dirname, "public", "sites");
const BASE  = process.env.BASE_URL  || `http://localhost:${PORT}`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "4mb" }));
app.use("/sites", express.static(SITES));   // serve published sites

// ── Ensure /sites folder exists ───────────────────────────────────────────────
await fs.mkdir(SITES, { recursive: true }).catch(() => {});

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert web designer and frontend developer.
Your job is to generate a complete, beautiful, production-ready single-file HTML website.

Rules:
- Output ONLY raw HTML (no markdown fences, no explanation, no backticks).
- The HTML must be complete: <!DOCTYPE html> ... </html>
- Use inline <style> for all CSS — NO external stylesheets.
- Use inline <script> for any JS — NO external scripts except fonts via their CDN link tags.
- Google Fonts are allowed via a <link> tag.
- Make it visually stunning: modern gradient backgrounds, glassmorphism cards, smooth transitions.
- Fully responsive (mobile-first).
- The design must match the user's business / product niche perfectly.
- Include realistic demo content (proper headings, copy, feature cards, CTA section, footer).
- Do NOT add a "Buy our product" CTA unless the user explicitly asked for one.
- Dark mode is preferred unless the user asks for light mode.
`;

// ── Helper: build the user message ───────────────────────────────────────────
function buildUserMessage(conversation) {
  // conversation: [{ role: "user"|"assistant", content: "..." }, ...]
  const lines = conversation.map(m => `${m.role.toUpperCase()}: ${m.content}`);
  lines.push("ASSISTANT:");
  return lines.join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/builder/generate
// Body: { conversation: [{ role, content }] }
// Response: text/event-stream with { type: "chunk"|"done"|"error", data: "..." }
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/builder/generate", async (req, res) => {
  const { conversation } = req.body;
  if (!conversation?.length) {
    return res.status(400).json({ error: "conversation is required" });
  }

  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  const send = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  };

  try {
    const userMessage = buildUserMessage(conversation);

    const stream = await ai.models.generateContentStream({
      model:  "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature:       0.7,
        maxOutputTokens:   8192,
      },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
    });

    for await (const chunk of stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text) send("chunk", text);
    }

    send("done", "");
    res.end();
  } catch (err) {
    console.error("[/api/builder/generate] error:", err);
    send("error", err.message || "Generation failed");
    res.end();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/builder/publish
// Body: { slug: "my-site-name", html: "<full HTML string>" }
// Response: { url, name, publishedAt }
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/builder/publish", async (req, res) => {
  const { slug, html } = req.body;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "slug is required" });
  }
  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "html is required" });
  }

  // Sanitize slug: lowercase alphanumeric + hyphens only
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  if (!safe) return res.status(400).json({ error: "invalid slug" });

  const dir      = path.join(SITES, safe);
  const filepath = path.join(dir, "index.html");

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filepath, html, "utf-8");

    const url = `${BASE}/sites/${safe}/index.html`;
    return res.json({ url, name: safe, publishedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[/api/builder/publish] error:", err);
    return res.status(500).json({ error: "Failed to publish site" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/builder/sites — list published sites
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/builder/sites", async (_req, res) => {
  try {
    const entries = await fs.readdir(SITES, { withFileTypes: true });
    const sites   = entries
      .filter(e => e.isDirectory())
      .map(e => ({ name: e.name, url: `${BASE}/sites/${e.name}/index.html` }));
    return res.json({ sites });
  } catch {
    return res.json({ sites: [] });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 EasyWay AI Builder backend running on http://localhost:${PORT}`);
  console.log(`   Published sites: ${SITES}`);
  console.log(`   Gemini key:      ${process.env.GEMINI_API_KEY ? "✓ set" : "✗ NOT SET"}\n`);
});
