import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function dashboardRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload;
}

export const getUserSettings = () => dashboardRequest("/api/user/settings");
export const saveUserSettings = (payload) =>
  dashboardRequest("/api/user/settings", { method: "POST", body: JSON.stringify(payload) });
export const changeUserPassword = (payload) =>
  dashboardRequest("/api/user/change-password", { method: "POST", body: JSON.stringify(payload) });
export const getUserAccess = () => dashboardRequest("/api/user/access");
export const requestEmailChange = (payload) =>
  dashboardRequest("/api/user/email-change/request", { method: "POST", body: JSON.stringify(payload) });
export const confirmEmailChange = (payload) =>
  dashboardRequest("/api/user/email-change/confirm", { method: "POST", body: JSON.stringify(payload) });
export const setupTwoFactor = () => dashboardRequest("/api/user/2fa/setup", { method: "POST" });
export const enableTwoFactor = (payload) =>
  dashboardRequest("/api/user/2fa/enable", { method: "POST", body: JSON.stringify(payload) });
export const disableTwoFactor = (payload) =>
  dashboardRequest("/api/user/2fa/disable", { method: "POST", body: JSON.stringify(payload) });
export const getSessionInfo = () => dashboardRequest("/api/user/sessions");
export const revokeAllSessions = () => dashboardRequest("/api/user/sessions/revoke-all", { method: "POST" });
