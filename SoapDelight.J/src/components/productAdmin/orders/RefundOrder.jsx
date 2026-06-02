/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  cancelRefund,
  CLEAR_REFUND_PREVIEW,
  getOrder,
  getRefundPreview,
} from "../../../redux/features/order/OrderSlice";
import styles from "./RefundOrder.module.scss";

const REFUND_POLL_INTERVAL_MS = 2500;
const REFUND_POLL_TIMEOUT_MS = 60000;
const REFUND_WAITING_MESSAGE =
  "退款已提交，正在等待 Stripe 確認及庫存回補...";
const REFUND_TIMEOUT_MESSAGE =
  "退款已提交，仍在等待 Stripe webhook 確認。請稍後重新整理。";

const formatMoney = (value, currency = "HKD") => {
  if (value === null || value === undefined || value === "") return "未能取得";
  return `${String(currency || "HKD").toUpperCase()} $${Number(value).toFixed(2)}`;
};

const feeSourceLabel = (source) => {
  if (source === "stripe_balance_transaction") return "Stripe 實際手續費";
  if (source === "manual") return "管理員手動輸入";
  return "暫未能從 Stripe 取得";
};

const refundStatusLabel = (order, pollTimedOut = false) => {
  if (order?.cancellationStatus === "cancelled_refunded") {
    return "退款已完成，網店庫存已補回。";
  }
  if (order?.cancellationStatus === "refund_failed") {
    return "退款處理失敗，請人工跟進。";
  }
  if (order?.cancellationStatus === "refund_processing") {
    return pollTimedOut ? REFUND_TIMEOUT_MESSAGE : REFUND_WAITING_MESSAGE;
  }
  return "";
};

