import React, { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";

const StripeCheckoutSurface = ({ clientSecret, paymentIntentId }) => {
  const stripePromise = useMemo(
    () => loadStripe(import.meta.env.VITE_REACT_APP_STRIPE_PK),
    []
  );
  const options = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: "stripe" },
    }),
    [clientSecret]
  );

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm paymentIntentId={paymentIntentId} />
    </Elements>
  );
};

export default StripeCheckoutSurface;
