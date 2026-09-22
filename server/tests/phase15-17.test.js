const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Phase 15-17 server modules exist", () => {
  const files = [
    "controllers/customerIntelligenceController.js",
    "controllers/aiAssistantController.js",
    "controllers/adminCopilotController.js",
    "routes/customerIntelligenceRoutes.js",
    "routes/aiRoutes.js",
  ];
  for (const file of files) assert.equal(fs.existsSync(path.join(__dirname, "..", file)), true, file);
});

test("Phase 15-17 routes are registered", () => {
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(server, /customerIntelligenceRoutes/);
  assert.match(server, /aiRoutes/);
  assert.match(server, /\/api\/customer-intelligence/);
  assert.match(server, /\/api\/ai/);
});
