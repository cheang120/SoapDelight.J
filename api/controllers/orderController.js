import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js"
import Coupon from "../models/couponMondel.js";
import {
  calculateTotalPrice,
  restoreOnlineStockForCancelledOrder,
  restoreOnlineStockForReturnedOrder,
  updateProductQuantity,
} from "../utils/index.js";
// import calculateTotalPrice from "../utils"
import axios from "axios"
import Stripe from "stripe"
// import sendGmail from "../utils/sendGmail.js";
import { orderSuccessEmail } from "../emailTemplate/orderTemplate.js";
import { refundCompletionEmail } from "../emailTemplate/refundTemplate.js";
import { sendGmail } from "../utils/sendGmail.js";
import mongoose from "mongoose";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const REFUND_ELIGIBLE_ORDER_STATUSES = ["Order Placed...", "Processing..."];
const RETURN_REFUND_ELIGIBLE_ORDER_STATUSES = ["Shipped...", "Delivered"];
const REFUND_SUBMITTED_MESSAGE =
  "退款已提交，等待 Stripe 確認。客人通知會在退款成功及庫存補回後發出。";
const RETURN_REFUND_SUBMITTED_MESSAGE =
  "已提交 Stripe 退款，等待確認。客人通知會在退款成功及退貨商品處理完成後發出。";

const throwHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const getStripeObjectId = (value) => {
  if (typeof value === "string") {
    return value;
  }

  return value?.id ? String(value.id) : "";
};

const getOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const toMajorCurrencyAmount = (amountMinor) => {
  const number = getOptionalNumber(amountMinor);
  return number === undefined ? undefined : number / 100;
};

const getAmountMinor = (amountMinor, amount) => {
  if (amountMinor !== undefined && amountMinor !== null && amountMinor !== "") {
    const normalizedAmountMinor = Number(amountMinor);
    return Number.isInteger(normalizedAmountMinor)
      ? normalizedAmountMinor
      : undefined;
  }

  if (amount !== undefined && amount !== null && amount !== "") {
    const normalizedAmount = Number(amount);
    return Number.isFinite(normalizedAmount)
      ? Math.round(normalizedAmount * 100)
      : undefined;
  }

  return undefined;
};

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const getOrderReturnBreakdown = (order) => {
  const cartItems = Array.isArray(order?.cartItems) ? order.cartItems : [];
  const productSubtotal = roundMoney(
    cartItems
      .filter((item) => item?.category !== "Shipping")
      .reduce(
        (total, item) =>
          total + Number(item?.price || 0) * Number(item?.cartQuantity || 0),
        0
      )
  );
  const shippingFee = roundMoney(
    cartItems
      .filter((item) => item?.category === "Shipping")
      .reduce((total, item) => total + Number(item?.price || 0), 0)
  );
  const couponDiscountRate =
    String(order?.coupon?.name || "nil").toLowerCase() !== "nil"
      ? Number(order?.coupon?.discount || 0)
      : 0;
  const couponDiscountAmount = roundMoney(
    (productSubtotal * couponDiscountRate) / 100
  );
  const productSubtotalAfterDiscount = roundMoney(
    Math.max(productSubtotal - couponDiscountAmount, 0)
  );

  return {
    productSubtotal,
    productSubtotalMinor: Math.round(productSubtotal * 100),
    couponDiscountRate,
    couponDiscountAmount,
    couponDiscountAmountMinor: Math.round(couponDiscountAmount * 100),
    productSubtotalAfterDiscount,
    productSubtotalAfterDiscountMinor: Math.round(
      productSubtotalAfterDiscount * 100
    ),
    originalShippingFee: shippingFee,
    originalShippingFeeMinor: Math.round(shippingFee * 100),
  };
};

const isStripePaidOrder = (order) =>
  String(order?.paymentProvider || order?.paymentMethod || "")
    .trim()
    .toLowerCase() === "stripe";

const getReturnRefundEligibility = (order) => {
  if (!order) {
    return "找不到此訂單";
  }

  if (!RETURN_REFUND_ELIGIBLE_ORDER_STATUSES.includes(order.orderStatus)) {
    return "只有已寄出或已送達的訂單可以建立退貨個案";
  }

  if (!isStripePaidOrder(order)) {
    return "此訂單不是 Stripe 付款訂單";
  }

  if (order.paymentStatus !== "paid") {
    return "此訂單目前不是可建立退貨個案的已付款狀態";
  }

  if (!order.stripePaymentIntentId && !order.stripeChargeId) {
    return "此訂單缺少 Stripe 付款參照，請人工跟進";
  }

  if (
    order.stripeRefundId ||
    ["processing", "succeeded"].includes(order.refundStatus) ||
    !["none", null, undefined].includes(order.returnStatus)
  ) {
    return "此訂單已有退貨或退款個案";
  }

  const paymentAmountMinor = getAmountMinor(
    order.paymentAmountMinor,
    order.paymentAmount
  );

  if (!Number.isInteger(paymentAmountMinor) || paymentAmountMinor <= 0) {
    return "此訂單缺少有效 Stripe 付款金額，請人工跟進";
  }

  return "";
};

const canSubmitReturnRefund = (order) =>
  ["awaiting_return", "no_return_required"].includes(order?.returnStatus) &&
  order?.paymentStatus === "paid" &&
  !order?.stripeRefundId &&
  ["none", null, undefined].includes(order?.refundStatus);

const getReturnRefundPreviewPayload = (order) => {
  const createCaseError = getReturnRefundEligibility(order);
  const breakdown = getOrderReturnBreakdown(order);
  const paymentAmountMinor = getAmountMinor(
    order?.paymentAmountMinor,
    order?.paymentAmount
  );
  const stripeFeeAmountMinor = getOptionalNumber(order?.stripeFeeAmountMinor);
  const hasReturnCase = !["none", null, undefined].includes(order?.returnStatus);

  return {
    canCreateReturnCase: !createCaseError,
    cannotCreateReturnCaseReason: createCaseError || "",
    canSubmitStripeRefund: canSubmitReturnRefund(order),
    hasReturnCase,
    returnStatus: order?.returnStatus || "none",
    returnReasonType: order?.returnReasonType || "",
    returnRequiresReturn: order?.returnRequiresReturn,
    returnShippingResponsibility: order?.returnShippingResponsibility || "",
    returnInspectionStatus: order?.returnInspectionStatus || "",
    paymentAmountMinor: paymentAmountMinor ?? null,
    paymentAmount: toMajorCurrencyAmount(paymentAmountMinor) ?? null,
    paymentCurrency: order?.paymentCurrency || "hkd",
    stripeFeeAmountMinor: stripeFeeAmountMinor ?? null,
    stripeFeeAmount: toMajorCurrencyAmount(stripeFeeAmountMinor) ?? null,
    stripeFeeCurrency:
      order?.stripeFeeCurrency || order?.paymentCurrency || "hkd",
    stripeFeeSource: order?.stripeFeeSource || "unavailable",
    eligibleOrderStatuses: RETURN_REFUND_ELIGIBLE_ORDER_STATUSES,
    ...breakdown,
  };
};

const getRefundEligibility = (order) => {
  if (!order) {
    return "找不到此訂單";
  }

  if (!REFUND_ELIGIBLE_ORDER_STATUSES.includes(order.orderStatus)) {
    return "只有未寄出的訂單可以取消及退款";
  }

  if (
    String(order.paymentProvider || order.paymentMethod || "")
      .trim()
      .toLowerCase() !== "stripe"
  ) {
    return "此訂單不是 Stripe 付款訂單";
  }

  if (order.paymentStatus !== "paid") {
    return "此訂單目前不是可退款的已付款狀態";
  }

  if (!order.stripePaymentIntentId && !order.stripeChargeId) {
    return "此訂單缺少 Stripe 付款參照，請人工跟進";
  }

  if (
    order.stripeRefundId ||
    ["processing", "succeeded"].includes(order.refundStatus) ||
    ["refund_processing", "cancelled_refunded"].includes(
      order.cancellationStatus
    )
  ) {
    return "此訂單已提交退款或已完成退款";
  }

  const paymentAmountMinor = getAmountMinor(
    order.paymentAmountMinor,
    order.paymentAmount
  );

  if (!Number.isInteger(paymentAmountMinor) || paymentAmountMinor <= 0) {
    return "此訂單缺少有效 Stripe 付款金額，請人工跟進";
  }

  return "";
};

