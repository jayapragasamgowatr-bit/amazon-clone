// ============================================================
// CANCELLATION AND RETURN RULES (pure functions)
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;

const RETURN_REASONS = Object.freeze([
  "Damaged on arrival",
  "Wrong item received",
  "Not as described",
  "Defective / not working",
  "No longer needed",
  "Other",
]);

const RETURN_STATUSES = Object.freeze(["None", "Requested", "Approved", "Rejected", "Refunded"]);

const getReturnWindowDays = () => {
  const days = Number(process.env.RETURN_WINDOW_DAYS);
  return Number.isFinite(days) && days >= 0 && days <= 365 ? Math.floor(days) : 7;
};

// Customers may cancel on their own only before the order is being packed.
const canCustomerCancel = (order) => ["Pending", "Confirmed"].includes(order?.status);

const returnDeadline = (order, windowDays = getReturnWindowDays()) => {
  if (!order?.deliveredAt) return null;
  return new Date(new Date(order.deliveredAt).getTime() + windowDays * DAY_MS);
};

// Returns { ok: true } or { ok: false, message }.
const canRequestReturn = (order, { now = new Date(), windowDays = getReturnWindowDays() } = {}) => {
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status !== "Delivered") {
    return { ok: false, message: "Only delivered orders can be returned." };
  }
  const current = order.returnRequest?.status || "None";
  if (current !== "None") {
    return { ok: false, message: "A return has already been requested for this order." };
  }
  const deadline = returnDeadline(order, windowDays);
  if (!deadline) return { ok: false, message: "The delivery date for this order is not recorded yet." };
  if (new Date(now).getTime() > deadline.getTime()) {
    return { ok: false, message: `The ${windowDays}-day return window for this order has closed.` };
  }
  return { ok: true };
};

// Which decision an admin may record next.
const canDecideReturn = (currentStatus, decision) => {
  if (currentStatus === "Requested") return ["Approved", "Rejected"].includes(decision);
  if (currentStatus === "Approved") return decision === "Refunded";
  return false;
};

module.exports = {
  RETURN_REASONS,
  RETURN_STATUSES,
  getReturnWindowDays,
  canCustomerCancel,
  returnDeadline,
  canRequestReturn,
  canDecideReturn,
};
