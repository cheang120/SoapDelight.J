import express from "express";
import {
  createCampaign,
  deleteDraftCampaign,
  getAdminCampaigns,
  getEligibleRecipientCount,
  sendCampaignToSubscribers,
  sendTestCampaign,
  updateDraftCampaign,
} from "../controllers/campaignController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/admin", protect, authorOnly, getAdminCampaigns);
router.get("/admin/eligible-recipients/count", protect, authorOnly, getEligibleRecipientCount);
router.post("/admin", protect, authorOnly, createCampaign);
router.patch("/admin/:id", protect, authorOnly, updateDraftCampaign);
router.post("/admin/:id/test", protect, authorOnly, sendTestCampaign);
router.post("/admin/:id/send", protect, authorOnly, sendCampaignToSubscribers);
router.delete("/admin/:id", protect, authorOnly, deleteDraftCampaign);

export default router;
