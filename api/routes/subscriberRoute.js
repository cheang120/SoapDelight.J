import express from "express";
import {
  getAdminSubscribers,
  getAdminSubscriberOverview,
  getSubscriptionStatus,
  subscribe,
  unsubscribe,
  unsubscribeByEmail,
} from "../controllers/subscriberController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribeByEmail);
router.get("/status", getSubscriptionStatus);
router.get("/unsubscribe/:token", unsubscribe);
router.get("/admin", protect, authorOnly, getAdminSubscribers);
router.get("/admin/overview", protect, authorOnly, getAdminSubscriberOverview);

export default router;
