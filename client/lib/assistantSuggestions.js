import { apiFetch } from "./api";

export async function getAssistantSuggestions(exclude = []) {
  const safe = Array.isArray(exclude) ? exclude.filter(Boolean).slice(-12) : [];
  const query = safe.length ? `?exclude=${encodeURIComponent(safe.join("||"))}` : "";
  return apiFetch(`/api/ai/assistant/suggestions${query}`, { method: "GET", auth: false, timeoutMs: 15000 });
}
