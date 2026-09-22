const Product = require("../models/Product");
const Event = require("../models/Event");
const { chat } = require("../utils/aiProvider");

const clean = (v, max=500) => typeof v === "string" ? v.trim().slice(0,max) : "";
const words = (s) => [...new Set(s.toLowerCase().replace(/[^a-z0-9\s.-]/g," ").split(/\s+/).filter(w=>w.length>2).slice(0,10))];

const getAssistant = async (req,res,next) => {
  try {
    const message = clean(req.body?.message);
    if (!message) return res.status(400).json({success:false,message:"Message is required."});
    const nums = message.match(/(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
    const budget = nums ? Number(nums[1].replace(/,/g,"")) : null;
    const terms = words(message).filter(w=>!['show','find','need','want','with','good','best','products','product','available','please','under','below'].includes(w));
    const clauses = terms.map(t=>({name:{$regex:t,$options:"i"}}));
    let query = {isActive:{$ne:false}};
    if (budget) query.price = {$lte:budget};
    if (clauses.length) query.$or = [...clauses, ...terms.map(t=>({category:{$regex:t,$options:"i"}})), ...terms.map(t=>({description:{$regex:t,$options:"i"}}))];
    let products = await Product.find(query).select("name description price image category countInStock rating numReviews features applications specifications").sort({rating:-1,numReviews:-1}).limit(12).lean();
    if (!products.length) {
      const fallback = {isActive:{$ne:false}}; if (budget) fallback.price={$lte:budget};
      products = await Product.find(fallback).select("name description price image category countInStock rating numReviews features applications specifications").sort({rating:-1,numReviews:-1}).limit(12).lean();
    }
    const catalog = products.map((p,i)=>({id:String(p._id),name:p.name,category:p.category,price:p.price,stock:p.countInStock,rating:p.rating,reviews:p.numReviews,features:p.features,applications:p.applications,specifications:p.specifications,description:p.description}));
    const result = await chat({
      system: `You are the real Waventra Vetric shopping assistant. Use ONLY the supplied live catalog context for factual product claims. Never invent a product, price, stock level, rating, feature, specification or discount. If the catalog does not support an answer, say so. Recommend at most 6 products and refer to them by id when useful. Be concise and helpful.`,
      user: `Customer request:\n${message}\n\nLive catalog from MongoDB:\n${JSON.stringify(catalog)}\n\nAnswer the customer. If there are no suitable products, explain that clearly and suggest a better search term.`,
      temperature:0.2,maxTokens:900
    });
    if (req.user?._id) await Event.create({eventName:"search",sessionId:`assistant-${String(req.user._id)}`.slice(0,80),user:req.user._id,searchTerm:message.slice(0,100),metadata:{source:"ai_assistant"}}).catch(()=>{});
    res.json({success:true,provider:"ai",model:result.model,message:result.text,products});
  } catch(e){ next(e); }
};
module.exports={getAssistant};
