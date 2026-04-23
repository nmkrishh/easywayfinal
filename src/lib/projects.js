import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function projectRequest(path, options = {}) {
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

export async function listProjects(type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  const data = await projectRequest(`/api/projects${query}`);
  return data.projects || [];
}

export async function getProject(projectId) {
  const data = await projectRequest(`/api/projects/${projectId}`);
  return data.project;
}

export async function saveProject(payload) {
  return projectRequest("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function replaceProjectContent(projectId, payload) {
  return projectRequest(`/api/projects/${projectId}/replace`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function aiEditProject(projectId, payload) {
  return projectRequest(`/api/projects/${projectId}/ai-edit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(projectId) {
  return projectRequest(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

