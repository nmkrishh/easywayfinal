/**
 * Agent 5 — MERN Backend Agent (Trinity Large)
 * Generates full Express + MongoDB server with models/routes/controllers
 *
 * Output format (parsed by parseProjectFiles):
 *   [FILE path="server/server.js"]...[/FILE]
 *   [FILE path="server/models/Contact.js"]...[/FILE]
 *   [FILE path="server/routes/api.js"]...[/FILE]
 */
import { callAI, MODELS, parseProjectFiles } from "./callAI.js";

const SYSTEM = `You are a senior Node.js/Express backend developer.
Build a complete, production-ready MERN backend with proper separation of concerns.

═══════════════════════════════════════════════════════
 OUTPUT FORMAT — STRICTLY REQUIRED
═══════════════════════════════════════════════════════

Output ONLY file blocks in this exact format, no other text:
[FILE path="server/server.js"]
...content...
[/FILE]
[FILE path="server/models/Contact.js"]
...content...
[/FILE]
[FILE path="server/routes/api.js"]
...content...
[/FILE]
[FILE path="server/controllers/apiController.js"]
...content...
[/FILE]
[FILE path="server/.env.example"]
...content...
[/FILE]
[FILE path="server/package.json"]
...content...
[/FILE]

═══════════════════════════════════════════════════════
 CODE REQUIREMENTS
═══════════════════════════════════════════════════════

server/server.js:
• CommonJS (require/module.exports) — NOT ES modules
• Express 4.x with express.json(), cors(), helmet(), morgan()
• dotenv with process.env.MONGODB_URI + process.env.PORT
• Connect to MongoDB with mongoose.connect()
• Mount routes at /api prefix
• Serve client/dist as static files (production build)
• Global error handler middleware
• Listen on PORT (default 5000)
• Helpful console.log on start

server/models/*.js:
• Mongoose schemas for EACH model in the plan
• Proper field types, required flags, and defaults
• timestamps: true on all schemas
• Add schema indexes where appropriate
• Export with module.exports = mongoose.model(...)

server/routes/api.js:
• All routes from the plan
• Use express.Router()
• Input validation (manual or express-validator style)
• Delegate to controllers
• Proper HTTP status codes (200, 201, 400, 404, 500)

server/controllers/apiController.js:
• async/await with try/catch on every handler
• Return { success: true, data: ... } for success
• Return { success: false, error: "..." } for failures
• Never return raw mongoose documents — use .toObject() or .lean()

server/.env.example:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-db-name
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

server/package.json:
• name, version, main: "server.js"
• dependencies: express, mongoose, cors, dotenv, helmet, morgan
• devDependencies: nodemon
• scripts: start, dev (nodemon server.js)

═══════════════════════════════════════════════════════
 CRITICAL RULES
═══════════════════════════════════════════════════════
• DO NOT invent sample data, emails, or phone numbers
• Use placeholder environment variables for all secrets
• All endpoints must handle errors gracefully
• No TypeScript — plain JavaScript only
• No frontend code — backend only`;

/**
 * @param {object} plan — JSON from structurer
 * @returns {Promise<Record<string,string>>} Map of filepath → content
 */
export async function runBackend(plan) {
  const prompt = `Build the complete MERN backend for:

PROJECT: ${plan.siteName || plan.brandName || "Website"}

ROUTES NEEDED:
${JSON.stringify(plan.backend_routes || [], null, 2)}

MODELS NEEDED:
${(plan.models || ["Contact"]).join(", ")}

KEY FEATURES:
${(plan.key_features || []).join(", ")}`;

  const raw = await callAI(
    MODELS.agentic,
    [{ role: "user", content: prompt }],
    SYSTEM,
  );

  const { files } = parseProjectFiles(raw);

  // Fallback: if no delimiters found, store entire output as server.js
  if (!Object.keys(files).length) {
    console.warn("[backend] No delimited files found — storing raw output as server.js");
    return { "server/server.js": raw };
  }

  return files;
}
