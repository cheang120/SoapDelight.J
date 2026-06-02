import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderDate: {
      type: String,
      required: [true, "Please add an order date"],
      trim: true,
    },
    orderTime: {
      type: String,
      required: [true, "Please add an order date"],
      trim: true,
    },
    orderAmount: {
      type: Number,
      required: [true, "Please add an order amount"],
      trim: true,
    },
    orderStatus: {
      type: String,
      required: [true, "Please add an order status"],
      trim: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      default: "unknown",
      trim: true,
    },
    paymentProvider: {
      type: String,
      trim: true,
    },
    paymentCurrency: {
      type: String,
      trim: true,
      lowercase: true,
    },
    paymentAmountMinor: {
      type: Number,
    },
    paymentAmount: {
      type: Number,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeChargeId: {
      type: String,
      trim: true,
    },
    stripeBalanceTransactionId: {
      type: String,
      trim: true,
    },
    stripeFeeAmountMinor: {
      type: Number,
    },
    stripeFeeAmount: {
      type: Number,
    },
    stripeFeeCurrency: {
      type: String,
      trim: true,
      lowercase: true,
    },
    stripeFeeSource: {
      type: String,
      trim: true,
    },
    stripeFeeFetchedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    cartItems: {
        // type:String,
      type: [Object],
      required: [true],
    },
    shippingAddress: {
      type: Object,
    // type:String,
      required: true,
    },
    coupon: {
      type: Object,
      required: true,
      default: {
        name: "nil",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
