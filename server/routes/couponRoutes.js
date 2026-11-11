const express = require("express");

const { protect, can } = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");
const {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

const router = express.Router();

// Mounted at /api/coupons
// Guessing codes is rate limited per visitor.
router.post(
  "/validate",
  protect,
  createRateLimiter({ windowMs: 10 * 60 * 1000, max: 20, keyPrefix: "coupon-validate", message: "Too many coupon attempts. Please try again later." }),
  validateCoupon
);

router.get("/", protect, can("coupons.manage"), listCoupons);
router.post("/", protect, can("coupons.manage"), audit("coupon.create", "Coupon"), createCoupon);
router.put("/:id", protect, can("coupons.manage"), audit("coupon.update", "Coupon"), updateCoupon);
router.delete("/:id", protect, can("coupons.manage"), audit("coupon.delete", "Coupon"), deleteCoupon);

module.exports = router;
