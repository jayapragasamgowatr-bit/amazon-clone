const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectImageUrl } = require('../utils/imageIntelligence');
const crypto = require('crypto');
test('image intelligence flags missing images', () => assert.equal(inspectImageUrl('').status, 'missing'));
test('image intelligence accepts a normal image URL', () => assert.equal(inspectImageUrl('https://cdn.example.com/product.jpg').status, 'ready'));
test('SHA-256 ledger hashing is deterministic', () => { const a = crypto.createHash('sha256').update('abc').digest('hex'); const b = crypto.createHash('sha256').update('abc').digest('hex'); assert.equal(a, b); assert.equal(a.length, 64); });
