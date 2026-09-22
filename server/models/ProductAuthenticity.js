const mongoose = require('mongoose');
const productAuthenticitySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
  productSnapshotHash: { type: String, required: true, index: true },
  previousHash: { type: String, default: 'GENESIS' },
  ledgerHash: { type: String, required: true, unique: true, index: true },
  version: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.models.ProductAuthenticity || mongoose.model('ProductAuthenticity', productAuthenticitySchema);
