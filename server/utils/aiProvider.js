const getConfig = () => ({
  provider: (process.env.AI_PROVIDER || "gemini").trim().toLowerCase(),
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "",
  model: ((process.env.AI_PROVIDER || "gemini").trim().toLowerCase() === "gemini"
    ? (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite")
    : (process.env.AI_MODEL || "")),
  geminiBaseUrl: (process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, ""),
  openaiUrl: (process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions").trim(),
});

const isConfigured = () => {
  const c = getConfig();
  return Boolean(c.apiKey && c.model);
};

const requestJson = async (url, options, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error?.status ||
        `AI provider request failed (${response.status}).`;
      const err = new Error(message);
      err.statusCode =
        response.status === 401 || response.status === 403
          ? 502
          : response.status === 429
            ? 429
            : 502;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error("AI provider timed out. Please try again.");
      err.statusCode = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
};

const extractInteractionText = (data) => {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const parts = [];
  for (const step of steps) {
    if (step?.type !== "model_output" || !Array.isArray(step?.content)) continue;
    for (const item of step.content) {
      if (item?.type === "text" && typeof item.text === "string") {
        parts.push(item.text);
      }
    }
  }
  return parts.join("").trim();
};

const chatGemini = async ({
  system,
  user,
  temperature,
  maxTokens,
  previousInteractionId,
}) => {
  const c = getConfig();

  // Gemini Interactions API is the recommended interface for new Gemini projects.
  const url = `${c.geminiBaseUrl}/interactions`;
  const body = {
    model: c.model,
    input: user,
    system_instruction: system,
    store: false,
    generation_config: {
      max_output_tokens: maxTokens,
      thinking_level: "low",
    },
  };

  if (previousInteractionId) {
    body.previous_interaction_id = previousInteractionId;
    delete body.store;
  }

  const data = await requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": c.apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = extractInteractionText(data);
  if (!text) {
    const err = new Error("Gemini returned an empty response.");
    err.statusCode = 502;
    throw err;
  }

  return {
    text,
    model: c.model,
    provider: "gemini-interactions",
    interactionId: data?.id || null,
  };
};

const chatOpenAICompatible = async ({ system, user, temperature, maxTokens }) => {
  const c = getConfig();
  const data = await requestJson(c.openaiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.apiKey}`,
    },
    body: JSON.stringify({
      model: c.model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    const err = new Error("AI provider returned an empty response.");
    err.statusCode = 502;
    throw err;
  }
  return { text, model: c.model, provider: "openai-compatible" };
};

const chat = async ({
  system,
  user,
  temperature = 0.2,
  maxTokens = 900,
  previousInteractionId = null,
}) => {
  const c = getConfig();
  if (!c.apiKey || !c.model) {
    const err = new Error(
      "AI provider is not configured. Set GEMINI_API_KEY and GEMINI_MODEL on the server."
    );
    err.statusCode = 503;
    throw err;
  }

  if (c.provider === "gemini") {
    return chatGemini({
      system,
      user,
      temperature,
      maxTokens,
      previousInteractionId,
    });
  }

  return chatOpenAICompatible({
    system,
    user,
    temperature,
    maxTokens,
  });
};

module.exports = { chat, isConfigured, getConfig };
