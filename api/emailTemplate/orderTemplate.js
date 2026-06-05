const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const getItemTotal = (item) => {
  return Number(item?.price || 0) * Number(item?.cartQuantity || 0);
};

const hasCoupon = (coupon) => {
  return Boolean(coupon?.name && coupon.name !== "nil" && coupon?.discount);
};

export const orderSuccessEmail = ({
  customerName,
  orderDate,
  orderTime,
  productItems = [],
  coupon = { name: "nil" },
  productSubtotal = 0,
  couponDiscountAmount = 0,
  subtotalAfterDiscount = 0,
  deliveryName = "未有送貨資料",
  deliveryFee = 0,
  total = 0,
  orderAmount,
} = {}) => {
  const validProductItems = Array.isArray(productItems) ? productItems : [];
  const couponApplied = hasCoupon(coupon);
  const finalTotal = Number.isFinite(Number(total))
    ? Number(total)
    : Number(orderAmount || 0);
  const summaryRows = [
    {
      item: "商品小計",
      detail: "",
      amount: formatMoney(productSubtotal),
    },
  ];

  if (couponApplied) {
    summaryRows.push(
      {
        item: "優惠",
        detail: `${coupon.name} (${Number(coupon.discount || 0)}%)`,
        amount: `-${formatMoney(couponDiscountAmount)}`,
      },
      {
        item: "優惠後小計",
        detail: "",
        amount: formatMoney(subtotalAfterDiscount),
      }
    );
  }

  summaryRows.push(
    {
      item: "送貨方式",
      detail: deliveryName || "未有送貨資料",
      amount: "",
    },
    {
      item: "運費",
      detail: "",
      amount: formatMoney(deliveryFee),
    },
    {
      item: "總數",
      detail: "",
      amount: formatMoney(finalTotal),
    }
  );

  const email = {
    body: {
      name: customerName || "客人",
      intro: "感謝您的訂購。我們已收到付款，訂單現正處理中。",
      table: [
        {
          title: "訂單商品",
          data:
            validProductItems.length > 0
              ? validProductItems.map((item) => ({
                  商品: item?.name || "未有商品資料",
                  單價: formatMoney(item?.price),
                  數量: Number(item?.cartQuantity || 0),
                  小計: formatMoney(getItemTotal(item)),
                }))
              : [
                  {
                    商品: "未有商品資料",
                    單價: formatMoney(0),
                    數量: 0,
                    小計: formatMoney(0),
                  },
                ],
          columns: {
            customWidth: {
              商品: "40%",
              單價: "20%",
              數量: "15%",
              小計: "25%",
            },
            customAlignment: {
              單價: "right",
              數量: "right",
              小計: "right",
            },
          },
        },
        {
          title: "訂單摘要",
          data: summaryRows,
          columns: {
            customWidth: {
              item: "45%",
              detail: "35%",
              amount: "20%",
            },
            customAlignment: {
              amount: "right",
            },
          },
        },
      ],
      dictionary: {
        訂單日期: orderDate || "未能取得",
        訂單時間: orderTime || "未能取得",
      },
      action: {
        instructions: "您可以登入帳戶查看訂單狀態：",
        button: {
          color: "#18181b",
          text: "查看訂單",
          link: "https://soapdelight-j.onrender.com/",
        },
      },
      outro:
        "如需補充資料，我們會與您聯絡。感謝您支持 SoapDelight.J。",
    },
  };

  return email;
};
