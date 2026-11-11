const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { NAME_RE, cleanString } = require("../utils/validation");

// ============================================================
// ADDRESS BOOK  (/api/account/addresses)
// ============================================================

const MAX_ADDRESSES = 10;

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const readAddress = (body = {}) => {
  const address = {
    label: text(body.label, 40) || "Home",
    name: text(body.name, 100),
    phone: text(body.phone, 20).replace(/[^\d+\s-]/g, ""),
    address: text(body.address, 500),
    city: text(body.city, 100),
    state: text(body.state, 100),
    postalCode: text(body.postalCode || body.pincode, 10).replace(/\s/g, ""),
    isDefault: body.isDefault === true,
  };

  const errors = [];
  if (address.name.length < 2) errors.push("Enter the recipient's name.");
  if (address.phone.replace(/\D/g, "").length < 10) errors.push("Enter a valid phone number.");
  if (address.address.length < 5) errors.push("Enter the street address.");
  if (!address.city) errors.push("Enter the city.");
  if (!address.state) errors.push("Enter the state.");
  if (!/^\d{6}$/.test(address.postalCode)) errors.push("Enter a valid 6-digit PIN code.");

  return { address, errors };
};

// Exactly one default whenever there is at least one address.
const normalizeDefault = (user, preferredId = null) => {
  if (!user.addresses.length) return;
  const preferred = preferredId
    ? user.addresses.find((item) => String(item._id) === String(preferredId))
    : null;
  const chosen = preferred || user.addresses.find((item) => item.isDefault) || user.addresses[0];
  user.addresses.forEach((item) => {
    item.isDefault = String(item._id) === String(chosen._id);
  });
};

const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("addresses").lean();
    res.json({ success: true, addresses: user?.addresses || [] });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const { address, errors } = readAddress(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    if (user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({ success: false, message: `You can save up to ${MAX_ADDRESSES} addresses.` });
    }

    user.addresses.push(address);
    const created = user.addresses[user.addresses.length - 1];
    normalizeDefault(user, address.isDefault ? created._id : null);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { address, errors } = readAddress(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const user = await User.findById(req.user._id).select("addresses");
    const existing = user?.addresses.id(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Address not found." });

    Object.assign(existing, address);
    normalizeDefault(user, address.isDefault ? existing._id : null);
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    const existing = user?.addresses.id(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Address not found." });

    existing.deleteOne();
    normalizeDefault(user);
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PROFILE  (/api/account/profile)
// ============================================================

const updateProfile = async (req, res, next) => {
  try {
    const name = cleanString(req.body?.name, 100);
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
    }
    if (!NAME_RE.test(name)) {
      return res.status(400).json({ success: false, message: "Name contains invalid characters." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name } },
      { returnDocument: "after", runValidators: true }
    ).select("name email role isAdmin createdAt");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    res.json({ success: true, message: "Your profile has been updated.", user });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PASSWORD  (/api/account/password)
// ============================================================

const changePassword = async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");

    if (!currentPassword || currentPassword.length > 128) {
      return res.status(400).json({ success: false, message: "Enter your current password." });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ success: false, message: "New password must be between 8 and 128 characters." });
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must contain at least one letter and one number." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, message: "Choose a password you have not just used." });
    }

    // req.user is loaded without the password, so read it again here.
    const user = await User.findById(req.user._id).select("password");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Your current password is not correct." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // Any outstanding reset link stops working once the password changes.
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: "Your password has been changed." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateProfile,
  changePassword,
  readAddress,
  normalizeDefault,
};
