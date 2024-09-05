import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import Confetti from "react-confetti";
import { CALCULATE_TOTAL_QUANTITY, CLEAR_CART } from "../../redux/features/cart/cartSlice";

const CheckoutSuccess = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(CLEAR_CART());
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [dispatch]);

  return (
    <>
      <Confetti />

      <section style={{height:"100vh"}}>
        <div className="container m-auto py-1 px-3">
          <h3 className="mt-14 text-2xl mb-6">Checkout Successful</h3>
          <p className="mb-8">Thank you for your purchase</p>
          <br />

          <button className=" --btn --btn-primary">
            <Link to="/order-history">View Order Status</Link>
          </button>
        </div>
      </section>
    </>
  );
};

export default CheckoutSuccess;