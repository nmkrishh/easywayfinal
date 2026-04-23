import { callAI, MODELS, parseProjectFiles } from "./callAI.js";

const SYSTEM = `You are a senior Node.js/Express backend developer.
Build a complete, production-ready MERN backend.
Output ONLY file blocks. No explanations. No comments in output. No markdown.

OUTPUT FORMAT:
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

server/server.js:
• CommonJS (require/module.exports) — NOT ES modules
• Express 4.x with express.json(), cors(), helmet(), morgan()
• dotenv with process.env.MONGODB_URI + process.env.PORT
• mongoose.connect() with error handling
• Routes mounted at /api prefix
• Serve client/dist as static (production)
• Global error handler middleware at bottom
• Listen on PORT (default 5000)

server/models/*.js:
• Mongoose schemas for each model in the plan
• Proper field types, required flags, defaults
• timestamps: true on all schemas
• module.exports = mongoose.model(...)

server/routes/api.js:
• All routes from the plan using express.Router()
• Input validation
• Delegate to controllers
• Proper HTTP status codes

server/controllers/apiController.js:
• async/await with try/catch on every handler
• Return { success: true, data: ... } for success
• Return { success: false, error: "..." } for failures
• Never return raw mongoose docs — use .lean()

server/.env.example:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-db-name
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

server/package.json:
• name, version, main: "server.js"
• dependencies: express, mongoose, cors, dotenv, helmet, morgan
• devDependencies: nodemon
• scripts: start, dev (nodemon)

RULES:
• Never invent sample data, emails, phone numbers
• All secrets as env vars
• All endpoints handle errors gracefully
• No TypeScript — plain JavaScript
• No frontend code`;

export async function runBackend(plan, onFileGenerated = null) {
  const prompt = `Build the complete MERN backend for:

PROJECT: ${plan.siteName || plan.brandName || "Website"}

ROUTES NEEDED:
${JSON.stringify(plan.backend_routes || [], null, 2)}

MODELS NEEDED:
${(plan.models || ["Contact"]).join(", ")}

KEY FEATURES:
${(plan.key_features || []).join(", ")}`;

  const raw = await callAI(MODELS.agentic, [{ role: "user", content: prompt }], SYSTEM);

  const { files } = parseProjectFiles(raw);

  if (!Object.keys(files).length) {
    console.warn("[backend] No delimited files found — storing raw output as server.js");
    if (onFileGenerated) onFileGenerated("backend", "server/server.js", raw, "done");
    return { "server/server.js": raw };
  }

  if (onFileGenerated) {
    for (const [filePath, content] of Object.entries(files)) {
      onFileGenerated("backend", filePath, content, "done");
    }
  }

  return files;
}
