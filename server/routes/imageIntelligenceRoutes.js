const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { getImageAudit, inspectOne } = require('../controllers/imageIntelligenceController');
const router = express.Router();
router.get('/admin/audit', protect, adminOnly, getImageAudit);
router.get('/admin/product/:id', protect, adminOnly, inspectOne);
module.exports = router;
