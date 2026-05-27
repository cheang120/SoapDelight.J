import React, { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./CheckoutForm.module.scss";
import CheckoutSummary from "../checkoutSummary/CheckoutSummary";
import { Spinner } from "../../Loader";
import {
  CLEAR_CART,
  saveCartDB,
  selectCartItems,
  selectCartTotalAmount,
} from "../../../redux/features/cart/cartSlice";
import {
  selectPaymentMethod,
  selectShippingAddress,
} from "../../../redux/features/checkout/checkoutSlice";
import { isCouponValid } from "../../../redux/features/coupon/couponSlice";
import { createOrder } from "../../../redux/features/order/OrderSlice";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { coupon } = useSelector((state) => state.coupon);
  const cartItems = useSelector(selectCartItems);
  const cartTotalAmount = useSelector(selectCartTotalAmount);
  const shippingAddress = useSelector(selectShippingAddress);
  const paymentMethod = useSelector(selectPaymentMethod);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const saveOrder = async () => {
    const today = new Date();
    const formData = {
      orderDate: today.toDateString(),
      orderTime: today.toLocaleTimeString(),
      orderAmount: cartTotalAmount,
      orderStatus: "Order Placed...",
      cartItems,
      shippingAddress,
      paymentMethod,
      coupon: isCouponValid(coupon) ? coupon : { name: "nil" },
    };

    await dispatch(createOrder(formData)).unwrap();

    try {
      await dispatch(saveCartDB({ cartItems: [] })).unwrap();
    } catch {
      // Keep checkout success even if saved cart cleanup fails.
    }

    dispatch(CLEAR_CART());
    navigate("/checkout-success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!stripe || !elements) {
      return;
    }

    if (coupon && !isCouponValid(coupon)) {
      const errorMessage = "優惠碼已過期，請移除後再試。";
      toast.error(errorMessage);
      setMessage(errorMessage);
      return;
    }

    setIsLoading(true);

    const frontendUrl =
      import.meta.env.VITE_REACT_APP_FRONTEND_URL ||
      import.meta.env.VITE_REACT_APP_FRENTEND_URL ||
      window.location.origin;

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${frontendUrl}/checkout-success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        const errorMessage = result.error.message || "未能完成付款。";
        toast.error(errorMessage);
        setMessage(errorMessage);
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        toast.success("付款成功");
        await saveOrder();
      }
    } catch (error) {
      const errorMessage = error.message || "未能完成付款。";
      toast.error(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>安全付款</p>
            <h1>付款</h1>
            <p className={styles.lead}>
              使用 Stripe 完成安全付款，並再次確認你的訂單摘要。
            </p>
          </div>
          <Link to="/checkout-details" className={styles.secondaryLink}>
            &larr; 返回資料頁
          </Link>
        </div>

        <div className={styles.layout}>
          <section className={styles.paymentCard}>
            <div className={styles.sectionHeader}>
              <h2>付款資料</h2>
              <p>付款將透過 Stripe 安全處理。</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.paymentElement}>
                <PaymentElement options={{ layout: "tabs" }} />
              </div>

              <button
                disabled={isLoading || !stripe || !elements}
                type="submit"
                className={styles.button}
              >
                <span>{isLoading ? <Spinner /> : "立即付款"}</span>
              </button>

              {message && <div className={styles.message}>{message}</div>}
            </form>
          </section>

          <aside className={styles.summaryColumn}>
            <div className={styles.summaryCard}>
              <CheckoutSummary title="訂單摘要" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
