const mongoose=require("mongoose");
const User=require("../models/User");
const Order=require("../models/Order");
const Event=require("../models/Event");
const Product=require("../models/Product");
const {chat}=require("../utils/aiProvider");
const getCustomerAI=async(req,res,next)=>{try{
 const id=req.params.userId;if(!mongoose.isValidObjectId(id))return res.status(400).json({success:false,message:"Valid userId is required."});
 const [user,orders,events]=await Promise.all([User.findById(id).select("name email role createdAt").lean(),Order.find({user:id}).sort({createdAt:-1}).limit(100).lean(),Event.find({user:id}).sort({createdAt:-1}).limit(300).lean()]);
 if(!user)return res.status(404).json({success:false,message:"Customer not found."});
 const valid=orders.filter(o=>o.status!=="Cancelled"); const spent=valid.reduce((s,o)=>s+Number(o.totalPrice||0),0);
 const products=await Product.find({_id:{$in:valid.flatMap(o=>(o.items||[]).map(i=>i.product)).filter(mongoose.isValidObjectId)}}).select("name category price rating").lean();
 const context={customer:{id:String(user._id),name:user.name,createdAt:user.createdAt},metrics:{orders:orders.length,validOrders:valid.length,cancelledOrders:orders.length-valid.length,totalSpent:Number(spent.toFixed(2)),averageOrderValue:valid.length?Number((spent/valid.length).toFixed(2)):0,events:events.length},recentOrders:valid.slice(0,10).map(o=>({status:o.status,total:o.totalPrice,createdAt:o.createdAt,items:o.items})),recentEvents:events.slice(0,50).map(e=>({eventName:e.eventName,product:e.product,category:e.category,createdAt:e.createdAt})),catalogProducts:products};
 const ai=await chat({system:`You are a customer intelligence analyst for Waventra Vetric. Use only the supplied customer data. Summarize observed behavior, interests and lifecycle signals. Do not infer sensitive traits or invent motivations. Distinguish observations from hypotheses.`,user:`Create a concise Customer 360 intelligence brief with: observed behavior, product/category interests, engagement, retention/lifecycle signals, and useful follow-up opportunities.\n\nLIVE DATA:\n${JSON.stringify(context)}`,temperature:.15,maxTokens:900});
 res.json({success:true,provider:"ai",model:ai.model,customerId:id,analysis:ai.text});
}catch(e){next(e)}};
module.exports={getCustomerAI};
