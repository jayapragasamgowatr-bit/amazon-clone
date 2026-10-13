const AutomationAlert = require("../models/AutomationAlert");
const { runAutomationScan } = require("../services/automationService");

const listAlerts = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const status = String(req.query.status || "open");
    const query = status === "all" ? {} : { status };
    const alerts = await AutomationAlert.find(query)
      .populate("resolvedBy", "name email")
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, alerts });
  } catch (error) {
    next(error);
  }
};

const scan = async (req, res, next) => {
  try {
    res.json({ success: true, ...(await runAutomationScan()) });
  } catch (error) {
    next(error);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const alert = await AutomationAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      },
      { new: true, runValidators: true },
    )
      .populate("resolvedBy", "name email")
      .lean();

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found." });
    }
    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
};

module.exports = { listAlerts, scan, resolveAlert };
