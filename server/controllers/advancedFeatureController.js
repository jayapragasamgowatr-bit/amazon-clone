const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { chat, isConfigured } = require("../utils/aiProvider");

function tokenize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}
function productText(p) {
  return [p.name,p.description,p.category,(p.features||[]).join(" "),(p.applications||[]).join(" "),JSON.stringify(p.specifications||{})].join(" ");
}

async function savePushSubscription(req,res,next){
  try {
    const sub=req.body?.subscription;
    if(!sub?.endpoint) return res.status(400).json({success:false,message:"Valid push subscription is required."});
    const user=await User.findById(req.user._id);
    if(!user) return res.status(404).json({success:false,message:"User not found."});
    const exists=(user.pushSubscriptions||[]).some(x=>x?.endpoint===sub.endpoint);
    if(!exists) user.pushSubscriptions.push(sub);
    await user.save();
    res.json({success:true,message:"Push notifications enabled."});
  }catch(e){next(e)}
}
async function removePushSubscription(req,res,next){
  try { const endpoint=String(req.body?.endpoint||""); const user=await User.findById(req.user._id); if(user){user.pushSubscriptions=(user.pushSubscriptions||[]).filter(x=>x?.endpoint!==endpoint); await user.save();} res.json({success:true,message:"Push subscription removed."}); } catch(e){next(e)}
}
async function getCustomerDashboard(req,res,next){
  try {
    const uid=req.user._id;
    const orders=await Order.find({user:uid}).sort({createdAt:-1}).limit(20).lean();
    const totalSpent=orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+Number(o.totalPrice||o.total||0),0);
    const wishlist=(await User.findById(uid).select("wishlist notificationPreferences").populate("wishlist","name price image category rating numReviews").lean())||{};
    const recentOrders=orders.slice(0,5).map(o=>({_id:o._id,status:o.status,total:Number(o.totalPrice||o.total||0),createdAt:o.createdAt,items:(o.items||[]).length}));
    res.json({success:true,summary:{orders:orders.length,totalSpent:Number(totalSpent.toFixed(2)),cancelled:orders.filter(o=>o.status==="Cancelled").length,pending:orders.filter(o=>["Pending","Confirmed","Processing","Shipped"].includes(o.status)).length},recentOrders,wishlist:wishlist.wishlist||[],notificationPreferences:wishlist.notificationPreferences||{}});
  }catch(e){next(e)}
}
async function semanticSearch(req,res,next){
  try {
    const q=String(req.query.q||"").trim(); if(!q) return res.json({success:true,query:"",results:[]});
    const terms=tokenize(q); const products=await Product.find({isActive:true}).limit(1000).lean();
    const results=products.map(p=>{const tokens=tokenize(productText(p)); let score=0; for(const t of terms){if(tokens.includes(t))score+=5; if(tokens.some(x=>x.startsWith(t)))score+=2; if(productText(p).toLowerCase().includes(t))score+=1;} if(terms.some(t=>String(p.category||"").toLowerCase().includes(t)))score+=4; return {...p,semanticScore:score};}).filter(p=>p.semanticScore>0).sort((a,b)=>b.semanticScore-a.semanticScore||Number(b.rating||0)-Number(a.rating||0)).slice(0,24);
    res.json({success:true,query:q,results});
  }catch(e){next(e)}
}
async function getKnowledgeGraph(req,res,next){
  try { const products=await Product.find({isActive:true}).select("name category price rating features applications").lean(); const nodes=[]; const edges=[]; const cats=new Map(); products.forEach(p=>{nodes.push({id:String(p._id),label:p.name,type:"product",category:p.category}); const c=p.category||"Uncategorized"; if(!cats.has(c)){cats.set(c,`cat:${c}`);nodes.push({id:`cat:${c}`,label:c,type:"category"});} edges.push({source:String(p._id),target:`cat:${c}`,type:"belongs_to"});}); const byCat={}; products.forEach(p=>(byCat[p.category||"Uncategorized"]??=[]).push(p)); for(const arr of Object.values(byCat)){for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length&&j<i+4;j++)edges.push({source:String(arr[i]._id),target:String(arr[j]._id),type:"related"});} res.json({success:true,nodes:nodes.slice(0,500),edges:edges.slice(0,1000),summary:{products:products.length,categories:cats.size,relationships:edges.length}}); } catch(e){next(e)}
}
async function summarizeProductReviews(req,res,next){
  try { const p=await Product.findById(req.params.id).lean(); if(!p)return res.status(404).json({success:false,message:"Product not found."}); const reviews=p.reviews||[]; if(!reviews.length)return res.json({success:true,summary:"No customer reviews yet.",sentiment:"neutral",highlights:[]}); const text=reviews.slice(0,80).map(r=>`Rating ${r.rating}/5: ${r.comment||""}`).join("\n"); if(!isConfigured()) return res.json({success:true,summary:`Customers gave an average rating of ${Number(p.rating||0).toFixed(1)}/5 across ${reviews.length} reviews.`,sentiment:p.rating>=4?"positive":p.rating>=3?"mixed":"negative",highlights:reviews.slice(0,3).map(r=>r.comment).filter(Boolean)}); const out=await chat({system:"Summarize ecommerce product reviews. Return concise JSON with summary, sentiment (positive/mixed/negative), strengths (array), concerns (array), and recommendation (string).",user:`Product: ${p.name}\nReviews:\n${text}`,temperature:.2,maxTokens:500}); let parsed; try{parsed=JSON.parse(out.text.replace(/^```json|```$/g,"").trim())}catch{parsed={summary:out.text,sentiment:"mixed",strengths:[],concerns:[],recommendation:""}} res.json({success:true,...parsed,reviewCount:reviews.length,rating:p.rating}); }catch(e){next(e)}
}
async function getAdminAdvancedAI(req,res,next){
  try { const [orders,products,users]=await Promise.all([Order.find({}).select("status totalPrice createdAt").lean(),Product.find({}).select("name category countInStock rating numReviews price").lean(),User.countDocuments()]); const revenue=orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+Number(o.totalPrice||0),0); const lowStock=products.filter(p=>Number(p.countInStock||0)<=5).sort((a,b)=>a.countInStock-b.countInStock).slice(0,10); const categories={}; products.forEach(p=>{const c=p.category||"Uncategorized"; categories[c]=(categories[c]||0)+1}); res.json({success:true,metrics:{orders:orders.length,revenue:Number(revenue.toFixed(2)),users,products:products.length,cancelled:orders.filter(o=>o.status==="Cancelled").length},lowStock,categories}); }catch(e){next(e)}
}
module.exports={savePushSubscription,removePushSubscription,getCustomerDashboard,semanticSearch,getKnowledgeGraph,summarizeProductReviews,getAdminAdvancedAI};
