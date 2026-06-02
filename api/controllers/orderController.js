import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js"
import Coupon from "../models/couponMondel.js";
import {
  calculateTotalPrice,
  restoreOnlineStockForCancelledOrder,
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
const REFUND_SUBMITTED_MESSAGE =
  "退款已提交，等待 Stripe 確認。客人通知會在退款成功及庫存補回後發出。";

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

const markStripeRefundFailed = async (refund) => {
  const order = await findOrderForStripeRefund(refund);

  if (!order || order.stockRestoreStatus === "restored") {
    return;
  }

  order.stripeRefundId = refund.id;
  order.stripeRefundStatus = refund.status || "failed";
  order.refundStatus = "failed";
  order.cancellationStatus = "refund_failed";
  order.paymentStatus = "refund_failed";
  order.orderStatus = "Refund Failed / Manual Follow-up Required";
  order.stockRestoreStatus = "not_applicable";
  order.refundFailedAt = new Date();
  order.refundFailureReason =
    refund.failure_reason || "Stripe refund failed; manual follow-up required";
  await order.save();
};

const sendRefundCompletionEmailIfNeeded = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      stockRestoreStatus: "restored",
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

const processSucceededStripeRefund = async (refund) => {
  const existingOrder = await findOrderForStripeRefund(refund);

  if (!existingOrder) {
    console.warn(`No order found for Stripe refund ${refund?.id || ""}`);
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
