// ============================================================
// ROLES AND PERMISSIONS
// ============================================================
// One place that says what each role may do. The client keeps a
// copy of this table (client/lib/permissions.js) to hide menus,
// but the server is the one that enforces it.
//
//   user       customer, no admin access
//   support    orders, customers (view), returns, product questions
//   inventory  products, stock, orders (view), product questions
//   manager    everything except managing staff accounts
//   admin      everything
// ============================================================

const PERMISSIONS = Object.freeze([
  "orders.view",
  "orders.manage",
  "products.manage",
  "inventory.manage",
  "customers.view",
  "customers.manage",
  "coupons.manage",
  "returns.manage",
  "questions.manage",
  "analytics.view",
  "activity.view",
  "staff.manage",
]);

const ROLE_PERMISSIONS = Object.freeze({
  user: [],
  support: ["orders.view", "orders.manage", "customers.view", "returns.manage", "questions.manage"],
  inventory: ["orders.view", "products.manage", "inventory.manage", "questions.manage"],
  manager: PERMISSIONS.filter((permission) => permission !== "staff.manage"),
  admin: [...PERMISSIONS],
});

const ROLES = Object.freeze(Object.keys(ROLE_PERMISSIONS));
const STAFF_ROLES = Object.freeze(ROLES.filter((role) => role !== "user"));

const ROLE_LABELS = Object.freeze({
  user: "Customer",
  support: "Support",
  inventory: "Inventory",
  manager: "Manager",
  admin: "Administrator",
});

const isValidRole = (role) => ROLES.includes(role);
const isStaffRole = (role) => STAFF_ROLES.includes(role);

const permissionsFor = (role) => ROLE_PERMISSIONS[role] || [];

const hasPermission = (role, permission) => permissionsFor(role).includes(permission);

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  STAFF_ROLES,
  ROLE_LABELS,
  isValidRole,
  isStaffRole,
  permissionsFor,
  hasPermission,
};
