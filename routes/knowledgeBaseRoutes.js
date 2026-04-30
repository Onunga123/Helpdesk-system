const express = require("express");
const router = express.Router();
const { createArticle, getArticles, searchArticles, getArticleById, updateArticle, deleteArticle, voteArticle, getKnowledgeStats } = require("../controllers/knowledgeBaseController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/search", searchArticles);
router.get("/stats", authorize("admin", "ict_officer"), getKnowledgeStats);
router.route("/").get(getArticles).post(authorize("admin", "ict_officer"), createArticle);
router.route("/:id").get(getArticleById).put(authorize("admin", "ict_officer"), updateArticle).delete(authorize("admin"), deleteArticle);
router.post("/:id/vote", voteArticle);

module.exports = router;