const getStripePaymentSnapshot = async (paymentIntent) => {
  const latestCharge = paymentIntent?.latest_charge;
  const stripeChargeId = getStripeObjectId(latestCharge);
  let charge = typeof latestCharge === "object" ? latestCharge : null;

  if (stripeChargeId && !charge) {
    try {
      charge = await stripe.charges.retrieve(stripeChargeId, {
        expand: ["balance_transaction"],
      });
    } catch {
      charge = null;
    }
  }

  const chargeBalanceTransaction = charge?.balance_transaction;
  const stripeBalanceTransactionId = getStripeObjectId(chargeBalanceTransaction);
  let balanceTransaction =
    typeof chargeBalanceTransaction === "object"
      ? chargeBalanceTransaction
      : null;

  if (stripeBalanceTransactionId && !balanceTransaction) {
    try {
      balanceTransaction = await stripe.balanceTransactions.retrieve(
        stripeBalanceTransactionId
      );
    } catch {
      balanceTransaction = null;
    }
  }

  const stripeFeeAmountMinor = getOptionalNumber(balanceTransaction?.fee);
  const hasStripeFee = stripeFeeAmountMinor !== undefined;
  const paymentAmountMinor = getOptionalNumber(
    paymentIntent?.amount_received ?? paymentIntent?.amount
  );

  return {
    paymentProvider: "stripe",
    paymentStatus: "paid",
    paymentCurrency: paymentIntent?.currency || "",
    paymentAmountMinor,
    paymentAmount: toMajorCurrencyAmount(paymentAmountMinor),
    stripePaymentIntentId: paymentIntent.id,
    stripeChargeId: stripeChargeId || undefined,
    stripeBalanceTransactionId: stripeBalanceTransactionId || undefined,
    stripeFeeAmountMinor: hasStripeFee ? stripeFeeAmountMinor : undefined,
    stripeFeeAmount: hasStripeFee
      ? toMajorCurrencyAmount(stripeFeeAmountMinor)
      : undefined,
    stripeFeeCurrency: hasStripeFee
      ? balanceTransaction?.currency || paymentIntent?.currency || ""
      : undefined,
    stripeFeeSource: hasStripeFee
      ? "stripe_balance_transaction"
      : "unavailable",
    stripeFeeFetchedAt: hasStripeFee ? new Date() : undefined,
    paidAt: charge?.created || paymentIntent?.created
      ? new Date(Number(charge?.created || paymentIntent.created) * 1000)
      : new Date(),
  };
};

const refreshStripePaymentSnapshot = async (order) => {
  if (!order?.stripePaymentIntentId) {
    return order;
  }

  let paymentIntent;

  try {
    paymentIntent = await stripe.paymentIntents.retrieve(
      order.stripePaymentIntentId,
      {
        expand: ["latest_charge.balance_transaction"],
      }
    );
  } catch (error) {
    console.error(
      `Unable to refresh Stripe payment snapshot for order ${order._id}:`,
      error?.message || error
    );
    return order;
  }

  const snapshot = await getStripePaymentSnapshot(paymentIntent);
  Object.assign(order, snapshot);
  await order.save();
  return order;
};

const getRefundPreviewPayload = (order) => {
  const cannotRefundReason = getRefundEligibility(order);
  const paymentAmountMinor = getAmountMinor(
    order?.paymentAmountMinor,
    order?.paymentAmount
  );
  const stripeFeeAmountMinor = getOptionalNumber(order?.stripeFeeAmountMinor);
  const defaultRefundAmountMinor =
    Number.isInteger(paymentAmountMinor) && stripeFeeAmountMinor !== undefined
      ? Math.max(paymentAmountMinor - stripeFeeAmountMinor, 0)
      : null;

  return {
    canRefund: !cannotRefundReason,
    cannotRefundReason: cannotRefundReason || "",
    orderAmount: Number(order?.orderAmount || 0),
    paymentAmountMinor: paymentAmountMinor ?? null,
    paymentAmount: toMajorCurrencyAmount(paymentAmountMinor) ?? null,
    paymentCurrency: order?.paymentCurrency || "hkd",
    stripePaymentIntentId: order?.stripePaymentIntentId || "",
    stripeChargeId: order?.stripeChargeId || "",
    stripeFeeAmountMinor: stripeFeeAmountMinor ?? null,
    stripeFeeAmount: toMajorCurrencyAmount(stripeFeeAmountMinor) ?? null,
    stripeFeeCurrency: order?.stripeFeeCurrency || order?.paymentCurrency || "hkd",
    stripeFeeSource: order?.stripeFeeSource || "unavailable",
    defaultRefundPolicyType: "customer_pays_fee",
    defaultRefundAmountMinor,
    defaultRefundAmount: toMajorCurrencyAmount(defaultRefundAmountMinor) ?? null,
    companyAbsorbsFeeRefundAmountMinor: paymentAmountMinor ?? null,
    companyAbsorbsFeeRefundAmount:
      toMajorCurrencyAmount(paymentAmountMinor) ?? null,
    customRefundAllowed: true,
    eligibleOrderStatuses: REFUND_ELIGIBLE_ORDER_STATUSES,
  };
};

const findOrderForStripeRefund = async (refund, session) => {
  const orderId = refund?.metadata?.orderId;
  const query = {
    $or: [
      { stripeRefundId: refund?.id },
      ...(mongoose.isValidObjectId(orderId) ? [{ _id: orderId }] : []),
    ],
  };

  if (query.$or.length === 0) {
    return null;
  }

  return Order.findOne(query).session(session || null);
};

const isShippedReturnRefund = (refund, order) =>
  refund?.metadata?.refundFlow === "shipped_return" ||
  order?.refundFlow === "shipped_return" ||
  [
    "refund_processing",
    "returned_refunded",
    "return_refund_failed",
  ].includes(order?.returnStatus);

const markStripeRefundFailed = async (refund) => {
  const order = await findOrderForStripeRefund(refund);

  if (
    !order ||
    order.stockRestoreStatus === "restored" ||
    order.returnStatus === "returned_refunded"
  ) {
    return;
  }

  order.stripeRefundId = refund.id;
  order.stripeRefundStatus = refund.status || "failed";
  order.refundStatus = "failed";
  order.paymentStatus = "refund_failed";
  order.stockRestoreStatus = "not_applicable";
  order.refundFailedAt = new Date();
  order.refundFailureReason =
    refund.failure_reason || "Stripe refund failed; manual follow-up required";

  if (isShippedReturnRefund(refund, order)) {
    order.returnStatus = "return_refund_failed";
    order.orderStatus = "Return Refund Failed / Manual Follow-up Required";
  } else {
    order.cancellationStatus = "refund_failed";
    order.orderStatus = "Refund Failed / Manual Follow-up Required";
  }

  await order.save();
};

const sendRefundCompletionEmailIfNeeded = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      stockRestoreStatus: { $in: ["restored", "not_restocked"] },
      refundEmailStatus: { $in: ["not_sent", "failed", null] },
    },
    {
      $set: {
        refundEmailStatus: "sending",
        refundEmailError: "",
      },
    },
    { new: true }
  ).populate("user", "email username");

  if (!order) {
    return;
  }

  const sendTo = order.user?.email || order.shippingAddress?.email;

  if (!sendTo) {
    await Order.findByIdAndUpdate(orderId, {
      refundEmailStatus: "failed",
      refundEmailError: "Customer email not available",
    });
    return;
  }

  const template = refundCompletionEmail({
    customerName: order.user?.username || order.shippingAddress?.name,
    orderId: order._id,
    refundAmount: order.refundAmount,
    refundCurrency: order.refundCurrency,
    refundPolicyType: order.refundPolicyType,
    refundFlow: order.refundFlow,
    stockRestoreStatus: order.stockRestoreStatus,
  });

  try {
    await sendGmail(
      "SoapDelight.J Refund Completed",
      sendTo,
      "no_reply@gmail.com",
      template
    );
    await Order.findByIdAndUpdate(orderId, {
      refundEmailStatus: "sent",
      refundEmailSentAt: new Date(),
      refundEmailError: "",
    });
  } catch (error) {
    console.error(
      `Refund email failed for order ${orderId}:`,
      error?.message || error
    );
    await Order.findByIdAndUpdate(orderId, {
      refundEmailStatus: "failed",
      refundEmailError: "Refund completed but customer email could not be sent",
    });
  }
};

