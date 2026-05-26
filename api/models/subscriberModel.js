import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    preferredChannels: {
      type: [
        {
          type: String,
          enum: ["email", "whatsapp"],
        },
      ],
      default: ["email"],
    },
    source: {
      type: String,
      trim: true,
      default: "website",
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
    consentAt: {
      type: Date,
    },
    unsubscribedAt: {
      type: Date,
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    lastSubscribedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
