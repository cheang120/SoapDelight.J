import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import AuditLog from "../models/auditLogModel.js";

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePage = (value) => {
  const page = Number(value || 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const normalizeLimit = (value) => {
  const limit = Number(value || 25);
  if (!Number.isInteger(limit) || limit <= 0) return 25;
  return Math.min(limit, 100);
};

const addDateFilter = (query, { dateFrom, dateTo }) => {
  const createdAt = {};
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;

  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    createdAt.$gte = fromDate;
  }

  if (toDate && !Number.isNaN(toDate.getTime())) {
    toDate.setHours(23, 59, 59, 999);
    createdAt.$lte = toDate;
  }

  if (Object.keys(createdAt).length > 0) {
    query.createdAt = createdAt;
  }
};

export const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const {
    actionType,
    targetType,
    actorId,
    actorEmail,
    dateFrom,
    dateTo,
    q,
  } = req.query;
  const page = normalizePage(req.query.page);
  const limit = normalizeLimit(req.query.limit);
  const query = {};

  if (actionType) query.actionType = String(actionType).trim();
  if (targetType) query.targetType = String(targetType).trim();
  if (actorEmail) query.actorEmail = String(actorEmail).trim().toLowerCase();

  if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
    query.actorId = actorId;
  }

  addDateFilter(query, { dateFrom, dateTo });

  if (q && String(q).trim()) {
    const keyword = new RegExp(escapeRegex(String(q).trim()), "i");
    query.$or = [
      { summary: keyword },
      { targetLabel: keyword },
      { actorName: keyword },
      { actorEmail: keyword },
      { actionLabel: keyword },
      { targetId: keyword },
    ];
  }

  const total = await AuditLog.countDocuments(query);
  const pages = Math.max(Math.ceil(total / limit), 1);
  const records = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.status(200).json({
    records,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
    summary: {
      totalRecords: total,
    },
  });
});

export default getAdminAuditLogs;
