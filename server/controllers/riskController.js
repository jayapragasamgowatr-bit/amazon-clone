const Order = require("../models/Order");
const User = require("../models/User");

const DAYS = 30;
const HIGH_VALUE = 50000;
const RAPID_WINDOW_MIN = 30;

function safeEmail(value) { return String(value || "").trim().toLowerCase(); }
function keyFor(order) {
  const email = safeEmail(order?.customer?.email || order?.shippingAddress?.email);
  const phone = String(order?.customer?.phone || order?.shippingAddress?.phone || "").replace(/\D/g, "");
  return email || phone || String(order?.user || "unknown");
}
function riskLevel(score) { return score >= 70 ? "High" : score >= 40 ? "Medium" : "Low"; }

const getRiskAnalysis = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || DAYS, 1), 180);
    const since = new Date(Date.now() - days * 86400000);
    const orders = await Order.find({ createdAt: { $gte: since } })
      .select("user customer shippingAddress totalPrice status items createdAt cancellationReason")
      .sort({ createdAt: -1 }).limit(10000).lean();

    const groups = new Map();
    for (const order of orders) {
      const key = keyFor(order);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(order);
    }

    const signals = [];
    for (const [key, list] of groups.entries()) {
      const cancelled = list.filter(o => o.status === "Cancelled");
      const valid = list.filter(o => o.status !== "Cancelled");
      const totalValue = valid.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
      let score = 0;
      const reasons = [];
      if (list.length >= 5) { score += 20; reasons.push(`${list.length} orders in ${days} days`); }
      if (list.length >= 10) { score += 15; reasons.push("high order frequency"); }
      if (cancelled.length >= 3) { score += 20; reasons.push(`${cancelled.length} cancelled orders`); }
      if (cancelled.length >= 5) { score += 15; reasons.push("repeated cancellations"); }
      if (totalValue >= HIGH_VALUE) { score += 20; reasons.push(`₹${Math.round(totalValue).toLocaleString("en-IN")} non-cancelled value`); }
      const sorted = [...list].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      let rapidPairs = 0;
      for (let i = 1; i < sorted.length; i++) {
        if ((new Date(sorted[i].createdAt) - new Date(sorted[i-1].createdAt)) <= RAPID_WINDOW_MIN * 60000) rapidPairs++;
      }
      if (rapidPairs >= 2) { score += 15; reasons.push(`${rapidPairs} rapid order intervals`); }
      if (score >= 20) signals.push({ key, score: Math.min(score,100), level:riskLevel(score), orderCount:list.length, cancelledCount:cancelled.length, totalValue:Number(totalValue.toFixed(2)), reasons });
    }

    signals.sort((a,b) => b.score - a.score || b.totalValue - a.totalValue);
    const high = signals.filter(x => x.level === "High").length;
    const medium = signals.filter(x => x.level === "Medium").length;
    const uniqueCustomers = groups.size;
    const cancelledOrders = orders.filter(o => o.status === "Cancelled").length;
    const highValueOrders = orders.filter(o => Number(o.totalPrice || 0) >= HIGH_VALUE).length;

    res.json({
      success:true,
      generatedAt:new Date().toISOString(),
      methodology:"Rule-based risk signals only; not a fraud determination.",
      windowDays:days,
      summary:{orders:orders.length, uniqueCustomers, cancelledOrders, highValueOrders, flaggedCustomers:signals.length, highRisk:high, mediumRisk:medium},
      signals:signals.slice(0,100),
      thresholds:{highValueOrder:HIGH_VALUE, rapidOrderWindowMinutes:RAPID_WINDOW_MIN, minimumSignalScore:20}
    });
  } catch (e) { next(e); }
};

const getRiskCustomer = async (req,res,next) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) return res.status(400).json({success:false,message:"Customer email, phone, or user ID is required."});
    const user = await User.findOne({$or:[{email:q},{_id:q}]}).select("name email phone role createdAt").lean().catch(()=>null);
    const orders = await Order.find({$or:[{"customer.email":q},{"shippingAddress.email":q},{"customer.phone":q},{"shippingAddress.phone":q}, ...(user? [{user:user._id}] : [])]})
      .select("totalPrice status items createdAt cancellationReason").sort({createdAt:-1}).limit(100).lean();
    if (!orders.length) return res.json({success:true, customer:user, orders:[], signals:[], score:0, level:"Low"});
    const cancelled=orders.filter(o=>o.status==="Cancelled").length;
    const total=orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+Number(o.totalPrice||0),0);
    let score=0; const reasons=[];
    if(orders.length>=5){score+=20;reasons.push("high order frequency")}
    if(cancelled>=3){score+=25;reasons.push("repeated cancellations")}
    if(total>=HIGH_VALUE){score+=20;reasons.push("high non-cancelled order value")}
    if(orders.some(o=>Number(o.totalPrice||0)>=HIGH_VALUE)){score+=10;reasons.push("high-value order present")}
    score=Math.min(score,100);
    res.json({success:true,customer:user,orders,score,level:riskLevel(score),signals:reasons});
  }catch(e){next(e)}
};
module.exports={getRiskAnalysis,getRiskCustomer};
