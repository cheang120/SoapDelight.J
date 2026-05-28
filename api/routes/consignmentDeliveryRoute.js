import express from "express";
import {
  cancelConsignmentDelivery,
  createConsignmentDelivery,
  getConsignmentDeliveries,
  getConsignmentDeliveryById,
  markConsignmentDeliveryIssued,
  updateConsignmentDelivery,
} from "../controllers/consignmentDeliveryController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorOnly);

router.get("/", getConsignmentDeliveries);
router.get("/:id", getConsignmentDeliveryById);
router.post("/admin", createConsignmentDelivery);
router.patch("/admin/:id", updateConsignmentDelivery);
router.post("/admin/:id/issue", markConsignmentDeliveryIssued);
router.post("/admin/:id/cancel", cancelConsignmentDelivery);

export default router;
