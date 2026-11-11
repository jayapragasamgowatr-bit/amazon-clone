const express=require("express");
const {protect,can}=require("../middlewares/authMiddleware");
const {getCustomerIntelligence,getCustomerIntelligenceSummary}=require("../controllers/customerIntelligenceController");
const router=express.Router();
router.get("/admin/summary",protect,can("analytics.view"),getCustomerIntelligenceSummary);
router.get("/admin/customer",protect,can("analytics.view"),getCustomerIntelligence);
module.exports=router;
