import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { CALCULATE_SUBTOTAL, selectCartItems, selectCartTotalAmount, selectCartTotalQuantity} from '../../../redux/features/cart/cartSlice';
import Card from '../../card/Card';
import styles from "./CheckoutSummary.module.scss";
import { Link, useLocation } from 'react-router-dom';
import { CartDiscount } from '../../verifyCoupon/VerifyCoupon';


const CheckoutSummary = ({ selectedShippingFee }) => {
    const { coupon } = useSelector((state) => state.coupon);
    const cartItems = useSelector(selectCartItems);
    // console.log(cartItems);
    const cartTotalAmount = useSelector(selectCartTotalAmount);
    const cartTotalQuantity = useSelector(selectCartTotalQuantity);
    const dispatch = useDispatch();

    const location = useLocation();
    // const selectedShippingFee = location.state?.selectedShippingFee || 0;

    useEffect(() => {
        dispatch(CALCULATE_SUBTOTAL({ coupon: coupon }));
    }, [cartItems, dispatch, coupon]);

      // 計算總價 (購物車總額 + 郵寄費)
      // const testShippingFee = 10.99;

      const totalWithShipping = cartTotalAmount;


  // const totalWithShipping = cartTotalAmount + selectedShippingFee +testShippingFee;
  console.log("Received shipping fee:", selectedShippingFee);

  return (
    <div>
      <h3>Checkout Summary</h3>
      <div>
      {cartItems.lenght === 0 ? (
          <>
            <p>No item in your cart.</p>
            <button className="--btn">
              <Link to="/#products">Back To Shop</Link>
            </button>
          </>
        ) : (
          <div>
            <p>
              <b>{`Cart item(s): ${cartTotalQuantity}`}</b>
            </p>
            <div className={styles.text}>
              <h4>Subtotal:</h4>
              <h3>{cartTotalAmount.toFixed(2)}</h3>
            </div>
            <CartDiscount />


            {/* 顯示郵寄費 */}
            <div className={styles.text}>
              <h4>Shipping Fee:</h4>
              <h3>{selectedShippingFee ? `$${selectedShippingFee.toFixed(2)}` : "$0.00"}</h3>
              {/* <h3>{testShippingFee ? `$${testShippingFee.toFixed(2)}` : "$0.00"}</h3> */}

            </div>

            {/* 顯示總價（購物車總額 + 郵寄費） */}
            <div className={styles.text}>
              <h4>Total (with Shipping):</h4>
              <h3>{`$${totalWithShipping.toFixed(2)}`}</h3>

            </div>

            {cartItems.map((item, index) => {
              const { _id, name, price, cartQuantity } = item;
              return (
                <Card key={_id} cardClass={styles.card}>
                  <h4>Product: {name}</h4>
                  <p>Quantity: {cartQuantity}</p>
                  <p>Unit price: {price}</p>
                  <p>Set price: {price * cartQuantity}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutSummary
