import React, { useEffect, useState } from "react";
import styles from "./CheckoutForm.module.scss"
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import Card from "../../card/Card";
import CheckoutSummary from "../checkoutSummary/CheckoutSummary";
import { Spinner } from "../../Loader";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCartItems, selectCartTotalAmount } from "../../../redux/features/cart/cartSlice";
import { selectPaymentMethod, selectShippingAddress } from "../../../redux/features/checkout/checkoutSlice";
import { createOrder } from "../../../redux/features/order/OrderSlice";

export default function CheckoutForm({dpmCheckerLink}) {
  const stripe = useStripe();
  const elements = useElements();
  const { coupon } = useSelector((state) => state.coupon);

  const [email, setEmail] = useState("")
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const shippingAddress = useSelector(selectShippingAddress);
  const paymentMethod = useSelector(selectPaymentMethod);

  const cartItems = useSelector(selectCartItems);
  const cartTotalAmount = useSelector(selectCartTotalAmount);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }
  }, [stripe]);

  const saveOrder = async () => {
    // console.log("Order saved!");
    const today = new Date();
    const formData = {
      orderDate: today.toDateString(),
      orderTime: today.toLocaleTimeString(),
      orderAmount: cartTotalAmount,
      orderStatus: "Order Placed...",
      cartItems,
      shippingAddress,
      paymentMethod,
      coupon: coupon != null ? coupon : { name: "nil" },
    };
    // console.log(formData);
    dispatch(createOrder(formData));
    navigate("/checkout-success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null)

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    await stripe.confirmPayment({
        elements, 
        confirmParams: {
            return_url: `${import.meta.env.VITE_REACT_APP_FRENTEND_URL}/checkout-success`,
        },
        redirect:"if_required"
    })
    .then((result) => {
        // ok - paymentIntent // bad - error
        if (result.error) {
          toast.error(result.error.message);
          setMessage(result.error.message);
          return;
        }
        if (result.paymentIntent) {
          if (result.paymentIntent.status === "succeeded") {
            setIsLoading(false);
            toast.success("Payment successful");
            saveOrder();
          }
        }
      });

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs"
  }

  return (
    <>
    <section className="min-h-screen">
      <div className={`container m-auto ${styles.checkout}`}>
        <h2>Checkout</h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div>
            <Card cardClass={styles.card}>
              <CheckoutSummary />
            </Card>
          </div>
          <div>
            <Card cardClass={`${styles.card} ${styles.pay}`}>
              <h3>Stripe Checkout</h3>
              <PaymentElement
                id={styles["payment-element"]} 
                options={paymentElementOptions}
              />
              <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className={styles.button}
              >
                <span id="button-text">
                  {isLoading ? (
                    // <img
                    //   src={spinnerImg}
                    //   alt="Loading..."
                    //   style={{ width: "20px" }}
                    // />
                    <Spinner />
                  ) : (
                    "Pay now"
                  )}
                </span>
              </button>
              {/* Show any error or success messages */}
              {message && <div id={styles["payment-message"]}>{message}</div>}
            </Card>
          </div>
        </form>
      </div>
    </section>
    </>
  );
}