const mongoose = require("mongoose");

const Product = require("../models/Product");
const ProductQuestion = require("../models/ProductQuestion");

// ============================================================
// PRODUCT QUESTIONS AND ANSWERS
// ============================================================
// Customers ask on the product page; a question becomes public
// once a staff member answers it.
// ============================================================

const MAX_OPEN_QUESTIONS_PER_PRODUCT = 3;

const text = (value, max) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

const firstName = (name) => text(String(name || "").split(" ")[0], 40) || "Customer";

const publicQuestion = (item) => ({
  _id: item._id,
  askedBy: item.askedBy,
  question: item.question,
  answer: item.answer,
  status: item.status,
  createdAt: item.createdAt,
  answeredAt: item.answeredAt,
});

// GET /api/questions/product/:productId
// Answered questions for everyone, plus the signed-in customer's own pending ones.
const listForProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id." });
    }

    const [answered, mine] = await Promise.all([
      ProductQuestion.find({ product: productId, status: "Answered" })
        .sort({ answeredAt: -1 })
        .limit(50)
        .lean(),
      req.user?._id
        ? ProductQuestion.find({ product: productId, user: req.user._id, status: "Pending" })
            .sort({ createdAt: -1 })
            .limit(MAX_OPEN_QUESTIONS_PER_PRODUCT)
            .lean()
        : [],
    ]);

    res.json({
      success: true,
      questions: answered.map(publicQuestion),
      pending: mine.map(publicQuestion),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/questions/product/:productId   { question }
const askQuestion = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id." });
    }

    const question = text(req.body?.question, 400);
    if (question.length < 8) {
      return res.status(400).json({ success: false, message: "Please write your question in a little more detail." });
    }

    const product = await Product.exists({ _id: productId, isActive: { $ne: false } });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const open = await ProductQuestion.countDocuments({
      product: productId,
      user: req.user._id,
      status: "Pending",
    });
    if (open >= MAX_OPEN_QUESTIONS_PER_PRODUCT) {
      return res.status(429).json({
        success: false,
        message: "You already have questions waiting for an answer on this product.",
      });
    }

    const created = await ProductQuestion.create({
      product: productId,
      user: req.user._id,
      askedBy: firstName(req.user.name),
      question,
    });

    res.status(201).json({
      success: true,
      message: "Thanks! Your question has been sent to our team.",
      question: publicQuestion(created),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/questions/admin?status=Pending
const listForStaff = async (req, res, next) => {
  try {
    const status = ["Pending", "Answered", "Hidden"].includes(req.query.status)
      ? req.query.status
      : "Pending";

    const [items, counts] = await Promise.all([
      ProductQuestion.find({ status })
        .sort({ createdAt: status === "Pending" ? 1 : -1 })
        .limit(200)
        .populate("product", "name image")
        .populate("user", "name email")
        .lean(),
      ProductQuestion.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      counts: Object.fromEntries(counts.map((row) => [row._id, row.count])),
      questions: items,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/questions/admin/:id   { answer }  or  { hidden: true|false }
const answerQuestion = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid question id." });
    }

    const item = await ProductQuestion.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Question not found." });

    if (typeof req.body?.hidden === "boolean") {
      item.status = req.body.hidden ? "Hidden" : item.answer ? "Answered" : "Pending";
      res.locals.activitySummary = `${req.body.hidden ? "Hid" : "Restored"} a product question`;
    } else {
      const answer = text(req.body?.answer, 1500);
      if (answer.length < 2) {
        return res.status(400).json({ success: false, message: "Write an answer before saving." });
      }
      item.answer = answer;
      item.answeredBy = req.user._id;
      item.answeredAt = new Date();
      item.status = "Answered";
      res.locals.activitySummary = "Answered a product question";
    }

    await item.save();
    res.json({ success: true, question: item });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/questions/admin/:id
const deleteQuestion = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid question id." });
    }
    const removed = await ProductQuestion.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: "Question not found." });
    res.locals.activitySummary = "Deleted a product question";
    res.json({ success: true, message: "Question deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { listForProduct, askQuestion, listForStaff, answerQuestion, deleteQuestion };
