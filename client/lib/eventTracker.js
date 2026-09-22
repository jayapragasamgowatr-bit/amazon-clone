import { apiFetch } from "./api";

const STORAGE_KEY = "wv_analytics_session";

const getSessionId = () => {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      const random = Math.random().toString(36).slice(2);
      id = `s_${Date.now().toString(36)}_${random}`.slice(0, 80);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

export const trackEvent = (eventName, payload = {}) => {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  if (!sessionId) return;

  const body = {
    eventName,
    sessionId,
    productId: payload.productId || undefined,
    category: payload.category || "",
    searchTerm: payload.searchTerm || "",
    path: payload.path || window.location.pathname,
    metadata: payload.metadata || {},
  };

  apiFetch("/api/events", { method: "POST", body }).catch(() => {
    // Analytics must never interfere with customer actions.
  });
};

export const trackPageView = (path) =>
  trackEvent("page_view", { path });
