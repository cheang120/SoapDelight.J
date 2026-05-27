import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import InventoryLocation from "../models/inventoryLocationModel.js";
import ProductLocationMapping from "../models/productLocationMappingModel.js";
import InventoryBalance from "../models/inventoryBalanceModel.js";
import StockMovement from "../models/stockMovementModel.js";
import ConsignmentReport from "../models/consignmentReportModel.js";

const normalizeCode = (code) => String(code || "").trim().toUpperCase();
const normalizeText = (value) => String(value || "").trim();
const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const throwHttpError = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const toNonNegativeNumber = (res, value, fieldName) => {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number) || number < 0) {
    throwHttpError(res, 400, `${fieldName} must be zero or greater`);
  }

  return number;
};

const toPositiveNumber = (res, value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throwHttpError(res, 400, `${fieldName} must be greater than zero`);
  }

  return number;
};

const getLocation = async (res, { locationId, locationCode }) => {
  if (locationId) {
    const location = await InventoryLocation.findById(locationId);
    if (location) return location;
  }

  const code = normalizeCode(locationCode);
  if (code) {
    const location = await InventoryLocation.findOne({ code });
    if (location) return location;
  }

  throwHttpError(res, 404, "Inventory location not found");
};

const getNextReportNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `CSR-${year}-`;

  const latest = await ConsignmentReport.findOne({
    reportNumber: new RegExp(`^${prefix}`),
  })
    .sort("-createdAt")
    .select("reportNumber")
    .lean();

  const latestNumber = latest?.reportNumber
    ? Number(latest.reportNumber.replace(prefix, ""))
    : 0;

  return `${prefix}${String(latestNumber + 1).padStart(4, "0")}`;
};

const buildReportItems = async (res, { location, items }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throwHttpError(res, 400, "At least one report item is required");
  }

  const productIds = items.map((item) => item.productId).filter(Boolean);

  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  const mappings = await ProductLocationMapping.find({
    productId: { $in: productIds },
    locationId: location._id,
  }).lean();

  const mappingMap = new Map(
    mappings.map((mapping) => [String(mapping.productId), mapping])
  );

  return items.map((item) => {
    const product = productMap.get(String(item.productId));

    if (!product) {
      throwHttpError(res, 404, "Product not found in report item");
    }

    const mapping = mappingMap.get(String(product._id));
    const quantitySold = toPositiveNumber(res, item.quantitySold, "Quantity sold");

    const publicUnitPriceAtSale = toNonNegativeNumber(
      res,
      item.publicUnitPriceAtSale ?? product.price ?? 0,
      "Public unit price"
    );

    const discountRate = toNonNegativeNumber(
      res,
      item.discountRate ?? 0,
      "Discount rate"
    );

    if (discountRate > 100) {
      throwHttpError(res, 400, "Discount rate cannot exceed 100");
    }

    const commissionRateAtSale = toNonNegativeNumber(
      res,
      item.commissionRateAtSale ??
        item.commissionRate ??
        mapping?.commissionRate ??
        location.commissionRate ??
        0,
      "Commission rate"
    );

    const grossAmount = toMoney(publicUnitPriceAtSale * quantitySold);
    const promotionDiscountAmount = toMoney(grossAmount * (discountRate / 100));
    const netSalesAfterDiscount = toMoney(grossAmount - promotionDiscountAmount);
    const commissionAmount = toMoney(
      netSalesAfterDiscount * (commissionRateAtSale / 100)
    );
    const netPayableAmount = toMoney(netSalesAfterDiscount - commissionAmount);

    return {
      productId: product._id,
      productNameAtSale: product.name,
      centralSkuAtSale: product.sku || "",
      locationSkuAtSale: mapping?.locationSku || "",
      locationProductNameAtSale: mapping?.locationProductName || "",
      quantitySold,
      publicUnitPriceAtSale,
      discountRate,
      commissionRateAtSale,
      grossAmount,
      promotionDiscountAmount,
      commissionAmount,
      netPayableAmount,
      promotionNote: normalizeText(item.promotionNote),
      note: normalizeText(item.note),
    };
  });
};

const buildTotals = (items) =>
  items.reduce(
    (totals, item) => ({
      totalQuantity: totals.totalQuantity + Number(item.quantitySold || 0),
      grossTotal: toMoney(totals.grossTotal + Number(item.grossAmount || 0)),
      promotionDiscountTotal: toMoney(
        totals.promotionDiscountTotal + Number(item.promotionDiscountAmount || 0)
      ),
      commissionTotal: toMoney(
        totals.commissionTotal + Number(item.commissionAmount || 0)
      ),
      netPayableTotal: toMoney(
        totals.netPayableTotal + Number(item.netPayableAmount || 0)
      ),
    }),
    {
      totalQuantity: 0,
      grossTotal: 0,
      promotionDiscountTotal: 0,
      commissionTotal: 0,
      netPayableTotal: 0,
    }
  );

