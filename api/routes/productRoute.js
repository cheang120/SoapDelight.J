import express from "express"
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controllers/productController.js"
import { adminOnly,authorOnly, protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/", protect,authorOnly, createProduct)
router.get("/", getProducts)
router.get("/:id", getProduct)

router.delete("/:id",protect,authorOnly,  deleteProduct)
router.patch("/:id",protect,authorOnly, updateProduct)

export default router