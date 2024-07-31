import express from "express"
import { createProduct, getProduct } from "../controllers/productController.js"
import { adminOnly, protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/", protect,adminOnly, createProduct)
router.get("/", getProduct)
router.get("/:id", getProduct)


export default router