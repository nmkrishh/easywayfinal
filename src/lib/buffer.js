import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function bufferRequest(path, options = {}) {
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

export function getBufferConnectUrl() {
  const token = getAuthToken();
  return `${API_BASE}/auth/buffer?token=${encodeURIComponent(token || "")}`;
}

export const getBufferStatus = () => bufferRequest("/api/buffer/status");

export const connectBufferByToken = (accessToken) =>
  bufferRequest("/api/buffer/connect-token", {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });

export const scheduleBufferPost = (payload) =>
  bufferRequest("/api/schedule-post", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const generateScheduleImage = (prompt) =>
  bufferRequest("/api/schedule-post/generate-image", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
