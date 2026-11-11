const mongoose = require("mongoose");

// A record of who changed what in the admin panel.
const adminActivitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorName: { type: String, default: "", trim: true, maxlength: 100 },
    actorRole: { type: String, default: "", trim: true, maxlength: 20 },
    // e.g. "product.update", "order.status", "user.block"
    action: { type: String, required: true, trim: true, maxlength: 60, index: true },
    targetType: { type: String, default: "", trim: true, maxlength: 30, index: true },
    targetId: { type: String, default: "", trim: true, maxlength: 60 },
    summary: { type: String, default: "", trim: true, maxlength: 300 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "", trim: true, maxlength: 60 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

adminActivitySchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.AdminActivity || mongoose.model("AdminActivity", adminActivitySchema);
