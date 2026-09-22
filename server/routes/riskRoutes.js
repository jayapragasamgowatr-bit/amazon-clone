const express=require("express");
const {protect,adminOnly}=require("../middlewares/authMiddleware");
const {getRiskAnalysis,getRiskCustomer}=require("../controllers/riskController");
const router=express.Router();
router.get("/admin/analysis",protect,adminOnly,getRiskAnalysis);
router.get("/admin/customer",protect,adminOnly,getRiskCustomer);
module.exports=router;
