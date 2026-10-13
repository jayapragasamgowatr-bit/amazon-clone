const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  templateFor,
  unique,
  parseExcluded,
} = require("../controllers/assistantSuggestionsController");

test("suggestion templates adapt to technical intent", () => {
  assert.match(templateFor("flow meter for a 3-inch pipeline"), /specifications/i);
  assert.match(templateFor("tank level monitoring"), /level-monitoring/i);
  assert.match(templateFor("cloud monitoring and IoT connectivity"), /support/i);
  assert.match(templateFor("DN100 pipeline"), /matches/i);
});

test("suggestion deduplication is case-insensitive", () => {
  assert.deepEqual(
    unique(["Find a flow meter", "find a flow meter", "Show tank level options"]),
    ["Find a flow meter", "Show tank level options"]
  );
});

test("excluded suggestions are normalized and bounded", () => {
  const parsed = parseExcluded(["  Question One  ||Question Two", "Question Three"]);
  assert.deepEqual(parsed, ["question one", "question two", "question three"]);
  assert.equal(parseExcluded(Array.from({ length: 20 }, (_, i) => `Question ${i}`)).length, 12);
});

test("AI suggestions endpoint is registered with rate limiting", () => {
  const routes = fs.readFileSync(path.join(__dirname, "..", "routes", "aiRoutes.js"), "utf8");
  assert.match(routes, /getAssistantSuggestions/);
  assert.match(routes, /router\.get\("\/assistant\/suggestions"/);
  assert.match(routes, /Too many suggestion requests/);
});

test("assistant query analytics event is allowed by the event schema", () => {
  const model = fs.readFileSync(path.join(__dirname, "..", "models", "Event.js"), "utf8");
  assert.match(model, /"assistant_query"/);
});
