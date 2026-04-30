const asyncHandler = require('express-async-handler');
const KnowledgeBase = require('../models/knowledgeBaseModel');

const processTags = (tags) => {
  if (!tags) return [];
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t !== '');
  }
  if (Array.isArray(tags)) {
    return tags
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t !== '');
  }
  return [];
};

const createArticle = asyncHandler(async (req, res) => {
  const { title, content, category, tags, status } = req.body;

  if (!title || !content || !category) {
    res.status(400);
    throw new Error('Please provide title, content and category');
  }

  const article = await KnowledgeBase.create({
    title,
    content,
    category,
    tags: processTags(tags),
    author: req.user._id,
    status: status || 'draft',
  });

  const populatedArticle = await KnowledgeBase.findById(article._id).populate(
    'author',
    'name role'
  );

  res.status(201).json({
    success: true,
    data: populatedArticle,
  });
});

const getArticles = asyncHandler(async (req, res) => {
  const isPrivileged = ['admin', 'ict_officer'].includes(req.user.role);

  let query = {};

  if (!isPrivileged) {
    query.status = 'published';
  } else {
    if (req.query.status) query.status = req.query.status;
  }

  if (req.query.category) query.category = req.query.category;

  const articles = await KnowledgeBase.find(query)
    .populate('author', 'name role')
    .select('-content')
    .sort({ views: -1, createdAt: -1 });

  res.json({
    success: true,
    count: articles.length,
    data: articles,
  });
});

const searchArticles = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Please provide a search keyword using ?q=keyword');
  }

  const isPrivileged = ['admin', 'ict_officer'].includes(req.user.role);

  let query = { $text: { $search: q } };
  if (!isPrivileged) {
    query.status = 'published';
  }

  const articles = await KnowledgeBase.find(query, {
    score: { $meta: 'textScore' },
  })
    .populate('author', 'name role')
    .sort({ score: { $meta: 'textScore' } });

  res.json({
    success: true,
    count: articles.length,
    keyword: q,
    data: articles,
  });
});

const getArticleById = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id).populate(
    'author',
    'name role'
  );

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  if (
    article.status === 'draft' &&
    (req.user.role === 'student' || req.user.role === 'staff')
  ) {
    res.status(403);
    throw new Error('This article is not available');
  }

  if (
    article.status === 'published' &&
    (req.user.role === 'student' || req.user.role === 'staff')
  ) {
    article.views += 1;
    await article.save();
  }

  res.json({
    success: true,
    data: article,
  });
});

const updateArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  const { title, content, category, tags, status } = req.body;

  article.title = title || article.title;
  article.content = content || article.content;
  article.category = category || article.category;
  article.status = status || article.status;

  if (tags) {
    article.tags = processTags(tags);
  }

  const updatedArticle = await article.save();

  const populated = await KnowledgeBase.findById(updatedArticle._id).populate(
    'author',
    'name role'
  );

  res.json({
    success: true,
    data: populated,
  });
});

const deleteArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  await article.deleteOne();

  res.json({
    success: true,
    message: 'Article deleted successfully',
  });
});

const voteArticle = asyncHandler(async (req, res) => {
  const { vote } = req.body;

  if (!vote || !['helpful', 'notHelpful'].includes(vote)) {
    res.status(400);
    throw new Error('Vote must be either "helpful" or "notHelpful"');
  }

  const article = await KnowledgeBase.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  if (
    article.status === 'draft' &&
    (req.user.role === 'student' || req.user.role === 'staff')
  ) {
    res.status(403);
    throw new Error('This article is not available');
  }

  const userId = req.user._id;

  article.helpful = article.helpful.filter(
    (id) => id.toString() !== userId.toString()
  );
  article.notHelpful = article.notHelpful.filter(
    (id) => id.toString() !== userId.toString()
  );

  if (vote === 'helpful') {
    article.helpful.push(userId);
  } else {
    article.notHelpful.push(userId);
  }

  await article.save();

  res.json({
    success: true,
    message: `Voted as "${vote}" successfully`,
    data: {
      helpfulCount: article.helpful.length,
      notHelpfulCount: article.notHelpful.length,
    },
  });
});

const getKnowledgeStats = asyncHandler(async (req, res) => {
  const categoryStats = await KnowledgeBase.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const statusStats = await KnowledgeBase.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const topArticlesRaw = await KnowledgeBase.find({ status: 'published' })
    .sort({ views: -1 })
    .limit(5)
    .select('title views category helpful notHelpful')
    .populate('author', 'name');

  const totalArticles = await KnowledgeBase.countDocuments();

  res.json({
    success: true,
    data: {
      total: totalArticles,
      byCategory: categoryStats,
      byStatus: statusStats,
      topViewed: topArticlesRaw.map((a) => ({
        title: a.title,
        category: a.category,
        views: a.views,
        helpfulCount: a.helpful.length,
        notHelpfulCount: a.notHelpful.length,
        author: a.author,
      })),
    },
  });
});

module.exports = {
  createArticle,
  getArticles,
  searchArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  voteArticle,
  getKnowledgeStats,
};
