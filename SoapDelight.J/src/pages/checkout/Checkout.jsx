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
// import { selectUser } from "../../redux/features/auth/authSlice";


// import CompletePage from "./CompletePage";

const stripePromise = loadStripe(import.meta.env.VITE_REACT_APP_STRIPE_PK);


export const Checkout = () => {
    const [message,setMessage] = useState("Initializing checkout...")
    const [clientSecret, setClientSecret] = useState("");
    // const [dpmCheckerLink, setDpmCheckerLink] = useState("");
    const {cartItems, cartTotalAmount} = useSelector((state) => state.cart);
    const totalAmount = useSelector(selectCartTotalAmount);
    const { currentUser } = useSelector((state) => state.user);
    // console.log(currentUser);
    // const user = useSelector(selectUser);
    // console.log(user);
    const customerEmail = currentUser.email;
    // console.log(customerEmail);

    const shippingAddress = useSelector(selectShippingAddress);
    const billingAddress = useSelector(selectBillingAddress);
    const { coupon } = useSelector((state) => state.coupon);
    const description = `eShop payment: email: ${customerEmail}, Amount: ${totalAmount}`;


    const productIDs = extractIdAndCartQuantity(cartItems)
  
    useEffect(() => {
        // const amountInCents = Math.round(totalAmount * 100);
      fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/order/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            items: productIDs,
            userEmail: customerEmail,
            shipping: shippingAddress,
            billing: billingAddress,
            description,
            coupon,
            // amount: amountInCents,
            }),
        })
            .then((res) => {
                if (res.ok) {
                    return res.json()
                }
                return res.json().then((json) => Promise.reject(json))
            })
            .then((data) => { 
                setClientSecret(data.clientSecret);
                // setDpmCheckerLink(data.dpmCheckerLink);
            })
            .catch((error) => {
                console.error("Checkout initialization error:", error); // Log the error details
                setMessage("Failed to initialize checkout!")
                toast.error("Something went wrong!")
            })
    }, []);
  
    const appearance = {
      theme: 'stripe',
    };

    const options = {
      clientSecret,
      appearance,
    };
  
    return (
        <>
        {/* <pre>{JSON.stringify(newCartItems, null, 2)}</pre> */}
        <section>
            <div className="container">
                {!clientSecret && <h3>{message}</h3>}
            </div>
        </section>
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        )}
      </>
    );
}
