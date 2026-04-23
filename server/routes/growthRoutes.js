import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

// Lazily initialise Firebase Admin once
let _fcmMessaging = null;
function getFcmMessaging() {
  if (_fcmMessaging) return _fcmMessaging;
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saPath) return null;
  try {
    const serviceAccount = JSON.parse(readFileSync(resolve(saPath), "utf-8"));
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    _fcmMessaging = admin.messaging();
    return _fcmMessaging;
  } catch (e) {
    console.error("Firebase Admin init failed:", e.message);
    return null;
  }
}

export function registerGrowthRoutes({
  app,
  authMiddleware,
  statements,
  saveActivity,
  safeJsonParse,
  safeJsonStringify,
  parseGoals,
  providerOAuthConfig,
  BASE_URL,
  JWT_SECRET,
  jwt,
  randomToken,
  dns,
  ai,
  TRINITY_MODEL,
  applySeoToHtml,
  persistWebsiteHtmlIfPublished,
}) {
  app.get("/api/business-profile", authMiddleware, (req, res) => {
    const row = statements.getBusinessProfile.get(req.user.id);
    const goals = safeJsonParse(row?.goals, []);
    return res.json({
      profile: row ? {
        businessName: row.business_name || "",
        industry: row.industry || "",
        city: row.city || "",
        country: row.country || "",
        mapProfileUrl: row.map_profile_url || "",
        audience: row.audience || "",
        brandTone: row.brand_tone || "",
        goals: Array.isArray(goals) ? goals : [],
        updatedAt: row.updated_at,
      } : null,
    });
  });

  app.post("/api/business-profile", authMiddleware, (req, res) => {
    const payload = {
      businessName: String(req.body?.businessName || "").trim(),
      industry: String(req.body?.industry || "").trim(),
      city: String(req.body?.city || "").trim(),
      country: String(req.body?.country || "").trim(),
      mapProfileUrl: String(req.body?.mapProfileUrl || "").trim(),
      audience: String(req.body?.audience || "").trim(),
      brandTone: String(req.body?.brandTone || "").trim(),
      goals: parseGoals(req.body?.goals),
    };
    statements.upsertBusinessProfile.run(
      req.user.id,
      payload.businessName || null,
      payload.industry || null,
      payload.city || null,
      payload.country || null,
      payload.mapProfileUrl || null,
      payload.audience || null,
      payload.brandTone || null,
      safeJsonStringify(payload.goals),
    );
    saveActivity(req.user.id, "Updated business profile", {
      industry: payload.industry,
      city: payload.city,
      country: payload.country,
    });
    return res.json({ ok: true, profile: payload });
  });

  app.get("/api/notifications", authMiddleware, (req, res) => {
    statements.ensureGrowthSettings.run(req.user.id);
    const settings = statements.getGrowthSettings.get(req.user.id);
    const targets = statements.getNotificationTargets.all(req.user.id).map((row) => ({
      id: row.id,
      type: row.target_type,
      label: row.label || "",
      endpoint: row.endpoint,
      enabled: !!row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return res.json({
      targets,
      settings: {
        oneTapEnabled: !!(settings?.one_tap_notifications_enabled ?? 1),
      },
    });
  });

  app.post("/api/notifications/settings", authMiddleware, (req, res) => {
    const enabled = !!req.body?.oneTapEnabled;
    statements.upsertGrowthSettings.run(req.user.id, enabled ? 1 : 0);
    saveActivity(req.user.id, enabled ? "Enabled one-tap notifications" : "Disabled one-tap notifications");
    return res.json({ ok: true, settings: { oneTapEnabled: enabled } });
  });

  app.post("/api/notifications/targets", authMiddleware, (req, res) => {
    const type = String(req.body?.type || "").toLowerCase();
    const label = String(req.body?.label || "").trim();
    const endpoint = String(req.body?.endpoint || "").trim();
    if (!["web", "app"].includes(type)) return res.status(400).json({ error: "type must be web or app" });
    if (!endpoint) return res.status(400).json({ error: "endpoint is required" });
    const insert = statements.insertNotificationTarget.run(req.user.id, type, label || null, endpoint, 1);
    saveActivity(req.user.id, "Added notification target", { type, label });
    return res.json({ id: Number(insert.lastInsertRowid), ok: true });
  });

  // ─── Android app registers its FCM token here ────────────────────────────
  app.post("/api/apps/:appId/fcm-token", (req, res) => {
    console.log(`[FCM DEBUG] Received token request for app: ${req.params.appId}`);
    console.log(`[FCM DEBUG] Payload:`, req.body);
    const appId    = String(req.params.appId || "").trim();
    const token    = String(req.body?.token    || "").trim();
    const deviceId = String(req.body?.deviceId || "").trim();
    if (!appId || !token) {
      console.log(`[FCM DEBUG] Missing appId or token.`);
      return res.status(400).json({ error: "appId and token are required" });
    }

    // Upsert token into notification_targets linked by appId label
    const existing = statements.getNotificationTargets
      .all(0)  // fetch all (across users) by appId label
      .find(r => r.label === appId && r.endpoint === token);

    if (!existing) {
      // Store token globally (user_id = 0 = system app tokens)
      statements.insertNotificationTarget.run(0, "app", appId, token, 1);
    }
    return res.json({ ok: true });
  });

  // ─── Send real FCM push notification via Firebase Admin SDK ──────────────
  app.post("/api/notifications/send-test", authMiddleware, async (req, res) => {
    statements.ensureGrowthSettings.run(req.user.id);
    const settings = statements.getGrowthSettings.get(req.user.id);
    if (!(settings?.one_tap_notifications_enabled ?? 1)) {
      return res.status(400).json({ error: "One-tap notifications are turned off" });
    }

    const title   = String(req.body?.title   || "EasyWay").trim();
    const message = String(req.body?.message || "Your website is live!").trim();
    const url     = String(req.body?.url     || "").trim();
    const appId   = String(req.body?.appId   || "").trim();

    // Collect FCM tokens from user's own targets + system-level app tokens
    const userTargets = statements.getNotificationTargets
      .all(req.user.id)
      .filter(r => r.enabled && r.target_type === "app");

    const systemTokens = statements.getNotificationTargets
      .all(0)
      .filter(r => r.enabled && (!appId || r.label === appId));

    const allTokens = [
      ...new Set([
        ...userTargets.map(r => r.endpoint),
        ...systemTokens.map(r => r.endpoint),
      ])
    ].filter(Boolean);

    saveActivity(req.user.id, "Triggered push notification", {
      recipients: allTokens.length, title, message, url,
    });

    const messaging = getFcmMessaging();
    if (!messaging) {
      return res.json({
        ok: true,
        sent: 0,
        transport: "stub",
        note: "FIREBASE_SERVICE_ACCOUNT not set in .env — notifications recorded but not delivered.",
        tokens: allTokens.length,
      });
    }

    if (allTokens.length === 0) {
      return res.json({ ok: true, sent: 0, note: "No registered device tokens yet. Open the app on a device first." });
    }

    try {
      // FCM v1 multicast (up to 500 tokens per call)
      const result = await messaging.sendEachForMulticast({
        tokens: allTokens,
        notification: { title, body: message },
        data: { url: url || "", appId: appId || "" },
        android: { priority: "high" },
      });

      const failed = result.responses
        .map((r, i) => (!r.success ? { token: allTokens[i], error: r.error?.message } : null))
        .filter(Boolean);

      return res.json({
        ok: true,
        sent: result.successCount,
        failed: result.failureCount,
        transport: "fcm-v1",
        tokens: allTokens.length,
        errors: failed,
      });
    } catch (err) {
      return res.status(500).json({ error: err?.message || "FCM send failed" });
    }
  });


  app.get("/api/social/accounts", authMiddleware, (req, res) => {
    const accounts = statements.getSocialAccounts.all(req.user.id).map((row) => ({
      id: row.id,
      platform: row.platform,
      accountHandle: row.account_handle,
      enabled: !!row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return res.json({ accounts });
  });

  app.post("/api/social/accounts", authMiddleware, (req, res) => {
    const platform = String(req.body?.platform || "").toLowerCase();
    const accountHandle = String(req.body?.accountHandle || "").trim();
    const accessToken = String(req.body?.accessToken || "").trim();
    if (!["instagram", "linkedin", "facebook"].includes(platform)) {
      return res.status(400).json({ error: "platform must be instagram, linkedin, or facebook" });
    }
    if (!accountHandle) return res.status(400).json({ error: "accountHandle is required" });
    const insert = statements.insertSocialAccount.run(req.user.id, platform, accountHandle, accessToken || null, 1);
    saveActivity(req.user.id, "Connected social account", { platform, accountHandle });
    return res.json({ id: Number(insert.lastInsertRowid), ok: true });
  });

  app.post("/api/social/oauth/start", authMiddleware, (req, res) => {
    const platform = String(req.body?.platform || "").toLowerCase();
    const config = providerOAuthConfig(platform);
    if (!config) return res.status(400).json({ error: "Unsupported platform" });
    const authHeader = String(req.headers.authorization || "");
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!config.clientId) {
      const fallbackUrl = `${BASE_URL}/auth/buffer?token=${encodeURIComponent(bearerToken)}`;
      return res.json({
        authorizationUrl: fallbackUrl,
        provider: "buffer-fallback",
        note: `${platform.toUpperCase()}_CLIENT_ID is not configured, using Buffer OAuth fallback`,
      });
    }
    const stateToken = jwt.sign(
      { sub: req.user.id, platform, purpose: "social-oauth" },
      JWT_SECRET,
      { expiresIn: "15m" },
    );
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scope,
      state: stateToken,
    });
    return res.json({ authorizationUrl: `${config.authUrl}?${params.toString()}` });
  });

  app.get("/api/social/oauth/callback", (req, res) => {
    const state = String(req.query.state || "");
    const code = String(req.query.code || "");
    if (!state || !code) {
      return res.status(400).send("<h3>OAuth failed: missing code/state</h3>");
    }
    try {
      const decoded = jwt.verify(state, JWT_SECRET);
      if (decoded?.purpose !== "social-oauth") {
        return res.status(400).send("<h3>OAuth failed: invalid state</h3>");
      }
      const userId = Number(decoded.sub);
      const platform = String(decoded.platform || "").toLowerCase();
      const accountHandle = `${platform}_connected_${Date.now().toString().slice(-6)}`;
      statements.insertSocialAccount.run(userId, platform, accountHandle, `oauth_code:${code}`, 1);
      saveActivity(userId, "Connected social account via OAuth", { platform, accountHandle });
      return res.send(`
      <html>
        <body style="font-family:system-ui;padding:24px">
          <h3>${platform} connected successfully.</h3>
          <p>You can close this window and continue in EasyWay dashboard.</p>
          <script>window.opener && window.opener.postMessage({type:'easyway-social-oauth', platform:'${platform}'}, '*'); setTimeout(() => window.close(), 1200);</script>
        </body>
      </html>
    `);
    } catch {
      return res.status(400).send("<h3>OAuth failed: invalid or expired session state</h3>");
    }
  });

  app.get("/api/social/schedules", authMiddleware, (req, res) => {
    const schedules = statements.getSocialSchedules.all(req.user.id).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      platform: row.platform,
      socialAccountId: row.social_account_id,
      scheduledFor: row.scheduled_for,
      caption: row.caption,
      tags: safeJsonParse(row.tags, []),
      status: row.status,
      createdAt: row.created_at,
    }));
    return res.json({ schedules });
  });

  app.post("/api/social/schedules", authMiddleware, (req, res) => {
    const projectId = req.body?.projectId ? Number(req.body.projectId) : null;
    const platform = String(req.body?.platform || "").toLowerCase();
    const socialAccountId = req.body?.socialAccountId ? Number(req.body.socialAccountId) : null;
    const scheduledFor = String(req.body?.scheduledFor || "").trim();
    const caption = String(req.body?.caption || "").trim();
    const tags = parseGoals(req.body?.tags);
    if (!["instagram", "linkedin", "facebook"].includes(platform)) {
      return res.status(400).json({ error: "platform must be instagram, linkedin, or facebook" });
    }
    if (!scheduledFor) return res.status(400).json({ error: "scheduledFor is required" });
    if (!caption) return res.status(400).json({ error: "caption is required" });
    const insert = statements.insertSocialSchedule.run(
      req.user.id,
      Number.isFinite(projectId) ? projectId : null,
      platform,
      Number.isFinite(socialAccountId) ? socialAccountId : null,
      scheduledFor,
      caption,
      safeJsonStringify(tags),
      "scheduled",
    );
    saveActivity(req.user.id, "Scheduled social post", {
      scheduleId: Number(insert.lastInsertRowid),
      platform,
      scheduledFor,
    });
    return res.json({ id: Number(insert.lastInsertRowid), ok: true });
  });

  app.post("/api/social/generate-live-post", authMiddleware, async (req, res) => {
    try {
      const projectId = Number(req.body?.projectId);
      const platform = String(req.body?.platform || "instagram").toLowerCase();
      const project = statements.getProjectById.get(projectId, req.user.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      const latestSeo = statements.getLatestSeoByProject.get(req.user.id, projectId);
      const seoTags = safeJsonParse(latestSeo?.tags, []);

      const response = await ai.models.generateContent({
        model: TRINITY_MODEL,
        config: {
          temperature: 0.45,
          maxOutputTokens: 900,
          responseMimeType: "application/json",
          systemInstruction: "Return only JSON with keys: caption, hashtags(array), cta.",
        },
        contents: [{
          role: "user",
          parts: [{
            text: [
              `Platform: ${platform}`,
              `Project name: ${project.name}`,
              `Live URL: ${project.published_url || "not published"}`,
              `SEO tags: ${(Array.isArray(seoTags) ? seoTags : []).join(", ")}`,
              "Generate a launch announcement post.",
            ].join("\n"),
          }],
        }],
      });

      const raw = response?.text ?? "{}";
      const parsed = safeJsonParse(raw, {});
      return res.json({
        caption: String(parsed?.caption || "").trim(),
        hashtags: Array.isArray(parsed?.hashtags) ? parsed.hashtags : [],
        cta: String(parsed?.cta || "").trim(),
      });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Post generation failed" });
    }
  });

  app.get("/api/domains", authMiddleware, (req, res) => {
    const domains = statements.getCustomDomains.all(req.user.id).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      domain: row.domain,
      verificationToken: row.verification_token,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return res.json({ domains });
  });

  app.post("/api/domains", authMiddleware, (req, res) => {
    const projectId = Number(req.body?.projectId);
    const domain = String(req.body?.domain || "").trim().toLowerCase();
    if (!Number.isFinite(projectId)) return res.status(400).json({ error: "projectId is required" });
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return res.status(400).json({ error: "valid domain is required" });
    }
    const project = statements.getProjectById.get(projectId, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const token = `easyway-verify-${randomToken(16)}`;
    try {
      const insert = statements.insertCustomDomain.run(req.user.id, projectId, domain, token);
      saveActivity(req.user.id, "Added custom domain", { projectId, domain });
      return res.json({
        id: Number(insert.lastInsertRowid),
        ok: true,
        verify: {
          type: "TXT",
          host: `_easyway.${domain}`,
          value: token,
        },
        dns: {
          cnameHost: domain,
          cnameValue: "sites.easyway.live",
        },
      });
    } catch {
      return res.status(409).json({ error: "Domain already added" });
    }
  });

  app.post("/api/domains/:id/verify", authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const domainRow = statements.getCustomDomainById.get(id, req.user.id);
    if (!domainRow) return res.status(404).json({ error: "Domain not found" });
    const host = `_easyway.${domainRow.domain}`;
    try {
      const records = await dns.resolveTxt(host);
      const flattened = records.flat().join(" ");
      const verified = flattened.includes(domainRow.verification_token);
      if (verified) {
        statements.setCustomDomainStatus.run("verified", id, req.user.id);
        saveActivity(req.user.id, "Verified custom domain", { domain: domainRow.domain });
        return res.json({ ok: true, verified: true });
      }
      return res.json({ ok: true, verified: false, reason: "TXT token not found yet" });
    } catch {
      return res.json({ ok: true, verified: false, reason: "DNS lookup failed or record not propagated" });
    }
  });

  app.post("/api/seo/generate", authMiddleware, async (req, res) => {
    try {
      const projectId = Number(req.body?.projectId);
      if (!Number.isFinite(projectId)) return res.status(400).json({ error: "projectId is required" });
      const project = statements.getProjectById.get(projectId, req.user.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (!project.html_content) return res.status(400).json({ error: "Project HTML not found" });

      const profile = statements.getBusinessProfile.get(req.user.id);
      const profileGoals = safeJsonParse(profile?.goals, []);
      const response = await ai.models.generateContent({
        model: TRINITY_MODEL,
        config: {
          temperature: 0.3,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
          systemInstruction: "Return only JSON with keys: title, description, keywords(array), ogTitle, ogDescription, tags(array).",
        },
        contents: [{
          role: "user",
          parts: [{
            text: [
              "Generate SEO metadata for this website.",
              `Business: ${profile?.business_name || project.name}`,
              `Industry: ${profile?.industry || "general"}`,
              `Location: ${profile?.city || ""} ${profile?.country || ""}`.trim(),
              `Audience: ${profile?.audience || ""}`,
              `Brand tone: ${profile?.brand_tone || ""}`,
              `Goals: ${(Array.isArray(profileGoals) ? profileGoals : []).join(", ")}`,
              "",
              "HTML:",
              project.html_content,
            ].join("\n"),
          }],
        }],
      });

      const parsed = safeJsonParse(response?.text ?? "{}", {});
      const seo = {
        title: String(parsed?.title || "").trim(),
        description: String(parsed?.description || "").trim(),
        keywords: Array.isArray(parsed?.keywords) ? parsed.keywords.map((k) => String(k).trim()).filter(Boolean) : [],
        ogTitle: String(parsed?.ogTitle || "").trim(),
        ogDescription: String(parsed?.ogDescription || "").trim(),
        tags: Array.isArray(parsed?.tags) ? parsed.tags.map((k) => String(k).trim()).filter(Boolean) : [],
      };

      const nextHtml = applySeoToHtml(project.html_content, seo);
      statements.replaceProjectHtml.run(nextHtml, projectId, req.user.id);
      persistWebsiteHtmlIfPublished(project, nextHtml);
      statements.insertSeoAsset.run(
        req.user.id,
        projectId,
        TRINITY_MODEL,
        seo.title || null,
        seo.description || null,
        safeJsonStringify(seo.keywords),
        seo.ogTitle || null,
        seo.ogDescription || null,
        safeJsonStringify(seo.tags),
      );
      saveActivity(req.user.id, "Generated SEO metadata", { projectId, model: TRINITY_MODEL });

      return res.json({
        ok: true,
        model: TRINITY_MODEL,
        seo,
        htmlContent: nextHtml,
      });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "SEO generation failed" });
    }
  });
}

