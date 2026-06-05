const formatMoney = (value, currency = "hkd") => {
  const amount = Number(value || 0);
  const label = String(currency || "hkd").toUpperCase();
  return `${label} $${amount.toFixed(2)}`;
};

const refundPolicyDescription = (policyType) => {
  if (policyType === "company_absorbs_fee") {
    return "已按安排退回全額付款。";
  }

  if (policyType === "custom") {
    return "已按雙方確認的金額完成退款。";
  }

  return "已按安排完成退款，退款金額已扣除相關支付平台手續費。";
};

export const refundCompletionEmail = ({
  customerName,
  orderId,
  refundAmount,
  refundCurrency,
  refundPolicyType,
  refundFlow,
  stockRestoreStatus,
} = {}) => ({
  body: {
    name: customerName || "客人",
    intro:
      refundFlow === "shipped_return"
        ? "您的 SoapDelight.J 退貨個案及 Stripe 退款已完成。"
        : "您的 SoapDelight.J 訂單取消及 Stripe 退款已完成。",
    dictionary: {
      訂單編號: String(orderId || "N/A"),
      退款金額: formatMoney(refundAmount, refundCurrency),
      退款詳情: refundPolicyDescription(refundPolicyType),
      ...(refundFlow === "shipped_return"
        ? {
            退貨商品處理:
              stockRestoreStatus === "restored"
                ? "已收到退回商品，並完成處理。"
                : "退貨個案已完成處理。",
          }
        : {}),
    },
    outro:
      "退款已透過 Stripe 處理。實際到帳時間可能因您的付款銀行或支付平台而有所不同。",
  },
});
