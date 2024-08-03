import express from "express"
import { adminOnly,authorOnly, protect } from "../middleware/auth.middleware.js"
import { createCategory, deleteCategory, getCategories } from "../controllers/categoryController.js";

const router = express.Router()



// routes
router.post("/createCategory", protect, authorOnly, createCategory);
router.get("/getCategories", protect, authorOnly, getCategories);

router.delete("/:slug", protect, authorOnly, deleteCategory);


export default router