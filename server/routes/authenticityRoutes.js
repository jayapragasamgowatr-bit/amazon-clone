const express = require('express');
const { protect, can } = require('../middlewares/authMiddleware');
const { registerAuthenticity, verifyAuthenticity, getLedger } = require('../controllers/authenticityController');
const router = express.Router();
router.get('/verify/:id', verifyAuthenticity);
router.get('/admin/ledger', protect, can("analytics.view"), getLedger);
router.post('/admin/register/:id', protect, can("products.manage"), registerAuthenticity);
module.exports = router;
