const mongoose = require("mongoose");

const automationAlertSchema = new mongoose.Schema({
  type: { type: String, enum: ["OUT_OF_STOCK", "LOW_STOCK", "CANCELLATION_SPIKE", "SALES_DROP", "HIGH_RISK"], required: true, index: true },
  severity: { type: String, enum: ["info", "warning", "critical"], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  fingerprint: { type: String, required: true, index: true },
  status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
  detectedAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

automationAlertSchema.index({ fingerprint: 1, detectedAt: -1 });
automationAlertSchema.index({ status: 1, severity: 1, detectedAt: -1 });
module.exports = mongoose.models.AutomationAlert || mongoose.model("AutomationAlert", automationAlertSchema);
