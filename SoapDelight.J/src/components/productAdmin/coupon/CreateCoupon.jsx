import React, { useEffect, useState } from "react";
// import Card from "../../card/Card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { createCoupon, getCoupons } from "../../../redux/features/coupon/couponSlice";
// import Loader from "../../loader/Loader";
import { toast } from "react-toastify";

const normalizeExpiryToEndOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const CreateCoupon = ({reloadCoupon}) => {
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [expiresAt, setExpiresAt] = useState(new Date());

  const { isLoading, coupons } = useSelector((state) => state.coupon);
  const dispatch = useDispatch();

  const saveCoupon = async (e) => {
    e.preventDefault();
    // console.log(name, discount, expiresAt);
    if (name.length < 6) {
      return toast.error("優惠碼至少需要 6 個字元");
    }
    if (discount < 1) {
      return toast.error("折扣必須大於 1");
    }

    const normalizedExpiry = normalizeExpiryToEndOfDay(expiresAt);
    if (normalizedExpiry.getTime() <= Date.now()) {
      return toast.error("到期日不可早於今天。");
    }

    const formData = {
      name,
      discount,
      expiresAt: normalizedExpiry,
    };
    // console.log(formData);
    dispatch(createCoupon(formData));
    setName("");
    setDiscount(0);

  };

  useEffect(() => {
    dispatch(getCoupons());
  }, [dispatch]);
  return (
    <>
      <div className="admin-taxonomy-panel">
          <div className="admin-taxonomy-panel-copy">
              <h3 className="admin-taxonomy-panel-title">建立優惠券</h3>
              <p className="admin-taxonomy-panel-subtitle">使用表格建立折扣優惠碼。</p>
          </div>
          <form onSubmit={saveCoupon} className="admin-taxonomy-form">
              <div className="admin-taxonomy-field">
                  <label className="admin-taxonomy-label">優惠碼名稱</label>
                  <input
                      type="text"
                      placeholder="優惠碼名稱"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      required
                      className="admin-taxonomy-input" 
                  />
              </div>
              <div className="admin-taxonomy-field">
                  <label className="admin-taxonomy-label">折扣 %</label>
                  <input
                      type="number"
                      placeholder="優惠折扣"
                      name="discount"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      required
                      className="admin-taxonomy-input" 
                  />
              </div>
              <div className="admin-taxonomy-field">
                  <label className="admin-taxonomy-label">到期日</label>
                  <DatePicker
                      selected={expiresAt}
                      value={expiresAt}
                      onChange={(date) => setExpiresAt(date)}
                      minDate={new Date()}
                      required
                      className="admin-taxonomy-input admin-taxonomy-date"
                  />
              </div>
              <button
                  type="submit"
                  className="admin-taxonomy-button"
              >
                  儲存優惠券
              </button>
          </form>
      </div>
    </>

  );
};

export default CreateCoupon;
