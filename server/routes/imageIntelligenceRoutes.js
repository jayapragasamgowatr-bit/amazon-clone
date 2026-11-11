const express = require('express');
const { protect, can } = require('../middlewares/authMiddleware');
const { getImageAudit, inspectOne } = require('../controllers/imageIntelligenceController');
const router = express.Router();
router.get('/admin/audit', protect, can("analytics.view"), getImageAudit);
router.get('/admin/product/:id', protect, can("analytics.view"), inspectOne);
module.exports = router;
