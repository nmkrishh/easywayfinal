import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function growthRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`API route not found: ${path}. Restart backend on latest code.`);
    }
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload;
}

export const getBusinessProfile = () => growthRequest("/api/business-profile");
export const saveBusinessProfile = (profile) =>
  growthRequest("/api/business-profile", { method: "POST", body: JSON.stringify(profile) });

export const getNotificationTargets = () => growthRequest("/api/notifications");
export const saveNotificationSettings = (payload) =>
  growthRequest("/api/notifications/settings", { method: "POST", body: JSON.stringify(payload) });
export const addNotificationTarget = (payload) =>
  growthRequest("/api/notifications/targets", { method: "POST", body: JSON.stringify(payload) });
export const sendTestNotification = (payload) =>
  growthRequest("/api/notifications/send-test", { method: "POST", body: JSON.stringify(payload) });

export const sendPushNotification = (payload) =>
  growthRequest("/api/notifications/send-test", { method: "POST", body: JSON.stringify(payload) });

export const generateSeoForProject = (projectId) =>
  growthRequest("/api/seo/generate", { method: "POST", body: JSON.stringify({ projectId }) });

export const getSocialAccounts = () => growthRequest("/api/social/accounts");
export const addSocialAccount = (payload) =>
  growthRequest("/api/social/accounts", { method: "POST", body: JSON.stringify(payload) });
export const startSocialOAuth = async (platform) => {
  try {
    return await growthRequest("/api/social/oauth/start", { method: "POST", body: JSON.stringify({ platform }) });
  } catch (error) {
    const msg = String(error?.message || "");
    if (msg.includes("400") || msg.includes("not configured") || msg.includes("API route not found")) {
      const token = getAuthToken();
      return {
        authorizationUrl: `${API_BASE}/auth/buffer?token=${encodeURIComponent(token || "")}`,
        provider: "buffer-direct-fallback",
      };
    }
    throw error;
  }
};
export const getSocialSchedules = () => growthRequest("/api/social/schedules");
export const scheduleSocialPost = (payload) =>
  growthRequest("/api/social/schedules", { method: "POST", body: JSON.stringify(payload) });
export const generateLivePost = (payload) =>
  growthRequest("/api/social/generate-live-post", { method: "POST", body: JSON.stringify(payload) });

export const getCustomDomains = () => growthRequest("/api/domains");
export const addCustomDomain = (payload) =>
  growthRequest("/api/domains", { method: "POST", body: JSON.stringify(payload) });
export const verifyCustomDomain = (id) =>
  growthRequest(`/api/domains/${id}/verify`, { method: "POST" });

export const getEcommerceProducts = (projectId) =>
  growthRequest(`/api/ecommerce/products?projectId=${encodeURIComponent(projectId)}`);
export const addEcommerceProduct = (payload) =>
  growthRequest("/api/ecommerce/products", { method: "POST", body: JSON.stringify(payload) });
export const updateEcommerceProduct = (id, payload) =>
  growthRequest(`/api/ecommerce/products/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteEcommerceProduct = (id, projectId) =>
  growthRequest(`/api/ecommerce/products/${encodeURIComponent(id)}?projectId=${encodeURIComponent(projectId)}`, { method: "DELETE" });

export const getEcommerceCustomers = (projectId) =>
  growthRequest(`/api/ecommerce/customers?projectId=${encodeURIComponent(projectId)}`);
export const addEcommerceCustomer = (payload) =>
  growthRequest("/api/ecommerce/customers", { method: "POST", body: JSON.stringify(payload) });

export const getEcommerceOrders = (projectId) =>
  growthRequest(`/api/ecommerce/orders?projectId=${encodeURIComponent(projectId)}`);
export const addEcommerceOrder = (payload) =>
  growthRequest("/api/ecommerce/orders", { method: "POST", body: JSON.stringify(payload) });
export const syncEcommerceOrderPayment = (id, payload) =>
  growthRequest(`/api/ecommerce/orders/${encodeURIComponent(id)}/sync-payment`, { method: "POST", body: JSON.stringify(payload) });
