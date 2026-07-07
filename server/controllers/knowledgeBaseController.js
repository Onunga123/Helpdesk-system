const asyncHandler = require('express-async-handler');
const KnowledgeBase = require('../models/knowledgeBaseModel');

// ─── HELPER: Process tags safely ─────────────────────────────
// FIX 4: Filters out empty strings produced by inputs like ",,,wifi,,,"
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

// ─────────────────────────────────────────────────────────────
// @desc    Create a new article
// @route   POST /api/knowledge
// @access  Private (Admin / ICT Officer)
// ─────────────────────────────────────────────────────────────
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
    tags: processTags(tags), // FIX 4: safe tag processing
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

// ─────────────────────────────────────────────────────────────
// @desc    Get all articles
//          - Students/Staff see ONLY published articles
//          - Admin/ICT Officer see all (published + draft)
// @route   GET /api/knowledge
// @access  Private
// ─────────────────────────────────────────────────────────────
const getArticles = asyncHandler(async (req, res) => {
  const isPrivileged = ['admin', 'ict_officer'].includes(req.user.role);

  let query = {};

  // FIX 3: Students/staff locked to published only
  // Their role overrides ANY query param they send
  if (!isPrivileged) {
    query.status = 'published';
  } else {
    // Admins/ICT Officers can optionally filter by status
    if (req.query.status) query.status = req.query.status;
  }

  // Filter by category if provided
  if (req.query.category) query.category = req.query.category;

  const articles = await KnowledgeBase.find(query)
    .populate('author', 'name role')
    .select('-content')
    .sort({ views: -1, createdAt: -1 })
    .lean();

  res.json({
    success: true,
    count: articles.length,
    data: articles,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Search articles by keyword
// @route   GET /api/knowledge/search?q=wifi
// @access  Private
// ─────────────────────────────────────────────────────────────
const searchArticles = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Please provide a search keyword using ?q=keyword');
  }

  const isPrivileged = ['admin', 'ict_officer'].includes(req.user.role);

  // FIX 3: Same protection as getArticles
  // Students/staff locked to published regardless of any params
  let query = { $text: { $search: q } };
  if (!isPrivileged) {
    query.status = 'published';
  }

  const articles = await KnowledgeBase.find(query, {
    score: { $meta: 'textScore' }, // relevance score
  })
    .populate('author', 'name role')
    .sort({ score: { $meta: 'textScore' } }); // sort by relevance

  res.json({
    success: true,
    count: articles.length,
    keyword: q,
    data: articles,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get a single article by ID
// @route   GET /api/knowledge/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getArticleById = asyncHandler(async (req, res) => {
  const article = await KnowledgeBase.findById(req.params.id).populate(
    'author',
    'name role'
  );

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Students/staff cannot see draft articles
  if (
    article.status === 'draft' &&
    (req.user.role === 'student' || req.user.role === 'staff')
  ) {
    res.status(403);
    throw new Error('This article is not available');
  }

  // FIX 1: Only count views for students/staff reading published articles
  // Admin/ICT Officer previews of drafts do not count as views
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

// ─────────────────────────────────────────────────────────────
// @desc    Update an article
// @route   PUT /api/knowledge/:id
// @access  Private (Admin / ICT Officer)
// ─────────────────────────────────────────────────────────────
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
    article.tags = processTags(tags); // FIX 4: safe tag processing
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

// ─────────────────────────────────────────────────────────────
// @desc    Delete an article
// @route   DELETE /api/knowledge/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// @desc    Vote on article helpfulness
// @route   POST /api/knowledge/:id/vote
// @access  Private
// ─────────────────────────────────────────────────────────────
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

  // FIX 2: Students/staff cannot vote on draft articles
  if (
    article.status === 'draft' &&
    (req.user.role === 'student' || req.user.role === 'staff')
  ) {
    res.status(403);
    throw new Error('This article is not available');
  }

  const userId = req.user._id;

  // Remove user from both arrays first — resets their previous vote
  article.helpful = article.helpful.filter(
    (id) => id.toString() !== userId.toString()
  );
  article.notHelpful = article.notHelpful.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Add user to the correct array
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

// ─────────────────────────────────────────────────────────────
// @desc    Get knowledge base statistics
// @route   GET /api/knowledge/stats
// @access  Private (Admin / ICT Officer)
// ─────────────────────────────────────────────────────────────
const getKnowledgeStats = asyncHandler(async (req, res) => {
  const categoryStats = await KnowledgeBase.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const statusStats = await KnowledgeBase.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Top 5 most viewed articles with quality metrics
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