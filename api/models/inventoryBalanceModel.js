import mongoose from "mongoose";

const inventoryBalanceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

inventoryBalanceSchema.index(
  { productId: 1, locationId: 1 },
  { unique: true }
);

const InventoryBalance = mongoose.model(
  "InventoryBalance",
  inventoryBalanceSchema
);

export default InventoryBalance;
