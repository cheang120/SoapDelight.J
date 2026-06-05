const fallback = (value, emptyLabel = "-") => {
  if (value === undefined || value === null || value === "") return emptyLabel;
  return String(value);
};

const orderStatusLabels = {
  "Order Placed...": "已下單",
  "Processing...": "處理中",
  "Shipped...": "已寄出",
  Delivered: "已送達",
  "Cancellation / Refund Processing": "取消 / 退款處理中",
  "Cancelled / Refunded": "已取消並退款",
  "Refund Failed / Manual Follow-up Required": "退款失敗 / 需人工跟進",
  "Return Requested / Awaiting Return": "已建立退貨個案 / 等待退貨",
  "Return Approved / No Return Required": "已建立退貨個案 / 毋須退貨",
  "Return Received / Refund Processing": "已收到退貨 / 退款處理中",
  "Return Refund Processing": "退貨退款處理中",
  "Returned / Refunded": "已退貨並退款",
  "Return Closed / No Refund": "退貨結案，不設退款",
};

const paymentStatusLabels = {
  unknown: "未確認",
  pending: "待付款",
  paid: "已付款",
  refunded: "已退款",
  refund_processing: "退款處理中",
  refund_failed: "退款失敗",
  failed: "失敗",
  processing: "處理中",
  succeeded: "已成功",
};

const paymentMethodLabels = {
  stripe: "Stripe",
  Stripe: "Stripe",
  cash: "現金",
  wallet: "錢包",
};

const refundStatusLabels = {
  none: "沒有退款",
  processing: "處理中",
  succeeded: "已成功",
  failed: "失敗",
  no_refund: "不設退款",
  refunded: "已退款",
  refund_processing: "退款處理中",
  refund_failed: "退款失敗",
};

const cancellationStatusLabels = {
  none: "沒有取消",
  refund_processing: "退款處理中",
  cancelled_refunded: "已取消並退款",
  refund_failed: "退款失敗",
};

const returnStatusLabels = {
  none: "沒有退貨",
  awaiting_return: "等待退貨",
  no_return_required: "毋須退貨",
  refund_processing: "退款處理中",
  return_refund_failed: "退貨退款失敗",
  returned_refunded: "已退貨並退款",
  closed_no_refund: "退貨結案，不設退款",
};

const stockRestoreStatusLabels = {
  pending: "等待庫存處理",
  restored: "已補回 ONLINE",
  not_restocked: "未補回庫存",
  not_applicable: "不適用",
  failed: "失敗",
};

const inspectionStatusLabels = {
  restockable: "可重新上架",
  not_restockable: "不可重新上架",
  not_applicable: "不適用",
};

const stockMovementTypeLabels = {
  initial_stock: "初始存貨",
  production_in: "入貨",
  transfer: "調貨",
  adjustment: "盤點調整",
  sale: "銷售扣貨",
  refund_restore: "退款補貨",
  return_restore: "退貨補貨",
  consignment_delivery: "寄賣出貨",
  consignment_return: "寄賣退回",
};

export const getOrderStatusLabel = (value) =>
  orderStatusLabels[value] || fallback(value, "處理中");

export const getPaymentStatusLabel = (value) =>
  paymentStatusLabels[value] || paymentMethodLabels[value] || fallback(value);

export const getPaymentMethodLabel = (value) =>
  paymentMethodLabels[value] || fallback(value);

export const getRefundStatusLabel = (value) =>
  refundStatusLabels[value] || fallback(value);

export const getCancellationStatusLabel = (value) =>
  cancellationStatusLabels[value] || fallback(value);

export const getReturnStatusLabel = (value) =>
  returnStatusLabels[value] || fallback(value);

export const getStockRestoreStatusLabel = (value) =>
  stockRestoreStatusLabels[value] || fallback(value);

export const getInspectionStatusLabel = (value) =>
  inspectionStatusLabels[value] || fallback(value);

export const getStockMovementTypeLabel = (value) =>
  stockMovementTypeLabels[value] || fallback(value);

export const getOrderBadgeTone = (status = "") => {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("deliver") ||
    normalized.includes("refunded") ||
    normalized.includes("returned")
  ) {
    return "success";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("failed") ||
    normalized.includes("no refund")
  ) {
    return "danger";
  }

  return "warning";
};
