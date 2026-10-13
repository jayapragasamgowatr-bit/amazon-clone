const REQUIRED_ALWAYS = ["MONGO_URI", "JWT_SECRET"];

const validateEnvironment = () => {
  const production = process.env.NODE_ENV === "production";
  const missing = REQUIRED_ALWAYS.filter((key) => !String(process.env[key] || "").trim());

  if (production && !String(process.env.CLIENT_URL || "").trim()) {
    missing.push("CLIENT_URL");
  }

  const jwtSecret = String(process.env.JWT_SECRET || "");
  if (jwtSecret && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  const clientUrl = String(process.env.CLIENT_URL || "");
  if (clientUrl.includes("*")) {
    throw new Error("CLIENT_URL must contain explicit origins; wildcard CORS is not allowed.");
  }

  const vapid = [
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  ];
  const vapidConfigured = vapid.some((value) => String(value || "").trim());
  if (vapidConfigured && vapid.some((value) => !String(value || "").trim())) {
    throw new Error("VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured together.");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }

  return { production };
};

module.exports = { validateEnvironment };
