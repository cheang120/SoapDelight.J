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

// import CompletePage from "./CompletePage";

const stripePromise = loadStripe(import.meta.env.VITE_REACT_APP_STRIPE_PK);


export const Checkout = () => {
    const [clientSecret, setClientSecret] = useState("");
    const [dpmCheckerLink, setDpmCheckerLink] = useState("");
  
    useEffect(() => {
      // Create PaymentIntent as soon as the page loads
      fetch("/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: "xl-tshirt", amount: 1000 }] }),
      })
        .then((res) => res.json())
        .then((data) => { 
          setClientSecret(data.clientSecret);
          // [DEV] For demo purposes only
          setDpmCheckerLink(data.dpmCheckerLink);
        });
    }, []);
  
    const appearance = {
      theme: 'stripe',
    };
    const options = {
      clientSecret,
      appearance,
    };
  
    return (
      <Router>
        <div className="App">
          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <Routes>
                <Route path="/checkout" element={<CheckoutForm dpmCheckerLink={dpmCheckerLink}/>} />
                {/* <Route path="/complete" element={<CompletePage />} /> */}
              </Routes>
            </Elements>
          )}
        </div>
      </Router>
    );
}
