const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const supportConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  messages: { type: [messageSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

supportConversationSchema.index({ user: 1, updatedAt: -1 });
module.exports = mongoose.model("SupportConversation", supportConversationSchema);
