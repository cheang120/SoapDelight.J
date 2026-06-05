import React, { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";

const StripeCheckoutSurface = ({
  clientSecret,
  paymentIntentId,
  policyAccepted,
  policyAcceptedAt,
  policyVersion,
  policyAgreement,
}) => {
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
      <CheckoutForm
        paymentIntentId={paymentIntentId}
        policyAccepted={policyAccepted}
        policyAcceptedAt={policyAcceptedAt}
        policyVersion={policyVersion}
        policyAgreement={policyAgreement}
      />
    </Elements>
  );
};

export default StripeCheckoutSurface;
