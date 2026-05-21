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
  <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] sm:px-10">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h1>
      <p className="mt-4 text-zinc-600">{body}</p>
      <Link
        to={ctaTo}
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800"
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
  const shouldLoadStripe =
    Boolean(currentUser) &&
    productItems.length > 0 &&
    Boolean(selectedDeliveryMethod) &&
    hasShippingAddress &&
    hasBillingAddress;
  useEffect(() => {
    let ignore = false;

    if (
      !currentUser ||
      !productItems.length ||
      !selectedDeliveryMethod ||
      !hasShippingAddress ||
      !hasBillingAddress
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
            coupon,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data?.clientSecret) {
          throw new Error(data?.message || "Unable to initialize checkout.");
        }

        if (!ignore) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        if (!ignore) {
          setClientSecret("");
          setInitError(error.message || "Unable to initialize checkout.");
          toast.error(error.message || "Unable to initialize checkout.");
        }
      }
    };

    createIntent();

    return () => {
      ignore = true;
    };
  }, [
    coupon,
    currentUser,
    description,
    hasBillingAddress,
    hasShippingAddress,
    effectiveBillingAddress,
    productItems.length,
    productIDs,
    selectedDeliveryMethod,
    shippingAddress,
    userEmail,
  ]);

  if (!productItems.length) {
    return (
      <CheckoutState
        eyebrow="Checkout"
        title="Your cart is empty."
        body="先挑選想要的商品，再進入付款流程。"
        ctaLabel="Continue Shopping / 繼續選購"
        ctaTo="/shop"
      />
    );
  }

  if (!selectedDeliveryMethod) {
    return (
      <CheckoutState
        eyebrow="Delivery Method"
        title="Choose a delivery method first."
        body="請先返回購物車選擇送貨方式或本地自取，系統才會計算完整總額。"
        ctaLabel="Back to Cart / 返回購物車"
        ctaTo="/cart"
      />
    );
  }

  if (!currentUser) {
    return (
      <CheckoutState
        eyebrow="Sign In Required"
        title="Please sign in to continue payment."
        body="目前付款流程會使用你的帳戶電郵建立付款與訂單紀錄。登入後即可繼續安全付款。"
        ctaLabel="Sign In / 登入"
        ctaTo="/sign-in?redirect=checkout-details"
      />
    );
  }

  if (!hasShippingAddress || !hasBillingAddress) {
    return (
      <CheckoutState
        eyebrow="Checkout Details"
        title="Complete your address details first."
        body="請先返回上一頁填寫送貨及帳單資料，之後再進入付款。"
        ctaLabel="Back to Details / 返回資料頁"
        ctaTo="/checkout-details"
      />
    );
  }

  if (initError) {
    return (
      <CheckoutState
        eyebrow="Checkout"
        title="We couldn't start payment just yet."
        body={initError}
        ctaLabel="Back to Details / 返回資料頁"
        ctaTo="/checkout-details"
      />
    );
  }

  if (!clientSecret) {
    return (
      <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] sm:px-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
            Secure Payment
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
            Initializing checkout...
          </h1>
          <p className="mt-4 text-zinc-600">
            正在準備付款頁面與訂單摘要，請稍候。
          </p>
        </div>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] sm:px-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
              Secure Payment
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
              Loading payment form...
            </h1>
            <p className="mt-4 text-zinc-600">正在載入付款元件，請稍候。</p>
          </div>
        </main>
      }
    >
      <StripeCheckoutSurface clientSecret={clientSecret} />
    </Suspense>
  );
};
