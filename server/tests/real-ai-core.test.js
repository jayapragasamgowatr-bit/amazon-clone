const test = require("node:test");
const assert = require("node:assert/strict");
const { isConfigured } = require("../utils/aiProvider");

test("Real AI core requires explicit server API key configuration", () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldAiKey = process.env.AI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_API_KEY;
  assert.equal(isConfigured(), false);
  if (oldKey !== undefined) process.env.GEMINI_API_KEY = oldKey; else delete process.env.GEMINI_API_KEY;
  if (oldAiKey !== undefined) process.env.AI_API_KEY = oldAiKey; else delete process.env.AI_API_KEY;
});
