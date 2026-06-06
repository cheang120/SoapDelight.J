import express from "express";
import { getAdminAuditLogs } from "../controllers/auditLogController.js";
import { authorOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/admin", protect, authorOnly, getAdminAuditLogs);

export default router;
