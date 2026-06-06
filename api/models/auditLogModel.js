import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    actionLabel: {
      type: String,
      trim: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    targetLabel: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({
  summary: "text",
  targetLabel: "text",
  actorName: "text",
  actorEmail: "text",
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
