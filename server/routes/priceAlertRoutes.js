const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { getPriceAlerts, createPriceAlert, deletePriceAlert } = require("../controllers/priceAlertController");

const router = express.Router();
router.use(protect);
router.get("/", getPriceAlerts);
router.post("/", createPriceAlert);
router.delete("/:id", deletePriceAlert);
module.exports = router;
