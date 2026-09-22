const test = require("node:test");
const assert = require("node:assert/strict");
const { getConfig } = require("../utils/aiProvider");

test("Gemini is the default real AI provider", () => {
  const previous = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    AI_MODEL: process.env.AI_MODEL,
  };
  delete process.env.AI_PROVIDER;
  delete process.env.GEMINI_MODEL;
  delete process.env.AI_MODEL;
  const c = getConfig();
  assert.equal(c.provider, "gemini");
  assert.equal(c.model, "gemini-3.5-flash-lite");
  process.env.AI_PROVIDER = previous.AI_PROVIDER;
  process.env.GEMINI_MODEL = previous.GEMINI_MODEL;
  process.env.AI_MODEL = previous.AI_MODEL;
});

test("Gemini configuration reads server-side API key only", () => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  const c = getConfig();
  assert.equal(c.apiKey, "test-key");
  process.env.GEMINI_API_KEY = previous;
});


test("Gemini uses the current Interactions API model by default", () => {
  const previousUrl = process.env.GEMINI_API_URL;
  const previousProvider = process.env.AI_PROVIDER;
  const previousGeminiModel = process.env.GEMINI_MODEL;
  const previousAiModel = process.env.AI_MODEL;
  delete process.env.GEMINI_API_URL;
  delete process.env.AI_PROVIDER;
  delete process.env.GEMINI_MODEL;
  delete process.env.AI_MODEL;
  const c = getConfig();
  assert.equal(c.geminiBaseUrl, "https://generativelanguage.googleapis.com/v1beta");
  assert.equal(c.model, "gemini-3.5-flash-lite");
  process.env.GEMINI_API_URL = previousUrl;
  process.env.AI_PROVIDER = previousProvider;
  process.env.GEMINI_MODEL = previousGeminiModel;
  process.env.AI_MODEL = previousAiModel;
});
