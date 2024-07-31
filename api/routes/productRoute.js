import express from "express"
import { createProduct } from "../controllers/productController.js"
import { adminOnly, protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/createProduct", protect,adminOnly, createProduct)

export default router