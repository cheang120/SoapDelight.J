import express from "express"
import { createCoupon } from "../controllers/couponController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router()

router.post("/createCoupon", protect, authorOnly, createCoupon);


export default router