const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { registerAuthenticity, verifyAuthenticity, getLedger } = require('../controllers/authenticityController');
const router = express.Router();
router.get('/verify/:id', verifyAuthenticity);
router.get('/admin/ledger', protect, adminOnly, getLedger);
router.post('/admin/register/:id', protect, adminOnly, registerAuthenticity);
module.exports = router;
