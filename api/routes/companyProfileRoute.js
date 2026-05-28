import express from "express";
import {
  getCompanyProfile,
  updateCompanyProfile,
} from "../controllers/companyProfileController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorOnly);

router.get("/", getCompanyProfile);
router.patch("/", updateCompanyProfile);

export default router;
