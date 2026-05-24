import React, { useEffect, useState } from "react";
// import Card from "../../card/Card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { createCoupon, getCoupons } from "../../../redux/features/coupon/couponSlice";
// import Loader from "../../loader/Loader";
import { toast } from "react-toastify";

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
      return toast.error("Coupon must be up to 6 characters");
    }
    if (discount < 1) {
      return toast.error("Discount must be greater than one");
    }

    const formData = {
      name,
      discount,
      expiresAt,
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
              <h3 className="admin-taxonomy-panel-title">Create Coupon</h3>
              <p className="admin-taxonomy-panel-subtitle">Use the form to create a discount code.</p>
          </div>
          <form onSubmit={saveCoupon} className="admin-taxonomy-form">
              <div className="admin-taxonomy-field">
                  <label className="admin-taxonomy-label">Coupon Name</label>
                  <input
                      type="text"
                      placeholder="Coupon name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      required
                      className="admin-taxonomy-input" 
                  />
              </div>
              <div className="admin-taxonomy-field">
                  <label className="admin-taxonomy-label">Discount %</label>
                  <input
                      type="number"
                      placeholder="Coupon Discount"
                      name="discount"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      required
                      className="admin-taxonomy-input" 
                  />
              </div>
              <div className="admin-taxonomy-field">
                  <label className="admin-taxonomy-label">Expiry Date</label>
                  <DatePicker
                      selected={expiresAt}
                      value={expiresAt}
                      onChange={(date) => setExpiresAt(date)}
                      required
                      className="admin-taxonomy-input admin-taxonomy-date"
                  />
              </div>
              <button
                  type="submit"
                  className="admin-taxonomy-button"
              >
                  Save Coupon
              </button>
          </form>
      </div>
    </>

  );
};

export default CreateCoupon;
