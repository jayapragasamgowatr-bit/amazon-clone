const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");

const DAYS = 30;
const HIGH_VALUE = 50000;
const RAPID_WINDOW_MIN = 30;

function safeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function keyFor(order) {
  const email = safeEmail(order?.customer?.email || order?.shippingAddress?.email);
  const phone = normalizePhone(order?.customer?.phone || order?.shippingAddress?.phone);
  return email || phone || String(order?.user || "unknown");
}

function maskCustomerKey(value) {
  const key = String(value || "");
  if (key.includes("@")) {
    const [local, ...domainParts] = key.split("@");
    const domain = domainParts.join("@");
    return `${local.slice(0, 1) || "*"}***@${domain}`;
  }
  const digits = normalizePhone(key);
  if (digits.length >= 7) return `•••• ${digits.slice(-4)}`;
  if (key.length > 4) return `Customer ••••${key.slice(-4)}`;
  return "Customer (masked)";
}

function riskLevel(score) {
  return score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
}

function scoreRiskGroup(list, days = DAYS) {
  const cancelled = list.filter((o) => o.status === "Cancelled");
  const valid = list.filter((o) => o.status !== "Cancelled");
  const totalValue = valid.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  let score = 0;
  const reasons = [];

  if (list.length >= 5) {
    score += 20;
    reasons.push(`${list.length} orders in ${days} days`);
  }
  if (list.length >= 10) {
    score += 15;
    reasons.push("high order frequency");
  }
  if (cancelled.length >= 3) {
    score += 20;
    reasons.push(`${cancelled.length} cancelled orders`);
  }
  if (cancelled.length >= 5) {
    score += 15;
    reasons.push("repeated cancellations");
  }
  if (totalValue >= HIGH_VALUE) {
    score += 20;
    reasons.push(`₹${Math.round(totalValue).toLocaleString("en-IN")} non-cancelled value`);
  }

  const sorted = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let rapidPairs = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const interval = new Date(sorted[i].createdAt) - new Date(sorted[i - 1].createdAt);
    if (interval >= 0 && interval <= RAPID_WINDOW_MIN * 60000) rapidPairs += 1;
  }
  if (rapidPairs >= 2) {
    score += 15;
    reasons.push(`${rapidPairs} rapid order intervals`);
  }

  return {
    score: Math.min(score, 100),
    cancelledCount: cancelled.length,
    totalValue: Number(totalValue.toFixed(2)),
    reasons,
    rapidPairs,
  };
}

function scoreCustomerOrders(orders) {
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;
  const total = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  let score = 0;
  const reasons = [];

  if (orders.length >= 5) {
    score += 20;
    reasons.push("high order frequency");
  }
  if (cancelled >= 3) {
    score += 25;
    reasons.push("repeated cancellations");
  }
  if (total >= HIGH_VALUE) {
    score += 20;
    reasons.push("high non-cancelled order value");
  }
  if (orders.some((o) => Number(o.totalPrice || 0) >= HIGH_VALUE)) {
    score += 10;
    reasons.push("high-value order present");
  }

  return { score: Math.min(score, 100), reasons };
}

function phoneRegexFor(value) {
  let digits = normalizePhone(value);
  if (digits.length < 7 || digits.length > 15) return null;
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  const sequence = digits.split("").join("\\D*");
  const prefix = digits.length === 10 ? "(?:\\+?91\\D*)?(?:0\\D*)?" : "";
  return new RegExp(`${prefix}${sequence}`);
}

const getRiskAnalysis = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || DAYS, 1), 180);
    const since = new Date(Date.now() - days * 86400000);
    const orders = await Order.find({ createdAt: { $gte: since } })
      .select("user customer shippingAddress totalPrice status items createdAt cancellationReason")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const groups = new Map();
    for (const order of orders) {
      const key = keyFor(order);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(order);
    }

    const signals = [];
    for (const [rawKey, list] of groups.entries()) {
      const result = scoreRiskGroup(list, days);
      if (result.score >= 20) {
        signals.push({
          id: crypto.createHash("sha256").update(rawKey).digest("hex").slice(0, 16),
          key: maskCustomerKey(rawKey),
          score: result.score,
          level: riskLevel(result.score),
          orderCount: list.length,
          cancelledCount: result.cancelledCount,
          totalValue: result.totalValue,
          reasons: result.reasons,
        });
      }
    }

    signals.sort((a, b) => b.score - a.score || b.totalValue - a.totalValue);
    const high = signals.filter((x) => x.level === "High").length;
    const medium = signals.filter((x) => x.level === "Medium").length;
    const uniqueCustomers = groups.size;
    const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;
    const highValueOrders = orders.filter((o) => Number(o.totalPrice || 0) >= HIGH_VALUE).length;

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      methodology: "Rule-based risk signals only; not a fraud determination. Review signals before taking action.",
      windowDays: days,
      summary: {
        orders: orders.length,
        uniqueCustomers,
        cancelledOrders,
        highValueOrders,
        flaggedCustomers: signals.length,
        highRisk: high,
        mediumRisk: medium,
      },
      signals: signals.slice(0, 100),
      thresholds: {
        highValueOrder: HIGH_VALUE,
        rapidOrderWindowMinutes: RAPID_WINDOW_MIN,
        minimumSignalScore: 20,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRiskCustomer = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Customer email, phone, or user ID is required.",
      });
    }

    const user = await User.findOne({ $or: [{ email: q }, { _id: q }] })
      .select("name email phone role createdAt")
      .lean()
      .catch(() => null);

    const orderConditions = [{ "customer.email": q }, { "shippingAddress.email": q }];
    const phoneRegex = phoneRegexFor(q);
    if (phoneRegex) {
      orderConditions.push(
        { "customer.phone": { $regex: phoneRegex } },
        { "shippingAddress.phone": { $regex: phoneRegex } },
      );
    }
    if (user) orderConditions.push({ user: user._id });

    const orders = await Order.find({ $or: orderConditions })
      .select("totalPrice status items createdAt cancellationReason")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (!orders.length) {
      return res.json({ success: true, customer: user, orders: [], signals: [], score: 0, level: "Low" });
    }

    const result = scoreCustomerOrders(orders);
    return res.json({
      success: true,
      customer: user,
      orders,
      score: result.score,
      level: riskLevel(result.score),
      signals: result.reasons,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRiskAnalysis,
  getRiskCustomer,
  // Export pure helpers so risk calculations can be tested without a live database.
  riskLevel,
  keyFor,
  normalizePhone,
  maskCustomerKey,
  phoneRegexFor,
  scoreRiskGroup,
  scoreCustomerOrders,
};
