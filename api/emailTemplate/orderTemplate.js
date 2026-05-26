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
  deliveryName = "Delivery information not available",
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
      item: "Product subtotal / 商品小計",
      detail: "",
      amount: formatMoney(productSubtotal),
    },
  ];

  if (couponApplied) {
    summaryRows.push(
      {
        item: "Coupon / 優惠",
        detail: `${coupon.name} (${Number(coupon.discount || 0)}% off)`,
        amount: `-${formatMoney(couponDiscountAmount)}`,
      },
      {
        item: "Subtotal after discount / 優惠後小計",
        detail: "",
        amount: formatMoney(subtotalAfterDiscount),
      }
    );
  }

  summaryRows.push(
    {
      item: "Delivery / 送貨方式",
      detail: deliveryName || "Delivery information not available",
      amount: "",
    },
    {
      item: "Delivery fee / 運費",
      detail: "",
      amount: formatMoney(deliveryFee),
    },
    {
      item: "Total / 總數",
      detail: "",
      amount: formatMoney(finalTotal),
    }
  );

  const email = {
    body: {
      name: customerName || "Customer",
      intro:
        "Thank you for your order. Your payment has been received and your order is now being processed.",
      table: [
        {
          title: "Order items",
          data:
            validProductItems.length > 0
              ? validProductItems.map((item) => ({
                  Product: item?.name || "Product",
                  "Unit price": formatMoney(item?.price),
                  Quantity: Number(item?.cartQuantity || 0),
                  "Item total": formatMoney(getItemTotal(item)),
                }))
              : [
                  {
                    Product: "No product items available",
                    "Unit price": formatMoney(0),
                    Quantity: 0,
                    "Item total": formatMoney(0),
                  },
                ],
          columns: {
            customWidth: {
              Product: "40%",
              "Unit price": "20%",
              Quantity: "15%",
              "Item total": "25%",
            },
            customAlignment: {
              "Unit price": "right",
              Quantity: "right",
              "Item total": "right",
            },
          },
        },
        {
          title: "Order summary",
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
        "Order date": orderDate || "N/A",
        "Order time": orderTime || "N/A",
      },
      action: {
        instructions:
          "You can check the status of your order and more in your dashboard:",
        button: {
          color: "#18181b",
          text: "Go to Dashboard",
          link: "https://soapdelight-j.onrender.com/",
        },
      },
      outro:
        "We will contact you if any further information is required. Thank you for shopping with SoapDelight.J.",
    },
  };

  return email;
};
