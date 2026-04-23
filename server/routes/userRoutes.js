/* global process, Buffer */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toBase32(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (!chunk) break;
    out += BASE32_ALPHABET[parseInt(chunk.padEnd(5, "0"), 2)];
  }
  return out;
}

function fromBase32(base32) {
  const cleaned = String(base32 || "").replace(/=+$/g, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx >= 0) bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotp(secret, step = 30, digits = 6, timestamp = Date.now()) {
  const key = fromBase32(secret);
  const counter = Math.floor(timestamp / 1000 / step);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = nodeCrypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  return String(code % (10 ** digits)).padStart(digits, "0");
}

function verifyTotp(secret, code, windowSteps = 1) {
  const cleanCode = String(code || "").trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;
  for (let i = -windowSteps; i <= windowSteps; i += 1) {
    const ts = Date.now() + (i * 30000);
    if (generateTotp(secret, 30, 6, ts) === cleanCode) return true;
  }
  return false;
}

export function registerUserRoutes({ app, authMiddleware, requireAccess, statements, saveActivity, bcrypt }) {
  app.get("/api/user/access", authMiddleware, (req, res) => {
    return res.json({
      access: {
        role: req.access?.role || "owner",
        plan: req.access?.plan || "starter",
      },
    });
  });

  app.get("/api/user/settings", authMiddleware, (req, res) => {
    statements.ensureUserSettingsRow.run(req.user.id);
    statements.ensureUserAccess.run(req.user.id);
    const row = statements.getUserSettings.get(req.user.id);
    const access = statements.getUserAccess.get(req.user.id) || { role: "owner", plan: "starter" };
    return res.json({
      user: {
        id: req.user.id,
        name: req.user.name || "",
        email: req.user.email,
      },
      access: {
        role: String(access.role || "owner"),
        plan: String(access.plan || "starter"),
      },
      settings: {
        company: row?.company || "",
        timezone: row?.timezone || "",
        defaultProjectType: row?.default_project_type || "website",
        profileImageUrl: row?.profile_image_url || "",
        twoFactorEnabled: Boolean(Number(row?.two_factor_enabled || 0)),
        sessionVersion: Number(row?.session_version || 1),
        updatedAt: row?.updated_at || null,
      },
    });
  });

  app.post("/api/user/settings", authMiddleware, (req, res) => {
    statements.ensureUserSettingsRow.run(req.user.id);
    const name = String(req.body?.name || "").trim();
    const company = String(req.body?.company || "").trim();
    const timezone = String(req.body?.timezone || "").trim();
    const defaultProjectType = String(req.body?.defaultProjectType || "website").toLowerCase();
    const profileImageUrl = String(req.body?.profileImageUrl || "").trim();

    if (!["website", "app"].includes(defaultProjectType)) {
      return res.status(400).json({ error: "defaultProjectType must be website or app" });
    }
    if (profileImageUrl.length > 1000000) {
      return res.status(400).json({ error: "profileImageUrl is too large" });
    }

    if (name) {
      statements.updateUserName.run(name, req.user.id);
    }

    const current = statements.getUserSettings.get(req.user.id) || {};
    statements.upsertUserSettings.run(
      req.user.id,
      company || null,
      timezone || null,
      defaultProjectType,
      profileImageUrl || current.profile_image_url || null,
    );

    saveActivity(req.user.id, "Updated user settings", { defaultProjectType, company });

    return res.json({
      ok: true,
      user: {
        id: req.user.id,
        name: name || req.user.name || "",
        email: req.user.email,
      },
      settings: {
        company,
        timezone,
        defaultProjectType,
        profileImageUrl: profileImageUrl || current.profile_image_url || "",
        twoFactorEnabled: Boolean(Number(current.two_factor_enabled || 0)),
      },
    });
  });

  app.post("/api/user/change-password", authMiddleware, async (req, res) => {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const row = statements.getUserPasswordHashById.get(req.user.id);
    if (!row?.password_hash) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    statements.updateUserPasswordHash.run(nextHash, req.user.id);
    statements.ensureUserSettingsRow.run(req.user.id);
    statements.bumpUserSessionVersion.run(req.user.id);
    saveActivity(req.user.id, "Changed password");

    return res.json({ ok: true, message: "Password changed. Other sessions were signed out." });
  });

  app.post("/api/user/email-change/request", authMiddleware, async (req, res) => {
    const newEmail = normalizeEmail(req.body?.newEmail);
    if (!newEmail) return res.status(400).json({ error: "newEmail is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: "Enter a valid email" });
    if (newEmail === normalizeEmail(req.user.email)) return res.status(400).json({ error: "New email must be different" });
    const existing = statements.getUserByEmail.get(newEmail);
    if (existing) return res.status(409).json({ error: "Email is already in use" });

    const token = nodeCrypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + (15 * 60 * 1000)).toISOString();
    statements.createEmailChangeRequest.run(req.user.id, newEmail, token, expires);
    saveActivity(req.user.id, "Requested email change", { newEmail });

    // In production this token should be emailed; returning it enables local/dev flow.
    return res.json({ ok: true, verificationToken: token, expiresAt: expires });
  });

  app.post("/api/user/email-change/confirm", authMiddleware, (req, res) => {
    const token = String(req.body?.token || "").trim();
    if (!token) return res.status(400).json({ error: "token is required" });
    const request = statements.getEmailChangeRequestByToken.get(token);
    if (!request || Number(request.user_id) !== Number(req.user.id)) {
      return res.status(400).json({ error: "Invalid token" });
    }
    if (request.used_at) return res.status(400).json({ error: "Token already used" });
    if (new Date(request.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Token expired" });
    }

    const existing = statements.getUserByEmail.get(normalizeEmail(request.new_email));
    if (existing && Number(existing.id) !== Number(req.user.id)) {
      return res.status(409).json({ error: "Email is already in use" });
    }

    statements.updateUserEmail.run(normalizeEmail(request.new_email), req.user.id);
    statements.consumeEmailChangeRequest.run(request.id);
    statements.ensureUserSettingsRow.run(req.user.id);
    statements.bumpUserSessionVersion.run(req.user.id);
    saveActivity(req.user.id, "Changed email", { email: normalizeEmail(request.new_email) });

    return res.json({ ok: true, email: normalizeEmail(request.new_email) });
  });

  app.post("/api/user/2fa/setup", authMiddleware, (req, res) => {
    statements.ensureUserSettingsRow.run(req.user.id);
    const secret = toBase32(nodeCrypto.randomBytes(20));
    statements.setPending2FASecret.run(secret, req.user.id);
    const issuer = "EasyWay";
    const label = `${issuer}:${req.user.email}`;
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    saveActivity(req.user.id, "Started 2FA setup");
    return res.json({ ok: true, secret, otpauthUrl });
  });

  app.post("/api/user/2fa/enable", authMiddleware, (req, res) => {
    statements.ensureUserSettingsRow.run(req.user.id);
    const code = String(req.body?.code || "").trim();
    const row = statements.getUserSettings.get(req.user.id);
    const pendingSecret = String(row?.two_factor_pending_secret || "");
    if (!pendingSecret) return res.status(400).json({ error: "Run setup first to generate a secret." });
    if (!verifyTotp(pendingSecret, code)) return res.status(400).json({ error: "Invalid authenticator code." });

    statements.enable2FAFromPending.run(req.user.id);
    statements.bumpUserSessionVersion.run(req.user.id);
    saveActivity(req.user.id, "Enabled 2FA");
    return res.json({ ok: true, twoFactorEnabled: true });
  });

  app.post("/api/user/2fa/disable", authMiddleware, (req, res) => {
    statements.ensureUserSettingsRow.run(req.user.id);
    const code = String(req.body?.code || "").trim();
    const row = statements.getUserSettings.get(req.user.id);
    const secret = String(row?.two_factor_secret || "");
    if (!secret) return res.status(400).json({ error: "2FA is not enabled." });
    if (!verifyTotp(secret, code)) return res.status(400).json({ error: "Invalid authenticator code." });

    statements.disable2FA.run(req.user.id);
    statements.bumpUserSessionVersion.run(req.user.id);
    saveActivity(req.user.id, "Disabled 2FA");
    return res.json({ ok: true, twoFactorEnabled: false });
  });

  app.get("/api/user/sessions", authMiddleware, (req, res) => {
    const row = statements.getUserSettings.get(req.user.id) || {};
    return res.json({
      sessions: {
        sessionVersion: Number(row.session_version || 1),
        currentRole: req.access?.role || "owner",
        currentPlan: req.access?.plan || "starter",
      },
    });
  });

  app.post("/api/user/sessions/revoke-all", authMiddleware, requireAccess({ minRole: "owner" }), (req, res) => {
    statements.ensureUserSettingsRow.run(req.user.id);
    statements.bumpUserSessionVersion.run(req.user.id);
    saveActivity(req.user.id, "Revoked all sessions");
    return res.json({ ok: true });
  });

  // Optional enterprise access override for local admin use.
  app.post("/api/user/access", authMiddleware, requireAccess({ minRole: "owner" }), (req, res) => {
    if (String(process.env.ALLOW_LOCAL_PLAN_SWITCH || "0") !== "1") {
      return res.status(403).json({ error: "Plan/role updates are disabled on this environment." });
    }
    const role = String(req.body?.role || "").toLowerCase();
    const plan = String(req.body?.plan || "").toLowerCase();
    if (!["viewer", "editor", "manager", "owner"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (!["starter", "pro", "enterprise"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }
    statements.upsertUserAccess.run(req.user.id, role, plan);
    saveActivity(req.user.id, "Updated access profile", { role, plan });
    return res.json({ ok: true, access: { role, plan } });
  });
}
import nodeCrypto from "node:crypto";
