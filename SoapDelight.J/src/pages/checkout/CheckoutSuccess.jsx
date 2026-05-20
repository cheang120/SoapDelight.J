import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  CALCULATE_TOTAL_QUANTITY,
  CLEAR_CART,
} from "../../redux/features/cart/cartSlice";

const CheckoutSuccess = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(CLEAR_CART());
    dispatch(CALCULATE_TOTAL_QUANTITY());
    toast.dismiss();
  }, [dispatch]);

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_12px_28px_rgba(24,24,27,0.04)] sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <FaCheckCircle size={28} />
        </div>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
          Order Confirmed
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          Checkout Successful
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
          多謝你的選購。訂單已成功建立，我們會按你的資料安排後續處理與通知。
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/shop"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Continue Shopping / 繼續選購
          </Link>
          {currentUser && (
            <Link
              to="/order-history"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-300 px-7 text-sm font-medium text-zinc-900 transition hover:border-zinc-950"
            >
              View Orders / 查看訂單
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default CheckoutSuccess;
