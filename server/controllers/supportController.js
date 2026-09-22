const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const SupportConversation = require("../models/SupportConversation");
const { chat } = require("../utils/aiProvider");

const clean = (v, max = 1200) => typeof v === "string" ? v.trim().slice(0, max) : "";

const productContext = async (message) => {
  const terms = [...new Set(message.toLowerCase().replace(/[^a-z0-9\s.-]/g, " ").split(/\s+/).filter(x => x.length > 2).slice(0, 8))];
  const or = terms.flatMap(t => [
    { name: { $regex: t, $options: "i" } },
    { category: { $regex: t, $options: "i" } },
    { description: { $regex: t, $options: "i" } },
  ]);
  const query = { isActive: { $ne: false }, ...(or.length ? { $or: or } : {}) };
  const products = await Product.find(query)
    .select("name description price image category countInStock rating numReviews features applications specifications")
    .sort({ rating: -1, numReviews: -1 }).limit(10).lean();
  return products.map(p => ({ id: String(p._id), name: p.name, category: p.category, price: p.price, stock: p.countInStock, rating: p.rating, reviews: p.numReviews, features: p.features, applications: p.applications, specifications: p.specifications, description: p.description }));
};

const orderContext = async (userId) => {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(8).select("_id createdAt status totalPrice paymentMethod paymentStatus items shippingAddress.name shippingAddress.city shippingAddress.state deliveredAt cancelledAt cancellationReason").lean();
  return orders.map(o => ({
    id: String(o._id), date: o.createdAt, status: o.status, total: o.totalPrice, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    items: (o.items || []).map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
    city: o.shippingAddress?.city, state: o.shippingAddress?.state, deliveredAt: o.deliveredAt, cancelledAt: o.cancelledAt, cancellationReason: o.cancellationReason,
  }));
};

const getSupport = async (req, res, next) => {
  try {
    const message = clean(req.body?.message);
    if (!message) return res.status(400).json({ success: false, message: "Message is required." });

    const userId = req.user?._id;
    const [products, orders] = await Promise.all([productContext(message), userId ? orderContext(userId) : Promise.resolve([])]);
    let conversation = userId ? await SupportConversation.findOne({ user: userId }).sort({ updatedAt: -1 }) : null;
    if (!conversation && userId) conversation = await SupportConversation.create({ user: userId, messages: [] });

    const recentMessages = (conversation?.messages || []).slice(-8).map(m => `${m.role}: ${m.content}`).join("\n");
    const system = `You are Waventra Vetric's real customer support assistant. Use only the supplied product and customer-order context for factual claims. Never invent prices, stock, order statuses, policies, delivery dates, refunds, discounts, specifications, or customer data. If information is not present, say that you cannot verify it. Never reveal another customer's information. For cancellation/return questions, explain that the customer should use the available site controls or contact support; do not claim an action was performed. Keep responses concise and helpful.`;
    const user = `Customer message:\n${message}\n\nLive product context:\n${JSON.stringify(products)}\n\nCustomer's recent orders (only if logged in):\n${JSON.stringify(orders)}\n\nRecent conversation:\n${recentMessages || "None"}\n\nAnswer the customer using only this context.`;
    const result = await chat({ system, user, temperature: 0.2, maxTokens: 900 });

    if (conversation) {
      conversation.messages.push({ role: "user", content: message }, { role: "assistant", content: result.text });
      conversation.messages = conversation.messages.slice(-20);
      conversation.updatedAt = new Date();
      await conversation.save();
    }

    res.json({ success: true, message: result.text, model: result.model, products: products.map(p => ({ _id: p.id, name: p.name, category: p.category, price: p.price, image: p.image, countInStock: p.stock, rating: p.rating, numReviews: p.reviews })) });
  } catch (e) { next(e); }
};

module.exports = { getSupport };
