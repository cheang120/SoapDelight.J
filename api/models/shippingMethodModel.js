import mongoose from "mongoose";

const shippingMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Shipping method name is required"],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      required: [true, "Shipping method code is required"],
    },
    region: {
      type: String,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Shipping fee cannot be negative"],
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "MOP",
    },
    description: {
      type: String,
      trim: true,
    },
    estimatedDeliveryTime: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isPickup: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);

export default ShippingMethod;
