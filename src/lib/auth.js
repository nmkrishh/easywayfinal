const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const TOKEN_KEY = "ew_auth_token";
const listeners = new Set();

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthToken() {
  return getToken();
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function emit(event, session) {
  listeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch {
      // Ignore listener errors so one bad subscriber does not break auth flow.
    }
  });
}

async function request(path, options = {}, requiresAuth = false) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (requiresAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  if (!res.ok) {
    const message = payload?.error || `Request failed (${res.status})`;
    return { data: null, error: { message } };
  }

  return { data: payload, error: null };
}

export async function signUp(email, password, name = "") {
  const { data, error } = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  if (error) return { data: null, error };

  setToken(data.token);
  const session = data.session || null;
  emit("SIGNED_IN", session);
  return { data, error: null };
}

export async function signIn(email, password) {
  const { data, error } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (error) return { data: null, error };

  setToken(data.token);
  const session = data.session || null;
  emit("SIGNED_IN", session);
  return { data, error: null };
}

export async function signOut() {
  await request("/api/auth/logout", { method: "POST" }, true);
  setToken(null);
  emit("SIGNED_OUT", null);
  return { error: null };
}

export async function getSession() {
  const token = getToken();
  if (!token) return { session: null, error: null };

  const { data, error } = await request("/api/auth/session", { method: "GET" }, true);
  if (error) {
    setToken(null);
    return { session: null, error };
  }
  return { session: data.session || null, error: null };
}

export function onAuthStateChange(callback) {
  listeners.add(callback);
  return {
    unsubscribe: () => listeners.delete(callback),
  };
}

export async function logActivity(action, metadata = {}) {
  return request(
    "/api/activity",
    {
      method: "POST",
      body: JSON.stringify({ action, metadata }),
    },
    true,
  );
}

export async function fetchActivities(limit = 15) {
  return request(`/api/activity?limit=${limit}`, { method: "GET" }, true);
}
