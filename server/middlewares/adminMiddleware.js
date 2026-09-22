// Backward-compatible export. New code should import adminOnly from authMiddleware.
const { adminOnly } = require("./authMiddleware");
module.exports = adminOnly;
