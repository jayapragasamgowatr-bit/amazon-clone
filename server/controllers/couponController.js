const mongoose = require("mongoose");

const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const { normalizeCode, evaluateCoupon, validateCouponInput } = require("../utils/couponRules");

const countUserUses = (userId, code, session = null) => {
  const query = Order.countDocuments({
    user: userId,
    "coupon.code": code,
    status: { $ne: "Cancelled" },
  });
  return session ? query.session(session) : query;
};

// ------------------------------------------------------------
// POST /api/coupons/validate   { code, subtotal }
// Preview only. The real discount is recalculated on the server
// from live product prices when the order is placed.
// ------------------------------------------------------------
const validateCoupon = async (req, res, next) => {
  try {
    const code = normalizeCode(req.body?.code);
    if (!code) return res.status(400).json({ success: false, message: "Enter a coupon code." });

    const coupon = await Coupon.findOne({ code }).lean();
    const userUses = coupon ? await countUserUses(req.user._id, code) : 0;
    const result = evaluateCoupon(coupon, { subtotal: Number(req.body?.subtotal), userUses });

    if (!result.ok) return res.status(400).json({ success: false, message: result.message });

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
      discount: result.discount,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
// Used by createOrder inside its transaction. Reserves one use of
// the coupon and returns { code, type, value, discount }.
// Throws an Error with statusCode 400 when the coupon cannot be used.
// ------------------------------------------------------------
const redeemCouponForOrder = async ({ code: rawCode, subtotal, userId, session }) => {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const fail = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  };

  const coupon = await Coupon.findOne({ code }).session(session);
  const userUses = coupon ? await countUserUses(userId, code, session) : 0;
  const result = evaluateCoupon(coupon, { subtotal, userUses });
  if (!result.ok) throw fail(result.message);

  // Reserve one use atomically so two checkouts cannot both take the last one.
  const filter = { _id: coupon._id, isActive: true };
  if (Number(coupon.usageLimit) > 0) filter.usedCount = { $lt: coupon.usageLimit };

  const updated = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } }, { session });
  if (!updated.modifiedCount) throw fail("This coupon has just been fully used.");

  return { code: coupon.code, type: coupon.type, value: coupon.value, discount: result.discount };
};

// ------------------------------------------------------------
// Staff: list / create / update / delete
// ------------------------------------------------------------
const listCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const check = validateCouponInput(req.body);
    if (!check.ok) return res.status(400).json({ success: false, message: check.errors[0], errors: check.errors });

    if (await Coupon.exists({ code: check.value.code })) {
      return res.status(409).json({ success: false, message: "A coupon with this code already exists." });
    }

    const coupon = await Coupon.create({ ...check.value, createdBy: req.user._id });
    res.locals.activitySummary = `Created coupon ${coupon.code}`;
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon id." });
    }
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });

    // The code cannot be changed once created, so past orders stay traceable.
    const check = validateCouponInput({ ...coupon.toObject(), ...req.body, code: coupon.code });
    if (!check.ok) return res.status(400).json({ success: false, message: check.errors[0], errors: check.errors });

    Object.assign(coupon, check.value);
    await coupon.save();
    res.locals.activitySummary = `Updated coupon ${coupon.code}`;
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon id." });
    }
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.locals.activitySummary = `Deleted coupon ${coupon.code}`;
    res.json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  redeemCouponForOrder,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