const processSucceededShippedReturnRefund = async (refund, existingOrder) => {
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: existingOrder._id,
      stockRestoreStatus: {
        $in: ["pending", "not_restocked", "not_applicable", "failed"],
      },
      returnStatus: { $in: ["refund_processing", "return_refund_failed"] },
      $or: [
        { stripeRefundId: refund.id },
        { stripeRefundId: { $exists: false } },
        { stripeRefundId: null },
      ],
    },
    {
      $set: {
        stockRestoreStatus: "restoring",
        stripeRefundId: refund.id,
        stripeRefundStatus: refund.status || "succeeded",
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    const latestOrder = await Order.findById(existingOrder._id);

    if (
      ["restored", "not_restocked"].includes(latestOrder?.stockRestoreStatus) ||
      latestOrder?.returnStatus === "returned_refunded" ||
      latestOrder?.paymentStatus === "refunded"
    ) {
      return;
    }

    console.warn(
      `Shipped return stock action was not claimed for Stripe refund ${refund?.id || ""}`
    );
    return;
  }

  const session = await mongoose.startSession();
  const orderId = claimedOrder._id;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (
        !order ||
        ["restored", "not_restocked"].includes(order.stockRestoreStatus)
      ) {
        return;
      }

      if (
        order.stockRestoreStatus !== "restoring" ||
        !["refund_processing", "return_refund_failed"].includes(
          order.returnStatus
        )
      ) {
        return;
      }

      if (order.stripeRefundId && order.stripeRefundId !== refund.id) {
        throwHttpError(409, "Stripe refund reference does not match order");
      }

      if (
        getOptionalNumber(order.refundAmountMinor) !== undefined &&
        getOptionalNumber(refund.amount) !== order.refundAmountMinor
      ) {
        throwHttpError(409, "Stripe refund amount does not match order request");
      }

      const restockable =
        order.returnedItemsRestockable === true ||
        order.returnInspectionStatus === "restockable";

      if (restockable) {
        await restoreOnlineStockForReturnedOrder(order, {
          createdBy: order.refundRequestedBy,
          stripeRefundId: refund.id,
          session,
        });
      }

      order.stripeRefundId = refund.id;
      order.stripeRefundStatus = refund.status || "succeeded";
      order.refundStatus = "succeeded";
      order.paymentStatus = "refunded";
      order.returnStatus = "returned_refunded";
      order.orderStatus = "Returned / Refunded";
      order.refundAmountMinor =
        getOptionalNumber(refund.amount) ?? order.refundAmountMinor;
      order.refundAmount = toMajorCurrencyAmount(order.refundAmountMinor);
      order.refundCurrency = refund.currency || order.refundCurrency;
      order.refundSucceededAt = new Date();
      order.stockRestoreStatus = restockable ? "restored" : "not_restocked";
      order.stockRestoredAt = restockable ? new Date() : undefined;
      order.stockRestoreError = restockable
        ? ""
        : "Returned goods were not restocked";
      await order.save({ session });
    });
  } catch (error) {
    console.error(
      `Unable to finalize shipped return Stripe refund ${refund?.id || ""}:`,
      error?.message || error
    );

    const latestOrder = await Order.findById(orderId);

    if (
      ["restored", "not_restocked"].includes(latestOrder?.stockRestoreStatus) ||
      latestOrder?.returnStatus === "returned_refunded"
    ) {
      return;
    }

    if (["restoring", "pending"].includes(latestOrder?.stockRestoreStatus)) {
      await Order.findOneAndUpdate(
        {
          _id: orderId,
          stockRestoreStatus: { $in: ["restoring", "pending"] },
        },
        {
          $set: {
            stripeRefundId: refund?.id,
            stripeRefundStatus: refund?.status || "succeeded",
            refundStatus: "succeeded",
            paymentStatus: "refunded",
            returnStatus: "return_refund_failed",
            orderStatus:
              "Refund Succeeded / Return Stock Follow-up Required",
            stockRestoreStatus: "failed",
            stockRestoreError:
              "Unable to restore returned ONLINE inventory automatically",
          },
        }
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  await sendRefundCompletionEmailIfNeeded(orderId);
};

const processSucceededStripeRefund = async (refund) => {
  const existingOrder = await findOrderForStripeRefund(refund);

  if (!existingOrder) {
    console.warn(`No order found for Stripe refund ${refund?.id || ""}`);
    return;
  }

  if (isShippedReturnRefund(refund, existingOrder)) {
    await processSucceededShippedReturnRefund(refund, existingOrder);
    return;
  }

  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: existingOrder._id,
      stockRestoreStatus: { $in: ["pending", "failed"] },
      cancellationStatus: { $in: ["refund_processing", "refund_failed"] },
      $or: [
        { stripeRefundId: refund.id },
        { stripeRefundId: { $exists: false } },
        { stripeRefundId: null },
      ],
    },
    {
      $set: {
        stockRestoreStatus: "restoring",
        stripeRefundId: refund.id,
        stripeRefundStatus: refund.status || "succeeded",
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    const latestOrder = await Order.findById(existingOrder._id);

    if (
      latestOrder?.stockRestoreStatus === "restored" ||
      latestOrder?.cancellationStatus === "cancelled_refunded" ||
      latestOrder?.paymentStatus === "refunded"
    ) {
      return;
    }

    console.warn(
      `ONLINE stock restore was not claimed for Stripe refund ${refund?.id || ""}`
    );
    return;
  }

  const session = await mongoose.startSession();
  const orderId = claimedOrder._id;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order || order.stockRestoreStatus === "restored") {
        return;
      }

      if (
        order.stockRestoreStatus !== "restoring" ||
        !["refund_processing", "refund_failed"].includes(order.cancellationStatus)
      ) {
        return;
      }

      if (order.stripeRefundId && order.stripeRefundId !== refund.id) {
        throwHttpError(409, "Stripe refund reference does not match order");
      }

      if (
        getOptionalNumber(order.refundAmountMinor) !== undefined &&
        getOptionalNumber(refund.amount) !== order.refundAmountMinor
      ) {
        throwHttpError(409, "Stripe refund amount does not match order request");
      }

      await restoreOnlineStockForCancelledOrder(order, {
        createdBy: order.refundRequestedBy,
        stripeRefundId: refund.id,
        session,
      });

      order.stripeRefundId = refund.id;
      order.stripeRefundStatus = refund.status || "succeeded";
      order.refundStatus = "succeeded";
      order.cancellationStatus = "cancelled_refunded";
      order.paymentStatus = "refunded";
      order.orderStatus = "Cancelled / Refunded";
      order.refundAmountMinor =
        getOptionalNumber(refund.amount) ?? order.refundAmountMinor;
      order.refundAmount = toMajorCurrencyAmount(order.refundAmountMinor);
      order.refundCurrency = refund.currency || order.refundCurrency;
      order.refundSucceededAt = new Date();
      order.stockRestoreStatus = "restored";
      order.stockRestoredAt = new Date();
      order.stockRestoreError = "";
      await order.save({ session });
    });
  } catch (error) {
    console.error(
      `Unable to restore ONLINE stock for Stripe refund ${refund?.id || ""}:`,
      error?.message || error
    );

    const latestOrder = await Order.findById(orderId);

    if (latestOrder?.stockRestoreStatus === "restored") {
      return;
    }

    if (["restoring", "pending"].includes(latestOrder?.stockRestoreStatus)) {
      await Order.findOneAndUpdate(
        {
          _id: orderId,
          stockRestoreStatus: { $in: ["restoring", "pending"] },
        },
        {
          $set: {
            stripeRefundId: refund?.id,
            stripeRefundStatus: refund?.status || "succeeded",
            refundStatus: "succeeded",
            paymentStatus: "refunded",
            orderStatus: "Refund Succeeded / Stock Restore Follow-up Required",
            stockRestoreStatus: "failed",
            stockRestoreError: "Unable to restore ONLINE inventory automatically",
          },
        }
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  await sendRefundCompletionEmailIfNeeded(orderId);
};

export const stripeRefundWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const endpointSecret =
    process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_ENDPOINT_SECRET;

  if (!endpointSecret) {
    console.error("Stripe webhook secret is not configured");
    return res.status(500).json({ message: "Stripe webhook is not configured" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return res.status(400).json({ message: "Invalid Stripe webhook signature" });
  }

  try {
    const refundEventTypes = [
      "refund.created",
      "refund.updated",
      "charge.refund.updated",
    ];

    if (
      refundEventTypes.includes(event.type) &&
      event.data.object?.status === "succeeded"
    ) {
      await processSucceededStripeRefund(event.data.object);
    }

    if (
      event.type === "refund.failed" ||
      (refundEventTypes.includes(event.type) &&
        ["failed", "canceled"].includes(event.data.object?.status))
    ) {
      await markStripeRefundFailed(event.data.object);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(
      `Stripe webhook processing failed for ${event.type}:`,
      error?.message || error
    );
    return res.status(500).json({ message: "Stripe webhook processing failed" });
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  // res.send("create order")
  const {
    orderDate,
    orderTime,
    orderAmount,
    orderStatus,
    cartItems,
    shippingAddress,
    paymentMethod,
    coupon,
    stripePaymentIntentId,
  } = req.body;
    // 檢查 cartItems 是否為數組
    if (!Array.isArray(cartItems)) {
      res.status(400);
      throw new Error("cartItems 應該是一個數組");
    }

  //   Validation
  if (!cartItems || !orderStatus || !shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error("Order data missing!!!");
  }

  const isStripePayment =
    String(paymentMethod || "").trim().toLowerCase() === "stripe";
  let stripePaymentSnapshot = {};

  if (isStripePayment) {
    const normalizedPaymentIntentId = String(
      stripePaymentIntentId || ""
    ).trim();

    if (!normalizedPaymentIntentId) {
      throwHttpError(400, "Stripe payment reference missing");
    }

    const existingOrder = await Order.exists({
      stripePaymentIntentId: normalizedPaymentIntentId,
    });

    if (existingOrder) {
      throwHttpError(
        409,
        "This Stripe payment has already been used for another order"
      );
    }

    let paymentIntent;

    try {
      paymentIntent = await stripe.paymentIntents.retrieve(
        normalizedPaymentIntentId,
        {
          expand: ["latest_charge.balance_transaction"],
        }
      );
    } catch {
      throwHttpError(400, "Unable to verify Stripe payment");
    }

    if (paymentIntent?.status !== "succeeded") {
      throwHttpError(400, "Stripe payment not completed");
    }

    stripePaymentSnapshot = await getStripePaymentSnapshot(paymentIntent);
  }

  let validatedCoupon = { name: "nil" };
  if (coupon && coupon.name && String(coupon.name).toLowerCase() !== "nil") {
    const validCoupon = await Coupon.findOne({
      name: String(coupon.name).trim().toUpperCase(),
      expiresAt: { $gt: Date.now() },
    });

    if (!validCoupon) {
      res.status(400);
      throw new Error("Coupon has expired or is invalid");
    }

    validatedCoupon = {
      _id: validCoupon._id,
      name: validCoupon.name,
      discount: validCoupon.discount,
      expiresAt: validCoupon.expiresAt,
    };
  }

  const productItems = cartItems.filter((item) => item?.category !== "Shipping");
  const shippingItem = cartItems.find((item) => item?.category === "Shipping");
  const productSubtotal = productItems.reduce((total, item) => {
    return total + Number(item?.price || 0) * Number(item?.cartQuantity || 0);
  }, 0);
  const couponDiscountAmount = validatedCoupon?.discount
    ? (productSubtotal * Number(validatedCoupon.discount || 0)) / 100
    : 0;
  const subtotalAfterDiscount = Math.max(
    productSubtotal - couponDiscountAmount,
    0
  );
  const deliveryName =
    shippingItem?.name || "Delivery information not available";
  const deliveryFee = Number(shippingItem?.price || 0);
  const total = subtotalAfterDiscount + deliveryFee;

  // const updatedProduct = await updateProductQuantity(cartItems);
  // console.log("updated product", updatedProduct);

  let createdOrder;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const [order] = await Order.create(
        [
          {
            user: req.user.id,
            orderDate,
            orderTime,
            orderAmount,
            orderStatus,
            cartItems,
            shippingAddress,
            paymentMethod,
            coupon: validatedCoupon,
            ...stripePaymentSnapshot,
          },
        ],
        { session }
      );

      createdOrder = order;

      await updateProductQuantity(cartItems, {
        orderId: order._id,
        createdBy: req.user?._id,
        session,
      });
    });
  } catch (error) {
    if (
      error?.code === 11000 &&
      (error?.keyPattern?.stripePaymentIntentId ||
        error?.keyValue?.stripePaymentIntentId)
    ) {
      throwHttpError(
        409,
        "This Stripe payment has already been used for another order"
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  // Send Order Email to the user
  const subject = "SoapDelight.J Order Placed";
  const send_to = req.user.email;
  // console.log(send_to);
  const template = orderSuccessEmail({
    customerName: req.user.name || req.user.username || req.user.email,
    orderDate,
    orderTime,
    productItems,
    coupon: validatedCoupon,
    productSubtotal,
    couponDiscountAmount,
    subtotalAfterDiscount,
    deliveryName,
    deliveryFee,
    total,
    orderAmount,
  });
  // const template = "template"
  const reply_to = "no_reply@gmail.com";
  try {
    await sendGmail(subject, send_to,reply_to, template );
  } catch (error) {
    console.error(
      `Order ${createdOrder?._id || ""} created, but confirmation email failed:`,
      error?.message || error
    );
  }

  res.status(201).json({ message: "Order Created" });
});

// Get all Orders
export const getOrders = asyncHandler(async (req, res) => {
  let orders;

  if (req.user.role === "author") {
    orders = await Order.find().sort("-createdAt");
    return res.status(200).json(orders);
  }
  orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.status(200).json(orders);
});

// // Get single Order
export const getOrder = asyncHandler(async (req, res) => {
  // res.send("order")
  const order = await Order.findById(req.params.id);
  // if product doesnt exist
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (req.user.role === "author") {
    return res.status(200).json(order);
  }
  // Match Order to its user
  if (order.user.toString() !== req.user.id.toString()) {
    res.status(401);
    throw new Error("User not authorized");
  }
  res.status(200).json(order);
});

export const getRefundPreview = asyncHandler(async (req, res) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    throwHttpError(404, "Order not found");
  }

  const initialEligibilityError = getRefundEligibility(order);

  if (
    !initialEligibilityError &&
    getOptionalNumber(order.stripeFeeAmountMinor) === undefined &&
    order.stripePaymentIntentId
  ) {
    order = await refreshStripePaymentSnapshot(order);
  }

  res.status(200).json(getRefundPreviewPayload(order));
});

export const getReturnRefundPreview = asyncHandler(async (req, res) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    throwHttpError(404, "Order not found");
  }

  if (
    isStripePaidOrder(order) &&
    order.paymentStatus === "paid" &&
    getOptionalNumber(order.stripeFeeAmountMinor) === undefined &&
    order.stripePaymentIntentId
  ) {
    order = await refreshStripePaymentSnapshot(order);
  }

  res.status(200).json(getReturnRefundPreviewPayload(order));
});


