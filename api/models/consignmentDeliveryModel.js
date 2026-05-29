import mongoose from "mongoose";

const consignmentDeliveryItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productCodeAtIssue: {
      type: String,
      default: "",
      trim: true,
    },
    productNameAtIssue: {
      type: String,
      required: true,
      trim: true,
    },
    centralSkuAtIssue: {
      type: String,
      default: "",
      trim: true,
    },
    locationSkuAtIssue: {
      type: String,
      default: "",
      trim: true,
    },
    unitPriceAtIssue: {
      type: Number,
      required: true,
      min: 0,
    },
    settlementRateAtIssue: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    commissionRateAtIssue: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const consignmentDeliverySchema = new mongoose.Schema(
  {
    deliveryNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
    },
    locationNameAtIssue: {
      type: String,
      required: true,
      trim: true,
    },
    locationCodeAtIssue: {
      type: String,
      required: true,
      trim: true,
    },
    locationPhoneAtIssue: {
      type: String,
      default: "",
      trim: true,
    },
    locationEmailAtIssue: {
      type: String,
      default: "",
      trim: true,
    },
    locationAddressAtIssue: {
      type: String,
      default: "",
      trim: true,
    },
    companySnapshot: {
      businessName: { type: String, default: "", trim: true },
      contactName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      facebookPage: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
    },
    items: [consignmentDeliveryItemSchema],
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "cancelled"],
      default: "draft",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    issuedAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

consignmentDeliverySchema.index({ locationId: 1, status: 1 });
consignmentDeliverySchema.index({ createdAt: -1 });

const ConsignmentDelivery = mongoose.model(
  "ConsignmentDelivery",
  consignmentDeliverySchema
);

export default ConsignmentDelivery;
