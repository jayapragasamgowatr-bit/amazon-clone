const express=require("express");
const {protect,adminOnly}=require("../middlewares/authMiddleware");
const {getCustomerIntelligence,getCustomerIntelligenceSummary}=require("../controllers/customerIntelligenceController");
const router=express.Router();
router.get("/admin/summary",protect,adminOnly,getCustomerIntelligenceSummary);
router.get("/admin/customer",protect,adminOnly,getCustomerIntelligence);
module.exports=router;
