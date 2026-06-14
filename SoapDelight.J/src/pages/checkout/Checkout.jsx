import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { extractIdAndCartQuantity } from "../../utils";
import {
  selectProductCartItems,
  selectSelectedDeliveryMethod,
} from "../../redux/features/cart/cartSlice";
import {
  selectBillingAddress,
  selectShippingAddress,
} from "../../redux/features/checkout/checkoutSlice";
import { isCouponValid } from "../../redux/features/coupon/couponSlice";
import { API_BASE_URL } from "../../utils/apiBase";
import CheckoutPolicyAgreement, {
  POLICY_VERSION,
} from "../../components/checkout/policyAgreement/CheckoutPolicyAgreement";

const StripeCheckoutSurface = lazy(() =>
  import("../../components/checkout/checkoutForm/StripeCheckoutSurface")
);

const hasAddressData = (address) =>
  Boolean(
    address &&
      typeof address === "object" &&
      address.email &&
      address.name &&
      address.line1 &&
      address.city &&
      address.state &&
      address.postal_code &&
      address.country &&
      address.phone
  );

const CheckoutState = ({ eyebrow, title, body, ctaLabel, ctaTo }) => (
  <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] dark:border-zinc-800 dark:bg-zinc-950 sm:px-10">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
        {title}
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-300">{body}</p>
      <Link
        to={ctaTo}
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {ctaLabel}
      </Link>
    </div>
  </main>
);

