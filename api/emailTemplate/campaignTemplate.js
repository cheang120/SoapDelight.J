export const campaignEmailTemplate = ({
  title,
  message,
  couponCode,
  buttonLabel,
  buttonLink,
  unsubscribeUrl,
} = {}) => {
  const body = {
    intro: [
      "Hi,",
      title || "SoapDelight.J update",
      message || "We have an update from SoapDelight.J.",
    ],
    outro: [
      "You are receiving this email because you subscribed to SoapDelight.J updates.",
      unsubscribeUrl
        ? `Unsubscribe from these updates: ${unsubscribeUrl}`
        : "You can update your subscription preferences in your account.",
    ],
  };

  if (couponCode) {
    body.table = {
      title: "Special offer",
      data: [
        {
          "Coupon code": couponCode,
          Note: "Apply this code at checkout while the offer is available.",
        },
      ],
      columns: {
        customWidth: {
          "Coupon code": "35%",
          Note: "65%",
        },
      },
    };
  }

  if (buttonLink) {
    body.action = {
      instructions: "Open SoapDelight.J to view this update:",
      button: {
        color: "#18181b",
        text: buttonLabel || "Shop Now",
        link: buttonLink,
      },
    };
  }

  return { body };
};
