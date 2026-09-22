const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const PINCODE_RE = /^\d{6}$/;
const NAME_RE = /^[\p{L}\p{M} .'-]+$/u;

const cleanString = (value, max = 1000) =>
  String(value ?? "").trim().slice(0, max);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const validateSpecifications = (value) => {
  if (value === undefined) return { valid: true, value: {} };
  if (!isPlainObject(value)) {
    return { valid: false, message: "Specifications must be an object." };
  }

  const entries = Object.entries(value);
  if (entries.length > 50) {
    return { valid: false, message: "A product can have at most 50 specifications." };
  }

  const normalized = {};
  for (const [key, rawValue] of entries) {
    const cleanKey = cleanString(key, 100);
    if (!cleanKey) continue;
    if (typeof rawValue !== "string" && typeof rawValue !== "number" && typeof rawValue !== "boolean") {
      return { valid: false, message: "Specification values must be text, numbers, or booleans." };
    }
    const cleanValue = cleanString(rawValue, 500);
    normalized[cleanKey] = cleanValue;
  }
  return { valid: true, value: normalized };
};

const validateStringArray = (value, fieldName, maxItems = 50, maxLength = 200) => {
  if (!Array.isArray(value)) {
    return { valid: false, message: `${fieldName} must be an array.` };
  }
  if (value.length > maxItems) {
    return { valid: false, message: `${fieldName} cannot contain more than ${maxItems} items.` };
  }
  const normalized = value.map((item) => cleanString(item, maxLength)).filter(Boolean);
  return { valid: true, value: normalized };
};

const validateRegistration = ({ name, email, password } = {}) => {
  const cleanName = cleanString(name, 100);
  const cleanEmail = cleanString(email, 254).toLowerCase();
  const cleanPassword = String(password ?? "");

  if (!cleanName || cleanName.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters." };
  }
  if (!NAME_RE.test(cleanName)) {
    return { valid: false, message: "Name contains invalid characters." };
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    return { valid: false, message: "Invalid email address." };
  }
  if (cleanPassword.length < 8 || cleanPassword.length > 128) {
    return { valid: false, message: "Password must be between 8 and 128 characters." };
  }
  if (!/[A-Za-z]/.test(cleanPassword) || !/\d/.test(cleanPassword)) {
    return { valid: false, message: "Password must contain at least one letter and one number." };
  }
  return { valid: true, value: { name: cleanName, email: cleanEmail, password: cleanPassword } };
};

const validateReview = ({ rating, comment } = {}) => {
  const numericRating = Number(rating);
  const cleanComment = cleanString(comment, 1000);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return { valid: false, message: "Rating must be a whole number between 1 and 5." };
  }
  if (cleanComment.length > 1000) {
    return { valid: false, message: "Review comment cannot exceed 1000 characters." };
  }
  return { valid: true, value: { rating: numericRating, comment: cleanComment } };
};

module.exports = {
  EMAIL_RE,
  NAME_RE,
  PHONE_RE,
  PINCODE_RE,
  cleanString,
  isPlainObject,
  validateSpecifications,
  validateStringArray,
  validateRegistration,
  validateReview,
};