export const Checkout = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [initError, setInitError] = useState("");
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [hasViewedCheckoutPolicy, setHasViewedCheckoutPolicy] = useState(false);
  const [policyAgreementChecked, setPolicyAgreementChecked] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [policyAcceptedAt, setPolicyAcceptedAt] = useState("");

  const productItems = useSelector(selectProductCartItems);
  const selectedDeliveryMethod = useSelector(selectSelectedDeliveryMethod);
  const { currentUser } = useSelector((state) => state.user);
  const shippingAddress = useSelector(selectShippingAddress);
  const billingAddress = useSelector(selectBillingAddress);
  const { coupon } = useSelector((state) => state.coupon);

  const effectiveBillingAddress = hasAddressData(billingAddress)
    ? billingAddress
    : shippingAddress;
  const checkoutEmail = shippingAddress?.email || currentUser?.email || "";
  const userEmail = currentUser?.email || checkoutEmail;
  const productIDs = useMemo(
    () => extractIdAndCartQuantity(productItems),
    [productItems]
  );
  const description = `eShop payment: email: ${userEmail}`;
  const hasShippingAddress = hasAddressData(shippingAddress);
  const hasBillingAddress = hasAddressData(effectiveBillingAddress);
  const hasValidCoupon = isCouponValid(coupon);
  const hasExpiredCoupon = Boolean(coupon) && !hasValidCoupon;
  const validCoupon = hasValidCoupon ? coupon : null;
  const shouldLoadStripe =
    Boolean(currentUser) &&
    productItems.length > 0 &&
    Boolean(selectedDeliveryMethod) &&
    hasShippingAddress &&
    hasBillingAddress &&
    !hasExpiredCoupon &&
    policyAccepted;

  const openPolicyModal = () => {
    setHasViewedCheckoutPolicy(true);
    setIsPolicyModalOpen(true);
  };

  const closePolicyModal = () => {
    setIsPolicyModalOpen(false);
  };

  const handlePolicyAgreementCheckedChange = (nextChecked) => {
    setPolicyAgreementChecked(nextChecked);

    if (!nextChecked) {
      setPolicyAccepted(false);
      setPolicyAcceptedAt("");
      setClientSecret("");
      setPaymentIntentId("");
      setInitError("");
    }
  };

  const confirmPolicyAcceptance = () => {
    if (!policyAgreementChecked) {
      toast.info("請先閱讀並同意退款及退貨政策、送貨及自取政策");
      return;
    }

    setPolicyAccepted(true);
    setPolicyAcceptedAt(new Date().toISOString());
  };

  const renderPolicyAgreement = () => (
    <CheckoutPolicyAgreement
      isPolicyModalOpen={isPolicyModalOpen}
      hasViewedCheckoutPolicy={hasViewedCheckoutPolicy}
      policyAgreementChecked={policyAgreementChecked}
      policyAccepted={policyAccepted}
      onOpenPolicy={openPolicyModal}
      onClosePolicy={closePolicyModal}
      onPolicyAgreementCheckedChange={handlePolicyAgreementCheckedChange}
      onConfirmPolicyAcceptance={confirmPolicyAcceptance}
    />
  );

  useEffect(() => {
    let ignore = false;

    if (!shouldLoadStripe) {
      setClientSecret("");
      setPaymentIntentId("");
      setInitError("");
      return undefined;
    }

    const createIntent = async () => {
      try {
        setInitError("");
        const response = await fetch(`${API_BASE_URL}/order/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items: productIDs,
            deliveryMethodId: selectedDeliveryMethod._id,
            couponName: validCoupon?.name || "nil",
            shipping: shippingAddress,
            description,
            policyAccepted: true,
            policyAcceptedAt,
            policyVersion: POLICY_VERSION,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data?.clientSecret) {
          throw new Error(data?.message || "未能初始化結帳。");
        }

        if (!ignore) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId || "");
        }
      } catch (error) {
        if (!ignore) {
          setClientSecret("");
          setPaymentIntentId("");
          setInitError(error.message || "未能初始化結帳。");
          toast.error(error.message || "未能初始化結帳。");
        }
      }
    };

    createIntent();

    return () => {
      ignore = true;
    };
  }, [
    currentUser,
    description,
    hasBillingAddress,
    hasShippingAddress,
    policyAcceptedAt,
    productItems.length,
    productIDs,
    selectedDeliveryMethod,
    shouldLoadStripe,
    shippingAddress,
    userEmail,
    validCoupon,
  ]);

  if (!productItems.length) {
    return (
      <CheckoutState
        eyebrow="結帳"
        title="購物車是空的。"
        body="先挑選想要的商品，再進入付款流程。"
        ctaLabel="繼續選購"
        ctaTo="/shop"
      />
    );
  }

  if (!selectedDeliveryMethod) {
    return (
      <CheckoutState
        eyebrow="送貨方式"
        title="請先選擇送貨方式。"
        body="請先返回購物車選擇送貨方式或本地自取，系統才會計算完整總額。"
        ctaLabel="返回購物車"
        ctaTo="/cart"
      />
    );
  }

  if (!currentUser) {
    return (
      <CheckoutState
        eyebrow="需要登入"
        title="請先登入以繼續付款。"
        body="目前付款流程會使用你的帳戶電郵建立付款與訂單紀錄。登入後即可繼續安全付款。"
        ctaLabel="登入"
        ctaTo="/sign-in?redirect=checkout-details"
      />
    );
  }

  if (hasExpiredCoupon) {
    return (
      <CheckoutState
        eyebrow="優惠碼"
        title="優惠碼已過期。"
        body="請返回購物車移除已過期優惠碼，然後再繼續付款。"
        ctaLabel="返回購物車"
        ctaTo="/cart"
      />
    );
  }

  if (!hasShippingAddress || !hasBillingAddress) {
    return (
      <CheckoutState
        eyebrow="結帳資料"
        title="請先完成地址資料。"
        body="請先返回上一頁填寫送貨及帳單資料，之後再進入付款。"
        ctaLabel="返回資料頁"
        ctaTo="/checkout-details"
      />
    );
  }

  if (initError) {
    return (
      <CheckoutState
        eyebrow="結帳"
        title="暫時未能開始付款。"
        body={initError}
        ctaLabel="返回資料頁"
        ctaTo="/checkout-details"
      />
    );
  }

  if (!policyAccepted) {
    return (
      <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-5">
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-8 shadow-[0_12px_28px_rgba(24,24,27,0.04)] dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              安全付款
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              付款前確認政策
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">
              請先閱讀並同意退款、退貨、送貨及自取政策，然後即可載入安全付款表單。
            </p>
            <Link
              to="/checkout-details"
              className="mt-6 inline-flex text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              &larr; 返回資料頁
            </Link>
          </div>

          {renderPolicyAgreement()}
        </div>
      </main>
    );
  }

  if (!clientSecret) {
    return (
      <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] dark:border-zinc-800 dark:bg-zinc-950 sm:px-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
            安全付款
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            正在準備結帳...
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-300">
            正在準備付款頁面與訂單摘要，請稍候。
          </p>
        </div>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 dark:bg-zinc-950 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] dark:border-zinc-800 dark:bg-zinc-950 sm:px-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              安全付款
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              正在載入付款表單...
            </h1>
            <p className="mt-4 text-zinc-600 dark:text-zinc-300">正在載入付款元件，請稍候。</p>
          </div>
        </main>
      }
    >
      <StripeCheckoutSurface
        clientSecret={clientSecret}
        paymentIntentId={paymentIntentId}
        policyAccepted={policyAccepted}
        policyAcceptedAt={policyAcceptedAt}
        policyVersion={POLICY_VERSION}
        policyAgreement={renderPolicyAgreement()}
      />
    </Suspense>
  );
};
