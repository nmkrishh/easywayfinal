/* global process */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dns from "node:dns/promises";
import crypto from "node:crypto";
import JSZip from "jszip";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import { GoogleGenAI } from "@google/genai";
import { registerBufferRoutes } from "./bufferRoutes.js";
import { registerAuthRoutes } from "./server/routes/authRoutes.js";
import { registerActivityRoutes } from "./server/routes/activityRoutes.js";
import { registerProjectRoutes } from "./server/routes/projectRoutes.js";
import { registerGrowthRoutes } from "./server/routes/growthRoutes.js";
import { registerBuilderRoutes } from "./server/routes/builderRoutes.js";
import { registerEcommerceRoutes } from "./server/routes/ecommerceRoutes.js";
import { registerUserRoutes } from "./server/routes/userRoutes.js";
import { getMongoModels, initMongo, isMongoReady } from "./server/mongo/ecommerce.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SITES_DIR = process.env.SITES_DIR || path.join(__dirname, "public", "sites");
const REACT_ZIP_DIR = process.env.REACT_ZIP_DIR || path.join(__dirname, "react-zip");
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, "data", "easyway.sqlite");
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const SKILL_CONTEXT_CACHE_TTL_MS = Number(process.env.AI_SKILL_CACHE_TTL_MS || 300000);
const SKILL_CONTENT_MAX_CHARS = Number(process.env.AI_SKILL_MAX_CHARS || 3500);
const SKILL_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const SKILL_SOURCE_ROOTS = {
  codex: path.join(__dirname, ".codex", "skills"),
  antigravity: path.join(__dirname, ".antigravity-skills"),
};
const DEFAULT_SELECTED_SKILLS = ["codex:ui-ux-pro-max", "antigravity:react-best-practices"];
const AI_SELECTED_SKILLS = String(process.env.AI_SELECTED_SKILLS || DEFAULT_SELECTED_SKILLS.join(","))
  .split(",")
  .map((entry) => String(entry || "").trim())
  .filter(Boolean);

let cachedSkillContextPayload = null;
let cachedSkillContextAt = 0;

const app = express();

