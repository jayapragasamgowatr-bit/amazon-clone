const Product = require('../models/Product');
const { analyzeCatalog, inspectImageUrl } = require('../utils/imageIntelligence');

async function getImageAudit(req, res) {
  const products = await Product.find({}).select('_id name image isActive category').sort({ name: 1 }).lean();
  const rows = analyzeCatalog(products);
  const summary = {
    total: rows.length,
    ready: rows.filter(x => x.status === 'ready').length,
    review: rows.filter(x => x.status === 'review').length,
    missing: rows.filter(x => x.status === 'missing').length,
    averageScore: rows.length ? Math.round(rows.reduce((a, x) => a + x.score, 0) / rows.length) : 0,
  };
  res.json({ success: true, summary, rows });
}

async function inspectOne(req, res) {
  const product = await Product.findById(req.params.id).select('_id name image').lean();
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, product, analysis: inspectImageUrl(product.image) });
}
module.exports = { getImageAudit, inspectOne };
