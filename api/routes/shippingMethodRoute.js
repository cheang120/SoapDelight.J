import express from "express";
import {
  createShippingMethod,
  deleteShippingMethod,
  getActiveShippingMethods,
  getAdminShippingMethods,
  updateShippingMethod,
} from "../controllers/shippingMethodController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getActiveShippingMethods);
router.get("/admin", protect, authorOnly, getAdminShippingMethods);
router.post("/", protect, authorOnly, createShippingMethod);
router.patch("/:id", protect, authorOnly, updateShippingMethod);
router.delete("/:id", protect, authorOnly, deleteShippingMethod);

export default router;
