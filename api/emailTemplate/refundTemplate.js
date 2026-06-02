const formatMoney = (value, currency = "hkd") => {
  const amount = Number(value || 0);
  const label = String(currency || "hkd").toUpperCase();
  return `${label} $${amount.toFixed(2)}`;
};

const refundPolicyDescription = (policyType) => {
  if (policyType === "company_absorbs_fee") {
    return "SoapDelight.J has returned the full payment amount.";
  }

  if (policyType === "custom") {
    return "The agreed refund amount has been processed.";
  }

  return "The agreed refund amount, after the payment platform fee deduction, has been processed.";
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
    name: customerName || "Customer",
    intro:
      refundFlow === "shipped_return"
        ? "Your SoapDelight.J returned order and Stripe refund have been completed."
        : "Your SoapDelight.J order cancellation and Stripe refund have been completed.",
    dictionary: {
      "Order ID": String(orderId || "N/A"),
      "Refund amount": formatMoney(refundAmount, refundCurrency),
      "Refund details": refundPolicyDescription(refundPolicyType),
      ...(refundFlow === "shipped_return"
        ? {
            "Returned goods":
              stockRestoreStatus === "restored"
                ? "The returned goods were received and processed."
                : "The returned goods case has been processed.",
          }
        : {}),
    },
    outro:
      "The refund has been processed through Stripe. Please allow your payment provider time to reflect the refund in your account.",
  },
});
