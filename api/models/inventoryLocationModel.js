import mongoose from "mongoose";

const inventoryLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["central", "online", "consignment", "other"],
      default: "other",
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const InventoryLocation = mongoose.model(
  "InventoryLocation",
  inventoryLocationSchema
);

export default InventoryLocation;
