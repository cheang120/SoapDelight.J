import express from "express"
import { createCoupon, deleteCoupon, getCoupon, getCoupons } from "../controllers/couponController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router()

router.post("/createCoupon", protect, authorOnly, createCoupon);
router.get("/getCoupons", protect, authorOnly,getCoupons)
router.get("/:couponName", protect,getCoupon)
router.delete("/:id", protect, authorOnly,deleteCoupon)



export default router