import React from "react";
import CreateCoupon from "./CreateCoupon";
import CouponList from "./CouponList";
import "./Coupon.scss";

const Coupon = () => {
  window.scrollTo(0, 0);

  const reloadCoupon = () => {
    dispatch(getCategories());
  };
  return (
    <section>
      <div className="container coupon min-h-screen">
      <CreateCoupon reloadCoupon={reloadCoupon} />
        <CouponList />

      </div>
    </section>
  );
};

export default Coupon;

