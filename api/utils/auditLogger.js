import AuditLog from "../models/auditLogModel.js";

const compactText = (value, maxLength = 500) => {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const getIpAddress = (req) => {
  const forwardedFor = req?.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req?.ip || "";
};

export const createAuditLog = async ({
  req,
  actionType,
  actionLabel,
  targetType,
  targetId,
  targetLabel,
  summary,
  before,
  after,
  metadata,
  session,
} = {}) => {
  try {
    if (!actionType || !targetType || !targetId || !summary) {
      return null;
    }

    const user = req?.user;
    const payload = {
      actionType,
      actionLabel: compactText(actionLabel, 120),
      actorId: user?._id,
      actorName: compactText(user?.username || user?.name || user?.email, 160),
      actorEmail: compactText(user?.email, 220).toLowerCase(),
      targetType,
      targetId: String(targetId),
      targetLabel: compactText(targetLabel, 220),
      summary: compactText(summary, 500),
      before,
      after,
      metadata,
      ipAddress: compactText(getIpAddress(req), 120),
      userAgent: compactText(req?.get?.("user-agent"), 500),
    };

    if (session) {
      const [auditLog] = await AuditLog.create([payload], { session });
      return auditLog;
    }

    return await AuditLog.create(payload);
  } catch (error) {
    console.error("Unable to create audit log:", error?.message || error);
    return null;
  }
};

export default createAuditLog;
