import React, { useEffect } from "react";
import CreateCoupon from "./CreateCoupon";
import CouponList from "./CouponList";
import "./Coupon.scss";

const Coupon = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="admin-taxonomy-page">
      <header className="admin-taxonomy-header">
        <div className="admin-taxonomy-copy">
          <p className="admin-taxonomy-eyebrow">COUPON</p>
          <h2 className="admin-taxonomy-title">Create Coupon</h2>
          <p className="admin-taxonomy-subtitle">
            Create and manage discount codes.
          </p>
        </div>
      </header>

      <div className="admin-taxonomy-stack">
        <CreateCoupon />

        <CouponList />
      </div>
    </section>
  );
};

export default Coupon;