export const getRefundReturnRecords = asyncHandler(async (req, res) => {
  const refundReturnOrderStatuses = [
    "Cancellation / Refund Processing",
    "Cancelled / Refunded",
    "Refund Failed / Manual Follow-up Required",
    "Return Requested / Awaiting Return",
    "Return Approved / No Return Required",
    "Return Received / Refund Processing",
    "Return Refund Processing",
    "Returned / Refunded",
    "Return Closed / No Refund",
  ];

  const recordsQuery = {
    $or: [
      {
        cancellationStatus: {
          $in: ["refund_processing", "cancelled_refunded", "refund_failed"],
        },
      },
      {
        refundStatus: {
          $in: ["processing", "succeeded", "failed", "no_refund"],
        },
      },
      {
        returnStatus: {
          $in: [
            "awaiting_return",
            "no_return_required",
            "refund_processing",
            "returned_refunded",
            "closed_no_refund",
            "return_refund_failed",
          ],
        },
      },
      {
        orderStatus: { $in: refundReturnOrderStatuses },
      },
    ],
  };

  const orders = await Order.find(recordsQuery)
    .populate("user", "name username email")
    .sort("-updatedAt")
    .lean();

  const toMoney = (value) => {
    const number = Number(value || 0);
    return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
  };

  const formatCurrency = (order) =>
    String(order?.refundCurrency || order?.paymentCurrency || "hkd").toUpperCase();

  const getCustomerName = (order) =>
    order?.shippingAddress?.name ||
    order?.user?.name ||
    order?.user?.username ||
    "-";

  const getCustomerEmail = (order) =>
    order?.shippingAddress?.email ||
    order?.user?.email ||
    order?.customerEmail ||
    "-";

  const getProductQuantity = (order) =>
    (Array.isArray(order?.cartItems) ? order.cartItems : [])
      .filter((item) => item?.category !== "Shipping")
      .reduce(
        (total, item) => total + Number(item?.cartQuantity || item?.quantity || 0),
        0
      );

  const getTypeLabel = (order) => {
    const noRefund =
      order?.refundStatus === "no_refund" ||
      order?.returnStatus === "closed_no_refund" ||
      order?.orderStatus === "Return Closed / No Refund";

    if (noRefund) return "退貨不設退款";

    const needsFollowUp =
      ["refund_processing", "refund_failed"].includes(order?.cancellationStatus) ||
      ["processing", "failed"].includes(order?.refundStatus) ||
      ["refund_processing", "return_refund_failed"].includes(order?.returnStatus) ||
      [
        "Cancellation / Refund Processing",
        "Return Received / Refund Processing",
        "Return Refund Processing",
        "Refund Failed / Manual Follow-up Required",
      ].includes(order?.orderStatus);

    if (needsFollowUp) return "退款處理中 / 需跟進";

    const shippedReturn =
      order?.refundFlow === "shipped_return" ||
      order?.returnStatus === "returned_refunded" ||
      order?.orderStatus === "Returned / Refunded";

    if (shippedReturn) return "已出貨退貨退款";

    return "未出貨退款";
  };

  const getStockRestoreLabel = (order) => {
    if (order?.stockRestoreStatus === "restored") return "已補回 ONLINE";
    if (order?.stockRestoreStatus === "not_restocked") return "未補回庫存";
    if (order?.stockRestoreStatus === "not_applicable") return "不適用";
    return "處理中";
  };

  const records = orders.map((order) => {
    const breakdown = getOrderReturnBreakdown(order);
    const paymentAmount = toMoney(order.paymentAmount ?? order.orderAmount);
    const stripeFeeAmount = toMoney(
      order.stripeFeeAmount ?? order.manualStripeFeeAmount
    );
    const returnShippingDeduction = toMoney(order.returnShippingDeduction);
    const refundAmount = toMoney(order.refundAmount);
    const restoredQuantity =
      order.stockRestoreStatus === "restored" ? getProductQuantity(order) : 0;

    return {
      orderId: String(order._id),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerName: getCustomerName(order),
      customerEmail: getCustomerEmail(order),
      typeLabel: getTypeLabel(order),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      refundStatus: order.refundStatus,
      returnStatus: order.returnStatus,
      paymentAmount,
      paymentCurrency: formatCurrency(order),
      productSubtotalAfterDiscount:
        toMoney(order.productSubtotalAfterDiscount) ||
        breakdown.productSubtotalAfterDiscount,
      originalShippingFee:
        toMoney(order.originalShippingFee) || breakdown.originalShippingFee,
      stripeFeeAmount,
      returnShippingDeduction,
      refundAmount,
      noRefundReason: order.noRefundReason || "",
      returnInspectionStatus: order.returnInspectionStatus || "",
      returnedItemsRestockable: Boolean(order.returnedItemsRestockable),
      stockRestoreStatus: order.stockRestoreStatus || "",
      stockRestoreLabel: getStockRestoreLabel(order),
      stripeRefundId: order.stripeRefundId || "",
      refundSucceededAt: order.refundSucceededAt,
      stockRestoredAt: order.stockRestoredAt,
      noRefundClosedAt: order.noRefundClosedAt,
      restoredQuantity,
    };
  });

  const summary = records.reduce(
    (total, record) => {
      const isNoRefund = record.typeLabel === "退貨不設退款";
      const isProcessingOrFailed = record.typeLabel === "退款處理中 / 需跟進";

      total.totalPaymentAmount += record.paymentAmount;
      total.totalRefundAmount += record.refundAmount;
      total.totalStripeFeeDeducted += record.stripeFeeAmount;
      total.totalReturnShippingDeducted += record.returnShippingDeduction;
      total.totalRestoredQuantity += record.restoredQuantity;

      if (record.refundStatus === "succeeded") total.refundedOrderCount += 1;
      if (isNoRefund) total.noRefundCaseCount += 1;
      if (isProcessingOrFailed) total.processingOrFailedCount += 1;
      if (record.stockRestoreStatus === "not_restocked") {
        total.totalNotRestockedCount += 1;
      }

      return total;
    },
    {
      totalRecords: records.length,
      refundedOrderCount: 0,
      noRefundCaseCount: 0,
      processingOrFailedCount: 0,
      totalPaymentAmount: 0,
      totalRefundAmount: 0,
      totalStripeFeeDeducted: 0,
      totalReturnShippingDeducted: 0,
      totalRestoredQuantity: 0,
      totalNotRestockedCount: 0,
    }
  );

  Object.keys(summary).forEach((key) => {
    if (typeof summary[key] === "number") {
      summary[key] = toMoney(summary[key]);
    }
  });

  res.status(200).json({
    summary,
    records,
  });
});