const RefundOrder = ({ order }) => {
  const dispatch = useDispatch();
  const { isRefundLoading, refundMessage, refundPreview } = useSelector(
    (state) => state.order
  );
  const [isOpen, setIsOpen] = useState(false);
  const [policyType, setPolicyType] = useState("customer_pays_fee");
  const [refundReason, setRefundReason] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [manualStripeFeeAmount, setManualStripeFeeAmount] = useState("");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [confirmNotShipped, setConfirmNotShipped] = useState(false);
  const [confirmCustomerCommunication, setConfirmCustomerCommunication] =
    useState(false);
  const [confirmCustomerAgreedToFee, setConfirmCustomerAgreedToFee] =
    useState(false);
  const [confirmCustomRefundAgreement, setConfirmCustomRefundAgreement] =
    useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const clearPollingTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    clearPollingTimers();
    setIsPolling(false);
  }, [clearPollingTimers]);

  const startPolling = useCallback(
    (orderId) => {
      if (!orderId || pollIntervalRef.current) return;

      setPollTimedOut(false);
      setIsPolling(true);

      const refreshOrder = () => {
        dispatch(getOrder(orderId));
      };

      refreshOrder();
      pollIntervalRef.current = setInterval(
        refreshOrder,
        REFUND_POLL_INTERVAL_MS
      );
      pollTimeoutRef.current = setTimeout(() => {
        clearPollingTimers();
        setIsPolling(false);
        setPollTimedOut(true);
      }, REFUND_POLL_TIMEOUT_MS);
    },
    [clearPollingTimers, dispatch]
  );

  useEffect(() => {
    return () => {
      clearPollingTimers();
      dispatch(CLEAR_REFUND_PREVIEW());
    };
  }, [clearPollingTimers, dispatch]);

  const isRefundCompleted =
    order?.cancellationStatus === "cancelled_refunded" &&
    order?.paymentStatus === "refunded" &&
    order?.refundStatus === "succeeded" &&
    order?.stockRestoreStatus === "restored";
  const isRefundFailed =
    order?.cancellationStatus === "refund_failed" ||
    order?.refundStatus === "failed";
  const isRefundProcessing =
    order?.cancellationStatus === "refund_processing" ||
    order?.paymentStatus === "refund_processing" ||
    order?.refundStatus === "processing";
  const existingRefundMessage = refundStatusLabel(order, pollTimedOut);
  const isEligibleOrder =
    ["Order Placed...", "Processing..."].includes(order?.orderStatus) &&
    String(order?.paymentProvider || order?.paymentMethod || "").toLowerCase() ===
      "stripe" &&
    order?.paymentStatus === "paid" &&
    Boolean(order?.stripePaymentIntentId || order?.stripeChargeId);
  const feeUnavailable =
    refundPreview?.stripeFeeAmountMinor === null ||
    refundPreview?.stripeFeeAmountMinor === undefined;
  const paymentAmount = Number(refundPreview?.paymentAmount || 0);
  const manualFee = Number(manualStripeFeeAmount || 0);
  const expectedRefundAmount =
    policyType === "company_absorbs_fee"
      ? paymentAmount
      : policyType === "custom"
        ? Number(customRefundAmount || 0)
        : feeUnavailable
          ? Math.max(paymentAmount - manualFee, 0)
          : Number(refundPreview?.defaultRefundAmount || 0);

  useEffect(() => {
    if (isRefundCompleted || isRefundFailed) {
      stopPolling();
      return;
    }

    if (isRefundProcessing && !isPolling && !pollTimedOut) {
      startPolling(order?._id);
    }
  }, [
    isPolling,
    isRefundCompleted,
    isRefundFailed,
    isRefundProcessing,
    order?._id,
    pollTimedOut,
    startPolling,
    stopPolling,
  ]);

  if (!order) return null;

  const closePanel = () => {
    setIsOpen(false);
    dispatch(CLEAR_REFUND_PREVIEW());
  };

  const openPanel = async () => {
    setSubmittedMessage("");
    dispatch(CLEAR_REFUND_PREVIEW());
    setIsOpen(true);
    const result = await dispatch(getRefundPreview(order._id));
    if (getRefundPreview.rejected.match(result)) {
      toast.error(result.payload || "未能載入退款預覽");
    }
  };

  const submitRefund = async (event) => {
    event.preventDefault();

    if (!refundReason.trim() || !refundNote.trim()) {
      toast.error("請填寫退款原因及協商處理備註");
      return;
    }

    if (!confirmNotShipped || !confirmCustomerCommunication) {
      toast.error("請完成必要確認");
      return;
    }

    if (policyType === "customer_pays_fee" && !confirmCustomerAgreedToFee) {
      toast.error("請確認客人已同意扣除付款平台手續費");
      return;
    }

    if (
      policyType === "customer_pays_fee" &&
      feeUnavailable &&
      manualStripeFeeAmount === ""
    ) {
      toast.error("請輸入已確認的 Stripe 手續費");
      return;
    }

    if (policyType === "custom" && !confirmCustomRefundAgreement) {
      toast.error("請確認自訂退款金額已與客人協商");
      return;
    }

    const result = await dispatch(
      cancelRefund({
        id: order._id,
        formData: {
          refundPolicyType: policyType,
          customRefundAmount,
          manualStripeFeeAmount,
          refundReason,
          refundNote,
          confirmNotShipped,
          confirmCustomerCommunication,
          confirmCustomerAgreedToFee,
          confirmCustomRefundAgreement,
        },
      })
    );

    if (cancelRefund.rejected.match(result)) {
      toast.error(result.payload || "未能提交退款");
      return;
    }

    toast.success(result.payload?.message || "退款已提交");
    setSubmittedMessage(REFUND_WAITING_MESSAGE);
    closePanel();
    startPolling(order._id);
  };

  if (!isEligibleOrder && !existingRefundMessage && !submittedMessage) {
    return null;
  }

  return (
    <section className={styles.refund}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>取消及退款</p>
            <h3 className={styles.title}>取消訂單 / Stripe 退款</h3>
            <p className={styles.subtitle}>
              只適用於尚未寄出的 Stripe 已付款訂單。庫存會在 Stripe 確認退款成功後補回網店存貨。
            </p>
          </div>
          {isEligibleOrder && !isOpen && (
            <button type="button" className={styles.primaryButton} onClick={openPanel}>
              開始退款
            </button>
          )}
        </div>

        {(existingRefundMessage || submittedMessage) && (
          <p className={styles.statusMessage}>
            {existingRefundMessage || submittedMessage}
          </p>
        )}

        {isOpen && (
          <form className={styles.form} onSubmit={submitRefund}>
            {isRefundLoading && !refundPreview ? (
              <p className={styles.loading}>正在載入退款預覽...</p>
            ) : !refundPreview ? (
              <p className={styles.error}>
                {refundMessage || "未能載入退款預覽，請稍後再試。"}
              </p>
            ) : refundPreview && !refundPreview.canRefund ? (
              <p className={styles.error}>{refundPreview.cannotRefundReason}</p>
            ) : (
              <>
                <div className={styles.summaryGrid}>
                  <div>
                    <span>訂單付款金額</span>
                    <strong>
                      {formatMoney(
                        refundPreview?.paymentAmount,
                        refundPreview?.paymentCurrency
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Stripe 手續費</span>
                    <strong>
                      {formatMoney(
                        refundPreview?.stripeFeeAmount,
                        refundPreview?.stripeFeeCurrency
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>手續費來源</span>
                    <strong>{feeSourceLabel(refundPreview?.stripeFeeSource)}</strong>
                  </div>
                  <div>
                    <span>預計退款金額</span>
                    <strong>
                      {formatMoney(expectedRefundAmount, refundPreview?.paymentCurrency)}
                    </strong>
                  </div>
                </div>

                <fieldset className={styles.fieldset}>
                  <legend>退款方式</legend>
                  <label className={styles.option}>
                    <input
                      type="radio"
                      name="refundPolicyType"
                      value="customer_pays_fee"
                      checked={policyType === "customer_pays_fee"}
                      onChange={(event) => setPolicyType(event.target.value)}
                    />
                    <span>
                      <strong>客人承擔付款平台手續費</strong>
                      <small>適用於客人個人原因取消，並已同意扣除付款平台手續費。</small>
                    </span>
                  </label>
                  <label className={styles.option}>
                    <input
                      type="radio"
                      name="refundPolicyType"
                      value="company_absorbs_fee"
                      checked={policyType === "company_absorbs_fee"}
                      onChange={(event) => setPolicyType(event.target.value)}
                    />
                    <span>
                      <strong>公司承擔付款平台手續費</strong>
                      <small>適用於公司原因或公司同意全額退回。</small>
                    </span>
                  </label>
                  <label className={styles.option}>
                    <input
                      type="radio"
                      name="refundPolicyType"
                      value="custom"
                      checked={policyType === "custom"}
                      onChange={(event) => setPolicyType(event.target.value)}
                    />
                    <span>
                      <strong>自訂退款金額</strong>
                      <small>適用於特殊協商情況，請在備註記錄原因。</small>
                    </span>
                  </label>
                </fieldset>

                {policyType === "customer_pays_fee" && feeUnavailable && (
                  <label className={styles.field}>
                    <span>手動輸入 Stripe 手續費</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualStripeFeeAmount}
                      onChange={(event) => setManualStripeFeeAmount(event.target.value)}
                      placeholder="例如 12.50"
                    />
                    <small>Stripe 暫未提供手續費資料，請確認金額並在備註記錄來源。</small>
                  </label>
                )}

                {policyType === "custom" && (
                  <label className={styles.field}>
                    <span>自訂退款金額</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={customRefundAmount}
                      onChange={(event) => setCustomRefundAmount(event.target.value)}
                      placeholder="請輸入已協商退款金額"
                    />
                  </label>
                )}

                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span>退款原因</span>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(event) => setRefundReason(event.target.value)}
                      placeholder="例如：客人要求取消訂單"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>協商及處理備註</span>
                    <textarea
                      rows="4"
                      value={refundNote}
                      onChange={(event) => setRefundNote(event.target.value)}
                      placeholder="記錄已確認的退款金額、原因及溝通摘要"
                    />
                  </label>
                </div>

                <div className={styles.confirmations}>
                  <label>
                    <input
                      type="checkbox"
                      checked={confirmNotShipped}
                      onChange={(event) => setConfirmNotShipped(event.target.checked)}
                    />
                    已確認訂單尚未寄出
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={confirmCustomerCommunication}
                      onChange={(event) =>
                        setConfirmCustomerCommunication(event.target.checked)
                      }
                    />
                    已與客人確認退款安排及金額
                  </label>
                  {policyType === "customer_pays_fee" && (
                    <label>
                      <input
                        type="checkbox"
                        checked={confirmCustomerAgreedToFee}
                        onChange={(event) =>
                          setConfirmCustomerAgreedToFee(event.target.checked)
                        }
                      />
                      客人已同意扣除付款平台手續費
                    </label>
                  )}
                  {policyType === "custom" && (
                    <label>
                      <input
                        type="checkbox"
                        checked={confirmCustomRefundAgreement}
                        onChange={(event) =>
                          setConfirmCustomRefundAgreement(event.target.checked)
                        }
                      />
                      自訂退款金額已協商並在備註記錄原因
                    </label>
                  )}
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={closePanel}
                    disabled={isRefundLoading}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isRefundLoading || !refundPreview?.canRefund}
                  >
                    {isRefundLoading ? "提交中..." : "提交退款申請"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </section>
  );
};

export default RefundOrder;
