const mongoose = require("mongoose");

const User = require("../models/User");
const AdminActivity = require("../models/AdminActivity");
const {
  ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  isValidRole,
  isStaffRole,
  permissionsFor,
  hasPermission,
} = require("../utils/permissions");

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isAdmin: user.role === "admin",
  isBlocked: Boolean(user.isBlocked),
  blockedAt: user.blockedAt || null,
  blockedReason: user.blockedReason || "",
  createdAt: user.createdAt,
});

// ------------------------------------------------------------
// GET /api/admin/permissions
// The signed-in staff member's role and what it allows.
// ------------------------------------------------------------
const getMyPermissions = (req, res) => {
  res.json({
    success: true,
    role: req.user.role,
    permissions: permissionsFor(req.user.role),
    roles: ROLES.map((role) => ({
      role,
      label: ROLE_LABELS[role],
      permissions: ROLE_PERMISSIONS[role],
    })),
  });
};

// ------------------------------------------------------------
// GET /api/admin/staff      everyone with a staff role
// ------------------------------------------------------------
const listStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $ne: "user" } })
      .select("name email role isBlocked blockedAt blockedReason createdAt")
      .sort({ role: 1, name: 1 })
      .lean();
    res.json({ success: true, staff: staff.map(publicUser) });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
// PUT /api/admin/users/:id/role   { role }
// ------------------------------------------------------------
const setUserRole = async (req, res, next) => {
  try {
    const role = text(req.body?.role, 20);
    if (!isValidRole(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${ROLES.join(", ")}.` });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (String(user._id) === String(req.user._id) && role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own administrator access." });
    }

    // Never leave the store without an administrator.
    if (user.role === "admin" && role !== "admin") {
      const admins = await User.countDocuments({ role: "admin", isBlocked: { $ne: true } });
      if (admins <= 1) {
        return res.status(400).json({ success: false, message: "At least one administrator is required." });
      }
    }

    const previous = user.role;
    user.role = role;
    user.isAdmin = role === "admin";
    await user.save();

    res.locals.activitySummary = `Changed ${user.email} from ${ROLE_LABELS[previous] || previous} to ${ROLE_LABELS[role]}`;
    res.json({ success: true, message: `${user.name} is now ${ROLE_LABELS[role]}.`, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
// PUT /api/admin/users/:id/block   { blocked, reason }
// ------------------------------------------------------------
const setUserBlocked = async (req, res, next) => {
  try {
    if (typeof req.body?.blocked !== "boolean") {
      return res.status(400).json({ success: false, message: "Send blocked: true or false." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    const blocked = req.body.blocked;
    const reason = text(req.body?.reason, 300);

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot suspend your own account." });
    }
    // Only people who manage staff may suspend a staff member.
    if (isStaffRole(user.role) && !hasPermission(req.user.role, "staff.manage")) {
      return res.status(403).json({ success: false, message: "Only an administrator can suspend staff accounts." });
    }
    if (blocked && user.role === "admin") {
      const admins = await User.countDocuments({ role: "admin", isBlocked: { $ne: true } });
      if (admins <= 1) {
        return res.status(400).json({ success: false, message: "At least one active administrator is required." });
      }
    }
    if (blocked && !reason) {
      return res.status(400).json({ success: false, message: "Add a short reason for the suspension." });
    }

    user.isBlocked = blocked;
    user.blockedAt = blocked ? new Date() : null;
    user.blockedReason = blocked ? reason : "";
    await user.save();

    res.locals.activitySummary = `${blocked ? "Suspended" : "Restored"} ${user.email}${blocked ? `: ${reason}` : ""}`;
    res.json({
      success: true,
      message: blocked ? `${user.name}'s account is suspended.` : `${user.name}'s account is active again.`,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
// GET /api/admin/activity?page=1&action=&actor=&targetType=
// ------------------------------------------------------------
const listActivity = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    const filter = {};
    const action = text(String(req.query.action || ""), 60);
    const targetType = text(String(req.query.targetType || ""), 30);
    const actor = text(String(req.query.actor || ""), 40);
    // Prefix match on a fixed vocabulary; characters outside it are stripped first.
    if (action) filter.action = { $regex: `^${action.replace(/[^a-z._-]/gi, "")}` };
    if (targetType) filter.targetType = targetType;
    if (mongoose.isValidObjectId(actor)) filter.actor = actor;

    const [items, total] = await Promise.all([
      AdminActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminActivity.countDocuments(filter),
    ]);

    res.json({ success: true, page, pages: Math.max(1, Math.ceil(total / limit)), total, items });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyPermissions, listStaff, setUserRole, setUserBlocked, listActivity, publicUser };