export const createReturnRequest = asyncHandler(async (req, res) => {
  const {
    returnReasonType,
    returnReason,
    returnNote,
    returnRequiresReturn,
    returnShippingResponsibility,
    confirmCustomerCommunication,
  } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throwHttpError(404, "Order not found");
  }

  const eligibilityError = getReturnRefundEligibility(order);

  if (eligibilityError) {
    throwHttpError(400, eligibilityError);
  }

  const normalizedReasonType = String(returnReasonType || "").trim();
  const normalizedReason = String(returnReason || "").trim();
  const normalizedNote = String(returnNote || "").trim();
  const normalizedShippingResponsibility = String(
    returnShippingResponsibility || ""
  ).trim();
  const allowedReasonTypes = [
    "customer_change_mind",
    "company_error",
    "damaged",
    "other",
  ];
  const allowedShippingResponsibilities = [
    "customer",
    "company",
    "waived",
    "other",
  ];

  if (!allowedReasonTypes.includes(normalizedReasonType)) {
    throwHttpError(400, "請選擇有效退貨原因類型");
  }

  if (!normalizedReason || !normalizedNote) {
    throwHttpError(400, "請填寫退貨原因及內部處理備註");
  }

  if (!allowedShippingResponsibilities.includes(normalizedShippingResponsibility)) {
    throwHttpError(400, "請選擇退回運費承擔方式");
  }

  if (typeof returnRequiresReturn !== "boolean") {
    throwHttpError(400, "請確認是否需要客人退回商品");
  }

  if (!confirmCustomerCommunication) {
    throwHttpError(400, "請確認已與客人確認退貨安排");
  }

  if (normalizedReasonType === "customer_change_mind" && !returnRequiresReturn) {
    throwHttpError(400, "客人個人原因取消必須先收到退回商品");
  }

  if (
    !returnRequiresReturn &&
    !["company_error", "damaged"].includes(normalizedReasonType)
  ) {
    throwHttpError(400, "只有公司出錯或商品損壞個案可以選擇毋須退回商品");
  }

  const nextReturnStatus = returnRequiresReturn
    ? "awaiting_return"
    : "no_return_required";
  const nextOrderStatus = returnRequiresReturn
    ? "Return Requested / Awaiting Return"
    : "Return Approved / No Return Required";
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      orderStatus: { $in: RETURN_REFUND_ELIGIBLE_ORDER_STATUSES },
      paymentStatus: "paid",
      returnStatus: { $in: ["none", null] },
      refundStatus: { $in: ["none", null] },
      $or: [
        { stripeRefundId: { $exists: false } },
        { stripeRefundId: null },
      ],
    },
    {
      $set: {
        returnStatus: nextReturnStatus,
        orderStatus: nextOrderStatus,
        returnReasonType: normalizedReasonType,
        returnReason: normalizedReason,
        returnNote: normalizedNote,
        returnRequestedAt: new Date(),
        returnRequestedBy: req.user?._id,
        returnRequiresReturn,
        returnShippingResponsibility: normalizedShippingResponsibility,
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    throwHttpError(409, "此訂單已有退貨個案或目前不可建立退貨個案");
  }

  res.status(201).json({
    message: returnRequiresReturn
      ? "已建立退貨個案，等待退貨。"
      : "已建立退貨個案，已確認毋須退回商品。",
    order: updatedOrder,
  });
});

