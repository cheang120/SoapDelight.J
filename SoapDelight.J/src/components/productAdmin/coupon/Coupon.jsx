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
          <p className="admin-taxonomy-eyebrow">優惠券</p>
          <h2 className="admin-taxonomy-title">建立優惠券</h2>
          <p className="admin-taxonomy-subtitle">
            建立及管理折扣優惠碼。
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
