import express from "express"
import { adminOnly,authorOnly, protect } from "../middleware/auth.middleware.js"
import {
  createBrand,
  getBrands,
  deleteBrand,
} from "../controllers/brandController.js";

const router = express.Router();


// routes
router.post("/createBrand", protect, authorOnly, createBrand);
router.get("/getBrands", protect, authorOnly, getBrands);

router.delete("/:slug", protect, authorOnly, deleteBrand);

export default router;
