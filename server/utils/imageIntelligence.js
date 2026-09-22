function inspectImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return { status: 'missing', issues: ['Missing product image'], score: 0 };
  const lower = value.toLowerCase();
  const issues = [];
  let score = 100;
  if (!/^https?:\/\//.test(value)) { issues.push('Image URL is not HTTP/HTTPS'); score -= 20; }
  if (lower.includes('placeholder') || lower.includes('default')) { issues.push('Placeholder/default image filename'); score -= 25; }
  const ext = (lower.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/) || [])[1];
  if (!ext) { issues.push('Image format could not be detected from URL'); score -= 10; }
  if (lower.includes('small') || lower.includes('thumb') || lower.includes('thumbnail')) { issues.push('URL suggests a thumbnail asset'); score -= 10; }
  return { status: issues.length ? 'review' : 'ready', issues, score: Math.max(0, score), format: ext || 'unknown' };
}

function analyzeCatalog(products) {
  const urlMap = new Map();
  const rows = products.map((p) => {
    const result = inspectImageUrl(p.image);
    const key = String(p.image || '').trim().toLowerCase();
    if (key) urlMap.set(key, (urlMap.get(key) || 0) + 1);
    return { productId: p._id, name: p.name, image: p.image || '', ...result };
  });
  rows.forEach((r) => { if (r.image && urlMap.get(r.image.trim().toLowerCase()) > 1) { r.issues.push('Duplicate image URL used by multiple products'); r.status = 'review'; r.score = Math.max(0, r.score - 15); } });
  return rows;
}
module.exports = { inspectImageUrl, analyzeCatalog };
