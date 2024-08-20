import React from "react";
import CreateCoupon from "./CreateCoupon";
import CouponList from "./CouponList";
import "./Coupon.scss";

const Coupon = () => {
  const reloadCoupon = () => {
    dispatch(getCategories());
  };
  return (
    <section>
      <div className="container coupon">
      <CreateCoupon reloadCoupon={reloadCoupon} />
        <CouponList />

      </div>
    </section>
  );
};

export default Coupon;

