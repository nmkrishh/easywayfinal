/* global process, Buffer */
import crypto from "node:crypto";

export function registerBufferRoutes({
  app,
  db,
  authMiddleware,
  getUserByToken,
  saveActivity,
  baseUrl,
}) {
  const BUFFER_CLIENT_ID = process.env.BUFFER_CLIENT_ID || "";
  const BUFFER_CLIENT_SECRET = process.env.BUFFER_CLIENT_SECRET || "";
  const BUFFER_REDIRECT_URI = process.env.BUFFER_REDIRECT_URI || `${baseUrl}/auth/buffer/callback`;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
  const OPENROUTER_MODEL = "sourceful/riverflow-v2-max-preview";

  db.exec(`
    CREATE TABLE IF NOT EXISTS buffer_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      profiles_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const statements = {
    getConnectionByUser: db.prepare(`
      SELECT id, user_id, access_token, profiles_json, created_at, updated_at
      FROM buffer_connections
      WHERE user_id = ?
      LIMIT 1
    `),
    upsertConnection: db.prepare(`
      INSERT INTO buffer_connections (user_id, access_token, profiles_json)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        access_token = excluded.access_token,
        profiles_json = excluded.profiles_json,
        updated_at = datetime('now')
    `),
  };

  function parseProfiles(json) {
    try {
      const arr = JSON.parse(json || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  app.get("/auth/buffer", (req, res) => {
    const token = String(req.query.token || "");
    const user = getUserByToken(token);
    if (!user) return res.status(401).send("Invalid auth token");
    if (!BUFFER_CLIENT_ID) return res.status(500).send("BUFFER_CLIENT_ID is not configured");

    const statePayload = `${user.id}:${Date.now()}:${crypto.randomBytes(10).toString("hex")}`;
    const state = Buffer.from(statePayload, "utf-8").toString("base64url");
    const params = new URLSearchParams({
      client_id: BUFFER_CLIENT_ID,
      redirect_uri: BUFFER_REDIRECT_URI,
      response_type: "code",
      state,
    });
    return res.redirect(`https://bufferapp.com/oauth2/authorize?${params.toString()}`);
  });

  app.get("/auth/buffer/callback", async (req, res) => {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) return res.status(400).send("Missing code/state");
    if (!BUFFER_CLIENT_ID || !BUFFER_CLIENT_SECRET) {
      return res.status(500).send("Buffer OAuth is not configured on server");
    }

    let userId = null;
    try {
      const decoded = Buffer.from(state, "base64url").toString("utf-8");
      const [idRaw] = decoded.split(":");
      userId = Number(idRaw);
    } catch {
      userId = null;
    }
    if (!Number.isFinite(userId)) return res.status(400).send("Invalid OAuth state");

    try {
      const tokenBody = new URLSearchParams({
        code,
        client_id: BUFFER_CLIENT_ID,
        client_secret: BUFFER_CLIENT_SECRET,
        redirect_uri: BUFFER_REDIRECT_URI,
        grant_type: "authorization_code",
      });
      const tokenRes = await fetch("https://api.bufferapp.com/1/oauth2/token.json", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
      });
      const tokenPayload = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenPayload?.access_token) {
        return res.status(502).send(`Buffer token exchange failed: ${tokenPayload?.error || tokenRes.status}`);
      }

      const accessToken = String(tokenPayload.access_token);
      const profilesRes = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(accessToken)}`);
      const profilesPayload = await profilesRes.json().catch(() => []);
      const profiles = Array.isArray(profilesPayload) ? profilesPayload : [];

      statements.upsertConnection.run(userId, accessToken, JSON.stringify(profiles));
      saveActivity?.(userId, "Connected Buffer", { profiles: profiles.length });

      return res.send(`
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px;">
            <h3>Buffer connected successfully.</h3>
            <p>You can close this window and continue in EasyWay.</p>
            <script>
              window.opener && window.opener.postMessage({ type: "easyway-buffer-connected" }, "*");
              setTimeout(() => window.close(), 1200);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      return res.status(500).send(`Buffer OAuth callback failed: ${error?.message || "Unknown error"}`);
    }
  });

  app.get("/api/buffer/status", authMiddleware, (req, res) => {
    const row = statements.getConnectionByUser.get(req.user.id);
    const profiles = row ? parseProfiles(row.profiles_json) : [];
    return res.json({
      connected: Boolean(row),
      profiles,
      connectedAt: row?.updated_at || null,
    });
  });

  app.post("/api/buffer/connect-token", authMiddleware, async (req, res) => {
    const accessToken = String(req.body?.accessToken || "").trim();
    if (!accessToken) return res.status(400).json({ error: "accessToken is required" });
    try {
      const profilesRes = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(accessToken)}`);
      const profilesPayload = await profilesRes.json().catch(() => []);
      if (!profilesRes.ok) {
        return res.status(400).json({ error: "Invalid Buffer access token" });
      }
      const profiles = Array.isArray(profilesPayload) ? profilesPayload : [];
      statements.upsertConnection.run(req.user.id, accessToken, JSON.stringify(profiles));
      saveActivity?.(req.user.id, "Connected Buffer by access token", { profiles: profiles.length });
      return res.json({ ok: true, connected: true, profiles });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Failed to connect token" });
    }
  });

  app.post("/api/schedule-post", authMiddleware, async (req, res) => {
    const { caption = "", imageUrl = "", profileId = "", scheduleTime = "" } = req.body || {};
    if (!String(caption).trim()) return res.status(400).json({ error: "caption is required" });
    if (!String(profileId).trim()) return res.status(400).json({ error: "profileId is required" });
    if (!String(scheduleTime).trim()) return res.status(400).json({ error: "scheduleTime is required" });

    const row = statements.getConnectionByUser.get(req.user.id);
    if (!row) return res.status(400).json({ error: "Buffer is not connected" });

    const accessToken = row.access_token;
    const form = new URLSearchParams();
    form.set("access_token", accessToken);
    form.set("profile_ids[]", String(profileId));
    form.set("text", String(caption));
    if (String(imageUrl || "").trim()) form.set("media[photo]", String(imageUrl).trim());
    form.set("scheduled_at", new Date(scheduleTime).toISOString());
    form.set("now", "false");

    try {
      const response = await fetch("https://api.bufferapp.com/1/updates/create.json", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(502).json({ error: payload?.error || "Buffer scheduling failed" });
      }
      saveActivity?.(req.user.id, "Scheduled social post via Buffer", {
        profileId,
        scheduleTime,
      });
      return res.json({ ok: true, buffer: payload });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Schedule post failed" });
    }
  });

  app.post("/api/schedule-post/generate-image", authMiddleware, async (req, res) => {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    if (!OPENROUTER_API_KEY) return res.status(400).json({ error: "OPENROUTER_API_KEY is not configured" });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: "Generate a direct image URL only, no extra text." },
            { role: "user", content: prompt },
          ],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return res.status(502).json({ error: payload?.error?.message || "Image generation failed" });
      const content = String(payload?.choices?.[0]?.message?.content || "");
      const match = content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp)/i) || content.match(/https?:\/\/\S+/i);
      const imageUrl = match ? match[0] : "";
      if (!imageUrl) return res.status(502).json({ error: "Model did not return image URL" });
      return res.json({ ok: true, imageUrl, model: OPENROUTER_MODEL });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Image generation failed" });
    }
  });
}