export const receiveReturnRefund = asyncHandler(async (req, res) => {
  const {
    confirmReturnReceived,
    confirmNoReturnRequired,
    returnInspectionStatus,
    returnInspectionNote,
    returnShippingDeductionMinor,
    returnShippingDeduction,
    customRefundAmountMinor,
    customRefundAmount,
    manualStripeFeeAmountMinor,
    manualStripeFeeAmount,
    confirmRefundAmount,
    confirmProductCondition,
    confirmCustomerAgreedFeeAndDeductions,
    confirmCustomRefundAgreement,
    confirmRefundDespiteNoRestock,
    refundDespiteNoRestockReason,
    refundDespiteNoRestockNote,
  } = req.body;
  let order = await Order.findById(req.params.id);

  if (!order) {
    throwHttpError(404, "Order not found");
  }

  if (!canSubmitReturnRefund(order)) {
    throwHttpError(400, "此訂單目前不可提交已出貨退款");
  }

  if (!isStripePaidOrder(order)) {
    throwHttpError(400, "此訂單不是 Stripe 付款訂單");
  }

  if (!confirmRefundAmount || !confirmProductCondition) {
    throwHttpError(400, "請確認退款金額及商品狀態");
  }

  const normalizedInspectionNote = String(returnInspectionNote || "").trim();

  if (!normalizedInspectionNote) {
    throwHttpError(400, "請填寫商品檢查或毋須退回的處理備註");
  }

  let normalizedInspectionStatus = String(returnInspectionStatus || "").trim();

  if (order.returnRequiresReturn) {
    if (!confirmReturnReceived) {
      throwHttpError(400, "請確認已收到客人退回商品");
    }

    if (!["restockable", "not_restockable"].includes(normalizedInspectionStatus)) {
      throwHttpError(400, "請選擇商品檢查結果");
    }
  } else {
    if (!confirmNoReturnRequired) {
      throwHttpError(400, "請確認此個案毋須客人退回商品");
    }

    normalizedInspectionStatus = "not_applicable";
  }

  if (
    getOptionalNumber(order.stripeFeeAmountMinor) === undefined &&
    order.stripePaymentIntentId
  ) {
    order = await refreshStripePaymentSnapshot(order);
  }

  const paymentAmountMinor = getAmountMinor(
    order.paymentAmountMinor,
    order.paymentAmount
  );

  if (!Number.isInteger(paymentAmountMinor) || paymentAmountMinor <= 0) {
    throwHttpError(400, "此訂單缺少有效 Stripe 付款金額，請人工跟進");
  }

  const breakdown = getOrderReturnBreakdown(order);
  const savedStripeFeeAmountMinor = getOptionalNumber(
    order.stripeFeeAmountMinor
  );
  const normalizedManualStripeFeeAmountMinor = getAmountMinor(
    manualStripeFeeAmountMinor,
    manualStripeFeeAmount
  );
  const normalizedReturnShippingDeductionMinor = getAmountMinor(
    returnShippingDeductionMinor,
    returnShippingDeduction
  );
  const normalizedCustomRefundAmountMinor = getAmountMinor(
    customRefundAmountMinor,
    customRefundAmount
  );
  let refundAmountMinor;
  let refundPolicyType;
  let refundFeeSource =
    savedStripeFeeAmountMinor !== undefined
      ? "stripe_balance_transaction"
      : "unavailable";

  if (order.returnReasonType === "customer_change_mind") {
    if (!order.returnRequiresReturn || !confirmCustomerAgreedFeeAndDeductions) {
      throwHttpError(400, "請確認客人已同意扣除手續費及退回運費");
    }

    const applicableFeeAmountMinor =
      savedStripeFeeAmountMinor !== undefined
        ? savedStripeFeeAmountMinor
        : normalizedManualStripeFeeAmountMinor;

    if (
      applicableFeeAmountMinor === undefined ||
      applicableFeeAmountMinor < 0
    ) {
      throwHttpError(
        400,
        "Stripe 手續費暫未能取得，請輸入已確認的手續費金額並在備註記錄"
      );
    }

    if (
      normalizedReturnShippingDeductionMinor === undefined ||
      normalizedReturnShippingDeductionMinor < 0
    ) {
      throwHttpError(400, "請輸入有效的退回運費扣除金額，可以填寫 0");
    }

    if (savedStripeFeeAmountMinor === undefined) {
      refundFeeSource = "manual";
    }

    refundPolicyType = "customer_pays_fee";
    refundAmountMinor =
      breakdown.productSubtotalAfterDiscountMinor -
      applicableFeeAmountMinor -
      normalizedReturnShippingDeductionMinor;
  }

  if (["company_error", "damaged"].includes(order.returnReasonType)) {
    refundPolicyType = "company_absorbs_fee";
    refundAmountMinor =
      breakdown.productSubtotalAfterDiscountMinor +
      breakdown.originalShippingFeeMinor;
  }

  if (order.returnReasonType === "other") {
    if (!confirmCustomRefundAgreement) {
      throwHttpError(400, "請確認自訂退款金額已與客人協商並記錄原因");
    }

    refundPolicyType = "custom";
    refundAmountMinor = normalizedCustomRefundAmountMinor;
  }

  if (
    !Number.isInteger(refundAmountMinor) ||
    refundAmountMinor <= 0 ||
    refundAmountMinor > paymentAmountMinor
  ) {
    throwHttpError(400, "退款金額必須大於 0，並且不可超過 Stripe 付款金額");
  }

  const returnedItemsRestockable =
    order.returnRequiresReturn &&
    normalizedInspectionStatus === "restockable";
  const normalizedRefundDespiteNoRestockReason = String(
    refundDespiteNoRestockReason || ""
  ).trim();
  const normalizedRefundDespiteNoRestockNote = String(
    refundDespiteNoRestockNote || ""
  ).trim();

  if (
    (!returnedItemsRestockable ||
      normalizedInspectionStatus === "not_restockable") &&
    (!confirmRefundDespiteNoRestock ||
      !normalizedRefundDespiteNoRestockReason ||
      !normalizedRefundDespiteNoRestockNote)
  ) {
    throwHttpError(
      400,
      "商品不可重新上架，如仍需退款，請確認並填寫原因及內部備註。"
    );
  }

  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      returnStatus: { $in: ["awaiting_return", "no_return_required"] },
      paymentStatus: "paid",
      refundStatus: { $in: ["none", null] },
      $or: [
        { stripeRefundId: { $exists: false } },
        { stripeRefundId: null },
      ],
    },
    {
      $set: {
        refundFlow: "shipped_return",
        returnStatus: "refund_processing",
        refundStatus: "processing",
        paymentStatus: "refund_processing",
        orderStatus: order.returnRequiresReturn
          ? "Return Received / Refund Processing"
          : "Return Refund Processing",
        stockRestoreStatus: returnedItemsRestockable
          ? "pending"
          : "not_restocked",
        returnReceivedAt: order.returnRequiresReturn ? new Date() : undefined,
        returnReceivedBy: order.returnRequiresReturn ? req.user?._id : undefined,
        returnInspectionStatus: normalizedInspectionStatus,
        returnInspectionNote: normalizedInspectionNote,
        returnedItemsRestockable,
        returnShippingDeductionMinor:
          normalizedReturnShippingDeductionMinor ?? 0,
        returnShippingDeduction: toMajorCurrencyAmount(
          normalizedReturnShippingDeductionMinor ?? 0
        ),
        returnRefundSubmittedAt: new Date(),
        refundDespiteNoRestockConfirmed: !returnedItemsRestockable,
        refundDespiteNoRestockReason: !returnedItemsRestockable
          ? normalizedRefundDespiteNoRestockReason
          : undefined,
        refundDespiteNoRestockNote: !returnedItemsRestockable
          ? normalizedRefundDespiteNoRestockNote
          : undefined,
        refundDespiteNoRestockConfirmedAt: !returnedItemsRestockable
          ? new Date()
          : undefined,
        refundDespiteNoRestockConfirmedBy: !returnedItemsRestockable
          ? req.user?._id
          : undefined,
        refundPolicyType,
        refundReason: order.returnReason,
        refundNote: `${order.returnNote}\n${normalizedInspectionNote}`.trim(),
        refundAmountMinor,
        refundAmount: toMajorCurrencyAmount(refundAmountMinor),
        refundCurrency: order.paymentCurrency || "hkd",
        refundRequestedAt: new Date(),
        refundRequestedBy: req.user?._id,
        refundFeeSource,
        manualStripeFeeAmountMinor:
          refundFeeSource === "manual"
            ? normalizedManualStripeFeeAmountMinor
            : undefined,
        manualStripeFeeAmount:
          refundFeeSource === "manual"
            ? toMajorCurrencyAmount(normalizedManualStripeFeeAmountMinor)
            : undefined,
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    throwHttpError(409, "此訂單已提交退款或目前不可退款");
  }

  let stripeRefund;

  try {
    stripeRefund = await stripe.refunds.create(
      {
        ...(claimedOrder.stripePaymentIntentId
          ? { payment_intent: claimedOrder.stripePaymentIntentId }
          : { charge: claimedOrder.stripeChargeId }),
        amount: refundAmountMinor,
        ...(order.returnReasonType === "customer_change_mind"
          ? { reason: "requested_by_customer" }
          : {}),
        metadata: {
          orderId: String(claimedOrder._id),
          refundFlow: "shipped_return",
          returnReasonType: order.returnReasonType,
          source: "SoapDelight.J",
        },
      },
      {
        idempotencyKey: `shipped-return-refund:${claimedOrder._id}`,
      }
    );
  } catch (error) {
    console.error(
      `Unable to submit shipped return Stripe refund for order ${claimedOrder._id}:`,
      error?.message || error
    );
    await Order.findByIdAndUpdate(claimedOrder._id, {
      returnStatus: "return_refund_failed",
      refundStatus: "failed",
      paymentStatus: "refund_failed",
      orderStatus: "Return Refund Failed / Manual Follow-up Required",
      stockRestoreStatus: "not_applicable",
      refundFailedAt: new Date(),
      refundFailureReason:
        "Unable to submit shipped return Stripe refund; manual follow-up required",
    });
    throwHttpError(502, "未能提交 Stripe 退款，請稍後再試或人工跟進");
  }

  const stripeRefundFailed = stripeRefund.status === "failed";

  await Order.findByIdAndUpdate(claimedOrder._id, {
    stripeRefundId: stripeRefund.id,
    stripeRefundStatus: stripeRefund.status,
    stripeRefundCreatedAt: stripeRefund.created
      ? new Date(Number(stripeRefund.created) * 1000)
      : new Date(),
    ...(stripeRefundFailed
      ? {
          returnStatus: "return_refund_failed",
          refundStatus: "failed",
          paymentStatus: "refund_failed",
          orderStatus: "Return Refund Failed / Manual Follow-up Required",
          stockRestoreStatus: "not_applicable",
          refundFailedAt: new Date(),
          refundFailureReason:
            stripeRefund.failure_reason ||
            "Stripe refund failed; manual follow-up required",
        }
      : {}),
  });

  if (stripeRefundFailed) {
    throwHttpError(502, "Stripe 退款未能完成，請人工跟進");
  }

  res.status(202).json({
    message: RETURN_REFUND_SUBMITTED_MESSAGE,
  });
});