const buildReportPayload = async (res, body) => {
  const location = await getLocation(res, {
    locationId: body.locationId,
    locationCode: body.locationCode,
  });

  const items = await buildReportItems(res, {
    location,
    items: body.items,
  });

  return {
    location,
    payload: {
      locationId: location._id,
      locationNameAtReport: location.name,
      locationCodeAtReport: location.code,
      periodStart: body.periodStart ? new Date(body.periodStart) : undefined,
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : undefined,
      items,
      ...buildTotals(items),
      note: normalizeText(body.note),
      sourceDocument: normalizeText(body.sourceDocument),
    },
  };
};

export const getConsignmentReports = asyncHandler(async (req, res) => {
  const { status, locationId } = req.query;
  const query = {};

  if (status) query.status = status;
  if (locationId) query.locationId = locationId;

  const reports = await ConsignmentReport.find(query)
    .populate("locationId", "name code type commissionRate")
    .sort("-createdAt")
    .limit(100)
    .lean();

  res.status(200).json(reports);
});

export const getConsignmentReportById = asyncHandler(async (req, res) => {
  const report = await ConsignmentReport.findById(req.params.id)
    .populate("locationId", "name code type commissionRate")
    .populate("createdBy", "username email")
    .lean();

  if (!report) {
    throwHttpError(res, 404, "Consignment report not found");
  }

  res.status(200).json(report);
});

export const createConsignmentReport = asyncHandler(async (req, res) => {
  const { payload } = await buildReportPayload(res, req.body);

  const report = await ConsignmentReport.create({
    ...payload,
    reportNumber: await getNextReportNumber(),
    status: "draft",
    createdBy: req.user?._id,
  });

  res.status(201).json(report);
});

export const updateConsignmentReport = asyncHandler(async (req, res) => {
  const report = await ConsignmentReport.findById(req.params.id);

  if (!report) {
    throwHttpError(res, 404, "Consignment report not found");
  }

  if (report.status !== "draft") {
    throwHttpError(res, 400, "Only draft reports can be updated");
  }

  const { payload } = await buildReportPayload(res, req.body);
  Object.assign(report, payload);

  const savedReport = await report.save();
  res.status(200).json(savedReport);
});


export const confirmConsignmentReport = asyncHandler(async (req, res) => {
  const report = await ConsignmentReport.findById(req.params.id);

  if (!report) {
    throwHttpError(res, 404, "Consignment report not found");
  }

  if (report.status !== "draft") {
    throwHttpError(res, 400, "Only draft reports can be confirmed");
  }

  const requiredByProduct = new Map();

  for (const item of report.items) {
    const productId = String(item.productId);
    requiredByProduct.set(
      productId,
      Number(requiredByProduct.get(productId) || 0) + Number(item.quantitySold || 0)
    );
  }

  const balances = await InventoryBalance.find({
    productId: { $in: Array.from(requiredByProduct.keys()) },
    locationId: report.locationId,
  });

  const balanceMap = new Map(
    balances.map((balance) => [String(balance.productId), balance])
  );

  for (const [productId, requiredQuantity] of requiredByProduct.entries()) {
    const balance = balanceMap.get(productId);
    const available = Number(balance?.quantity || 0);

    if (available < requiredQuantity) {
      const itemName =
        report.items.find((item) => String(item.productId) === productId)
          ?.productNameAtSale || "selected product";

      throwHttpError(
        res,
        400,
        `Not enough stock for ${itemName}. Available: ${available}, required: ${requiredQuantity}`
      );
    }
  }

  for (const item of report.items) {
    const balance = balanceMap.get(String(item.productId));
    balance.quantity = Number(balance.quantity || 0) - Number(item.quantitySold || 0);
    await balance.save();

    await StockMovement.create({
      productId: item.productId,
      fromLocationId: report.locationId,
      toLocationId: null,
      quantity: item.quantitySold,
      type: "consignment_sold",
      direction: "out",
      note: `Consignment sold via ${report.reportNumber}${
        item.note ? ` - ${item.note}` : ""
      }`,
      sourceDocument: report.reportNumber,
      sourceDate: report.periodEnd || new Date(),
      createdBy: req.user?._id,
    });
  }

  report.status = "confirmed";
  report.confirmedBy = req.user?._id;
  report.confirmedAt = new Date();

  const savedReport = await report.save();
  res.status(200).json(savedReport);
});
