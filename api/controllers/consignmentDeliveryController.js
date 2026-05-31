import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import CompanyProfile from "../models/companyProfileModel.js";
import ConsignmentDelivery from "../models/consignmentDeliveryModel.js";
import ConsignmentDeliveryReturn from "../models/consignmentDeliveryReturnModel.js";
import InventoryBalance from "../models/inventoryBalanceModel.js";
import InventoryLocation from "../models/inventoryLocationModel.js";
import ProductLocationMapping from "../models/productLocationMappingModel.js";
import Product from "../models/productModel.js";
import StockMovement from "../models/stockMovementModel.js";

const normalizeCode = (value = "") => String(value).trim().toUpperCase();

const normalizeText = (value = "") => String(value ?? "").trim();

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatMoney = (value) =>
  `MOP$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-HK");
};

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

const getOrCreateBalance = async (productId, locationId) => {
  const balance = await InventoryBalance.findOne({ productId, locationId });
  if (balance) return balance;

  return InventoryBalance.create({ productId, locationId, quantity: 0 });
};

const buildCompanySnapshot = (profile) => ({
  businessName: normalizeText(profile?.businessName),
  contactName: normalizeText(profile?.contactName),
  phone: normalizeText(profile?.phone),
  email: normalizeText(profile?.email),
  facebookPage: normalizeText(profile?.facebookPage),
  address: normalizeText(profile?.address),
});

const pickSnapshotValue = (snapshotValue, fallbackValue) =>
  normalizeText(snapshotValue) || normalizeText(fallbackValue);

const getReadableFontPath = () => {
  const candidates = [
    path.resolve("api/assets/fonts/NotoSansCJKtc-Regular.otf"),
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJKtc-Regular.otf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/arphic/uming.ttc",
  ];

  return candidates.find((fontPath) => fs.existsSync(fontPath));
};

const setPdfFont = (doc) => {
  const fontPath = getReadableFontPath();

  if (fontPath) {
    doc.registerFont("CJK", fontPath);
    doc.font("CJK");
    return;
  }

  doc.font("Helvetica");
};

const drawTextLine = (doc, label, value, x, y, options = {}) => {
  const width = options.width || 220;
  const labelText = `${label}：`;
  const text = `${labelText} ${value || ""}`;

  doc
    .fontSize(options.fontSize || 11)
    .fillColor("#111111")
    .text(text, x, y, {
      width,
      height: options.height || 30,
      ellipsis: true,
      lineGap: options.lineGap || 1,
    });
};

const drawCell = (doc, text, x, y, width, height, options = {}) => {
  doc
    .rect(x, y, width, height)
    .lineWidth(options.lineWidth || 0.9)
    .strokeColor("#111111")
    .stroke();

  if (options.fill) {
    doc.save();
    doc.rect(x, y, width, height).fill(options.fill);
    doc.restore();
    doc
      .rect(x, y, width, height)
      .lineWidth(options.lineWidth || 0.9)
      .strokeColor("#111111")
      .stroke();
  }

  doc
    .fontSize(options.fontSize || 10.5)
    .fillColor("#111111")
    .text(String(text ?? ""), x + (options.paddingX || 6), y + (options.paddingY || 7), {
      width: width - ((options.paddingX || 6) * 2),
      height: height - 8,
      align: options.align || "left",
      ellipsis: options.ellipsis ?? true,
    });
};

const measurePdfTextWidth = (doc, text, fontSize) => {
  doc.fontSize(fontSize);
  return doc.widthOfString(String(text ?? ""));
};

const fitCellFontSize = (doc, text, width, maxSize, minSize) => {
  let currentSize = maxSize;

  while (currentSize > minSize) {
    if (measurePdfTextWidth(doc, text, currentSize) <= width) {
      return currentSize;
    }
    currentSize -= 0.2;
  }

  return minSize;
};

const formatRate = (value) => {
  const rate = Number(value || 0);
  if (!Number.isFinite(rate)) return "0";
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(2);
};

const getDeliveryPdfFilename = (delivery) =>
  `consignment-delivery-${delivery.deliveryNumber || delivery._id}.pdf`;

const getNextReturnNo = async () => {
  const year = new Date().getFullYear();
  const prefix = `CDR-${year}-`;
  const latestReturn = await ConsignmentDeliveryReturn.findOne({
    returnNo: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1, returnNo: -1 })
    .lean();

  if (!latestReturn?.returnNo) {
    return `${prefix}0001`;
  }

  const lastSequence = Number(String(latestReturn.returnNo).replace(prefix, ""));
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

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

export const downloadConsignmentDeliveryPdf = asyncHandler(async (req, res) => {
  const delivery = await ConsignmentDelivery.findById(req.params.id)
    .populate("locationId", "name code phone email address")
    .populate("items.productId", "name sku price")
    .lean();

  if (!delivery) {
    throwHttpError(res, 404, "Consignment delivery not found");
  }

  if (delivery.status === "cancelled") {
    throwHttpError(res, 400, "已取消的寄售清單不可下載正式 PDF。");
  }

  const companyProfile = await CompanyProfile.findOne({
    profileKey: "default",
  }).lean();
  const currentCompany = buildCompanySnapshot(companyProfile);
  const snapshotCompany = delivery.companySnapshot || {};
  const company = {
    businessName: pickSnapshotValue(
      snapshotCompany.businessName,
      currentCompany.businessName || "SoapDelight.J"
    ),
    contactName: pickSnapshotValue(
      snapshotCompany.contactName,
      currentCompany.contactName
    ),
    phone: pickSnapshotValue(snapshotCompany.phone, currentCompany.phone),
    email: pickSnapshotValue(snapshotCompany.email, currentCompany.email),
    facebookPage: pickSnapshotValue(
      snapshotCompany.facebookPage,
      currentCompany.facebookPage
    ),
    address: pickSnapshotValue(snapshotCompany.address, currentCompany.address),
  };
  const location = delivery.locationId || {};
  const locationSnapshot = {
    name: delivery.locationNameAtIssue || location.name || "",
    phone: delivery.locationPhoneAtIssue || location.phone || "",
    email: delivery.locationEmailAtIssue || location.email || "",
    address: delivery.locationAddressAtIssue || location.address || "",
  };
  const isDraft = delivery.status === "draft";
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margin: 24,
    info: {
      Title: `寄售清單 ${delivery.deliveryNumber || ""}`,
      Author: company.businessName || "SoapDelight.J",
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${getDeliveryPdfFilename(delivery)}"`
  );

  doc.pipe(res);
  setPdfFont(doc);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 32;
  const contentWidth = pageWidth - margin * 2;
  const topY = 38;
  const rowGap = 20;
  const columnGap = 18;
  const leftColumnWidth = 160;
  const middleColumnWidth = 170;
  const rightColumnWidth =
    contentWidth - leftColumnWidth - middleColumnWidth - columnGap * 2;
  const leftX = margin;
  const middleX = leftX + leftColumnWidth + columnGap;
  const rightX = middleX + middleColumnWidth + columnGap;
  const tableTop = 174;
  const rowHeight = 28;
  const headerHeight = 30;
  const items = Array.isArray(delivery.items) ? delivery.items : [];
  const maxSkuWidth = items.reduce((largest, item) => {
    const sku =
      item?.productCodeAtIssue || item?.locationSkuAtIssue || item?.centralSkuAtIssue || "";
    return Math.max(largest, measurePdfTextWidth(doc, sku, 9.2));
  }, 110);
  const skuWidth = Math.min(Math.max(Math.ceil(maxSkuWidth) + 10, 64), 86);
  const priceWidth = 84;
  const discountWidth = 50;
  const quantityWidth = 48;
  const amountWidth = 96;
  const nameWidth =
    contentWidth - skuWidth - priceWidth - discountWidth - quantityWidth - amountWidth;
  const tableColumns = [
    { label: "商品編號", width: skuWidth, align: "left" },
    { label: "名稱", width: nameWidth, align: "left" },
    { label: "價格", width: priceWidth, align: "center" },
    { label: "折扣", width: discountWidth, align: "center" },
    { label: "數量", width: quantityWidth, align: "center" },
    { label: "金額", width: amountWidth, align: "center" },
  ];
  const tableWidth = tableColumns.reduce((sum, column) => sum + column.width, 0);
  const tableX = margin;
  const rowsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));

  const drawPageHeader = (pageNumber) => {
    doc.save().rect(0, 0, pageWidth, pageHeight).fill("#ffffff").restore();
    setPdfFont(doc);
    doc.fontSize(11).fillColor("#111111");
    drawTextLine(doc, "公司", company.businessName || "SoapDelight.J", leftX, topY, {
      width: leftColumnWidth,
    });
    drawTextLine(doc, "電話", company.phone, leftX, topY + rowGap, {
      width: leftColumnWidth,
    });
    drawTextLine(doc, "電郵", company.email, leftX, topY + rowGap * 2, {
      width: leftColumnWidth,
    });
    drawTextLine(doc, "專頁", company.facebookPage, leftX, topY + rowGap * 3, {
      width: leftColumnWidth,
      height: 44,
    });

    drawTextLine(doc, "寄售單", "Consignment", middleX, topY, {
      width: middleColumnWidth,
    });
    drawTextLine(doc, "寄售單號", delivery.deliveryNumber || "-", middleX, topY + rowGap, {
      width: middleColumnWidth,
    });
    drawTextLine(doc, "合共頁數", `${pageNumber}/${totalPages}`, middleX, topY + rowGap * 2, {
      width: middleColumnWidth,
    });
    drawTextLine(doc, "由售賣方", company.businessName || "SoapDelight.J", middleX, topY + rowGap * 3, {
      width: middleColumnWidth,
    });
    drawTextLine(doc, "致寄售點", locationSnapshot.name, middleX, topY + rowGap * 4, {
      width: middleColumnWidth,
    });

    drawTextLine(doc, "開單日期", formatDate(delivery.issueDate || delivery.createdAt), rightX, topY, {
      width: rightColumnWidth,
    });
    drawTextLine(doc, "寄售電話", locationSnapshot.phone, rightX, topY + rowGap, {
      width: rightColumnWidth,
    });
    drawTextLine(doc, "寄售電郵", locationSnapshot.email, rightX, topY + rowGap * 2, {
      width: rightColumnWidth,
    });
    drawTextLine(doc, "寄售地址", locationSnapshot.address, rightX, topY + rowGap * 3, {
      width: rightColumnWidth,
      height: 52,
    });

    if (isDraft) {
      doc
        .save()
        .fontSize(44)
        .fillColor("#d1d5db")
        .opacity(0.35)
        .rotate(-24, { origin: [pageWidth / 2, pageHeight / 2] })
        .text("DRAFT / 草稿", pageWidth / 2 - 145, pageHeight / 2 - 24, {
          width: 290,
          align: "center",
        })
        .restore();
    }
  };

  const drawTable = (pageItems) => {
    let x = tableX;
    tableColumns.forEach((column, columnIndex) => {
      drawCell(doc, column.label, x, tableTop, column.width, headerHeight, {
        align: "center",
        fill: "#f3f4f6",
        fontSize: 10,
      });
      x += column.width;
    });

    let y = tableTop + headerHeight;

    for (let index = 0; index < rowsPerPage; index += 1) {
      const item = pageItems[index];
      const rowValues = item
        ? [
            item.productCodeAtIssue || item.locationSkuAtIssue || item.centralSkuAtIssue || "",
            item.productNameAtIssue || "",
            formatMoney(item.unitPriceAtIssue),
            formatRate(item.commissionRateAtIssue),
            Number(item.quantity || 0),
            formatMoney(item.lineAmount),
          ]
        : ["", "", "", "", "", ""];

      x = tableX;
      tableColumns.forEach((column, columnIndex) => {
        const isSkuColumn = columnIndex === 0;
        const skuFontSize = isSkuColumn
          ? fitCellFontSize(
              doc,
              rowValues[columnIndex],
              column.width - 8,
              8.8,
              6.8
            )
          : 9.2;
        drawCell(
          doc,
          rowValues[columnIndex],
          x,
          y,
          column.width,
          rowHeight,
          isSkuColumn
            ? {
                align: column.align,
                fontSize: skuFontSize,
                ellipsis: false,
                paddingX: 4,
              }
            : {
                align: column.align,
                fontSize: skuFontSize,
              }
        );
        x += column.width;
      });
      y += rowHeight;
    }

    return y;
  };

  const drawPageNumberFooter = (pageNumber) => {
    doc
      .fontSize(9)
      .fillColor("#111111")
      .text(`${pageNumber}/${totalPages}`, tableX + tableWidth - 80, pageHeight - 26, {
        width: 80,
        align: "right",
      });
  };

  const drawFinalPageFooter = (y) => {
    const totalY = y + 12;
    const totalLabelX = tableX + tableWidth - 198;
    const totalValueX = tableX + tableWidth - 112;

    doc
      .fontSize(11)
      .fillColor("#111111")
      .text("總額：", totalLabelX, totalY, {
        width: 80,
        align: "left",
      })
      .text(formatMoney(delivery.totalAmount), totalValueX, totalY, {
        width: 112,
        align: "right",
      });

    if (delivery.note) {
      doc
        .fontSize(9)
        .fillColor("#111111")
        .text(`備註：${delivery.note}`, tableX, totalY + 28, {
          width: tableWidth - 230,
        });
    }

    const signatureLabelY = pageHeight - 118;
    const signatureLineY = pageHeight - 44;
    const signatureWidth = 220;
    const sellerX = tableX + 4;
    const consigneeX = tableX + tableWidth / 2 + 12;

    doc
      .fontSize(11)
      .fillColor("#111111")
      .text("售賣方簽署・蓋章", sellerX, signatureLabelY, {
        width: signatureWidth,
        align: "left",
      });

    doc
      .moveTo(sellerX, signatureLineY)
      .lineTo(sellerX + signatureWidth, signatureLineY)
      .lineWidth(1.1)
      .strokeColor("#111111")
      .stroke();

    doc
      .fontSize(11)
      .fillColor("#111111")
      .text("寄售點簽署・蓋章", consigneeX, signatureLabelY, {
        width: signatureWidth,
        align: "left",
      });

    doc
      .moveTo(consigneeX, signatureLineY)
      .lineTo(consigneeX + signatureWidth, signatureLineY)
      .lineWidth(1.1)
      .strokeColor("#111111")
      .stroke();
  };

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    if (pageIndex > 0) {
      doc.addPage();
      setPdfFont(doc);
    }

    const pageItems = items.slice(
      pageIndex * rowsPerPage,
      pageIndex * rowsPerPage + rowsPerPage
    );
    drawPageHeader(pageIndex + 1);
    const tableBottom = drawTable(pageItems);

    if (pageIndex === totalPages - 1) {
      drawFinalPageFooter(tableBottom);
    }

    drawPageNumberFooter(pageIndex + 1);
  }

  doc.end();
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

  const centralLocation = await InventoryLocation.findOne({ code: "CENTRAL" });

  if (!centralLocation) {
    throwHttpError(res, 404, "Central stock location not found");
  }

  if (String(centralLocation._id) === String(delivery.locationId)) {
    throwHttpError(res, 400, "Delivery location must be different from central stock");
  }

  const items = Array.isArray(delivery.items) ? delivery.items : [];

  if (items.length === 0) {
    throwHttpError(res, 400, "At least one delivery item is required");
  }

  const requiredByProduct = new Map();

  for (const item of items) {
    const quantity = Number(item.quantity || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throwHttpError(res, 400, "Delivery item quantity must be greater than zero");
    }

    const productKey = String(item.productId);
    const current = requiredByProduct.get(productKey) || {
      productId: item.productId,
      productName: item.productNameAtIssue || "商品",
      quantity: 0,
    };

    current.quantity += quantity;
    requiredByProduct.set(productKey, current);
  }

  const centralBalances = await InventoryBalance.find({
    locationId: centralLocation._id,
    productId: {
      $in: [...requiredByProduct.values()].map((item) => item.productId),
    },
  });

  const centralBalanceByProduct = new Map(
    centralBalances.map((balance) => [String(balance.productId), balance])
  );

  for (const requiredItem of requiredByProduct.values()) {
    const balance = centralBalanceByProduct.get(String(requiredItem.productId));
    const availableQuantity = Number(balance?.quantity || 0);

    if (availableQuantity < requiredItem.quantity) {
      throwHttpError(
        res,
        400,
        `中央庫存不足：${requiredItem.productName}，可用 ${availableQuantity}，需要 ${requiredItem.quantity}`
      );
    }
  }

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const fromBalance = await getOrCreateBalance(
      item.productId,
      centralLocation._id
    );
    const toBalance = await getOrCreateBalance(item.productId, delivery.locationId);

    fromBalance.quantity = Number(fromBalance.quantity || 0) - quantity;
    toBalance.quantity = Number(toBalance.quantity || 0) + quantity;

    await Promise.all([fromBalance.save(), toBalance.save()]);

    await StockMovement.create({
      productId: item.productId,
      fromLocationId: centralLocation._id,
      toLocationId: delivery.locationId,
      quantity,
      type: "consignment_out",
      direction: "transfer",
      sourceDocument: delivery.deliveryNumber,
      sourceDate: delivery.issueDate,
      note: `寄售清單發出：${delivery.deliveryNumber}`,
      createdBy: req.user?._id,
    });
  }

  delivery.status = "issued";
  delivery.issuedBy = req.user?._id;
  delivery.issuedAt = new Date();

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

  if (delivery.status === "issued") {
    throwHttpError(
      res,
      400,
      "已發出的寄售清單不可直接取消，日後需用退貨流程處理。"
    );
  }

  delivery.status = "cancelled";
  delivery.cancelledBy = req.user?._id;
  delivery.cancelledAt = new Date();

  const updatedDelivery = await delivery.save();

  res.status(200).json(updatedDelivery);
});

