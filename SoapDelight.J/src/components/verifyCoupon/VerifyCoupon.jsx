import React, { useState } from 'react'
import "./VerifyCoupon.scss"
import { useDispatch, useSelector } from 'react-redux';

const VerifyCoupon = () => {
    const dispatch = useDispatch();
    const [couponName, setCouponName] = useState("");
    const [showForm, setShowForm] = useState(false);
    const { coupon, isLoadng } = useSelector((state) => state.coupon);
    const { cartTotalAmount, fixedCartTotalAmount } = useSelector(
      (state) => state.cart
    );

    const verifyCoupon = async (e) => {
        e.preventDefault();
    
        // dispatch(getCoupon(couponName));
    };

    const removeCoupon = async () => {
        // dispatch(REMOVE_COUPON());
      };

  return (
    <>
      <div className='--flex-between'>
        <p>Have a coupon?</p>
        {coupon === null ? (
          <p
            className="--cursor --color-primary"
            onClick={() => setShowForm(true)}
          >
            <b>Add Coupon</b>
          </p>
        ) : (
          <p className="--cursor --color-danger" onClick={removeCoupon}>
            <b>Remove Coupon</b>
          </p>
        )}

      </div>

      {showForm && (
        <form onSubmit={verifyCoupon} className={"coupon-form --form-control"}>
          <input
            type="text"
            placeholder="Coupon name"
            name="name"
            value={couponName}
            onChange={(e) => setCouponName(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" className="--btn --btn-primary mt-0">
            Verify
          </button>
        </form>
      )}
    </>
  )
}

export default VerifyCoupon
