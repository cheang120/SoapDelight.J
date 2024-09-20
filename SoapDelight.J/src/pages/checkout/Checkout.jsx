import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import "./Checkout.scss"
import CheckoutForm from "../../components/checkout/checkoutForm/CheckoutForm";
import { extractIdAndCartQuantity } from "../../utils";
import { selectCartItems, selectCartTotalAmount } from "../../redux/features/cart/cartSlice";
import { useSelector } from "react-redux";
import { selectBillingAddress, selectShippingAddress } from "../../redux/features/checkout/checkoutSlice";
import { toast } from "react-toastify";


// import CompletePage from "./CompletePage";

const stripePromise = loadStripe(import.meta.env.VITE_REACT_APP_STRIPE_PK);


export const Checkout = ({selectedShippingFee}) => {
  const [clientSecret, setClientSecret] = useState("");
  const { cartItems } = useSelector((state) => state.cart);
  const totalAmount = useSelector(selectCartTotalAmount);
  const { currentUser } = useSelector((state) => state.user);
  const shippingAddress = useSelector(selectShippingAddress);
  const billingAddress = useSelector(selectBillingAddress);
  const { coupon } = useSelector((state) => state.coupon);
  const description = `eShop payment: email: ${currentUser.email}, Amount: ${totalAmount}`;

  const productIDs = extractIdAndCartQuantity(cartItems);
  

  useEffect(() => {
    fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/order/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: productIDs,
        userEmail: currentUser.email,
        shipping: shippingAddress,
        billing: billingAddress,
        description,
        coupon,
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      setClientSecret(data.clientSecret);
    })
    .catch((error) => {
      console.error("Checkout initialization error:", error);
      toast.error("Something went wrong!");
    });
  }, []);

  const appearance = { theme: "stripe" };
  const options = { clientSecret, appearance };
  // console.log(selectedShippingFee);

  return (
    <>
      <section>
        <div className="container">
          {!clientSecret && <h3>Initializing checkout...</h3>}
        </div>
      </section>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </>
  );
};

