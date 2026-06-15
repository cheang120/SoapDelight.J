import express from "express";
import {
  createJournalArticle,
  createJournalCampaignDraft,
  deleteJournalArticle,
  getAdminJournalArticleById,
  getAdminJournalArticles,
  getPublishedJournalArticleBySlug,
  getPublishedJournalArticles,
  updateJournalArticle,
  updateJournalArticleStatus,
} from "../controllers/journalArticleController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getPublishedJournalArticles);
router.get("/admin", protect, authorOnly, getAdminJournalArticles);
router.get("/admin/:id", protect, authorOnly, getAdminJournalArticleById);
router.post("/admin", protect, authorOnly, createJournalArticle);
router.patch("/admin/:id", protect, authorOnly, updateJournalArticle);
router.patch("/admin/:id/status", protect, authorOnly, updateJournalArticleStatus);
router.post("/admin/:id/campaign-draft", protect, authorOnly, createJournalCampaignDraft);
router.delete("/admin/:id", protect, authorOnly, deleteJournalArticle);
router.get("/:slug", getPublishedJournalArticleBySlug);

export default router;
