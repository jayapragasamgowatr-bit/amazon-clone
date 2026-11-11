// Mirror of server/utils/permissions.js.
// Used only to show or hide menus; the server enforces the real rules.

export const ROLE_PERMISSIONS = {
  user: [],
  support: ["orders.view", "orders.manage", "customers.view", "returns.manage", "questions.manage"],
  inventory: ["orders.view", "products.manage", "inventory.manage", "questions.manage"],
  manager: [
    "orders.view", "orders.manage", "products.manage", "inventory.manage",
    "customers.view", "customers.manage", "coupons.manage", "returns.manage",
    "questions.manage", "analytics.view", "activity.view",
  ],
  admin: [
    "orders.view", "orders.manage", "products.manage", "inventory.manage",
    "customers.view", "customers.manage", "coupons.manage", "returns.manage",
    "questions.manage", "analytics.view", "activity.view", "staff.manage",
  ],
};

export const ROLE_LABELS = {
  user: "Customer",
  support: "Support",
  inventory: "Inventory",
  manager: "Manager",
  admin: "Administrator",
};

export const ROLE_DESCRIPTIONS = {
  user: "Shops in the store. No admin access.",
  support: "Orders, shipping, customer lookup, returns and product questions.",
  inventory: "Products, stock levels, product questions and order lookup.",
  manager: "Everything except managing staff accounts.",
  admin: "Full access, including staff roles.",
};

export const ROLES = Object.keys(ROLE_PERMISSIONS);

export const roleOf = (user) =>
  user?.role || (user?.isAdmin === true ? "admin" : "user");

export const isStaff = (user) => roleOf(user) !== "user" && Boolean(ROLE_PERMISSIONS[roleOf(user)]);

export const hasPermission = (user, permission) =>
  (ROLE_PERMISSIONS[roleOf(user)] || []).includes(permission);

// Sections of the admin panel, in menu order.
export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Dashboard", permission: "analytics.view" },
  { href: "/admin/orders", label: "Orders", permission: "orders.view" },
  { href: "/admin/shipping", label: "Shipping", permission: "orders.view" },
  { href: "/admin/returns", label: "Returns", permission: "returns.manage" },
  { href: "/admin/questions", label: "Questions", permission: "questions.manage" },
  { href: "/admin/products", label: "Products", permission: "products.manage" },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory.manage" },
  { href: "/admin/coupons", label: "Coupons", permission: "coupons.manage" },
  { href: "/admin/users", label: "Customers", permission: "customers.view" },
  { href: "/admin/access", label: "Team & access", permission: "customers.manage" },
  { href: "/admin/activity", label: "Activity log", permission: "activity.view" },
  { href: "/admin/analytics", label: "Analytics", permission: "analytics.view" },
  { href: "/admin/copilot", label: "AI Copilot", permission: "analytics.view" },
];

export const sectionsFor = (user) =>
  ADMIN_SECTIONS.filter((section) => hasPermission(user, section.permission));

// Which permission a given admin page needs. Pages that are not listed
// (reports, AI tools) need "analytics.view"; the longest matching path wins.
const EXTRA_RULES = [
  { href: "/admin/add-product", permission: "products.manage" },
  { href: "/admin/edit-product", permission: "products.manage" },
  { href: "/admin/reviews", permission: "products.manage" },
];

export const permissionForPath = (pathname = "") => {
  const rules = [...ADMIN_SECTIONS, ...EXTRA_RULES]
    .filter((rule) => rule.href !== "/admin")
    .sort((a, b) => b.href.length - a.href.length);
  const match = rules.find(
    (rule) => pathname === rule.href || pathname.startsWith(`${rule.href}/`)
  );
  return match ? match.permission : "analytics.view";
};

// Where to send a staff member who opens a page their role cannot use.
export const homeFor = (user) => sectionsFor(user)[0]?.href || "/";
