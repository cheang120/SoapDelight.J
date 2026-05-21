import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../../redux/features/order/OrderSlice";
import Loader from "../../components/Loader";
import OrderDetailsComp from "./OrderDetailsComp";

const SignInPrompt = () => (
  <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
      Sign in to view this order.
    </h2>
    <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
      登入後即可查看完整訂單資料與收據內容。
    </p>
    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        to="/sign-in"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        Sign In
      </Link>
      <Link
        to="/shop"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
      >
        Continue Shopping
      </Link>
    </div>
  </div>
);

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isLoading, isError, message, order } = useSelector(
    (state) => state.order
  );
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentUser && id) {
      dispatch(getOrder(id));
    }
  }, [dispatch, currentUser, id]);

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {!currentUser ? (
          <SignInPrompt />
        ) : isLoading && !order ? (
          <Loader />
        ) : isError ? (
          <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {message || "We couldn't load this order right now."}
          </div>
        ) : (
          <OrderDetailsComp order={order} orderPageLink="/order-history" />
        )}
      </div>
    </main>
  );
};

export default OrderDetails;
