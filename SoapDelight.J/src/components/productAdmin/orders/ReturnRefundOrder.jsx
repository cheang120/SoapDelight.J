/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  CLEAR_RETURN_REFUND_PREVIEW,
  closeReturnNoRefund,
  createReturnRequest,
  getOrder,
  getReturnRefundPreview,
  receiveReturnRefund,
} from "../../../redux/features/order/OrderSlice";
import styles from "./RefundOrder.module.scss";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60000;
const WAITING_MESSAGE = "已提交 Stripe 退款，正在等待確認及退貨商品處理...";
const TIMEOUT_MESSAGE =
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

const returnReasonLabel = (value) => {
  if (value === "customer_change_mind") return "客人改變主意 / 個人原因";
  if (value === "company_error") return "公司出錯 / 寄錯貨";
  if (value === "damaged") return "商品損壞";
  if (value === "other") return "其他協商情況";
  return "未設定";
};

const returnStatusMessage = (order, timedOut = false) => {
  if (order?.returnStatus === "returned_refunded") {
    return order?.stockRestoreStatus === "restored"
      ? "退款已完成，退貨商品已補回網店庫存。"
      : "退款已完成，退貨商品未重新上架。";
  }

  if (order?.returnStatus === "return_refund_failed") {
    return "已出貨退款處理失敗，請人工跟進。";
  }

  if (order?.returnStatus === "closed_no_refund") {
    return "退貨已處理，未有退款；商品未重新上架。";
  }

  if (order?.returnStatus === "refund_processing") {
    return timedOut ? TIMEOUT_MESSAGE : WAITING_MESSAGE;
  }

  if (order?.returnStatus === "awaiting_return") {
    return "已建立退貨個案，等待退貨。";
  }

  if (order?.returnStatus === "no_return_required") {
    return "已建立退貨個案，已確認毋須退回商品。";
  }

  return "";
};

