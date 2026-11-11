// ============================================================
// COUPON RULES (pure functions, no database access)
// ============================================================

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const normalizeCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 30);

// Returns { ok: true, discount } or { ok: false, message }.
// `userUses` is how many non-cancelled orders this customer already placed with the code.
const evaluateCoupon = (coupon, { subtotal, now = new Date(), userUses = 0 } = {}) => {
  const amount = Number(subtotal);

  if (!coupon) return { ok: false, message: "That coupon code is not valid." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Add items to your cart before applying a coupon." };
  }
  if (coupon.isActive === false) return { ok: false, message: "This coupon is no longer active." };

  const time = new Date(now).getTime();
  if (coupon.startsAt && time < new Date(coupon.startsAt).getTime()) {
    return { ok: false, message: "This coupon is not active yet." };
  }
  if (coupon.expiresAt && time > new Date(coupon.expiresAt).getTime()) {
    return { ok: false, message: "This coupon has expired." };
  }

  const usageLimit = Number(coupon.usageLimit || 0);
  if (usageLimit > 0 && Number(coupon.usedCount || 0) >= usageLimit) {
    return { ok: false, message: "This coupon has been fully used." };
  }

  const perUserLimit = Number(coupon.perUserLimit || 0);
  if (perUserLimit > 0 && Number(userUses) >= perUserLimit) {
    return { ok: false, message: "You have already used this coupon." };
  }

  const minOrder = Number(coupon.minOrder || 0);
  if (amount < minOrder) {
    return {
      ok: false,
      message: `This coupon needs a minimum order of ₹${minOrder.toLocaleString("en-IN")}.`,
    };
  }

  const value = Number(coupon.value || 0);
  let discount = coupon.type === "percent" ? (amount * value) / 100 : value;

  const maxDiscount = Number(coupon.maxDiscount || 0);
  if (coupon.type === "percent" && maxDiscount > 0) discount = Math.min(discount, maxDiscount);

  // A coupon can never make the order total negative.
  discount = round2(Math.min(Math.max(discount, 0), amount));

  if (discount <= 0) return { ok: false, message: "This coupon does not apply to your order." };

  return { ok: true, discount };
};

// Validate admin input for creating/updating a coupon.
const validateCouponInput = (input = {}) => {
  const errors = [];
  const code = normalizeCode(input.code);
  const type = input.type === "fixed" ? "fixed" : input.type === "percent" ? "percent" : "";
  const value = Number(input.value);

  const optionalNumber = (raw, label, { integer = false } = {}) => {
    if (raw === undefined || raw === null || raw === "") return 0;
    const number = Number(raw);
    if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
      errors.push(`${label} must be a positive ${integer ? "whole " : ""}number.`);
      return 0;
    }
    return number;
  };

  const optionalDate = (raw, label) => {
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      errors.push(`${label} is not a valid date.`);
      return null;
    }
    return date;
  };

  if (code.length < 3) errors.push("Code must be at least 3 letters or numbers.");
  if (!type) errors.push("Type must be percent or fixed.");
  if (!Number.isFinite(value) || value <= 0) errors.push("Value must be greater than zero.");
  if (type === "percent" && value > 100) errors.push("A percentage discount cannot be more than 100.");

  const startsAt = optionalDate(input.startsAt, "Start date");
  const expiresAt = optionalDate(input.expiresAt, "Expiry date");
  if (startsAt && expiresAt && expiresAt <= startsAt) {
    errors.push("Expiry date must be after the start date.");
  }

  const value2 = {
    code,
    type,
    value: Number.isFinite(value) ? round2(value) : 0,
    description: String(input.description || "").trim().slice(0, 200),
    minOrder: optionalNumber(input.minOrder, "Minimum order"),
    maxDiscount: optionalNumber(input.maxDiscount, "Maximum discount"),
    usageLimit: optionalNumber(input.usageLimit, "Usage limit", { integer: true }),
    perUserLimit: optionalNumber(input.perUserLimit, "Per-customer limit", { integer: true }),
    startsAt,
    expiresAt,
    isActive: input.isActive !== false,
  };

  return { ok: errors.length === 0, errors, value: value2 };
};

module.exports = { round2, normalizeCode, evaluateCoupon, validateCouponInput };
