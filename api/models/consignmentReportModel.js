import mongoose from "mongoose";

const consignmentReportItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productNameAtSale: {
      type: String,
      required: true,
      trim: true,
    },

    centralSkuAtSale: {
      type: String,
      default: "",
      trim: true,
    },

    locationSkuAtSale: {
      type: String,
      default: "",
      trim: true,
    },

    locationProductNameAtSale: {
      type: String,
      default: "",
      trim: true,
    },

    quantitySold: {
      type: Number,
      required: true,
      min: 1,
    },

    publicUnitPriceAtSale: {
      type: Number,
      required: true,
      min: 0,
    },

    discountRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    commissionRateAtSale: {
      type: Number,
      required: true,
      min: 0,
    },

    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    promotionDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    netPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    promotionNote: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const consignmentReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
    },

    locationNameAtReport: {
      type: String,
      required: true,
      trim: true,
    },

    locationCodeAtReport: {
      type: String,
      required: true,
      trim: true,
    },

    periodStart: {
      type: Date,
    },

    periodEnd: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["draft", "confirmed", "invoiced", "cancelled"],
      default: "draft",
    },

    items: {
      type: [consignmentReportItemSchema],
      default: [],
    },

    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    promotionDiscountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    commissionTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    netPayableTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    sourceDocument: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    confirmedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

consignmentReportSchema.index({ locationId: 1, status: 1 });
consignmentReportSchema.index({ createdAt: -1 });

const ConsignmentReport = mongoose.model(
  "ConsignmentReport",
  consignmentReportSchema
);

export default ConsignmentReport;