app.use(cors({ origin: true, methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"] }));
app.use(express.json({
  limit: "4mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString("utf-8");
  },
}));
app.use("/sites", express.static(SITES_DIR));
app.use("/react-zip", express.static(REACT_ZIP_DIR));

await fs.mkdir(SITES_DIR, { recursive: true });
await fs.mkdir(REACT_ZIP_DIR, { recursive: true });
await fs.mkdir(path.dirname(SQLITE_PATH), { recursive: true });
const mongoBoot = await initMongo(process.env.MONGODB_URI || "");
if (mongoBoot?.ready) {
  console.log("MongoDB connected for ecommerce data.");
} else {
  console.log(`MongoDB disabled: ${mongoBoot?.reason || "not configured"}`);
}

const db = new DatabaseSync(SQLITE_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- website | app
    name TEXT NOT NULL,
    slug TEXT,
    html_content TEXT,
    project_files TEXT,
    mobile_code TEXT,
    demo_apk_notes TEXT,
    aab_notes TEXT,
    published_url TEXT,
    zip_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_business_profiles (
    user_id INTEGER PRIMARY KEY,
    business_name TEXT,
    industry TEXT,
    city TEXT,
    country TEXT,
    map_profile_url TEXT,
    audience TEXT,
    brand_tone TEXT,
    goals TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notification_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL, -- web | app
    label TEXT,
    endpoint TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_growth_settings (
    user_id INTEGER PRIMARY KEY,
    one_tap_notifications_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS seo_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    open_graph_title TEXT,
    open_graph_description TEXT,
    tags TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL, -- instagram | linkedin | facebook
    account_handle TEXT NOT NULL,
    access_token TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    platform TEXT NOT NULL,
    social_account_id INTEGER,
    scheduled_for TEXT NOT NULL,
    caption TEXT NOT NULL,
    tags TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(social_account_id) REFERENCES social_accounts(id)
  );

  CREATE TABLE IF NOT EXISTS custom_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    domain TEXT NOT NULL,
    verification_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | verified
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, domain),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    company TEXT,
    timezone TEXT,
    default_project_type TEXT DEFAULT 'website',
    profile_image_url TEXT,
    two_factor_enabled INTEGER NOT NULL DEFAULT 0,
    two_factor_secret TEXT,
    two_factor_pending_secret TEXT,
    session_version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_access (
    user_id INTEGER PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'owner', -- viewer | editor | manager | owner
    plan TEXT NOT NULL DEFAULT 'starter', -- starter | pro | enterprise
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS email_change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    new_email TEXT NOT NULL,
    verify_token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Insert dummy system user for app FCM tokens (user_id = 0)
try {
  db.exec(`INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (0, 'System App User', 'system@easyway.app', 'none');`);
} catch (e) {
  // Ignore
}

function safeAlter(sql) {
  try {
    db.exec(sql);
  } catch {
    // Ignore duplicate-column migrations for already-updated databases.
  }
}

safeAlter(`ALTER TABLE user_settings ADD COLUMN profile_image_url TEXT;`);
safeAlter(`ALTER TABLE user_settings ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0;`);
safeAlter(`ALTER TABLE user_settings ADD COLUMN two_factor_secret TEXT;`);
safeAlter(`ALTER TABLE user_settings ADD COLUMN two_factor_pending_secret TEXT;`);
safeAlter(`ALTER TABLE user_settings ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;`);
safeAlter(`ALTER TABLE projects ADD COLUMN zip_path TEXT;`);

const statements = {
  insertUser: db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `),
  getUserByEmail: db.prepare(`
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE email = ?
  `),
  getUserById: db.prepare(`
    SELECT id, name, email, created_at
    FROM users
    WHERE id = ?
  `),
  updateUserEmail: db.prepare(`
    UPDATE users SET email = ? WHERE id = ?
  `),
  updateUserName: db.prepare(`
    UPDATE users SET name = ? WHERE id = ?
  `),
  updateUserPasswordHash: db.prepare(`
    UPDATE users SET password_hash = ? WHERE id = ?
  `),
  getUserPasswordHashById: db.prepare(`
    SELECT password_hash FROM users WHERE id = ? LIMIT 1
  `),
  insertActivity: db.prepare(`
    INSERT INTO user_activities (user_id, action, metadata)
    VALUES (?, ?, ?)
  `),
  getActivities: db.prepare(`
    SELECT id, action, metadata, created_at
    FROM user_activities
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
  `),
  insertProject: db.prepare(`
    INSERT INTO projects (
      user_id, type, name, slug, html_content, project_files,
      mobile_code, demo_apk_notes, aab_notes, published_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateProject: db.prepare(`
    UPDATE projects
    SET
      name = ?,
      slug = ?,
      html_content = ?,
      project_files = ?,
      mobile_code = ?,
      demo_apk_notes = ?,
      aab_notes = ?,
      published_url = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `),
  getProjectsByUser: db.prepare(`
    SELECT
      id,
      type,
      name,
      slug,
      published_url,
      zip_path,
      created_at,
      updated_at,
      html_content,
      CASE
        WHEN html_content IS NOT NULL AND trim(html_content) <> '' THEN 1
        ELSE 0
      END AS has_editable_html
    FROM projects
    WHERE user_id = ?
      AND (? IS NULL OR type = ?)
    ORDER BY updated_at DESC, id DESC
  `),
  getProjectById: db.prepare(`
    SELECT *
    FROM projects
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `),
  replaceProjectHtml: db.prepare(`
    UPDATE projects
    SET html_content = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `),
  setProjectZipPath: db.prepare(`
    UPDATE projects
    SET zip_path = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `),
  upsertBusinessProfile: db.prepare(`
    INSERT INTO user_business_profiles (
      user_id, business_name, industry, city, country, map_profile_url, audience, brand_tone, goals
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      business_name = excluded.business_name,
      industry = excluded.industry,
      city = excluded.city,
      country = excluded.country,
      map_profile_url = excluded.map_profile_url,
      audience = excluded.audience,
      brand_tone = excluded.brand_tone,
      goals = excluded.goals,
      updated_at = datetime('now')
  `),
  getBusinessProfile: db.prepare(`
    SELECT * FROM user_business_profiles WHERE user_id = ? LIMIT 1
  `),
  insertNotificationTarget: db.prepare(`
    INSERT INTO notification_targets (user_id, target_type, label, endpoint, enabled)
    VALUES (?, ?, ?, ?, ?)
  `),
  getNotificationTargets: db.prepare(`
    SELECT id, target_type, label, endpoint, enabled, created_at, updated_at
    FROM notification_targets
    WHERE user_id = ?
    ORDER BY id DESC
  `),
  insertSeoAsset: db.prepare(`
    INSERT INTO seo_assets (
      user_id, project_id, model_name, seo_title, seo_description, seo_keywords,
      open_graph_title, open_graph_description, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getLatestSeoByProject: db.prepare(`
    SELECT * FROM seo_assets
    WHERE user_id = ? AND project_id = ?
    ORDER BY id DESC
    LIMIT 1
  `),
  insertSocialAccount: db.prepare(`
    INSERT INTO social_accounts (user_id, platform, account_handle, access_token, enabled)
    VALUES (?, ?, ?, ?, ?)
  `),
  getSocialAccounts: db.prepare(`
    SELECT id, platform, account_handle, enabled, created_at, updated_at
    FROM social_accounts
    WHERE user_id = ?
    ORDER BY id DESC
  `),
  insertSocialSchedule: db.prepare(`
    INSERT INTO social_schedules (
      user_id, project_id, platform, social_account_id, scheduled_for, caption, tags, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getSocialSchedules: db.prepare(`
    SELECT id, project_id, platform, social_account_id, scheduled_for, caption, tags, status, created_at
    FROM social_schedules
    WHERE user_id = ?
    ORDER BY datetime(scheduled_for) DESC, id DESC
  `),
  insertCustomDomain: db.prepare(`
    INSERT INTO custom_domains (user_id, project_id, domain, verification_token, status)
    VALUES (?, ?, ?, ?, 'pending')
  `),
  getCustomDomains: db.prepare(`
    SELECT id, project_id, domain, verification_token, status, created_at, updated_at
    FROM custom_domains
    WHERE user_id = ?
    ORDER BY id DESC
  `),
  getCustomDomainById: db.prepare(`
    SELECT * FROM custom_domains WHERE id = ? AND user_id = ? LIMIT 1
  `),
  setCustomDomainStatus: db.prepare(`
    UPDATE custom_domains
    SET status = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `),
  ensureGrowthSettings: db.prepare(`
    INSERT INTO user_growth_settings (user_id, one_tap_notifications_enabled)
    VALUES (?, 1)
    ON CONFLICT(user_id) DO NOTHING
  `),
  getGrowthSettings: db.prepare(`
    SELECT user_id, one_tap_notifications_enabled, created_at, updated_at
    FROM user_growth_settings
    WHERE user_id = ?
    LIMIT 1
  `),
  upsertGrowthSettings: db.prepare(`
    INSERT INTO user_growth_settings (user_id, one_tap_notifications_enabled)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      one_tap_notifications_enabled = excluded.one_tap_notifications_enabled,
      updated_at = datetime('now')
  `),
  getUserSettings: db.prepare(`
    SELECT
      user_id,
      company,
      timezone,
      default_project_type,
      profile_image_url,
      two_factor_enabled,
      two_factor_secret,
      two_factor_pending_secret,
      session_version,
      updated_at
    FROM user_settings
    WHERE user_id = ?
    LIMIT 1
  `),
  upsertUserSettings: db.prepare(`
    INSERT INTO user_settings (user_id, company, timezone, default_project_type, profile_image_url)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      company = excluded.company,
      timezone = excluded.timezone,
      default_project_type = excluded.default_project_type,
      profile_image_url = excluded.profile_image_url,
      updated_at = datetime('now')
  `),
  ensureUserSettingsRow: db.prepare(`
    INSERT INTO user_settings (user_id)
    VALUES (?)
    ON CONFLICT(user_id) DO NOTHING
  `),
  setPending2FASecret: db.prepare(`
    UPDATE user_settings
    SET two_factor_pending_secret = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `),
  enable2FAFromPending: db.prepare(`
    UPDATE user_settings
    SET
      two_factor_enabled = 1,
      two_factor_secret = two_factor_pending_secret,
      two_factor_pending_secret = NULL,
      updated_at = datetime('now')
    WHERE user_id = ?
  `),
  disable2FA: db.prepare(`
    UPDATE user_settings
    SET
      two_factor_enabled = 0,
      two_factor_secret = NULL,
      two_factor_pending_secret = NULL,
      updated_at = datetime('now')
    WHERE user_id = ?
  `),
  bumpUserSessionVersion: db.prepare(`
    UPDATE user_settings
    SET
      session_version = COALESCE(session_version, 1) + 1,
      updated_at = datetime('now')
    WHERE user_id = ?
  `),
  ensureUserAccess: db.prepare(`
    INSERT INTO user_access (user_id, role, plan)
    VALUES (?, 'owner', 'starter')
    ON CONFLICT(user_id) DO NOTHING
  `),
  getUserAccess: db.prepare(`
    SELECT user_id, role, plan, updated_at
    FROM user_access
    WHERE user_id = ?
    LIMIT 1
  `),
  upsertUserAccess: db.prepare(`
    INSERT INTO user_access (user_id, role, plan)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      role = excluded.role,
      plan = excluded.plan,
      updated_at = datetime('now')
  `),
  createEmailChangeRequest: db.prepare(`
    INSERT INTO email_change_requests (user_id, new_email, verify_token, expires_at)
    VALUES (?, ?, ?, ?)
  `),
  getEmailChangeRequestByToken: db.prepare(`
    SELECT id, user_id, new_email, verify_token, expires_at, used_at, created_at
    FROM email_change_requests
    WHERE verify_token = ?
    LIMIT 1
  `),
  consumeEmailChangeRequest: db.prepare(`
    UPDATE email_change_requests
    SET used_at = datetime('now')
    WHERE id = ? AND used_at IS NULL
  `),
};

function createSession(user) {
  statements.ensureUserSettingsRow.run(user.id);
  statements.ensureUserAccess.run(user.id);
  const settings = statements.getUserSettings.get(user.id) || {};
  const access = statements.getUserAccess.get(user.id) || { role: "owner", plan: "starter" };
  const sessionVersion = Number(settings.session_version || 1);
  const payload = {
    sub: user.id,
    email: user.email,
    sv: sessionVersion,
    role: String(access.role || "owner"),
    plan: String(access.plan || "starter"),
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  return {
    token,
    session: {
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email,
        role: String(access.role || "owner"),
        plan: String(access.plan || "starter"),
        profileImageUrl: settings.profile_image_url || "",
        twoFactorEnabled: Boolean(Number(settings.two_factor_enabled || 0)),
      },
    },
  };
}

const ROLE_WEIGHT = { viewer: 1, editor: 2, manager: 3, owner: 4 };
const PLAN_WEIGHT = { starter: 1, pro: 2, enterprise: 3 };

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = statements.getUserById.get(payload.sub);
    if (!user) return res.status(401).json({ error: "Invalid session" });
    statements.ensureUserSettingsRow.run(user.id);
    statements.ensureUserAccess.run(user.id);
    const settings = statements.getUserSettings.get(user.id) || {};
    const sessionVersion = Number(settings.session_version || 1);
    if (Number(payload?.sv || 1) !== sessionVersion) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    const access = statements.getUserAccess.get(user.id) || { role: "owner", plan: "starter" };
    req.user = user;
    req.userSettings = settings;
    req.access = {
      role: String(access.role || "owner").toLowerCase(),
      plan: String(access.plan || "starter").toLowerCase(),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAccess({ minRole = "viewer", minPlan = "starter" } = {}) {
  const minRoleWeight = ROLE_WEIGHT[minRole] || ROLE_WEIGHT.viewer;
  const minPlanWeight = PLAN_WEIGHT[minPlan] || PLAN_WEIGHT.starter;
  return (req, res, next) => {
    const roleWeight = ROLE_WEIGHT[String(req.access?.role || "viewer")] || ROLE_WEIGHT.viewer;
    const planWeight = PLAN_WEIGHT[String(req.access?.plan || "starter")] || PLAN_WEIGHT.starter;
    if (roleWeight < minRoleWeight) {
      return res.status(403).json({ error: `This action requires role ${minRole} or higher.` });
    }
    if (planWeight < minPlanWeight) {
      return res.status(403).json({ error: `This action requires ${minPlan} plan or higher.` });
    }
    return next();
  };
}

function saveActivity(userId, action, metadata = {}) {
  statements.insertActivity.run(userId, action, JSON.stringify(metadata || {}));
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseNullableText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function extractSlugFromPublishedUrl(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/\/sites\/([^/]+)\/index\.html/i);
  if (!match?.[1]) return null;
  const safe = String(match[1]).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return safe || null;
}

function normalizeSlug(value) {
  if (!value) return null;
  const safe = String(value).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return safe || null;
}

function resolveProjectSlug(projectLike) {
  const fromSlug = normalizeSlug(projectLike?.slug);
  if (fromSlug) return fromSlug;
  return extractSlugFromPublishedUrl(projectLike?.published_url || projectLike?.publishedUrl || null);
}

function parseSkillReference(reference) {
  const raw = String(reference || "").trim();
  if (!raw) return null;

  const hasSourcePrefix = raw.includes(":");
  const source = hasSourcePrefix ? raw.split(":")[0].trim().toLowerCase() : null;
  const skillName = hasSourcePrefix ? raw.split(":").slice(1).join(":").trim() : raw;

  if (!skillName || !SKILL_NAME_RE.test(skillName)) return null;
  if (source && !Object.prototype.hasOwnProperty.call(SKILL_SOURCE_ROOTS, source)) return null;

  return { source, skillName };
}

async function resolveSkillFile(reference) {
  const parsed = parseSkillReference(reference);
  if (!parsed) return null;

  const sourcesToTry = parsed.source ? [parsed.source] : Object.keys(SKILL_SOURCE_ROOTS);
  for (const source of sourcesToTry) {
    const root = SKILL_SOURCE_ROOTS[source];
    const filePath = path.join(root, parsed.skillName, "SKILL.md");
    try {
      await fs.access(filePath);
      return {
        source,
        skillName: parsed.skillName,
        id: `${source}:${parsed.skillName}`,
        filePath,
      };
    } catch {
      // Try next source.
    }
  }

  return {
    source: parsed.source || null,
    skillName: parsed.skillName,
    id: parsed.source ? `${parsed.source}:${parsed.skillName}` : parsed.skillName,
    filePath: null,
  };
}

function clampSkillContent(content) {
  const normalized = String(content || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  if (normalized.length <= SKILL_CONTENT_MAX_CHARS) return normalized;
  return `${normalized.slice(0, SKILL_CONTENT_MAX_CHARS)}\n\n...[truncated for prompt budget]`;
}

async function buildSkillContextPayload() {
  const loaded = [];
  const missing = [];

  for (const selected of AI_SELECTED_SKILLS) {
    const resolved = await resolveSkillFile(selected);
    if (!resolved) {
      missing.push(selected);
      continue;
    }
    if (!resolved.filePath) {
      missing.push(resolved.id);
      continue;
    }

    try {
      const raw = await fs.readFile(resolved.filePath, "utf-8");
      const clamped = clampSkillContent(raw);
      if (!clamped) {
        missing.push(resolved.id);
        continue;
      }
      loaded.push({
        id: resolved.id,
        source: resolved.source,
        content: clamped,
      });
    } catch {
      missing.push(resolved.id);
    }
  }

  const skillContext = loaded.length
    ? [
      "LOCAL SKILL FILES (loaded from workspace SKILL.md):",
      ...loaded.map((skill) => `[${skill.id}]\n${skill.content}`),
    ].join("\n\n")
    : "";

  return {
    selectedSkills: AI_SELECTED_SKILLS,
    loadedSkills: loaded.map((s) => s.id),
    missingSkills: missing,
    skillContext,
    generatedAt: new Date().toISOString(),
  };
}

async function getSkillContextPayload(forceRefresh = false) {
  const now = Date.now();
  const cacheAge = now - cachedSkillContextAt;
  if (!forceRefresh && cachedSkillContextPayload && cacheAge < SKILL_CONTEXT_CACHE_TTL_MS) {
    return cachedSkillContextPayload;
  }

  const payload = await buildSkillContextPayload();
  cachedSkillContextPayload = payload;
  cachedSkillContextAt = Date.now();
  return payload;
}

function sanitizeZipEntryPath(rawPath) {
  if (!rawPath || typeof rawPath !== "string") return null;
  const normalized = rawPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
  return normalized || null;
}

async function persistProjectZip({ projectId, userId, slug, projectFiles = {}, htmlContent = "" }) {
  const numericProjectId = Number(projectId);
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericProjectId) || !Number.isFinite(numericUserId)) return null;

  const files = (projectFiles && typeof projectFiles === "object" && !Array.isArray(projectFiles))
    ? projectFiles
    : {};
  const entries = Object.entries(files);
  if (!entries.length && !String(htmlContent || "").trim()) return null;

  const zip = new JSZip();
  for (const [filePath, fileContent] of entries) {
    const safePath = sanitizeZipEntryPath(filePath);
    if (!safePath) continue;
    zip.file(safePath, typeof fileContent === "string" ? fileContent : String(fileContent ?? ""));
  }

  if (typeof htmlContent === "string" && htmlContent.trim()) {
    zip.file("preview.html", htmlContent);
  }

  const safeSlug = normalizeSlug(slug) || `project-${numericProjectId}`;
  const fileName = `${safeSlug}-u${numericUserId}-p${numericProjectId}.zip`;
  const fullPath = path.join(REACT_ZIP_DIR, fileName);
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  await fs.writeFile(fullPath, zipBuffer);
  const publicPath = `/react-zip/${fileName}`;
  statements.setProjectZipPath.run(publicPath, numericProjectId, numericUserId);
  return publicPath;
}

function persistWebsiteHtmlIfPublished(projectLike, htmlContent) {
  const safeSlug = resolveProjectSlug(projectLike);
  if (!safeSlug || !htmlContent) return;
  const filePath = path.join(SITES_DIR, safeSlug, "index.html");
  fs.mkdir(path.dirname(filePath), { recursive: true })
    .then(() => fs.writeFile(filePath, htmlContent, "utf-8"))
    .catch(() => {});
}

function extractHtmlFromModelResponse(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const doctypeIndex = raw.toLowerCase().indexOf("<!doctype");
  if (doctypeIndex >= 0) return raw.slice(doctypeIndex).trim();
  const htmlIndex = raw.toLowerCase().indexOf("<html");
  if (htmlIndex >= 0) return raw.slice(htmlIndex).trim();
  return raw;
}

function randomToken(size = 24) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < size; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function parseGoals(goals) {
  if (Array.isArray(goals)) return goals.map((g) => String(g).trim()).filter(Boolean);
  if (typeof goals === "string") {
    return goals.split(",").map((g) => g.trim()).filter(Boolean);
  }
  return [];
}

function safeJsonStringify(value, fallback = "[]") {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function applySeoToHtml(html, seo) {
  let out = String(html || "");
  const block = [
    seo.title ? `<title>${escapeHtml(seo.title)}</title>` : "",
    seo.description ? `<meta name="description" content="${escapeAttr(seo.description)}">` : "",
    Array.isArray(seo.keywords) && seo.keywords.length ? `<meta name="keywords" content="${escapeAttr(seo.keywords.join(", "))}">` : "",
    seo.ogTitle || seo.title ? `<meta property="og:title" content="${escapeAttr(seo.ogTitle || seo.title)}">` : "",
    seo.ogDescription || seo.description ? `<meta property="og:description" content="${escapeAttr(seo.ogDescription || seo.description)}">` : "",
  ].filter(Boolean).join("\n");
  if (!block) return out;

  const cleanPatterns = [
    /<title>[\s\S]*?<\/title>/gi,
    /<meta[^>]+name=["']description["'][^>]*>/gi,
    /<meta[^>]+name=["']keywords["'][^>]*>/gi,
    /<meta[^>]+property=["']og:title["'][^>]*>/gi,
    /<meta[^>]+property=["']og:description["'][^>]*>/gi,
  ];
  for (const pattern of cleanPatterns) out = out.replace(pattern, "");

  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n${block}\n`);
    return out;
  }
  if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n${block}\n</head>\n`);
    return out;
  }
  return `<!DOCTYPE html><html><head>${block}</head><body>${out}</body></html>`;
}

function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getUserFromAuthHeader(authorizationHeader = "") {
  const token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7) : "";
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return statements.getUserById.get(payload.sub) || null;
  } catch {
    return null;
  }
}

function getUserFromQueryToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(String(token), JWT_SECRET);
    return statements.getUserById.get(payload.sub) || null;
  } catch {
    return null;
  }
}

function providerOAuthConfig(platform) {
  const key = String(platform || "").toLowerCase();
  const redirectUri = process.env.SOCIAL_OAUTH_REDIRECT_URI || `${BASE_URL}/api/social/oauth/callback`;
  if (key === "instagram") {
    return {
      clientId: process.env.INSTAGRAM_CLIENT_ID || "",
      authUrl: "https://api.instagram.com/oauth/authorize",
      scope: "user_profile,user_media",
      redirectUri,
    };
  }
  if (key === "linkedin") {
    return {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      scope: "r_liteprofile r_emailaddress",
      redirectUri,
    };
  }
  if (key === "facebook") {
    return {
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      scope: "pages_show_list pages_manage_posts",
      redirectUri,
    };
  }
  return null;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TRINITY_MODEL = process.env.TRINITY_MODEL || "gemini-2.5-flash";

app.get("/api/skills/context", async (req, res) => {
  try {
    const forceRefresh = String(req.query?.refresh || "") === "1";
    const payload = await getSkillContextPayload(forceRefresh);
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to load skill context" });
  }
});

registerAuthRoutes({
  app,
  statements,
  authMiddleware,
  createSession,
  saveActivity,
  bcrypt,
});

registerActivityRoutes({
  app,
  authMiddleware,
  statements,
  saveActivity,
});

registerProjectRoutes({
  app,
  authMiddleware,
  statements,
  saveActivity,
  parseNullableText,
  normalizeSlug,
  extractSlugFromPublishedUrl,
  persistWebsiteHtmlIfPublished,
  persistProjectZip,
  safeJsonParse,
  ai,
  extractHtmlFromModelResponse,
});

registerGrowthRoutes({
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
  isMongoReady,
  getMongoModels,
});

registerBuilderRoutes({
  app,
  ai,
  fs,
  path,
  SITES_DIR,
  BASE_URL,
  getUserFromAuthHeader,
  statements,
  saveActivity,
  persistProjectZip,
});

registerEcommerceRoutes({
  app,
  authMiddleware,
  requireAccess,
  statements,
  saveActivity,
  isMongoReady,
  getMongoModels,
  crypto,
  WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
});

registerUserRoutes({
  app,
  authMiddleware,
  requireAccess,
  statements,
  saveActivity,
  bcrypt,
});
registerBufferRoutes({
  app,
  db,
  authMiddleware,
  getUserByToken: getUserFromQueryToken,
  saveActivity,
  baseUrl: BASE_URL,
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
  console.log(`EasyWay backend running on ${BASE_URL}`);
  console.log(`SQLite DB: ${SQLITE_PATH}`);
  console.log(`Sites dir: ${SITES_DIR}`);
  console.log(`React zip dir: ${REACT_ZIP_DIR}`);
});

