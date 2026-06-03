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
    cancellationStatus: {
      type: String,
      default: "none",
      trim: true,
    },
    refundStatus: {
      type: String,
      default: "none",
      trim: true,
    },
    refundPolicyType: {
      type: String,
      trim: true,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    refundNote: {
      type: String,
      trim: true,
    },
    refundAmountMinor: {
      type: Number,
    },
    refundAmount: {
      type: Number,
    },
    refundCurrency: {
      type: String,
      trim: true,
      lowercase: true,
    },
    stripeRefundId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    stripeRefundStatus: {
      type: String,
      trim: true,
    },
    stripeRefundCreatedAt: {
      type: Date,
    },
    refundRequestedAt: {
      type: Date,
    },
    refundRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundSucceededAt: {
      type: Date,
    },
    refundFailedAt: {
      type: Date,
    },
    refundFailureReason: {
      type: String,
      trim: true,
    },
    stockRestoreStatus: {
      type: String,
      default: "not_applicable",
      trim: true,
    },
    stockRestoredAt: {
      type: Date,
    },
    stockRestoreError: {
      type: String,
      trim: true,
    },
    refundEmailStatus: {
      type: String,
      default: "not_sent",
      trim: true,
    },
    refundEmailSentAt: {
      type: Date,
    },
    refundEmailError: {
      type: String,
      trim: true,
    },
    manualStripeFeeAmountMinor: {
      type: Number,
    },
    manualStripeFeeAmount: {
      type: Number,
    },
    refundFeeSource: {
      type: String,
      trim: true,
    },
    refundFlow: {
      type: String,
      trim: true,
    },
    returnStatus: {
      type: String,
      default: "none",
      trim: true,
    },
    returnReasonType: {
      type: String,
      trim: true,
    },
    returnReason: {
      type: String,
      trim: true,
    },
    returnNote: {
      type: String,
      trim: true,
    },
    returnRequestedAt: Date,
    returnRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    returnRequiresReturn: Boolean,
    returnShippingResponsibility: {
      type: String,
      trim: true,
    },
    returnShippingDeductionMinor: Number,
    returnShippingDeduction: Number,
    returnReceivedAt: Date,
    returnReceivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    returnInspectionStatus: {
      type: String,
      trim: true,
    },
    returnInspectionNote: {
      type: String,
      trim: true,
    },
    returnedItemsRestockable: Boolean,
    returnRefundSubmittedAt: Date,
    noRefundReason: {
      type: String,
      trim: true,
    },
    noRefundNote: {
      type: String,
      trim: true,
    },
    noRefundClosedAt: Date,
    noRefundClosedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundDespiteNoRestockConfirmed: Boolean,
    refundDespiteNoRestockReason: {
      type: String,
      trim: true,
    },
    refundDespiteNoRestockNote: {
      type: String,
      trim: true,
    },
    refundDespiteNoRestockConfirmedAt: Date,
    refundDespiteNoRestockConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
