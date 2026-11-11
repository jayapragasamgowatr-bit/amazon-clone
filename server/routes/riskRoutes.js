const express=require("express");
const {protect,can}=require("../middlewares/authMiddleware");
const {getRiskAnalysis,getRiskCustomer}=require("../controllers/riskController");
const router=express.Router();
router.get("/admin/analysis",protect,can("analytics.view"),getRiskAnalysis);
router.get("/admin/customer",protect,can("analytics.view"),getRiskCustomer);
module.exports=router;
