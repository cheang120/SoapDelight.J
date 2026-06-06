import asyncHandler from "express-async-handler";
import ShippingMethod from "../models/shippingMethodModel.js";
import { createAuditLog } from "../utils/auditLogger.js";

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return value === "true";
};

const normalizeShippingMethodPayload = (body) => ({
  name: body.name?.trim(),
  code: body.code?.trim().toUpperCase(),
  region: body.region?.trim() || "",
  fee: Number(body.fee ?? 0),
  currency: body.currency?.trim().toUpperCase() || "MOP",
  description: body.description?.trim() || "",
  estimatedDeliveryTime: body.estimatedDeliveryTime?.trim() || "",
  active: normalizeBoolean(body.active, true),
  isPickup: normalizeBoolean(body.isPickup, false),
});

const getShippingMethodValidationError = ({ name, code, fee }) => {
  if (!name || !code) {
    return "Please fill in shipping method name and code";
  }

  if (Number.isNaN(fee) || fee < 0) {
    return "Shipping fee must be zero or greater";
  }

  return "";
};

const compactShippingMethodAuditSnapshot = (shippingMethod) => ({
  name: shippingMethod?.name || "",
  code: shippingMethod?.code || "",
  type: shippingMethod?.isPickup ? "pickup" : "delivery",
  region: shippingMethod?.region || "",
  price: Number(shippingMethod?.fee || 0),
  fee: Number(shippingMethod?.fee || 0),
  currency: shippingMethod?.currency || "",
  active: shippingMethod?.active !== false,
  isPickup: Boolean(shippingMethod?.isPickup),
});

export const getActiveShippingMethods = asyncHandler(async (req, res) => {
  const shippingMethods = await ShippingMethod.find({ active: true }).sort({
    isPickup: -1,
    region: 1,
    name: 1,
  });

  res.status(200).json(shippingMethods);
});

export const getAdminShippingMethods = asyncHandler(async (req, res) => {
  const shippingMethods = await ShippingMethod.find().sort({
    isPickup: -1,
    region: 1,
    name: 1,
  });

  res.status(200).json(shippingMethods);
});

export const createShippingMethod = asyncHandler(async (req, res) => {
  const payload = normalizeShippingMethodPayload(req.body);
  const validationError = getShippingMethodValidationError(payload);

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const shippingMethod = await ShippingMethod.create(payload);
  await createAuditLog({
    req,
    actionType: "shipping_method.created",
    actionLabel: "新增送貨方式",
    targetType: "ShippingMethod",
    targetId: shippingMethod._id,
    targetLabel: shippingMethod.name || shippingMethod.code,
    summary: `新增送貨方式：${shippingMethod.name || shippingMethod.code}`,
    after: compactShippingMethodAuditSnapshot(shippingMethod),
  });

  res.status(201).json(shippingMethod);
});

export const updateShippingMethod = asyncHandler(async (req, res) => {
  const payload = normalizeShippingMethodPayload(req.body);
  const validationError = getShippingMethodValidationError(payload);

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const previousShippingMethod = await ShippingMethod.findById(req.params.id);

  if (!previousShippingMethod) {
    res.status(404);
    throw new Error("Shipping method not found");
  }

  const shippingMethod = await ShippingMethod.findByIdAndUpdate(
    req.params.id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!shippingMethod) {
    res.status(404);
    throw new Error("Shipping method not found");
  }

  await createAuditLog({
    req,
    actionType: "shipping_method.updated",
    actionLabel: "編輯送貨方式",
    targetType: "ShippingMethod",
    targetId: shippingMethod._id,
    targetLabel: shippingMethod.name || shippingMethod.code,
    summary: `編輯送貨方式：${shippingMethod.name || shippingMethod.code}`,
    before: compactShippingMethodAuditSnapshot(previousShippingMethod),
    after: compactShippingMethodAuditSnapshot(shippingMethod),
  });

  res.status(200).json(shippingMethod);
});

export const deleteShippingMethod = asyncHandler(async (req, res) => {
  const shippingMethod = await ShippingMethod.findByIdAndDelete(req.params.id);

  if (!shippingMethod) {
    res.status(404);
    throw new Error("Shipping method not found");
  }

  await createAuditLog({
    req,
    actionType: "shipping_method.deleted",
    actionLabel: "刪除送貨方式",
    targetType: "ShippingMethod",
    targetId: shippingMethod._id,
    targetLabel: shippingMethod.name || shippingMethod.code,
    summary: `刪除送貨方式：${shippingMethod.name || shippingMethod.code}`,
    before: compactShippingMethodAuditSnapshot(shippingMethod),
  });

  res.status(200).json({ message: "Shipping method deleted." });
});
