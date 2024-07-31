import express from "express"
import { createProduct, deleteProduct, getProduct, getProducts } from "../controllers/productController.js"
import { adminOnly,authorOnly, protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/", protect,authorOnly, createProduct)
router.get("/", getProducts)
router.get("/:id", getProduct)
router.delete("/:id", deleteProduct)


export default router