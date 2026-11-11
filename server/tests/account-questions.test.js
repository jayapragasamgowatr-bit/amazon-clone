const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { hasPermission, PERMISSIONS, ROLE_PERMISSIONS } = require("../utils/permissions");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("product questions can be answered by support, inventory, manager and admin only", () => {
  assert.ok(PERMISSIONS.includes("questions.manage"));
  for (const role of ["support", "inventory", "manager", "admin"]) {
    assert.equal(hasPermission(role, "questions.manage"), true, role);
  }
  assert.equal(hasPermission("user", "questions.manage"), false);
});

test("every role only holds permissions that exist", () => {
  for (const [role, list] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of list) assert.ok(PERMISSIONS.includes(permission), `${role}: ${permission}`);
  }
});

test("the browser copy of the permission table matches the server", () => {
  const client = fs.readFileSync(path.join(__dirname, "..", "..", "client", "lib", "permissions.js"), "utf8");
  for (const [role, list] of Object.entries(ROLE_PERMISSIONS)) {
    const block = client.match(new RegExp(`\\b${role}: \\[([^\\]]*)\\]`));
    assert.ok(block, `client is missing role ${role}`);
    const clientList = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
    assert.deepEqual(clientList, [...list].sort(), `role ${role}`);
  }
});

test("staff question routes are permission-guarded and audited", () => {
  const routes = read("routes/questionRoutes.js");
  assert.match(routes, /router\.get\("\/admin", protect, can\("questions\.manage"\)/);
  assert.match(routes, /router\.put\("\/admin\/:id", protect, can\("questions\.manage"\), audit\(/);
  assert.match(routes, /router\.post\(\s*"\/product\/:productId",\s*protect,\s*createRateLimiter/);
});

test("password changes are rate limited and require sign-in", () => {
  const routes = read("routes/accountRoutes.js");
  assert.match(routes, /"\/password",\s*protect,\s*createRateLimiter/);
  assert.match(routes, /router\.put\("\/profile", protect, updateProfile\)/);
});

test("no admin route is left on the old admin-or-nothing guard without a reason", () => {
  // Deleting users and orders stays administrator-only on purpose.
  const allowed = new Set(["routes/authRoutes.js", "routes/orderRoutes.js"]);
  for (const file of fs.readdirSync(path.join(__dirname, "..", "routes"))) {
    const name = `routes/${file}`;
    if (allowed.has(name)) continue;
    assert.ok(!/,\s*adminOnly\s*,/.test(read(name)), `${name} still uses adminOnly`);
  }
});
