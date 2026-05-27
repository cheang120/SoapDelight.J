import mongoose from "mongoose";

const campaignErrorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Email subject is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Campaign message is required"],
      trim: true,
    },
    couponCode: {
      type: String,
      trim: true,
    },
    buttonLabel: {
      type: String,
      trim: true,
    },
    buttonLink: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "failed", "test_sent"],
      default: "draft",
    },
    channel: {
      type: String,
      default: "email",
    },
    recipientQuery: {
      type: Object,
      default: {},
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    testSentTo: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    errors: {
      type: [campaignErrorSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