const ReturnRefundOrder = ({ order }) => {
  const dispatch = useDispatch();
  const {
    isReturnRefundLoading,
    returnRefundMessage,
    returnRefundPreview,
  } = useSelector((state) => state.order);
  const [panelMode, setPanelMode] = useState("");
  const [returnReasonType, setReturnReasonType] = useState(
    "customer_change_mind"
  );
  const [returnReason, setReturnReason] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [returnRequiresReturn, setReturnRequiresReturn] = useState(true);
  const [returnShippingResponsibility, setReturnShippingResponsibility] =
    useState("customer");
  const [confirmCustomerCommunication, setConfirmCustomerCommunication] =
    useState(false);
  const [confirmReturnReceived, setConfirmReturnReceived] = useState(false);
  const [confirmNoReturnRequired, setConfirmNoReturnRequired] = useState(false);
  const [returnInspectionStatus, setReturnInspectionStatus] =
    useState("restockable");
  const [returnInspectionNote, setReturnInspectionNote] = useState("");
  const [returnShippingDeduction, setReturnShippingDeduction] = useState("0");
  const [manualStripeFeeAmount, setManualStripeFeeAmount] = useState("");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [confirmRefundAmount, setConfirmRefundAmount] = useState(false);
  const [confirmProductCondition, setConfirmProductCondition] = useState(false);
  const [
    confirmCustomerAgreedFeeAndDeductions,
    setConfirmCustomerAgreedFeeAndDeductions,
  ] = useState(false);
  const [confirmCustomRefundAgreement, setConfirmCustomRefundAgreement] =
    useState(false);
  const [noRefundReason, setNoRefundReason] = useState("");
  const [noRefundNote, setNoRefundNote] = useState("");
  const [confirmNoRefund, setConfirmNoRefund] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [shouldPollAfterSubmit, setShouldPollAfterSubmit] = useState(false);
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
    setShouldPollAfterSubmit(false);
  }, [clearPollingTimers]);

  const startPolling = useCallback(
    (orderId) => {
      if (!orderId || pollIntervalRef.current) return;

      setPollTimedOut(false);
      setIsPolling(true);
      const refreshOrder = () => dispatch(getOrder(orderId));
      refreshOrder();
      pollIntervalRef.current = setInterval(refreshOrder, POLL_INTERVAL_MS);
      pollTimeoutRef.current = setTimeout(() => {
        clearPollingTimers();
        setIsPolling(false);
        setShouldPollAfterSubmit(false);
        setPollTimedOut(true);
      }, POLL_TIMEOUT_MS);
    },
    [clearPollingTimers, dispatch]
  );

  useEffect(() => {
    return () => {
      clearPollingTimers();
      dispatch(CLEAR_RETURN_REFUND_PREVIEW());
    };
  }, [clearPollingTimers, dispatch]);

  const isCompleted =
    order?.returnStatus === "returned_refunded" &&
    order?.paymentStatus === "refunded" &&
    order?.refundStatus === "succeeded" &&
    ["restored", "not_restocked", "not_applicable"].includes(
      order?.stockRestoreStatus
    );
  const isFailed =
    order?.returnStatus === "return_refund_failed" ||
    (order?.refundFlow === "shipped_return" && order?.refundStatus === "failed");
  const isProcessing = order?.returnStatus === "refund_processing";

  useEffect(() => {
    if (isCompleted || isFailed) {
      stopPolling();
      return;
    }

    if (isProcessing && shouldPollAfterSubmit && !isPolling && !pollTimedOut) {
      startPolling(order?._id);
    }
  }, [
    isCompleted,
    isFailed,
    isPolling,
    isProcessing,
    order?._id,
    pollTimedOut,
    shouldPollAfterSubmit,
    startPolling,
    stopPolling,
  ]);

  if (!order) return null;

  const isStripeOrder =
    String(order?.paymentProvider || order?.paymentMethod || "").toLowerCase() ===
    "stripe";
  const canStartCase =
    ["Shipped...", "Delivered"].includes(order?.orderStatus) &&
    isStripeOrder &&
    order?.paymentStatus === "paid" &&
    (!order?.returnStatus || order.returnStatus === "none");
  const canPrepareRefund =
    ["awaiting_return", "no_return_required"].includes(order?.returnStatus) &&
    order?.paymentStatus === "paid";
  const shouldShow =
    canStartCase ||
    (isStripeOrder && order?.returnStatus && order.returnStatus !== "none");

  if (!shouldShow) return null;

  const feeUnavailable =
    returnRefundPreview?.stripeFeeAmountMinor === null ||
    returnRefundPreview?.stripeFeeAmountMinor === undefined;
  const currency = returnRefundPreview?.paymentCurrency || "HKD";
  const customerMind = order?.returnReasonType === "customer_change_mind";
  const otherCase = order?.returnReasonType === "other";
  const estimatedRefundAmount = (() => {
    const subtotal = Number(
      returnRefundPreview?.productSubtotalAfterDiscount || 0
    );
    const shippingFee = Number(returnRefundPreview?.originalShippingFee || 0);

    if (customerMind) {
      const stripeFee = feeUnavailable
        ? Number(manualStripeFeeAmount || 0)
        : Number(returnRefundPreview?.stripeFeeAmount || 0);
      return Math.max(
        subtotal - stripeFee - Number(returnShippingDeduction || 0),
        0
      );
    }

    if (otherCase) return Number(customRefundAmount || 0);
    return subtotal + shippingFee;
  })();
  const canShowNoRefundClose =
    canPrepareRefund &&
    returnInspectionNote.trim() &&
    (order.returnRequiresReturn
      ? returnInspectionStatus === "not_restockable"
      : true);
  const shouldHideStripeRefundButton = confirmNoRefund;

  const closePanel = () => {
    setPanelMode("");
    dispatch(CLEAR_RETURN_REFUND_PREVIEW());
  };

  const openPanel = async (mode) => {
    setSubmittedMessage("");
    dispatch(CLEAR_RETURN_REFUND_PREVIEW());
    setPanelMode(mode);
    const result = await dispatch(getReturnRefundPreview(order._id));

    if (getReturnRefundPreview.rejected.match(result)) {
      toast.error(result.payload || "未能載入退貨退款資料");
    }
  };

  const submitReturnRequest = async (event) => {
    event.preventDefault();

    if (!returnReason.trim() || !returnNote.trim()) {
      toast.error("請填寫退貨原因及內部處理備註");
      return;
    }

    if (!confirmCustomerCommunication) {
      toast.error("請確認已與客人確認退貨安排");
      return;
    }

    const result = await dispatch(
      createReturnRequest({
        id: order._id,
        formData: {
          returnReasonType,
          returnReason,
          returnNote,
          returnRequiresReturn,
          returnShippingResponsibility,
          confirmCustomerCommunication,
        },
      })
    );

    if (createReturnRequest.rejected.match(result)) {
      toast.error(result.payload || "未能建立退貨個案");
      return;
    }

    toast.success(result.payload?.message || "已建立退貨個案");
    setSubmittedMessage(result.payload?.message || "已建立退貨個案，等待退貨。");
    closePanel();
    dispatch(getOrder(order._id));
  };

  const submitReturnRefund = async (event) => {
    event.preventDefault();

    if (!returnInspectionNote.trim()) {
      toast.error("請填寫商品檢查或處理備註");
      return;
    }

    if (order.returnRequiresReturn && !confirmReturnReceived) {
      toast.error("請確認已收到客人退回商品");
      return;
    }

    if (!order.returnRequiresReturn && !confirmNoReturnRequired) {
      toast.error("請確認此個案毋須客人退回商品");
      return;
    }

    if (!confirmRefundAmount || !confirmProductCondition) {
      toast.error("請確認退款金額及商品狀態");
      return;
    }

    if (customerMind && !confirmCustomerAgreedFeeAndDeductions) {
      toast.error("請確認客人已同意扣除手續費及退回運費");
      return;
    }

    if (customerMind && feeUnavailable && manualStripeFeeAmount === "") {
      toast.error("請輸入已確認的 Stripe 手續費");
      return;
    }

    if (otherCase && !confirmCustomRefundAgreement) {
      toast.error("請確認自訂退款金額已與客人協商");
      return;
    }

    const result = await dispatch(
      receiveReturnRefund({
        id: order._id,
        formData: {
          confirmReturnReceived,
          confirmNoReturnRequired,
          returnInspectionStatus,
          returnInspectionNote,
          returnShippingDeduction,
          manualStripeFeeAmount,
          customRefundAmount,
          confirmRefundAmount,
          confirmProductCondition,
          confirmCustomerAgreedFeeAndDeductions,
          confirmCustomRefundAgreement,
        },
      })
    );

    if (receiveReturnRefund.rejected.match(result)) {
      toast.error(result.payload || "未能提交 Stripe 退款");
      return;
    }

    toast.success(result.payload?.message || "已提交 Stripe 退款");
    setSubmittedMessage(WAITING_MESSAGE);
    setShouldPollAfterSubmit(true);
    closePanel();
    startPolling(order._id);
  };

  const submitNoRefundClose = async (event) => {
    event.preventDefault();

    if (!returnInspectionNote.trim()) {
      toast.error("請填寫商品檢查或處理備註");
      return;
    }

    if (order.returnRequiresReturn && !confirmReturnReceived) {
      toast.error("請確認已收到客人退回商品");
      return;
    }

    if (!order.returnRequiresReturn && !confirmNoReturnRequired) {
      toast.error("請確認此個案毋須客人退回商品");
      return;
    }

    if (order.returnRequiresReturn && returnInspectionStatus !== "not_restockable") {
      toast.error("只有不可重新上架的商品可使用不退款結案");
      return;
    }

    if (!noRefundReason.trim() || !noRefundNote.trim()) {
      toast.error("請填寫不設退款原因及內部備註");
      return;
    }

    if (!confirmNoRefund) {
      toast.error("請確認此退貨個案不設退款，且商品不會重新上架");
      return;
    }

    const result = await dispatch(
      closeReturnNoRefund({
        id: order._id,
        formData: {
          noRefundReason,
          noRefundNote,
          returnInspectionStatus: order.returnRequiresReturn
            ? returnInspectionStatus
            : "not_restockable",
          returnInspectionNote,
          confirmReturnReceived,
          confirmNoReturnRequired,
          confirmNoRefund,
        },
      })
    );

    if (closeReturnNoRefund.rejected.match(result)) {
      toast.error(result.payload || "未能不設退款結案");
      return;
    }

    const message =
      result.payload?.message || "退貨已處理，未有退款；商品未重新上架。";
    toast.success(message);
    setSubmittedMessage(message);
    stopPolling();
    closePanel();
    dispatch(getOrder(order._id));
  };

  return (
    <section className={styles.refund}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>已出貨退貨</p>
            <h3 className={styles.title}>退貨 / 已出貨退款</h3>
            <p className={styles.subtitle}>
              已寄出或已送達的訂單須先建立退貨個案。Stripe 退款成功後，只有可重新上架的商品會補回網店存貨。
            </p>
          </div>
          {!panelMode && canStartCase && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => openPanel("request")}
            >
              建立退貨 / 退款個案
            </button>
          )}
          {!panelMode && canPrepareRefund && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => openPanel("refund")}
            >
              處理退貨並提交退款
            </button>
          )}
        </div>

        {(returnStatusMessage(order, pollTimedOut) || submittedMessage) && (
          <p className={styles.statusMessage}>
            {returnStatusMessage(order, pollTimedOut) || submittedMessage}
          </p>
        )}

        {panelMode === "request" && (
          <form className={styles.form} onSubmit={submitReturnRequest}>
            <label className={styles.field}>
              <span>退貨原因類型</span>
              <select
                value={returnReasonType}
                onChange={(event) => {
                  const nextReasonType = event.target.value;
                  setReturnReasonType(nextReasonType);
                  if (
                    !["company_error", "damaged"].includes(nextReasonType)
                  ) {
                    setReturnRequiresReturn(true);
                  }
                }}
              >
                <option value="customer_change_mind">客人改變主意 / 個人原因</option>
                <option value="company_error">公司出錯 / 寄錯貨</option>
                <option value="damaged">商品損壞</option>
                <option value="other">其他協商情況</option>
              </select>
            </label>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>是否需要客人退回商品</span>
                <select
                  value={String(returnRequiresReturn)}
                  onChange={(event) =>
                    setReturnRequiresReturn(event.target.value === "true")
                  }
                >
                  <option value="true">需要退回商品</option>
                  <option
                    value="false"
                    disabled={!["company_error", "damaged"].includes(returnReasonType)}
                  >
                    毋須退回商品
                  </option>
                </select>
              </label>
              <label className={styles.field}>
                <span>退回運費承擔方式</span>
                <select
                  value={returnShippingResponsibility}
                  onChange={(event) =>
                    setReturnShippingResponsibility(event.target.value)
                  }
                >
                  <option value="customer">客人承擔</option>
                  <option value="company">公司承擔</option>
                  <option value="waived">已豁免 / 不適用</option>
                  <option value="other">其他安排</option>
                </select>
              </label>
            </div>
            <label className={styles.field}>
              <span>退貨原因</span>
              <input
                type="text"
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>內部處理備註</span>
              <textarea
                rows="3"
                value={returnNote}
                onChange={(event) => setReturnNote(event.target.value)}
              />
            </label>
            <div className={styles.confirmations}>
              <label>
                <input
                  type="checkbox"
                  checked={confirmCustomerCommunication}
                  onChange={(event) =>
                    setConfirmCustomerCommunication(event.target.checked)
                  }
                />
                已與客人確認退貨安排
              </label>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closePanel}
              >
                取消
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isReturnRefundLoading}
              >
                {isReturnRefundLoading ? "處理中..." : "建立退貨個案"}
              </button>
            </div>
          </form>
        )}

        {panelMode === "refund" && (
          <form className={styles.form} onSubmit={submitReturnRefund}>
            {isReturnRefundLoading && !returnRefundPreview ? (
              <p className={styles.loading}>正在載入退貨退款預覽...</p>
            ) : !returnRefundPreview ? (
              <p className={styles.error}>
                {returnRefundMessage || "未能載入退貨退款預覽，請稍後再試。"}
              </p>
            ) : (
              <>
                <div className={styles.summaryGrid}>
                  <div>
                    <span>Stripe 付款金額</span>
                    <strong>
                      {formatMoney(returnRefundPreview.paymentAmount, currency)}
                    </strong>
                  </div>
                  <div>
                    <span>商品折扣後小計</span>
                    <strong>
                      {formatMoney(
                        returnRefundPreview.productSubtotalAfterDiscount,
                        currency
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>原運費</span>
                    <strong>
                      {formatMoney(returnRefundPreview.originalShippingFee, currency)}
                    </strong>
                  </div>
                  <div>
                    <span>Stripe 手續費</span>
                    <strong>
                      {formatMoney(returnRefundPreview.stripeFeeAmount, currency)}
                    </strong>
                  </div>
                  <div>
                    <span>預計退款金額</span>
                    <strong>{formatMoney(estimatedRefundAmount, currency)}</strong>
                  </div>
                </div>
                <p className={styles.subtitle}>
                  原因：{returnReasonLabel(order.returnReasonType)}。手續費來源：
                  {feeSourceLabel(returnRefundPreview.stripeFeeSource)}。
                </p>

                {order.returnRequiresReturn ? (
                  <>
                    <label className={styles.option}>
                      <input
                        type="checkbox"
                        checked={confirmReturnReceived}
                        onChange={(event) =>
                          setConfirmReturnReceived(event.target.checked)
                        }
                      />
                      已收到客人退回商品
                    </label>
                    <label className={styles.field}>
                      <span>商品檢查結果</span>
                      <select
                        value={returnInspectionStatus}
                        onChange={(event) =>
                          setReturnInspectionStatus(event.target.value)
                        }
                      >
                        <option value="restockable">可重新上架</option>
                        <option value="not_restockable">不可重新上架</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <label className={styles.option}>
                    <input
                      type="checkbox"
                      checked={confirmNoReturnRequired}
                      onChange={(event) =>
                        setConfirmNoReturnRequired(event.target.checked)
                      }
                    />
                    已確認此個案毋須客人退回商品
                  </label>
                )}

                <label className={styles.field}>
                  <span>檢查及處理備註</span>
                  <textarea
                    rows="3"
                    value={returnInspectionNote}
                    onChange={(event) =>
                      setReturnInspectionNote(event.target.value)
                    }
                  />
                </label>

                {customerMind && (
                  <label className={styles.field}>
                    <span>額外扣除退回運費（如公司沒有代付，請填 0）</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={returnShippingDeduction}
                      onChange={(event) =>
                        setReturnShippingDeduction(event.target.value)
                      }
                    />
                  </label>
                )}

                {customerMind && feeUnavailable && (
                  <label className={styles.field}>
                    <span>手動輸入 Stripe 手續費</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualStripeFeeAmount}
                      onChange={(event) =>
                        setManualStripeFeeAmount(event.target.value)
                      }
                    />
                    <small>Stripe 暫未提供手續費，請確認金額並記錄來源。</small>
                  </label>
                )}

                {otherCase && (
                  <label className={styles.field}>
                    <span>自訂退款金額</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={customRefundAmount}
                      onChange={(event) =>
                        setCustomRefundAmount(event.target.value)
                      }
                    />
                  </label>
                )}

                <div className={styles.confirmations}>
                  <label>
                    <input
                      type="checkbox"
                      checked={confirmRefundAmount}
                      onChange={(event) =>
                        setConfirmRefundAmount(event.target.checked)
                      }
                    />
                    已確認退款金額
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={confirmProductCondition}
                      onChange={(event) =>
                        setConfirmProductCondition(event.target.checked)
                      }
                    />
                    已確認商品狀態
                  </label>
                  {customerMind && (
                    <label>
                      <input
                        type="checkbox"
                        checked={confirmCustomerAgreedFeeAndDeductions}
                        onChange={(event) =>
                          setConfirmCustomerAgreedFeeAndDeductions(
                            event.target.checked
                          )
                        }
                      />
                      已與客人確認扣除手續費及退回運費
                    </label>
                  )}
                  {otherCase && (
                    <label>
                      <input
                        type="checkbox"
                        checked={confirmCustomRefundAgreement}
                        onChange={(event) =>
                          setConfirmCustomRefundAgreement(event.target.checked)
                        }
                      />
                      已與客人確認自訂退款金額
                    </label>
                  )}
                </div>
                <p className={styles.subtitle}>退款處理</p>
                {canShowNoRefundClose && (
                  <fieldset className={styles.fieldset}>
                    <legend>退貨結案，不設退款</legend>
                    <p className={styles.subtitle}>
                      適用於商品不可重新上架，且此個案不符合退款安排的情況。此操作不會建立 Stripe 退款、不會補回網店庫存。
                    </p>
                    <label className={styles.field}>
                      <span>不設退款原因</span>
                      <input
                        type="text"
                        value={noRefundReason}
                        onChange={(event) =>
                          setNoRefundReason(event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>不設退款內部備註</span>
                      <textarea
                        rows="3"
                        value={noRefundNote}
                        onChange={(event) =>
                          setNoRefundNote(event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.option}>
                      <input
                        type="checkbox"
                        checked={confirmNoRefund}
                        onChange={(event) =>
                          setConfirmNoRefund(event.target.checked)
                        }
                      />
                      我確認此退貨個案不設退款，且商品不會重新上架。
                    </label>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={isReturnRefundLoading}
                      onClick={submitNoRefundClose}
                    >
                      {isReturnRefundLoading
                        ? "處理中..."
                        : "退貨結案，不設退款"}
                    </button>
                  </fieldset>
                )}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={closePanel}
                  >
                    取消
                  </button>
                  {!shouldHideStripeRefundButton && (
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={isReturnRefundLoading}
                    >
                      {isReturnRefundLoading ? "處理中..." : "提交 Stripe 退款"}
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </section>
  );
};

export default ReturnRefundOrder;
