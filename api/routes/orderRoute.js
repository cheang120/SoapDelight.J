import express from "express";
const router = express.Router();
import { protect, adminOnly,authorOnly } from "../middleware/auth.middleware.js";
import {
  createOrder, getOrder, getOrders, updateOrderStatus,
  // payWithStripe,
  // payWithFlutterwave,
  // verifyFlwPayment,
  // payWithWallet,
} from "../controllers/orderController.js";

// router.get("/response", verifyFlwPayment);
router.post("/", protect, createOrder);
router.patch("/:id", protect, authorOnly, updateOrderStatus);

router.get("/", protect, getOrders);
router.get("/:id", protect, getOrder);

// router.post("/create-payment-intent", payWithStripe);
// router.post("/payWithFlutterwave", payWithFlutterwave);
// router.post("/payWithWallet", protect, payWithWallet);

export default router;
