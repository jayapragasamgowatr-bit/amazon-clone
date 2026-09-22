const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Event = require("../models/Event");
const { chat } = require("../utils/aiProvider");

const getCopilot = async (req,res,next) => {
  try {
    const since = new Date(Date.now()-30*86400000);
    const [orders, products, users, events] = await Promise.all([
      Order.find({createdAt:{$gte:since}}).select("totalPrice status items createdAt customer user").sort({createdAt:-1}).limit(5000).lean(),
      Product.find({}).select("name category price countInStock rating numReviews isActive").lean(),
      User.countDocuments({role:"user"}), Event.countDocuments({createdAt:{$gte:since}})
    ]);
    const valid=orders.filter(o=>o.status!=="Cancelled");
    const revenue=valid.reduce((s,o)=>s+Number(o.totalPrice||0),0);
    const low=products.filter(p=>Number(p.countInStock||0)>0&&Number(p.countInStock||0)<=5).sort((a,b)=>a.countInStock-b.countInStock).slice(0,20);
    const out=products.filter(p=>Number(p.countInStock||0)<=0).slice(0,20);
    const cancelled=orders.filter(o=>o.status==="Cancelled").length;
    const status={}; for(const o of orders) status[o.status]=(status[o.status]||0)+1;
    const top={}; for(const o of valid) for(const i of o.items||[]) top[i.name]=(top[i.name]||0)+Number(i.quantity||0);
    const topProducts=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,units])=>({name,units}));
    const snapshot={periodDays:30,orders:orders.length,revenue:Number(revenue.toFixed(2)),customers:users,events30d:events,averageOrderValue:valid.length?Number((revenue/valid.length).toFixed(2)):0,cancelledOrders:cancelled,cancellationRate:orders.length?Number((cancelled/orders.length*100).toFixed(2)):0,status};
    const ai=await chat({
      system:`You are Waventra Vetric's real admin business copilot. Analyze only the supplied live business data. Do not invent causes, figures or trends that are not supported. Clearly label an inference as an inference. Give concise findings and concrete areas for admin review. Do not execute actions or claim that an action was taken.`,
      user:`Analyze this live 30-day MongoDB snapshot and return:\n1) executive summary\n2) important findings\n3) inventory attention\n4) sales/customer observations\n5) suggested admin checks.\n\nSnapshot:\n${JSON.stringify(snapshot)}\nLow stock:\n${JSON.stringify(low)}\nOut of stock:\n${JSON.stringify(out)}\nTop products:\n${JSON.stringify(topProducts)}`,
      temperature:0.15,maxTokens:1100
    });
    res.json({success:true,provider:"ai",model:ai.model,generatedAt:new Date().toISOString(),snapshot,insights:[ai.text],lowStock:low,outOfStock:out,topProducts});
  } catch(e){next(e);}
};
module.exports={getCopilot};
