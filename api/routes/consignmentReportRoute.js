import express from "express";
import {
  confirmConsignmentReport,
  createConsignmentReport,
  downloadConsignmentReportInvoicePdf,
  getConsignmentReportById,
  getConsignmentReports,
  updateConsignmentReport,
} from "../controllers/consignmentReportController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorOnly);

router.get("/admin", getConsignmentReports);
router.post("/admin", createConsignmentReport);
router.get("/admin/:id", getConsignmentReportById);
router.get("/admin/:id/invoice-pdf", downloadConsignmentReportInvoicePdf);
router.patch("/admin/:id", updateConsignmentReport);
router.post("/admin/:id/confirm", confirmConsignmentReport);

export default router;
