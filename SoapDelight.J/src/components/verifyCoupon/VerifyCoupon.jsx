import React, { useState } from 'react'
import "./VerifyCoupon.scss"
import { useDispatch, useSelector } from 'react-redux';
import { REMOVE_COUPON, getCoupon, isCouponValid } from '../../redux/features/coupon/couponSlice';
import { CALCULATE_SUBTOTAL } from '../../redux/features/cart/cartSlice';


export const CartDiscount = () => {
    const { coupon } = useSelector((state) => state.coupon);
    const hasValidCoupon = isCouponValid(coupon);
  
    return (
      <>
        {coupon != null && hasValidCoupon && (
          <div className="coupon-msg">
            <p>
              Coupon <b>{coupon?.name}</b> applied
            </p>
            <span>
              {coupon?.discount}% off eligible items
            </span>
          </div>
        )}
        {coupon != null && !hasValidCoupon && (
          <div className="coupon-msg">
            <p>
              Coupon <b>{coupon?.name}</b> has expired
            </p>
            <span>Please remove it before checkout.</span>
          </div>
        )}
      </>
    );
  };

const VerifyCoupon = () => {
    const dispatch = useDispatch();
    const [couponName, setCouponName] = useState("");
    const [showForm, setShowForm] = useState(false);
    const { coupon, isLoading } = useSelector((state) => state.coupon);

    // const verifyCoupon = async (e) => {
    //     e.preventDefault();
    //     console.log(couponName);
    //     dispatch(getCoupon(couponName));
    // };

    const verifyCoupon = async (e) => {
        e.preventDefault();
        const result = await dispatch(getCoupon(couponName));
        if (getCoupon.fulfilled.match(result) && isCouponValid(result.payload)) {
          dispatch(CALCULATE_SUBTOTAL({ coupon: result.payload }));
          setShowForm(false);
          setCouponName("");
        } else {
          dispatch(CALCULATE_SUBTOTAL({ coupon: null }));
        }
      };

    const removeCoupon = async () => {
        dispatch(REMOVE_COUPON());
        dispatch(CALCULATE_SUBTOTAL({ coupon: null }));
      };

  return (
    <div className="coupon-box">
        <CartDiscount />
    
      <div className='coupon-head'>
        <p>Coupon</p>
        {coupon === null ? (
          <button
            type="button"
            className="coupon-link"
            onClick={() => setShowForm(true)}
          >
            Add Coupon
          </button>
        ) : (
          <button type="button" className="coupon-link danger" onClick={removeCoupon}>
            Remove Coupon
          </button>
        )}

      </div>

      {showForm && (
        <form onSubmit={verifyCoupon} className={"coupon-form"}>
          <input
            type="text"
            placeholder="Coupon name"
            name="name"
            value={couponName}
            onChange={(e) => setCouponName(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Checking..." : "Apply"}
          </button>
        </form>
      )}
    </div>
  )
}

export default VerifyCoupon