export const closeReturnNoRefund = asyncHandler(async (req, res) => {
  const {
    noRefundReason,
    noRefundNote,
    returnInspectionStatus,
    returnInspectionNote,
    confirmReturnReceived,
    confirmNoReturnRequired,
    confirmNoRefund,
  } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throwHttpError(404, "Order not found");
  }

  const allowedOrderStatuses = [
    ...RETURN_REFUND_ELIGIBLE_ORDER_STATUSES,
    "Return Requested / Awaiting Return",
    "Return Approved / No Return Required",
  ];

  if (!allowedOrderStatuses.includes(order.orderStatus)) {
    throwHttpError(400, "只有已出貨退貨個案可以不設退款結案");
  }

  if (!["awaiting_return", "no_return_required"].includes(order.returnStatus)) {
    throwHttpError(400, "此訂單未有可結案的退貨個案");
  }

  if (order.stripeRefundId) {
    throwHttpError(400, "此訂單已建立 Stripe 退款，不可不設退款結案");
  }

  if (["processing", "succeeded", "no_refund"].includes(order.refundStatus)) {
    throwHttpError(400, "此訂單退款或不退款結案已在處理中");
  }

  if (["refund_processing", "refunded"].includes(order.paymentStatus)) {
    throwHttpError(400, "此訂單付款狀態不可不設退款結案");
  }

  if (order.returnedItemsRestockable === true) {
    throwHttpError(400, "可重新上架的退貨不可使用不退款結案");
  }

  if (
    order.returnInspectionStatus === "restockable" ||
    returnInspectionStatus === "restockable"
  ) {
    throwHttpError(400, "可重新上架的退貨不可使用不退款結案");
  }

  if (order.returnRequiresReturn && !confirmReturnReceived) {
    throwHttpError(400, "請確認已收到退回商品");
  }

  if (!order.returnRequiresReturn && !confirmNoReturnRequired) {
    throwHttpError(400, "請確認此個案毋須退回商品");
  }

  const normalizedNoRefundReason = String(noRefundReason || "").trim();
  const normalizedNoRefundNote = String(noRefundNote || "").trim();
  const normalizedInspectionNote = String(returnInspectionNote || "").trim();

  if (!normalizedNoRefundReason) {
    throwHttpError(400, "請填寫不設退款原因");
  }

  if (!normalizedNoRefundNote) {
    throwHttpError(400, "請填寫不設退款內部備註");
  }

  if (!normalizedInspectionNote) {
    throwHttpError(400, "請填寫商品檢查或處理備註");
  }

  if (!confirmNoRefund) {
    throwHttpError(400, "請確認此退貨個案不設退款，且商品不會重新上架");
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      orderStatus: { $in: allowedOrderStatuses },
      returnStatus: { $in: ["awaiting_return", "no_return_required"] },
      paymentStatus: "paid",
      refundStatus: { $in: ["none", null] },
      $or: [
        { stripeRefundId: { $exists: false } },
        { stripeRefundId: null },
      ],
      returnedItemsRestockable: { $ne: true },
      returnInspectionStatus: { $ne: "restockable" },
    },
    {
      $set: {
        orderStatus: "Return Closed / No Refund",
        paymentStatus: "paid",
        refundStatus: "no_refund",
        returnStatus: "closed_no_refund",
        refundFlow: "shipped_return_no_refund",
        refundAmountMinor: 0,
        refundAmount: 0,
        refundCurrency: order.paymentCurrency || "hkd",
        stockRestoreStatus: "not_restocked",
        returnInspectionStatus: "not_restockable",
        returnInspectionNote: normalizedInspectionNote,
        returnedItemsRestockable: false,
        returnReceivedAt: order.returnRequiresReturn ? new Date() : undefined,
        returnReceivedBy: order.returnRequiresReturn ? req.user?._id : undefined,
        noRefundReason: normalizedNoRefundReason,
        noRefundNote: normalizedNoRefundNote,
        noRefundClosedAt: new Date(),
        noRefundClosedBy: req.user?._id,
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    throwHttpError(409, "此退貨個案已被處理，請重新整理後再試");
  }

  res.status(200).json({
    message: "退貨已處理，未有退款；商品未重新上架。",
    order: updatedOrder,
  });
});

export const createCancelRefund = asyncHandler(async (req, res) => {
  const {
    refundPolicyType,
    customRefundAmountMinor,
    customRefundAmount,
    manualStripeFeeAmountMinor,
    manualStripeFeeAmount,
    refundReason,
    refundNote,
    confirmNotShipped,
    confirmCustomerCommunication,
    confirmCustomerAgreedToFee,
    confirmCustomRefundAgreement,
  } = req.body;
  let order = await Order.findById(req.params.id);

  if (!order) {
    throwHttpError(404, "Order not found");
  }

  const initialEligibilityError = getRefundEligibility(order);
  if (initialEligibilityError) {
    throwHttpError(400, initialEligibilityError);
  }

  if (!confirmNotShipped || !confirmCustomerCommunication) {
    throwHttpError(400, "請確認訂單未寄出，並已與客人確認退款安排");
  }

  const normalizedRefundReason = String(refundReason || "").trim();
  const normalizedRefundNote = String(refundNote || "").trim();

  if (!normalizedRefundReason || !normalizedRefundNote) {
    throwHttpError(400, "請填寫退款原因及協商處理備註");
  }

  if (
    getOptionalNumber(order.stripeFeeAmountMinor) === undefined &&
    order.stripePaymentIntentId
  ) {
    order = await refreshStripePaymentSnapshot(order);
  }

  const paymentAmountMinor = getAmountMinor(
    order.paymentAmountMinor,
    order.paymentAmount
  );
  const savedStripeFeeAmountMinor = getOptionalNumber(
    order.stripeFeeAmountMinor
  );
  const normalizedPolicyType = String(refundPolicyType || "").trim();
  const allowedPolicyTypes = [
    "customer_pays_fee",
    "company_absorbs_fee",
    "custom",
  ];

  if (!allowedPolicyTypes.includes(normalizedPolicyType)) {
    throwHttpError(400, "請選擇有效退款方式");
  }

  let refundAmountMinor;
  let refundFeeSource =
    savedStripeFeeAmountMinor !== undefined
      ? "stripe_balance_transaction"
      : "unavailable";
  let normalizedManualStripeFeeAmountMinor;

  if (normalizedPolicyType === "customer_pays_fee") {
    if (!confirmCustomerAgreedToFee) {
      throwHttpError(400, "請確認客人已同意扣除付款平台手續費");
    }

    normalizedManualStripeFeeAmountMinor = getAmountMinor(
      manualStripeFeeAmountMinor,
      manualStripeFeeAmount
    );

    const applicableFeeAmountMinor =
      savedStripeFeeAmountMinor !== undefined
        ? savedStripeFeeAmountMinor
        : normalizedManualStripeFeeAmountMinor;

    if (
      applicableFeeAmountMinor === undefined ||
      applicableFeeAmountMinor < 0
    ) {
      throwHttpError(
        400,
        "Stripe 手續費暫未能取得，請輸入已確認的手續費金額並在備註記錄"
      );
    }

    if (savedStripeFeeAmountMinor === undefined) {
      refundFeeSource = "manual";
    }

    refundAmountMinor = paymentAmountMinor - applicableFeeAmountMinor;
  }

  if (normalizedPolicyType === "company_absorbs_fee") {
    refundAmountMinor = paymentAmountMinor;
  }

  if (normalizedPolicyType === "custom") {
    if (!confirmCustomRefundAgreement) {
      throwHttpError(400, "請確認自訂退款金額已與客人協商並記錄原因");
    }

    refundAmountMinor = getAmountMinor(
      customRefundAmountMinor,
      customRefundAmount
    );
  }

  if (
    !Number.isInteger(refundAmountMinor) ||
    refundAmountMinor <= 0 ||
    refundAmountMinor > paymentAmountMinor
  ) {
    throwHttpError(400, "退款金額必須大於 0，並且不可超過 Stripe 付款金額");
  }

  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      orderStatus: { $in: REFUND_ELIGIBLE_ORDER_STATUSES },
      paymentStatus: "paid",
      cancellationStatus: { $in: ["none", null] },
      refundStatus: { $in: ["none", null] },
      stripeRefundId: { $exists: false },
    },
    {
      $set: {
        cancellationStatus: "refund_processing",
        refundStatus: "processing",
        paymentStatus: "refund_processing",
        orderStatus: "Cancellation / Refund Processing",
        stockRestoreStatus: "pending",
        refundPolicyType: normalizedPolicyType,
        refundReason: normalizedRefundReason,
        refundNote: normalizedRefundNote,
        refundAmountMinor,
        refundAmount: toMajorCurrencyAmount(refundAmountMinor),
        refundCurrency: order.paymentCurrency || "hkd",
        refundRequestedAt: new Date(),
        refundRequestedBy: req.user?._id,
        refundFeeSource,
        manualStripeFeeAmountMinor:
          refundFeeSource === "manual"
            ? normalizedManualStripeFeeAmountMinor
            : undefined,
        manualStripeFeeAmount:
          refundFeeSource === "manual"
            ? toMajorCurrencyAmount(normalizedManualStripeFeeAmountMinor)
            : undefined,
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    throwHttpError(409, "此訂單已提交退款或目前不可退款");
  }

  let stripeRefund;

  try {
    stripeRefund = await stripe.refunds.create(
      {
        ...(claimedOrder.stripePaymentIntentId
          ? { payment_intent: claimedOrder.stripePaymentIntentId }
          : { charge: claimedOrder.stripeChargeId }),
        amount: refundAmountMinor,
        ...(normalizedPolicyType === "customer_pays_fee"
          ? { reason: "requested_by_customer" }
          : {}),
        metadata: {
          orderId: String(claimedOrder._id),
          refundPolicyType: normalizedPolicyType,
          source: "SoapDelight.J",
        },
      },
      {
        idempotencyKey: `order-cancel-refund:${claimedOrder._id}`,
      }
    );
  } catch (error) {
    console.error(
      `Unable to submit Stripe refund for order ${claimedOrder._id}:`,
      error?.message || error
    );
    await Order.findByIdAndUpdate(claimedOrder._id, {
      cancellationStatus: "refund_failed",
      refundStatus: "failed",
      paymentStatus: "refund_failed",
      orderStatus: "Refund Failed / Manual Follow-up Required",
      stockRestoreStatus: "not_applicable",
      refundFailedAt: new Date(),
      refundFailureReason:
        "Unable to submit Stripe refund; manual follow-up required",
    });
    throwHttpError(502, "未能提交 Stripe 退款，請稍後再試或人工跟進");
  }

  const stripeRefundFailed = stripeRefund.status === "failed";

  await Order.findByIdAndUpdate(claimedOrder._id, {
    stripeRefundId: stripeRefund.id,
    stripeRefundStatus: stripeRefund.status,
    stripeRefundCreatedAt: stripeRefund.created
      ? new Date(Number(stripeRefund.created) * 1000)
      : new Date(),
    ...(stripeRefundFailed
      ? {
          cancellationStatus: "refund_failed",
          refundStatus: "failed",
          paymentStatus: "refund_failed",
          orderStatus: "Refund Failed / Manual Follow-up Required",
          stockRestoreStatus: "not_applicable",
          refundFailedAt: new Date(),
          refundFailureReason:
            stripeRefund.failure_reason ||
            "Stripe refund failed; manual follow-up required",
        }
      : {}),
  });

  if (stripeRefundFailed) {
    throwHttpError(502, "Stripe 退款未能完成，請人工跟進");
  }

  res.status(202).json({
    message: REFUND_SUBMITTED_MESSAGE,
  });
});

