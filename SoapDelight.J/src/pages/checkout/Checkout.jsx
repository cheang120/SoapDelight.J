import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { extractIdAndCartQuantity } from "../../utils";
import {
  selectCartItems,
  selectCartTotalAmount,
  selectProductCartItems,
  selectSelectedDeliveryMethod,
} from "../../redux/features/cart/cartSlice";
import {
  selectBillingAddress,
  selectShippingAddress,
} from "../../redux/features/checkout/checkoutSlice";
import { isCouponValid } from "../../redux/features/coupon/couponSlice";
import { API_BASE_URL } from "../../utils/apiBase";

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
  const [initError, setInitError] = useState("");

  const cartItems = useSelector(selectCartItems);
  const productItems = useSelector(selectProductCartItems);
  const totalAmount = useSelector(selectCartTotalAmount);
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
  const productIDs = useMemo(() => extractIdAndCartQuantity(cartItems), [cartItems]);
  const description = `eShop payment: email: ${userEmail}, Amount: ${totalAmount}`;
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
    !hasExpiredCoupon;
  useEffect(() => {
    let ignore = false;

    if (
      !currentUser ||
      !productItems.length ||
      !selectedDeliveryMethod ||
      !hasShippingAddress ||
      !hasBillingAddress ||
      hasExpiredCoupon
    ) {
      setClientSecret("");
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
            userEmail,
            shipping: shippingAddress,
            billing: effectiveBillingAddress,
            description,
            coupon: validCoupon || { name: "nil" },
          }),
        });

        const data = await response.json();
        if (!response.ok || !data?.clientSecret) {
          throw new Error(data?.message || "未能初始化結帳。");
        }

        if (!ignore) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        if (!ignore) {
          setClientSecret("");
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
    hasExpiredCoupon,
    hasShippingAddress,
    effectiveBillingAddress,
    productItems.length,
    productIDs,
    selectedDeliveryMethod,
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
      <StripeCheckoutSurface clientSecret={clientSecret} />
    </Suspense>
  );
};
