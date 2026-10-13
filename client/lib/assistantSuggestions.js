import { apiFetch } from "./api";

export async function getAssistantSuggestions(exclude = [], context = "") {
  const params = new URLSearchParams();
  const safe = Array.isArray(exclude)
    ? exclude.filter((item) => typeof item === "string" && item.trim()).slice(-12)
    : [];

  if (safe.length) params.set("exclude", safe.join("||"));
  if (typeof context === "string" && context.trim()) {
    params.set("context", context.trim().slice(0, 120));
  }

  const query = params.toString();
  return apiFetch(
    `/api/ai/assistant/suggestions${query ? `?${query}` : ""}`,
    { method: "GET", auth: false }
  );
}
