import React from "react";

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
};

const shortenId = (id = "") => {
  if (!id) return "N/A";
  return `#${id.slice(-8).toUpperCase()}`;
};

const getStatusClasses = (status = "") => {
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

const ListOfOrders = ({ orders, openOrderDetails = () => {} }) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const isEmpty = safeOrders.length === 0;

  if (isEmpty) {
    return (
      <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          No orders yet.
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          There are no orders to display right now.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="hidden overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr_140px] gap-4 border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          <span>Order</span>
          <span>Date</span>
          <span>Status</span>
          <span>Payment</span>
          <span>Total</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {safeOrders.map((order) => {
            const paymentLabel = paymentStatusLabel(order);

            return (
              <article
                key={order._id}
                className="grid grid-cols-[1.1fr_1fr_1fr_1fr_1fr_140px] gap-4 px-6 py-5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50/60 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
              >
                <div>
                  <p className="font-semibold text-zinc-950 dark:text-white">
                    {shortenId(order._id)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {order?.cartItems?.filter((item) => item.category !== "Shipping").length || 0} items
                  </p>
                </div>

                <div>
                  <p>{order.orderDate || "N/A"}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {order.orderTime || ""}
                  </p>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus || "Processing"}
                  </span>
                </div>

                <div className="text-zinc-600 dark:text-zinc-300">
                  {paymentLabel || "—"}
                </div>

                <div className="font-medium text-zinc-950 dark:text-white">
                  {formatCurrency(order.orderAmount)}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => openOrderDetails(order._id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
                  >
                    View details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:hidden">
        {safeOrders.map((order) => {
          const paymentLabel = paymentStatusLabel(order);

          return (
              <article
                key={order._id}
              className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Order
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {shortenId(order._id)}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus || "Processing"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Date</span>
                  <span className="text-right text-zinc-950 dark:text-white">
                    {order.orderDate || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Payment</span>
                  <span className="text-right text-zinc-950 dark:text-white">
                    {paymentLabel || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Total</span>
                  <span className="text-right font-medium text-zinc-950 dark:text-white">
                    {formatCurrency(order.orderAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openOrderDetails(order._id)}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                View details
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
};

export default ListOfOrders;
