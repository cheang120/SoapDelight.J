import express from "express";
import {
  deleteAdminSubscriber,
  getAdminSubscribers,
  subscribe,
  unsubscribe,
  unsubscribeByEmail,
  updateAdminSubscriber,
} from "../controllers/subscriberController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribeByEmail);
router.get("/unsubscribe/:token", unsubscribe);
router.get("/admin", protect, authorOnly, getAdminSubscribers);
router.patch("/admin/:id", protect, authorOnly, updateAdminSubscriber);
router.delete("/admin/:id", protect, authorOnly, deleteAdminSubscriber);

export default router;
