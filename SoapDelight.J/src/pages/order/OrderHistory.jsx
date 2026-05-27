import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getOrders } from "../../redux/features/order/OrderSlice";
import Loader from "../../components/Loader";
import ListOfOrders from "./ListOfOrder";

const EmptyState = () => (
  <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
      你暫時未有訂單。
    </h2>
    <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
      你暫時未有訂單。
    </p>
    <Link
      to="/shop"
      className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      繼續選購
    </Link>
  </div>
);

const SignInPrompt = () => (
  <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
      請登入以查看訂單。
    </h2>
    <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
      登入後即可查看訂單紀錄與詳細資料。
    </p>
    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        to="/sign-in"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        登入
      </Link>
      <Link
        to="/shop"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
      >
        繼續選購
      </Link>
    </div>
  </div>
);

const OrderHistory = () => {
  const { isLoading, isError, message, orders } = useSelector(
    (state) => state.order
  );
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentUser) {
      dispatch(getOrders());
    }
  }, [dispatch, currentUser]);

  const openOrderDetails = (id) => {
    navigate(`/order-details/${id}`);
  };

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-700">
            訂單
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            訂單紀錄
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            查看近期購買紀錄、訂單狀態及完整收據。
          </p>
        </section>

        {!currentUser ? (
          <SignInPrompt />
        ) : isLoading ? (
          <Loader />
        ) : isError ? (
          <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {message || "暫時未能載入訂單。"}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <ListOfOrders orders={orders} openOrderDetails={openOrderDetails} />
        )}
      </div>
    </main>
  );
};

export default OrderHistory;
