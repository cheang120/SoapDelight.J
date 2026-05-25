import React, { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
};

const shortenId = (id = "") => {
  if (!id) return "N/A";
  return `#${id.slice(-8).toUpperCase()}`;
};

const statusBadgeClass = (status = "") => {
  const normalized = status.toLowerCase();
  if (normalized.includes("deliver")) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (normalized.includes("cancel")) {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }
  return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
};

const paymentStatusLabel = (order) => {
  if (order?.paymentStatus) return order.paymentStatus;
  if (order?.paymentMethod) return order.paymentMethod;
  return null;
};

const OrderDetailsComp = ({ order, orderPageLink, variant = "customer" }) => {
  const pdfRef = useRef();
  const isAdminView = variant === "admin";

  const {
    productItems,
    shippingItem,
    productSubtotal,
    shippingFee,
    couponDiscountAmount,
    effectiveTotal,
  } = useMemo(() => {
    const cartItems = Array.isArray(order?.cartItems) ? order.cartItems : [];
    const shippingItems = cartItems.filter(
      (item) => item?.category === "Shipping"
    );
    const realItems = cartItems.filter((item) => item?.category !== "Shipping");

    const subtotal = realItems.reduce(
      (sum, item) =>
        sum + Number(item?.price || 0) * Number(item?.cartQuantity || 0),
      0
    );
    const deliveryFee = shippingItems.reduce(
      (sum, item) =>
        sum + Number(item?.price || 0) * Number(item?.cartQuantity || 1),
      0
    );
    const baseBeforeDiscount = subtotal + deliveryFee;
    const rawDiscount =
      order?.coupon && order?.coupon?.name !== "nil"
        ? Math.max(0, baseBeforeDiscount - Number(order?.orderAmount || 0))
        : 0;

    return {
      productItems: realItems,
      shippingItem: shippingItems[0] || null,
      productSubtotal: subtotal,
      shippingFee: deliveryFee,
      couponDiscountAmount: rawDiscount,
      effectiveTotal: Number(order?.orderAmount || 0),
    };
  }, [order]);

  const downloadPDF = () => {
    const input = pdfRef.current;
    if (!input) return;

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4", true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imageWidth, pdfHeight / imageHeight);
      const imgX = (pdfWidth - imageWidth * ratio) / 2;
      const imgY = 18;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imageWidth * ratio,
        imageHeight * ratio
      );
      pdf.save("soapDelightInvoice.pdf");
    });
  };

  if (!order) {
    return (
      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 sm:px-8">
        We couldn't find this order.
      </div>
    );
  }

  const paymentLabel = paymentStatusLabel(order);
  const deliveryLabel =
    shippingItem?.name ||
    order?.shippingAddress?.deliveryMethod ||
    order?.shippingAddress?.shippingMethod ||
    "Delivery information not available";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={orderPageLink}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
          Back to Orders
        </Link>
        <button
          type="button"
          onClick={downloadPDF}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Download PDF
        </button>
      </div>

      <div
        ref={pdfRef}
        className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
      >
        <div className="flex flex-col gap-6 border-b border-zinc-100 pb-8 dark:border-zinc-800 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-700">
              Receipt
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Order Details / 訂單詳情
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {shortenId(order._id)}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 md:text-right">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Date
              </p>
              <p className="mt-1 text-zinc-950 dark:text-white">
                {order?.orderDate || "N/A"} {order?.orderTime ? `at ${order.orderTime}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Status
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                  order?.orderStatus
                )}`}
              >
                {order?.orderStatus || "Processing"}
              </span>
            </div>
            {paymentLabel && (
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Payment
                </p>
                <p className="mt-1 text-zinc-950 dark:text-white">{paymentLabel}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-[#fbfcfa] p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Contact
              </p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <p className="font-medium text-zinc-950 dark:text-white">
                  {order?.shippingAddress?.name || "Customer"}
                </p>
                {order?.shippingAddress?.email && <p>{order.shippingAddress.email}</p>}
                {order?.shippingAddress?.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-[#fbfcfa] p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Delivery
              </p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <p className="font-medium text-zinc-950 dark:text-white">
                  {deliveryLabel}
                </p>
                <p>
                  {[order?.shippingAddress?.line1, order?.shippingAddress?.line2]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>
                  {[order?.shippingAddress?.city, order?.shippingAddress?.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>
                  {[order?.shippingAddress?.country, order?.shippingAddress?.postal_code]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Items
              </p>
              <div className="mt-5 space-y-4">
                {productItems.map((item) => {
                  const itemImage = Array.isArray(item?.image) ? item.image[0] : item?.image;
                  const lineTotal =
                    Number(item?.price || 0) * Number(item?.cartQuantity || 0);

                  return (
                    <article
                      key={`${item?._id || item?.name}-${item?.cartQuantity}`}
                      className="flex gap-4 rounded-[1.25rem] border border-zinc-100 p-4 dark:border-zinc-800"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f7f8f4] dark:bg-zinc-900">
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt={item?.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-950 dark:text-white">
                          {item?.name || "Product"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Qty {item?.cartQuantity || 0}
                        </p>
                        <p className="mt-3 text-sm font-medium text-zinc-950 dark:text-white">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>

                        {!isAdminView && (
                          <div className="flex shrink-0 items-end">
                            <Link
                              to={`/review-product/${item?._id}`}
                              className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
                            >
                              Review
                            </Link>
                          </div>
                        )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="rounded-[1.5rem] border border-zinc-200 bg-[#fbfcfa] p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Summary
            </p>
            <div className="mt-5 space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center justify-between gap-4">
                <span>Product subtotal / 商品小計</span>
                <span className="font-medium text-zinc-950 dark:text-white">
                  {formatCurrency(productSubtotal)}
                </span>
              </div>

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Delivery / 送貨方式
                </p>
                <p className="mt-2 text-zinc-950 dark:text-white">{deliveryLabel}</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Delivery fee / 運費</span>
                <span className="font-medium text-zinc-950 dark:text-white">
                  {formatCurrency(shippingFee)}
                </span>
              </div>

              {order?.coupon?.name && order?.coupon?.name !== "nil" && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p>Coupon / 優惠</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {order.coupon.name}
                      {order?.coupon?.discount ? ` (${order.coupon.discount}% off)` : ""}
                    </p>
                  </div>
                  <span className="font-medium text-zinc-950 dark:text-white">
                    {couponDiscountAmount > 0
                      ? `-${formatCurrency(couponDiscountAmount).replace("$", "$")}`
                      : "Applied"}
                  </span>
                </div>
              )}

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-semibold text-zinc-950 dark:text-white">
                    Total / 總數
                  </span>
                  <span className="text-base font-semibold text-zinc-950 dark:text-white">
                    {formatCurrency(effectiveTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                to={orderPageLink}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Back to Orders
              </Link>
              {!isAdminView && (
                <Link
                  to="/shop"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
                >
                  Continue Shopping
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsComp;
