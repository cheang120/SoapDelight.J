import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import CompanyProfile from "../models/companyProfileModel.js";
import Product from "../models/productModel.js";
import InventoryLocation from "../models/inventoryLocationModel.js";
import ProductLocationMapping from "../models/productLocationMappingModel.js";
import InventoryBalance from "../models/inventoryBalanceModel.js";
import StockMovement from "../models/stockMovementModel.js";
import ConsignmentReport from "../models/consignmentReportModel.js";

const normalizeCode = (code) => String(code || "").trim().toUpperCase();
const normalizeText = (value) => String(value || "").trim();
const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
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

const throwHttpError = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

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

const drawInvoiceTextLine = (doc, label, value, x, y, options = {}) => {
  const text = `${label}： ${value || ""}`;
  doc
    .fontSize(options.fontSize || 10.5)
    .fillColor("#111111")
    .text(text, x, y, {
      width: options.width || 220,
      lineGap: 1,
      ellipsis: options.ellipsis ?? false,
    });
};

const drawInvoiceCell = (doc, text, x, y, width, height, options = {}) => {
  doc
    .rect(x, y, width, height)
    .lineWidth(options.lineWidth || 0.6)
    .strokeColor("#111111")
    .stroke();

  doc
    .fontSize(options.fontSize || 10)
    .fillColor("#111111")
    .text(String(text ?? ""), x + 5, y + 7, {
      width: width - 10,
      height: height - 10,
      align: options.align || "left",
      ellipsis: options.ellipsis ?? true,
    });
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getPdfTextWidth = (doc, text, fontSize) => {
  doc.fontSize(fontSize);
  return doc.widthOfString(String(text ?? ""));
};

const getPdfTextHeight = (doc, text, width, fontSize, options = {}) => {
  doc.fontSize(fontSize);
  return doc.heightOfString(String(text ?? ""), {
    width,
    align: options.align || "left",
    lineGap: options.lineGap ?? 1,
  });
};

const fitPdfTextSize = (doc, text, width, maxSize, minSize) => {
  let currentSize = maxSize;

  while (currentSize > minSize) {
    if (getPdfTextWidth(doc, text, currentSize) <= width) {
      return currentSize;
    }
    currentSize -= 0.2;
  }

  return minSize;
};

const drawInvoicePairLine = (doc, label, value, x, y, options = {}) => {
  const labelWidth = options.labelWidth || 126;
  const valueX = x + labelWidth + (options.gap || 8);
  const width = options.width || 300;
  const fontSize = options.fontSize || 10.5;

  doc
    .fontSize(fontSize)
    .fillColor("#111111")
    .text(`${label}：`, x, y, {
      width: labelWidth,
      ellipsis: false,
    });

  doc
    .fontSize(fontSize)
    .fillColor("#111111")
    .text(String(value || ""), valueX, y, {
      width: Math.max(0, width - labelWidth - (options.gap || 8)),
      ellipsis: false,
      lineGap: options.lineGap ?? 1,
    });
};

const drawDoubleUnderline = (doc, x, y, width, gap = 4) => {
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(0.85)
    .strokeColor("#111111")
    .stroke();

  doc
    .moveTo(x, y + gap)
    .lineTo(x + width, y + gap)
    .lineWidth(0.85)
    .strokeColor("#111111")
    .stroke();
};

const getInvoicePdfFilename = (report) =>
  `invoice-${report.reportNumber || report._id}.pdf`;

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

export const downloadConsignmentReportInvoicePdf = asyncHandler(async (req, res) => {
  const report = await ConsignmentReport.findById(req.params.id)
    .populate("locationId", "name code phone email address")
    .lean();

  if (!report) {
    throwHttpError(res, 404, "Consignment report not found");
  }

  if (report.status !== "confirmed" && report.status !== "invoiced") {
    throwHttpError(res, 400, "Only confirmed reports can generate Invoice PDF");
  }

  const [companyProfile, location] = await Promise.all([
    CompanyProfile.findOne({ profileKey: "default" }).lean(),
    InventoryLocation.findById(report.locationId?._id || report.locationId).lean(),
  ]);

  const company = {
    businessName: normalizeText(companyProfile?.businessName) || "SoapDelight.J",
    contactName:
      normalizeText(companyProfile?.contactName) ||
      normalizeText(companyProfile?.businessName) ||
      "SoapDelight.J",
    phone: normalizeText(companyProfile?.phone),
    email: normalizeText(companyProfile?.email),
    bankName: normalizeText(companyProfile?.bankName),
    bankAccountName: normalizeText(companyProfile?.bankAccountName),
    bankAccountNumber: normalizeText(companyProfile?.bankAccountNumber),
    chequePayableTo: normalizeText(companyProfile?.chequePayableTo),
  };

  const issueToName =
    normalizeText(report.locationNameAtReport) ||
    normalizeText(location?.name) ||
    "Consignment location";

  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margin: 40,
    info: {
      Title: `Invoice ${report.reportNumber || ""}`,
      Author: company.businessName || "SoapDelight.J",
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${getInvoicePdfFilename(report)}"`
  );

  doc.pipe(res);
  setPdfFont(doc);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const leftX = margin;
  const rightX = pageWidth - margin - 148;
  const topY = 46;
  const rowGap = 18;

  doc.save().rect(0, 0, pageWidth, pageHeight).fill("#ffffff").restore();
  setPdfFont(doc);

  doc.fontSize(18).fillColor("#111111").text(company.businessName, leftX, topY, {
    width: 220,
  });
  doc.fontSize(10.5).text("聯繫資料", leftX, topY + 24, { width: 160 });
  drawInvoiceTextLine(doc, "名字", company.contactName, leftX, topY + 48, {
    width: 240,
  });
  drawInvoiceTextLine(doc, "電話", company.phone, leftX, topY + 48 + rowGap, {
    width: 240,
  });
  drawInvoiceTextLine(doc, "電郵", company.email, leftX, topY + 48 + rowGap * 2, {
    width: 260,
  });

  doc.fontSize(18).fillColor("#111111").text("Invoice", rightX, topY, {
    width: 148,
    align: "left",
  });
  drawInvoiceTextLine(doc, "No.", report.reportNumber || "-", rightX, topY + 30, {
    width: 148,
  });
  drawInvoiceTextLine(
    doc,
    "日期",
    formatDate(report.confirmedAt || report.periodEnd || report.createdAt),
    rightX,
    topY + 30 + rowGap,
    {
      width: 148,
    }
  );

  doc.fontSize(11).fillColor("#111111").text("Issue to:", leftX, topY + 126, {
    width: 80,
  });
  doc.fontSize(11).text(issueToName, leftX + 58, topY + 126, {
    width: contentWidth - 58,
  });

  const items = Array.isArray(report.items) ? report.items : [];
  const tableTop = topY + 146;
  const columnGap = 10;
  const tableWidth = contentWidth - 2;
  const tableX = margin + 1;
  const fixedColumns = {
    quantity: 40,
    price: 74,
    discount: 48,
    total: 86,
  };
  const maxCodeWidth = items.reduce((largest, item) => {
    const code =
      item?.locationSkuAtSale || item?.centralSkuAtSale || item?.productCodeAtSale || "-";
    return Math.max(largest, getPdfTextWidth(doc, code, 8.8));
  }, 76);
  const codeWidth = clamp(Math.ceil(maxCodeWidth) + 12, 86, 118);
  const minNameWidth = 150;
  const remainingWidth =
    tableWidth -
    fixedColumns.quantity -
    fixedColumns.price -
    fixedColumns.discount -
    fixedColumns.total -
    columnGap * 5;
  const safeCodeWidth = clamp(codeWidth, 82, Math.max(82, remainingWidth - minNameWidth));
  const nameWidth = remainingWidth - safeCodeWidth;
  const columns = [
    { key: "code", label: "Code", width: safeCodeWidth, align: "left" },
    { key: "name", label: "貨品名稱", width: nameWidth, align: "left" },
    { key: "quantity", label: "數量", width: fixedColumns.quantity, align: "center" },
    { key: "price", label: "價格", width: fixedColumns.price, align: "right" },
    { key: "discount", label: "折扣", width: fixedColumns.discount, align: "center" },
    { key: "total", label: "Total", width: fixedColumns.total, align: "right" },
  ];
  const tableHeaderTopY = tableTop;
  const tableHeaderTextY = tableHeaderTopY + 8;
  const tableHeaderBottomY = tableHeaderTopY + 28;
  const rowPaddingY = 5;
  const rowPaddingX = 2;
  const rowFontSizes = {
    code: 8.8,
    name: 10.2,
    quantity: 10.2,
    price: 10.2,
    discount: 10.2,
    total: 10.2,
  };
  const footerReserve = 158;

  const measureInvoiceRow = (item) => {
    const code =
      item?.locationSkuAtSale || item?.centralSkuAtSale || item?.productCodeAtSale || "-";
    const name = item?.locationProductNameAtSale || item?.productNameAtSale || "-";
    const codeFontSize = fitPdfTextSize(
      doc,
      code,
      safeCodeWidth - rowPaddingX * 2,
      rowFontSizes.code,
      7.2
    );
    const codeHeight = getPdfTextHeight(
      doc,
      code,
      safeCodeWidth - rowPaddingX * 2,
      codeFontSize,
      { lineGap: 1 }
    );
    const nameHeight = getPdfTextHeight(
      doc,
      name,
      nameWidth - rowPaddingX * 2,
      rowFontSizes.name,
      { lineGap: 1.2 }
    );
    const quantityHeight = getPdfTextHeight(
      doc,
      String(Number(item?.quantitySold || 0)),
      fixedColumns.quantity,
      rowFontSizes.quantity
    );
    const priceHeight = getPdfTextHeight(
      doc,
      formatMoney(item?.publicUnitPriceAtSale || 0),
      fixedColumns.price,
      rowFontSizes.price
    );
    const discountText = `${100 - Number(item?.commissionRateAtSale || 0)}%`;
    const discountHeight = getPdfTextHeight(
      doc,
      discountText,
      fixedColumns.discount,
      rowFontSizes.discount
    );
    const totalHeight = getPdfTextHeight(
      doc,
      formatMoney(item?.netPayableAmount || 0),
      fixedColumns.total,
      rowFontSizes.total
    );

    return {
      item,
      code,
      name,
      discountText,
      codeFontSize,
      rowHeight:
        Math.max(
          codeHeight,
          nameHeight,
          quantityHeight,
          priceHeight,
          discountHeight,
          totalHeight,
          12
        ) +
        rowPaddingY * 2,
    };
  };

  const measuredRows = items.map(measureInvoiceRow);
  const pages = [];
  let currentPageRows = [];
  let currentHeight = 0;
  const availableTableHeight =
    pageHeight - (tableHeaderBottomY + 12) - footerReserve;

  measuredRows.forEach((row) => {
    if (
      currentPageRows.length > 0 &&
      currentHeight + row.rowHeight > availableTableHeight
    ) {
      pages.push(currentPageRows);
      currentPageRows = [];
      currentHeight = 0;
    }

    currentPageRows.push(row);
    currentHeight += row.rowHeight;
  });

  if (currentPageRows.length > 0 || pages.length === 0) {
    pages.push(currentPageRows);
  }

  const totalPages = pages.length;

  const getColumnX = (columnIndex) =>
    columns
      .slice(0, columnIndex)
      .reduce((sum, column) => sum + column.width + columnGap, tableX);

  const drawInvoiceHeader = (pageNumber) => {
    doc.save().rect(0, 0, pageWidth, pageHeight).fill("#ffffff").restore();
    setPdfFont(doc);

    doc.fontSize(18).fillColor("#111111").text(company.businessName, leftX, topY, {
      width: 220,
    });
    doc.fontSize(10.5).text("聯繫資料", leftX, topY + 24, { width: 160 });
    drawInvoiceTextLine(doc, "名字", company.contactName, leftX, topY + 48, {
      width: 240,
    });
    drawInvoiceTextLine(doc, "電話", company.phone, leftX, topY + 48 + rowGap, {
      width: 240,
    });
    drawInvoiceTextLine(doc, "電郵", company.email, leftX, topY + 48 + rowGap * 2, {
      width: 260,
    });

    doc.fontSize(18).fillColor("#111111").text("Invoice", rightX, topY, {
      width: 148,
      align: "left",
    });
    drawInvoiceTextLine(doc, "No.", report.reportNumber || "-", rightX, topY + 30, {
      width: 148,
    });
    drawInvoiceTextLine(
      doc,
      "日期",
      formatDate(report.confirmedAt || report.periodEnd || report.createdAt),
      rightX,
      topY + 30 + rowGap,
      {
        width: 148,
      }
    );
    doc.fontSize(11).fillColor("#111111").text("Issue to:", leftX, topY + 126, {
      width: 80,
    });
    doc.fontSize(11).text(issueToName, leftX + 58, topY + 126, {
      width: contentWidth - 58,
    });
  };

  const drawInvoiceTableHeader = () => {
    doc
      .moveTo(tableX, tableHeaderTopY)
      .lineTo(tableX + tableWidth, tableHeaderTopY)
      .lineWidth(0.85)
      .strokeColor("#111111")
      .stroke();

    columns.forEach((column, index) => {
      const x = getColumnX(index);
      doc
        .fontSize(10.5)
        .fillColor("#111111")
        .text(column.label, x, tableHeaderTextY, {
          width: column.width,
          align: index >= 2 ? "center" : "left",
          ellipsis: false,
        });
    });

    doc
      .moveTo(tableX, tableHeaderBottomY)
      .lineTo(tableX + tableWidth, tableHeaderBottomY)
      .lineWidth(0.85)
      .strokeColor("#111111")
      .stroke();
  };

  const drawInvoiceRow = (row, y) => {
    const codeX = getColumnX(0);
    const nameX = getColumnX(1);
    const quantityX = getColumnX(2);
    const priceX = getColumnX(3);
    const discountX = getColumnX(4);
    const totalX = getColumnX(5);
    const textY = y + rowPaddingY;

    doc
      .fontSize(row.codeFontSize)
      .fillColor("#111111")
      .text(row.code, codeX, textY, {
        width: safeCodeWidth - rowPaddingX * 2,
        align: "left",
        lineGap: 1,
        ellipsis: false,
      });

    doc
      .fontSize(rowFontSizes.name)
      .fillColor("#111111")
      .text(row.name, nameX, textY, {
        width: nameWidth - rowPaddingX * 2,
        align: "left",
        lineGap: 1.2,
        ellipsis: false,
      });

    doc
      .fontSize(rowFontSizes.quantity)
      .fillColor("#111111")
      .text(String(Number(row.item?.quantitySold || 0)), quantityX, textY, {
        width: fixedColumns.quantity,
        align: "center",
        ellipsis: false,
      });

    doc
      .fontSize(rowFontSizes.price)
      .fillColor("#111111")
      .text(formatMoney(row.item?.publicUnitPriceAtSale || 0), priceX, textY, {
        width: fixedColumns.price,
        align: "right",
        ellipsis: false,
      });

    doc
      .fontSize(rowFontSizes.discount)
      .fillColor("#111111")
      .text(row.discountText, discountX, textY, {
        width: fixedColumns.discount,
        align: "center",
        ellipsis: false,
      });

    doc
      .fontSize(rowFontSizes.total)
      .fillColor("#111111")
      .text(formatMoney(row.item?.netPayableAmount || 0), totalX, textY, {
        width: fixedColumns.total,
        align: "right",
        ellipsis: false,
      });
  };

  const drawInvoiceFooter = (y) => {
    const totalLineTopY = y + 4;
    const totalValueX = getColumnX(5);
    const totalBlockWidth = fixedColumns.total;
    const totalLabelX = totalValueX - 132;

    doc
      .fontSize(10.5)
      .fillColor("#111111")
      .text(String(report.totalQuantity || ""), getColumnX(2), totalLineTopY + 2, {
        width: fixedColumns.quantity,
        align: "center",
        ellipsis: false,
      })
      .text(formatMoney(report.netPayableTotal || 0), totalValueX, totalLineTopY + 2, {
        width: totalBlockWidth,
        align: "right",
        ellipsis: false,
      });

    drawDoubleUnderline(doc, totalValueX, totalLineTopY + 18, totalBlockWidth, 4);

    const dueY = totalLineTopY + 42;
    doc
      .fontSize(10.5)
      .fillColor("#111111")
      .text("TotalAmount Due：", totalLabelX, dueY, {
        width: 124,
        align: "left",
        ellipsis: false,
      })
      .text(formatMoney(report.netPayableTotal || 0), totalValueX, dueY, {
        width: totalBlockWidth,
        align: "right",
        ellipsis: false,
      });

    drawDoubleUnderline(doc, totalValueX, dueY + 18, totalBlockWidth, 4);

    const paymentSectionY = dueY + 40;
    doc
      .moveTo(leftX, paymentSectionY - 10)
      .lineTo(tableX + tableWidth, paymentSectionY - 10)
      .lineWidth(0.85)
      .strokeColor("#111111")
      .stroke();

    doc.fontSize(11).fillColor("#111111").text("支付方式", leftX, paymentSectionY, {
      width: 120,
      ellipsis: false,
    });
    drawInvoicePairLine(
      doc,
      "銀行帳戶名稱（銀行名稱）",
      company.bankName,
      leftX,
      paymentSectionY + 18,
      {
        width: 320,
        labelWidth: 158,
        gap: 4,
        fontSize: 9.9,
      }
    );
    drawInvoicePairLine(
      doc,
      "銀行帳戶號碼（銀行號碼）",
      company.bankAccountNumber,
      leftX,
      paymentSectionY + 32,
      {
        width: 320,
        labelWidth: 158,
        gap: 4,
        fontSize: 9.9,
      }
    );
    drawInvoicePairLine(
      doc,
      "銀行帳戶名稱（戶口名稱）",
      company.bankAccountName,
      leftX,
      paymentSectionY + 46,
      {
        width: 320,
        labelWidth: 158,
        gap: 4,
        fontSize: 9.9,
      }
    );
    drawInvoicePairLine(
      doc,
      "支票抬頭",
      company.chequePayableTo,
      leftX,
      paymentSectionY + 60,
      {
        width: 320,
        labelWidth: 158,
        gap: 4,
        fontSize: 9.9,
      }
    );

    const signDate = formatDate(
      report.confirmedAt || report.periodEnd || report.createdAt
    );
    const signTopY = paymentSectionY + 82;
    const signLabelY = signTopY + 18;
    const signLineY = signLabelY + 22;
    const signDateY = signLineY + 8;
    const signX = pageWidth - margin - 174;
    const signWidth = 172;

    doc.fontSize(11).fillColor("#111111").text("Sign / Chop", signX, signLabelY, {
      width: signWidth,
      align: "center",
      ellipsis: false,
    });
    doc
      .moveTo(signX, signLineY)
      .lineTo(signX + signWidth, signLineY)
      .lineWidth(0.8)
      .strokeColor("#111111")
      .stroke();

    doc.fontSize(10).fillColor("#111111").text(signDate, signX, signDateY, {
      width: signWidth,
      align: "center",
      ellipsis: false,
    });
  };

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    if (pageIndex > 0) {
      doc.addPage();
      setPdfFont(doc);
    }

    drawInvoiceHeader(pageIndex + 1);
    drawInvoiceTableHeader();
    const pageRows = pages[pageIndex] || [];
    let currentY = tableHeaderBottomY + 10;

    pageRows.forEach((row) => {
      drawInvoiceRow(row, currentY);
      currentY += row.rowHeight;
    });

    if (pageIndex === totalPages - 1) {
      drawInvoiceFooter(currentY);
    }
  }

  doc.end();
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
