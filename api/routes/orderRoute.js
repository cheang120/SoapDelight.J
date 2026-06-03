import express from "express";
const router = express.Router();
import { protect, adminOnly,authorOnly } from "../middleware/auth.middleware.js";
import {
  createOrder, getOrder, getOrders, updateOrderStatus,
  createCancelRefund, getRefundPreview,
  closeReturnNoRefund, createReturnRequest, getReturnRefundPreview,
  receiveReturnRefund, getRefundReturnRecords,
  payWithStripe,
  // payWithFlutterwave,
  // verifyFlwPayment,
  // payWithWallet,
} from "../controllers/orderController.js";

// router.get("/response", verifyFlwPayment);
router.post("/", protect, createOrder);
router.get("/admin/:id/refund-preview", protect, authorOnly, getRefundPreview);
router.post("/admin/:id/cancel-refund", protect, authorOnly, createCancelRefund);
router.get("/admin/:id/return-refund-preview", protect, authorOnly, getReturnRefundPreview);
router.post("/admin/:id/return-request", protect, authorOnly, createReturnRequest);
router.post("/admin/:id/receive-return-refund", protect, authorOnly, receiveReturnRefund);
router.post("/admin/:id/close-return-no-refund", protect, authorOnly, closeReturnNoRefund);
router.get("/admin/refund-return-records", protect, authorOnly, getRefundReturnRecords);
router.patch("/:id", protect, authorOnly, updateOrderStatus);

router.get("/", protect, getOrders);
router.get("/:id", protect, getOrder);

router.post("/create-payment-intent", payWithStripe);
// router.post("/payWithFlutterwave", payWithFlutterwave);
// router.post("/payWithWallet", protect, payWithWallet);

export default router;
