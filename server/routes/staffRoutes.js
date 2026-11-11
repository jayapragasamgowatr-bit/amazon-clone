const express = require("express");

const { protect, staffOnly, can } = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");
const {
  getMyPermissions,
  listStaff,
  setUserRole,
  setUserBlocked,
  listActivity,
} = require("../controllers/staffController");

const router = express.Router();

// Mounted at /api/admin
router.get("/permissions", protect, staffOnly, getMyPermissions);
router.get("/staff", protect, can("staff.manage"), listStaff);
router.put("/users/:id/role", protect, can("staff.manage"), audit("user.role", "User"), setUserRole);
router.put("/users/:id/block", protect, can("customers.manage"), audit("user.block", "User"), setUserBlocked);
router.get("/activity", protect, can("activity.view"), listActivity);

module.exports = router;