// // Update Product
export const updateOrderStatus = asyncHandler(async (req, res) => {
  // res.send("order")
  const { orderStatus } = req.body;
  const { id } = req.params;

  const order = await Order.findById(id);

  // if product doesnt exist
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    order.cancellationStatus &&
    order.cancellationStatus !== "none"
  ) {
    throwHttpError(400, "退款處理中的訂單不可手動更改狀態");
  }

  if (order.returnStatus && order.returnStatus !== "none") {
    throwHttpError(400, "退貨處理中的訂單不可手動更改狀態");
  }

  // Update Product
  await Order.findByIdAndUpdate(
    { _id: id },
    {
      orderStatus: orderStatus,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ message: "Order status updated" });
});

// // Pay with stripe
export const payWithStripe = asyncHandler(async (req, res) => {
  const { items, shipping, description, coupon,shippingFee, userId, userEmail } = req.body;
  const products = await Product.find();

  let orderAmount;
  orderAmount = calculateTotalPrice(products, items);
  if (coupon !== null && coupon?.name !== "nil") {
    let totalAfterDiscount =
      orderAmount - (orderAmount * coupon.discount) / 100;
    orderAmount = totalAfterDiscount;
  }

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    // amount: orderAmount,
    amount: Math.round(orderAmount * 100),
    currency: "hkd",
    automatic_payment_methods: {
      enabled: true,
    },
    description,
    metadata: {
      source: "SoapDelight.J",
      ...(userId ? { userId: String(userId) } : {}),
      ...(userEmail ? { customerEmail: String(userEmail) } : {}),
    },
    shipping: {
      address: {
        line1: shipping.line1,
        line2: shipping.line2,
        city: shipping.city,
        country: shipping.country,
        postal_code: shipping.postal_code,
      },
      name: shipping.name,
      phone: shipping.phone,
    },
    // receipt_email: customerEmail
  });

  // console.log(paymentIntent);

  res.send({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });
});

// // Verify FLW Payment
// const verifyFlwPayment = asyncHandler(async (req, res) => {
//   const { transaction_id } = req.query;

//   // Confirm transaction
//   const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;

//   const response = await axios({
//     url,
//     method: "get",
//     headers: {
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       Authorization: process.env.FLW_SECRET_KEY,
//     },
//   });

//   // console.log(response.data.data);
//   const { amount, customer, tx_ref } = response.data.data;

//   const successURL =
//     process.env.FRONTEND_URL +
//     `/checkout-flutterwave?payment=successful&ref=${tx_ref}`;
//   const failureURL =
//     process.env.FRONTEND_URL + "/checkout-flutterwave?payment=failed";
//   if (req.query.status === "successful") {
//     res.redirect(successURL);
//   } else {
//     res.redirect(failureURL);
//   }
// });

// // Pay With Flutterwave // NOT WORKING
// const payWithFlutterwave = async (req, res) => {
//   const { items, userID } = req.body;
//   const products = await Product.find();
//   const user = await User.findById(userID);
//   const orderAmount = calculateTotalPrice(products, items);
//   // console.log(orderAmount);
//   // const url = "https://jsonplaceholder.typicode.com/posts";
//   const url = "https://api.flutterwave.com/v3/payments";
//   const json = {
//     tx_ref: "shopito-48981487343MDI0NzMx",
//     amount: orderAmount,
//     currency: "USD",
//     // payment_options: "card, banktransfer, ussd",
//     redirect_url: "http://localhost:5000/response",
//     //   meta: {
//     //     consumer_id: 23,
//     //     consumer_mac: "92a3-912ba-1192a",
//     //   },
//     customer: {
//       email: user?.email,
//       phone_number: user.phone,
//       name: user.name,
//     },
//     customizations: {
//       title: "Shopito Online Store",
//       description: "Payment for products",
//       logo: "https://www.logolynx.com/images/logolynx/22/2239ca38f5505fbfce7e55bbc0604386.jpeg",
//     },
//   };

//   axios
//     .post(url, json, {
//       headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json;charset=UTF-8",
//         Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
//       },
//     })
//     .then(({ data }) => {
//       // console.log(data);
//       return res.status(200).json(data);
//     })
//     .catch((err) => {
//       // console.log(err.message);
//       return res.json(err.message);
//     });
// };

// // pAYWith Wallet
// // Pay with Wallet
// const payWithWallet = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);
//   const { items, cartItems, shippingAddress, coupon } = req.body;
//   // console.log(coupon);
//   const products = await Product.find();
//   const today = new Date();

//   let orderAmount;
//   orderAmount = calculateTotalPrice(products, items);
//   if (coupon !== null && coupon?.name !== "nil") {
//     let totalAfterDiscount =
//       orderAmount - (orderAmount * coupon.discount) / 100;
//     orderAmount = totalAfterDiscount;
//   }
//   // console.log(orderAmount);
//   // console.log(user.balance);

//   if (user.balance < orderAmount) {
//     res.status(400);
//     throw new Error("Insufficient balance");
//   }

//   const newTransaction = await Transaction.create({
//     amount: orderAmount,
//     sender: user.email,
//     receiver: "Shopito store",
//     description: "Payment for products.",
//     status: "success",
//   });

//   // decrease the sender's balance
//   const newBalance = await User.findOneAndUpdate(
//     { email: user.email },
//     {
//       $inc: { balance: -orderAmount },
//     }
//   );

//   const newOrder = await Order.create({
//     user: user._id,
//     orderDate: today.toDateString(),
//     orderTime: today.toLocaleTimeString(),
//     orderAmount,
//     orderStatus: "Order Placed...",
//     cartItems,
//     shippingAddress,
//     paymentMethod: "Shopito Wallet",
//     coupon,
//   });

//   // Update Product quantity
//   const updatedProduct = await updateProductQuantity(cartItems);
//   // console.log("updated product", updatedProduct);

//   // Send Order Email to the user
//   const subject = "Shopito Order Placed";
//   const send_to = user.email;
//   // const send_to = "zinotrust@gmail.com";
//   const template = orderSuccessEmail(user.name, cartItems);
//   const reply_to = "donaldzee.ng@gmail.com";
//   // const cc = "donaldzee.ng@gmail.com";

//   await sendEmail(subject, send_to, template, reply_to);

//   if (newTransaction && newBalance && newOrder) {
//     return res.status(200).json({
//       message: "Payment successful",
//       url: `${process.env.FRONTEND_URL}/checkout-success`,
//     });
//   }
//   res
//     .status(400)
//     .json({ message: "Something went wrong, please contact admin" });
// });

// const updateProductQuantity = async (cartItems) => {
//   // Update Product quantity
//   let bulkOption = cartItems.map((product) => {
//     return {
//       updateOne: {
//         filter: { _id: product._id }, // IMPORTANT item.product
//         update: {
//           $inc: {
//             quantity: -product.cartQuantity,
//             sold: +product.cartQuantity,
//           },
//         },
//       },
//     };
//   });
//   let updatedProduct = await Product.bulkWrite(bulkOption, {});
// };
