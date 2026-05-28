import asyncHandler from "express-async-handler";
import CompanyProfile from "../models/companyProfileModel.js";
import ConsignmentDelivery from "../models/consignmentDeliveryModel.js";
import InventoryLocation from "../models/inventoryLocationModel.js";
import ProductLocationMapping from "../models/productLocationMappingModel.js";
import Product from "../models/productModel.js";

const normalizeCode = (value = "") => String(value).trim().toUpperCase();

const normalizeText = (value = "") => String(value ?? "").trim();

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const parseMoneyNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const throwHttpError = (res, statusCode, message) => {
  res.status(statusCode);
  throw new Error(message);
};

const toNonNegativeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const getLocation = async (res, { locationId, locationCode }) => {
  if (!locationId && !locationCode) {
    throwHttpError(res, 400, "Location is required");
  }

  const query = locationId
    ? { _id: locationId }
    : { code: normalizeCode(locationCode) };

  const location = await InventoryLocation.findOne(query);

  if (!location) {
    throwHttpError(res, 404, "Inventory location not found");
  }

  return location;
};

const buildCompanySnapshot = (profile) => ({
  businessName: normalizeText(profile?.businessName),
  contactName: normalizeText(profile?.contactName),
  phone: normalizeText(profile?.phone),
  email: normalizeText(profile?.email),
  facebookPage: normalizeText(profile?.facebookPage),
  address: normalizeText(profile?.address),
});

const getNextDeliveryNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `CSD-${year}-`;
  const latestDelivery = await ConsignmentDelivery.findOne({
    deliveryNumber: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1, deliveryNumber: -1 })
    .lean();

  if (!latestDelivery?.deliveryNumber) {
    return `${prefix}0001`;
  }

  const lastSequence = Number(
    String(latestDelivery.deliveryNumber).replace(prefix, "")
  );
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

const buildDeliveryItems = async (res, { location, items }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throwHttpError(res, 400, "At least one delivery item is required");
  }

  const deliveryItems = [];

  for (const item of items) {
    const productId = item?.productId;

    if (!productId) {
      throwHttpError(res, 400, "Product is required for each delivery item");
    }

    const quantity = toPositiveNumber(item?.quantity);

    if (!quantity) {
      throwHttpError(res, 400, "Item quantity must be greater than zero");
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      throwHttpError(res, 404, "Product not found");
    }

    const mapping = await ProductLocationMapping.findOne({
      productId,
      locationId: location._id,
    }).lean();

    const fallbackPrice = parseMoneyNumber(product?.price, null);


    const unitPriceAtIssue =


      parseMoneyNumber(item?.unitPriceAtIssue, fallbackPrice) ?? null;

    if (unitPriceAtIssue === null) {
      throwHttpError(res, 400, "Unit price must be zero or greater");
    }

    const commissionRate =
      toNonNegativeNumber(mapping?.commissionRate, location?.commissionRate ?? 0) ??
      null;

    if (commissionRate === null) {
      throwHttpError(res, 400, "Commission rate must be zero or greater");
    }

    const settlementRate = toMoney(100 - commissionRate);

    if (settlementRate < 0 || settlementRate > 100) {
      throwHttpError(res, 400, "Settlement rate must be between 0 and 100");
    }

    const lineAmount = toMoney(
      unitPriceAtIssue * quantity * (settlementRate / 100)
    );

    deliveryItems.push({
      productId: product._id,
      productCodeAtIssue:
        normalizeText(mapping?.locationSku) || normalizeText(product?.sku),
      productNameAtIssue:
        normalizeText(mapping?.locationProductName) || normalizeText(product?.name),
      centralSkuAtIssue:
        normalizeText(mapping?.centralSku) || normalizeText(product?.sku),
      locationSkuAtIssue: normalizeText(mapping?.locationSku),
      unitPriceAtIssue: toMoney(unitPriceAtIssue),
      settlementRateAtIssue: settlementRate,
      commissionRateAtIssue: toMoney(commissionRate),
      quantity,
      lineAmount,
      note: normalizeText(item?.note),
    });
  }

  return deliveryItems;
};

const buildTotals = (items = []) =>
  items.reduce(
    (acc, item) => {
      acc.totalQuantity += Number(item.quantity) || 0;
      acc.totalAmount = toMoney(acc.totalAmount + (Number(item.lineAmount) || 0));
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0 }
  );

