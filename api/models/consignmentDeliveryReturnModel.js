import mongoose from "mongoose";

const consignmentDeliveryReturnItemSchema = new mongoose.Schema(
  {
    deliveryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productCodeAtReturn: {
      type: String,
      default: "",
      trim: true,
    },
    productNameAtReturn: {
      type: String,
      required: true,
      trim: true,
    },
    originalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    previouslyReturnedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    returnQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    remainingQuantityAfterReturn: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const consignmentDeliveryReturnSchema = new mongoose.Schema(
  {
    returnNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    originalDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsignmentDelivery",
      required: true,
    },
    deliveryNumberAtReturn: {
      type: String,
      required: true,
      trim: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
    },
    locationNameAtReturn: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["confirmed"],
      default: "confirmed",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    items: [consignmentDeliveryReturnItemSchema],
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

consignmentDeliveryReturnSchema.index({ originalDeliveryId: 1, createdAt: -1 });
consignmentDeliveryReturnSchema.index({ locationId: 1, createdAt: -1 });

const ConsignmentDeliveryReturn = mongoose.model(
  "ConsignmentDeliveryReturn",
  consignmentDeliveryReturnSchema
);

export default ConsignmentDeliveryReturn;