export const createConsignmentDeliveryReturn = asyncHandler(async (req, res) => {
  const delivery = await ConsignmentDelivery.findById(req.params.id);

  if (!delivery) {
    throwHttpError(res, 404, "Consignment delivery not found");
  }

  if (delivery.status !== "issued") {
    throwHttpError(res, 400, "Only issued deliveries can be returned");
  }

  const reason = normalizeText(req.body?.reason);
  const note = normalizeText(req.body?.note);

  if (!reason) {
    throwHttpError(res, 400, "Return reason is required");
  }

  const requestedItems = Array.isArray(req.body?.items) ? req.body.items : [];

  if (requestedItems.length === 0) {
    throwHttpError(res, 400, "At least one return item is required");
  }

  const centralLocation = await InventoryLocation.findOne({ code: "CENTRAL" });

  if (!centralLocation) {
    throwHttpError(res, 404, "Central stock location not found");
  }

  const deliveryItemsById = new Map(
    delivery.items.map((item) => [String(item._id), item])
  );
  const requestedByItemId = new Map();

  for (const requestedItem of requestedItems) {
    const itemId = normalizeText(requestedItem?.itemId);
    const returnQuantity = toPositiveNumber(requestedItem?.quantity);

    if (!itemId || !deliveryItemsById.has(itemId)) {
      throwHttpError(res, 400, "Return item is invalid");
    }

    if (!returnQuantity) {
      throwHttpError(res, 400, "Return quantity must be greater than zero");
    }

    const currentQuantity = requestedByItemId.get(itemId) || 0;
    requestedByItemId.set(itemId, currentQuantity + returnQuantity);
  }

  const returnItems = [];
  const requiredByProduct = new Map();

  for (const [itemId, returnQuantity] of requestedByItemId.entries()) {
    const deliveryItem = deliveryItemsById.get(itemId);
    const originalQuantity = Number(deliveryItem.quantity || 0);
    const previouslyReturnedQuantity = Number(deliveryItem.returnedQuantity || 0);
    const availableToReturn = originalQuantity - previouslyReturnedQuantity;

    if (returnQuantity > availableToReturn) {
      throwHttpError(
        res,
        400,
        `退貨數量超過可退數量：${deliveryItem.productNameAtIssue}，可退 ${availableToReturn}，今次退 ${returnQuantity}`
      );
    }

    const productKey = String(deliveryItem.productId);
    const currentRequired = requiredByProduct.get(productKey) || {
      productId: deliveryItem.productId,
      productName: deliveryItem.productNameAtIssue || "商品",
      quantity: 0,
    };

    currentRequired.quantity += returnQuantity;
    requiredByProduct.set(productKey, currentRequired);

    returnItems.push({
      deliveryItemId: deliveryItem._id,
      productId: deliveryItem.productId,
      productCodeAtReturn:
        deliveryItem.productCodeAtIssue ||
        deliveryItem.locationSkuAtIssue ||
        deliveryItem.centralSkuAtIssue ||
        "",
      productNameAtReturn: deliveryItem.productNameAtIssue,
      originalQuantity,
      previouslyReturnedQuantity,
      returnQuantity,
      remainingQuantityAfterReturn: availableToReturn - returnQuantity,
    });
  }

  const consignmentBalances = await InventoryBalance.find({
    locationId: delivery.locationId,
    productId: {
      $in: [...requiredByProduct.values()].map((item) => item.productId),
    },
  });
  const consignmentBalanceByProduct = new Map(
    consignmentBalances.map((balance) => [String(balance.productId), balance])
  );

  for (const requiredItem of requiredByProduct.values()) {
    const balance = consignmentBalanceByProduct.get(String(requiredItem.productId));
    const availableQuantity = Number(balance?.quantity || 0);

    if (availableQuantity < requiredItem.quantity) {
      throwHttpError(
        res,
        400,
        `寄賣點庫存不足：${requiredItem.productName}，可用 ${availableQuantity}，需要退 ${requiredItem.quantity}`
      );
    }
  }

  const returnNo = await getNextReturnNo();
  const totalQuantity = returnItems.reduce(
    (sum, item) => sum + Number(item.returnQuantity || 0),
    0
  );

  const returnRecord = await ConsignmentDeliveryReturn.create({
    returnNo,
    originalDeliveryId: delivery._id,
    deliveryNumberAtReturn: delivery.deliveryNumber,
    locationId: delivery.locationId,
    locationNameAtReturn: delivery.locationNameAtIssue,
    reason,
    note,
    items: returnItems,
    totalQuantity,
    createdBy: req.user?._id,
  });

  for (const returnItem of returnItems) {
    const quantity = Number(returnItem.returnQuantity || 0);
    const fromBalance = await getOrCreateBalance(
      returnItem.productId,
      delivery.locationId
    );
    const toBalance = await getOrCreateBalance(
      returnItem.productId,
      centralLocation._id
    );

    fromBalance.quantity = Number(fromBalance.quantity || 0) - quantity;
    toBalance.quantity = Number(toBalance.quantity || 0) + quantity;

    await Promise.all([fromBalance.save(), toBalance.save()]);

    await StockMovement.create({
      productId: returnItem.productId,
      fromLocationId: delivery.locationId,
      toLocationId: centralLocation._id,
      quantity,
      type: "consignment_return",
      direction: "transfer",
      sourceDocument: returnNo,
      sourceDate: new Date(),
      note: `${reason}${note ? `：${note}` : ""}`,
      createdBy: req.user?._id,
      referenceType: "ConsignmentDeliveryReturn",
      referenceId: returnRecord._id,
    });

    const deliveryItem = deliveryItemsById.get(String(returnItem.deliveryItemId));
    deliveryItem.returnedQuantity =
      Number(deliveryItem.returnedQuantity || 0) + quantity;
  }

  const updatedDelivery = await delivery.save();

  res.status(201).json({
    message: "Consignment delivery return created",
    returnRecord,
    delivery: updatedDelivery,
  });
});
