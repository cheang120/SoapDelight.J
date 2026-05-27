import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    fromLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      default: null,
    },
    toLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: [
        "initial_stock",
        "production_in",
        "transfer",
        "consignment_out",
        "consignment_return",
        "consignment_sold",
        "online_allocated",
        "online_sold",
        "adjustment",
        "damaged",
        "lost",
        "sample",
        "reverse",
      ],
      required: true,
    },
    direction: {
      type: String,
      enum: ["in", "out", "transfer", "adjustment"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    sourceDocument: {
      type: String,
      trim: true,
      default: "",
    },
    sourceDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relatedMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockMovement",
    },
    reversed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ fromLocationId: 1, createdAt: -1 });
stockMovementSchema.index({ toLocationId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);

export default StockMovement;
