const crypto = require('crypto');
const Product = require('../models/Product');
const ProductAuthenticity = require('../models/ProductAuthenticity');

function snapshot(product) {
  return JSON.stringify({ id: String(product._id), name: product.name, category: product.category || '', price: product.price, image: product.image || '', createdAt: product.createdAt, updatedAt: product.updatedAt });
}
function sha(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

async function registerAuthenticity(req, res) {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  const existing = await ProductAuthenticity.findOne({ product: product._id });
  const previous = existing ? existing.previousHash : (await ProductAuthenticity.findOne().sort({ createdAt: -1 }).lean())?.ledgerHash || 'GENESIS';
  const productSnapshotHash = sha(snapshot(product));
  const ledgerHash = sha(`${previous}|${productSnapshotHash}|${Date.now()}`);
  const record = existing ? await ProductAuthenticity.findOneAndUpdate({ product: product._id }, { productSnapshotHash, previousHash: previous, ledgerHash, version: (existing.version || 1) + 1, createdBy: req.user._id }, { new: true }) : await ProductAuthenticity.create({ product: product._id, productSnapshotHash, previousHash: previous, ledgerHash, createdBy: req.user._id });
  res.json({ success: true, record });
}

async function verifyAuthenticity(req, res) {
  const record = await ProductAuthenticity.findOne({ product: req.params.id }).populate('product', 'name category price image updatedAt createdAt').lean();
  if (!record) return res.status(404).json({ success: false, verified: false, message: 'No authenticity record exists for this product.' });
  const currentHash = sha(snapshot(record.product));
  const verified = currentHash === record.productSnapshotHash;
  res.json({ success: true, verified, record, currentHash });
}
async function getLedger(req, res) {
  const rows = await ProductAuthenticity.find({}).populate('product', 'name category').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, rows });
}
module.exports = { registerAuthenticity, verifyAuthenticity, getLedger };
