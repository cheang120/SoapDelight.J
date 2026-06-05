import React from "react";
import { toast } from "react-toastify";
import styles from "./CheckoutPolicyAgreement.module.scss";

export const POLICY_VERSION = "2026-06-v1";

const policySections = [
  {
    title: "退款及退貨政策",
    body: "訂單一經付款確認後，商品會按訂單狀態安排製作、包裝或出貨。如訂單仍未寄出並符合退款條件，客人可聯絡我們申請取消訂單及退款。退款會按原付款方式處理，實際到帳時間以 Stripe、銀行或發卡機構為準。",
  },
  {
    title: "已出貨退貨安排",
    body: "已寄出或已送達的訂單，如因商品狀況需要申請退貨，請於收到商品後盡快聯絡我們並提供訂單資料及相片。退貨個案會按商品狀態、包裝完整度及實際情況審核。",
  },
  {
    title: "商品損壞或錯漏處理",
    body: "如收到商品時發現明顯損壞、滲漏、寄錯或缺漏，請保留商品、包裝及相關相片，並盡快與我們聯絡。我們會按情況安排補寄、更換、退款或其他合適處理。",
  },
  {
    title: "退貨運費安排",
    body: "如退貨原因屬商品錯漏或運送途中損壞，相關運費安排會由我們跟進。如因個人原因退貨，退貨運費及其他相關費用或需由客人承擔，實際安排以個案確認為準。",
  },
  {
    title: "不設退款情況",
    body: "已使用、已開封、因個人喜好改變、未按建議方式保存、或未能提供足夠訂單及商品狀況資料的個案，可能不設退款。天然手作產品的色澤、形狀、香氣或紋理有輕微差異，通常不視為瑕疵。",
  },
  {
    title: "送貨及自取政策",
    body: "訂單會按商品狀態、手作時間及配送安排處理。澳門本地送貨、自取地點、時間及費用會以結帳頁、訂單資料及後續確認為準。客人需確保收件資料正確，如因資料錯誤導致延誤或額外費用，可能需由客人承擔。",
  },
];

const CheckoutPolicyAgreement = ({
  isPolicyModalOpen,
  hasViewedCheckoutPolicy,
  policyAgreementChecked,
  policyAccepted,
  onOpenPolicy,
  onClosePolicy,
  onPolicyAgreementCheckedChange,
  onConfirmPolicyAcceptance,
}) => {
  const handleAgreementChange = (event) => {
    if (!hasViewedCheckoutPolicy) {
      event.preventDefault();
      toast.info("請先查看退款、退貨、送貨及自取政策");
      return;
    }

    onPolicyAgreementCheckedChange(event.target.checked);
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>付款前確認</p>
        <h2>退款、退貨、送貨及自取政策</h2>
        <p>
          請先查看政策內容，再勾選同意。完成後系統才會載入 Stripe
          安全付款表單。
        </p>
      </div>

      <button type="button" className={styles.policyButton} onClick={onOpenPolicy}>
        查看退款、退貨、送貨及自取政策
      </button>

      <label
        className={`${styles.checkboxRow} ${
          !hasViewedCheckoutPolicy ? styles.checkboxRowDisabled : ""
        }`}
      >
        <input
          type="checkbox"
          checked={policyAgreementChecked}
          onChange={handleAgreementChange}
          aria-disabled={!hasViewedCheckoutPolicy}
        />
        <span>我已閱讀並同意退款及退貨政策、送貨及自取政策</span>
      </label>

      {policyAgreementChecked && !policyAccepted && (
        <p className={styles.notice}>
          請按「確認並載入安全付款」繼續。
        </p>
      )}

      {!policyAgreementChecked && !policyAccepted && (
        <p className={styles.notice}>
          請先閱讀並同意退款、退貨、送貨及自取政策，然後即可載入安全付款表單。
        </p>
      )}

      <button
        type="button"
        className={styles.confirmButton}
        onClick={onConfirmPolicyAcceptance}
        disabled={!policyAgreementChecked || policyAccepted}
      >
        {policyAccepted ? "已確認，正在載入安全付款" : "確認並載入安全付款"}
      </button>

      {isPolicyModalOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={onClosePolicy}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-policy-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Policy {POLICY_VERSION}</p>
                <h2 id="checkout-policy-title">退款、退貨、送貨及自取政策</h2>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClosePolicy}
                aria-label="關閉政策內容"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {policySections.map((section) => (
                <section key={section.title} className={styles.policySection}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CheckoutPolicyAgreement;