const buildDeliveryPayload = async (res, body) => {
  const location = await getLocation(res, {
    locationId: body?.locationId,
    locationCode: body?.locationCode,
  });

  const companyProfile = await CompanyProfile.findOne({
    profileKey: "default",
  }).lean();

  const deliveryItems = await buildDeliveryItems(res, {
    location,
    items: body?.items,
  });

  const totals = buildTotals(deliveryItems);

  return {
    location,
    payload: {
      issueDate: body?.issueDate ? new Date(body.issueDate) : new Date(),
      locationId: location._id,
      locationNameAtIssue: normalizeText(location.name),
      locationCodeAtIssue: normalizeCode(location.code),
      locationPhoneAtIssue: normalizeText(location.phone),
      locationEmailAtIssue: normalizeText(location.email),
      locationAddressAtIssue: normalizeText(location.address),
      companySnapshot: buildCompanySnapshot(companyProfile),
      items: deliveryItems,
      totalQuantity: totals.totalQuantity,
      totalAmount: totals.totalAmount,
      note: normalizeText(body?.note),
    },
  };
};

export const getConsignmentDeliveries = asyncHandler(async (req, res) => {
  const { locationId, status } = req.query;
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 200))
    : 100;

  const query = {};

  if (locationId) {
    query.locationId = locationId;
  }

  if (status) {
    query.status = status;
  }

  const deliveries = await ConsignmentDelivery.find(query)
    .populate("locationId", "name code")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json(deliveries);
});

export const getConsignmentDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await ConsignmentDelivery.findById(req.params.id)
    .populate("locationId", "name code phone email address")
    .populate("items.productId", "name sku price");

  if (!delivery) {
    throwHttpError(res, 404, "Consignment delivery not found");
  }

  res.status(200).json(delivery);
});

export const createConsignmentDelivery = asyncHandler(async (req, res) => {
  const { payload } = await buildDeliveryPayload(res, req.body);

  const deliveryNumber =
    normalizeText(req.body?.deliveryNumber) || (await getNextDeliveryNumber());

  const existingDelivery = await ConsignmentDelivery.findOne({
    deliveryNumber,
  }).lean();

  if (existingDelivery) {
    throwHttpError(res, 400, "Delivery number already exists");
  }

  const delivery = await ConsignmentDelivery.create({
    ...payload,
    deliveryNumber,
    status: "draft",
    createdBy: req.user?._id,
  });

  res.status(201).json(delivery);
});

export const updateConsignmentDelivery = asyncHandler(async (req, res) => {
  const delivery = await ConsignmentDelivery.findById(req.params.id);

  if (!delivery) {
    throwHttpError(res, 404, "Consignment delivery not found");
  }

  if (delivery.status !== "draft") {
    throwHttpError(res, 400, "Only draft deliveries can be updated");
  }

  const { payload } = await buildDeliveryPayload(res, req.body);

  delivery.issueDate = payload.issueDate;
  delivery.locationId = payload.locationId;
  delivery.locationNameAtIssue = payload.locationNameAtIssue;
  delivery.locationCodeAtIssue = payload.locationCodeAtIssue;
  delivery.locationPhoneAtIssue = payload.locationPhoneAtIssue;
  delivery.locationEmailAtIssue = payload.locationEmailAtIssue;
  delivery.locationAddressAtIssue = payload.locationAddressAtIssue;
  delivery.companySnapshot = payload.companySnapshot;
  delivery.items = payload.items;
  delivery.totalQuantity = payload.totalQuantity;
  delivery.totalAmount = payload.totalAmount;
  delivery.note = payload.note;

  const updatedDelivery = await delivery.save();

  res.status(200).json(updatedDelivery);
});

export const markConsignmentDeliveryIssued = asyncHandler(async (req, res) => {
  const delivery = await ConsignmentDelivery.findById(req.params.id);

  if (!delivery) {
    throwHttpError(res, 404, "Consignment delivery not found");
  }

  if (delivery.status !== "draft") {
    throwHttpError(res, 400, "Only draft deliveries can be issued");
  }

  delivery.status = "issued";
  delivery.issuedBy = req.user?._id;
  delivery.issuedAt = new Date();

  // Stock movement integration is intentionally deferred until the
  // delivery UI and future PDF workflow are confirmed.
  const updatedDelivery = await delivery.save();

  res.status(200).json(updatedDelivery);
});

export const cancelConsignmentDelivery = asyncHandler(async (req, res) => {
  const delivery = await ConsignmentDelivery.findById(req.params.id);

  if (!delivery) {
    throwHttpError(res, 404, "Consignment delivery not found");
  }

  if (delivery.status === "cancelled") {
    throwHttpError(res, 400, "Consignment delivery is already cancelled");
  }

  delivery.status = "cancelled";
  delivery.cancelledBy = req.user?._id;
  delivery.cancelledAt = new Date();

  const updatedDelivery = await delivery.save();

  res.status(200).json(updatedDelivery);
});
