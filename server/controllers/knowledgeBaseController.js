const asyncHandler = require("express-async-handler");
const KnowledgeBase = require("../models/knowledgeBaseModel");

const createArticle = asyncHandler(async (req, res) => {
  const { title, content, category, tags, status } = req.body;
  if (!title || !content || !category) { res.status(400); throw new Error("Please provide title, content and category"); }
  let processedTags = [];
  if (tags) {
    if (typeof tags === "string") processedTags = tags.split(",").map((t) => t.trim().toLowerCase());
    else if (Array.isArray(tags)) processedTags = tags.map((t) => t.trim().toLowerCase());
  }
  const article = await KnowledgeBase.create({ title, content, category, tags: processedTags, author: req.user._id, status: status || "draft" });
  const populated = await KnowledgeBase.findById(article._id).populate("author", "name role");
  res.status(201).json({ success: true, data: populated });
});

const getArticles = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === "student" || req.user.role === "staff") query.status = "published";
  if (req.query.category) query.category = req.query.category;
  if (req.query.status) query.status = req.query.status;
  const articles = await KnowledgeBase.find(query).populate("author", "name role").select("-content").sort({ views: -1, createdAt: -1 });
  res.json({ success: true, count: articles.length, data: articles });
});

const searchArticles = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) { res.status(400); throw new Error("Please provide a search keyword"); }
  let query = { $text: { $search: q } };
  if (req.user.role === "student" || req.user.role === "staff") query.status = "published";
  const articles = await KnowledgeBase.find(query, { score: { $meta: "textScore" } }).populate("author", "name role").sort({ score: { $meta: "textScore" } });
  res.json({ success: true, count: articles.length, keyword: q, data: articles });
});

const getArticleById = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id).populate("author", "name role");
  if (!article) { res.status(404); throw new Error("Article not found"); }
  if (article.status === "draft" && (req.user.role === "student" || req.user.role === "staff")) { res.status(403); throw new Error("This article is not available"); }
  article.views += 1;
  await article.save();
  res.json({ success: true, data: article });
});

const updateArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id);
  if (!article) { res.status(404); throw new Error("Article not found"); }
  const { title, content, category, tags, status } = req.body;
  article.title = title || article.title;
  article.content = content || article.content;
  article.category = category || article.category;
  article.status = status || article.status;
  if (tags) {
    if (typeof tags === "string") article.tags = tags.split(",").map((t) => t.trim().toLowerCase());
    else if (Array.isArray(tags)) article.tags = tags.map((t) => t.trim().toLowerCase());
  }
  const updated = await article.save();
  const populated = await KnowledgeBase.findById(updated._id).populate("author", "name role");
  res.json({ success: true, data: populated });
});

const deleteArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id);
  if (!article) { res.status(404); throw new Error("Article not found"); }
  await article.deleteOne();
  res.json({ success: true, message: "Article deleted successfully" });
});

const voteArticle = asyncHandler(async (req, res) => {
  const { vote } = req.body;
  if (!vote || !["helpful", "notHelpful"].includes(vote)) { res.status(400); throw new Error("Vote must be helpful or notHelpful"); }
  const article = await KnowledgeBase.findById(req.params.id);
  if (!article) { res.status(404); throw new Error("Article not found"); }
  const userId = req.user._id;
  article.helpful = article.helpful.filter((id) => id.toString() !== userId.toString());
  article.notHelpful = article.notHelpful.filter((id) => id.toString() !== userId.toString());
  if (vote === "helpful") article.helpful.push(userId);
  else article.notHelpful.push(userId);
  await article.save();
  res.json({ success: true, message: "Voted successfully", data: { helpfulCount: article.helpful.length, notHelpfulCount: article.notHelpful.length } });
});

const getKnowledgeStats = asyncHandler(async (req, res) => {
  const categoryStats = await KnowledgeBase.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const statusStats = await KnowledgeBase.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const topArticles = await KnowledgeBase.find({ status: "published" }).sort({ views: -1 }).limit(5).select("title views category").populate("author", "name");
  const totalArticles = await KnowledgeBase.countDocuments();
  res.json({ success: true, data: { total: totalArticles, byCategory: categoryStats, byStatus: statusStats, topViewed: topArticles } });
});

module.exports = { createArticle, getArticles, searchArticles, getArticleById, updateArticle, deleteArticle, voteArticle, getKnowledgeStats };
