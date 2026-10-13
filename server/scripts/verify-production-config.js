require("dotenv").config();
const { validateEnvironment } = require("../utils/envValidation");

try {
  const result = validateEnvironment();
  console.log(`Production configuration check passed (${result.production ? "production" : "development"}).`);
  console.log("Secrets were not printed.");
  process.exit(0);
} catch (error) {
  console.error(`Production configuration check failed: ${error.message}`);
  process.exit(1);
}
