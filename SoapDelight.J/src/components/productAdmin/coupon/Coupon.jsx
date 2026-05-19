import React from "react";
import CreateCoupon from "./CreateCoupon";
import CouponList from "./CouponList";
import "./Coupon.scss";

const Coupon = () => {
  window.scrollTo(0, 0);
  return (
    <section>
      <div className="container coupon min-h-screen">
        <CreateCoupon />
        <CouponList />

      </div>
    </section>
  );
};

export default Coupon;
