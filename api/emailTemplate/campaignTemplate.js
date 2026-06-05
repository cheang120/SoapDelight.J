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
      "您好，",
      title || "SoapDelight.J 最新消息",
      message || "我們有一則來自 SoapDelight.J 的最新消息。",
    ],
    outro: [
      "您收到此電郵，是因為您已訂閱 SoapDelight.J 的最新消息。",
      unsubscribeUrl
        ? `如需取消訂閱，請按此連結：${unsubscribeUrl}`
        : "您可以登入帳戶更新訂閱偏好。",
    ],
  };

  if (couponCode) {
    body.table = {
      title: "優惠資訊",
      data: [
        {
          優惠碼: couponCode,
          備註: "請於優惠有效期間在結帳時輸入此優惠碼。",
        },
      ],
      columns: {
        customWidth: {
          優惠碼: "35%",
          備註: "65%",
        },
      },
    };
  }

  if (buttonLink) {
    body.action = {
      instructions: "請開啟 SoapDelight.J 查看詳情：",
      button: {
        color: "#18181b",
        text: buttonLabel || "立即查看",
        link: buttonLink,
      },
    };
  }

  return { body };
};
