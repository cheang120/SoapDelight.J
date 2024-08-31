import React, { useEffect } from 'react'
import {   ADD_TO_CART, CALCULATE_SUBTOTAL, CALCULATE_TOTAL_QUANTITY, CLEAR_CART, 
  DECREASE_CART, REMOVE_FROM_CART, getCartDB, saveCartDB, selectCartItems, 
  selectCartTotalAmount, selectCartTotalQuantity  } from '../../redux/features/cart/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from "./Cart.module.scss";
import { FaTrashAlt } from 'react-icons/fa';
import { Card } from 'flowbite-react';
import VerifyCoupon from '../../components/verifyCoupon/VerifyCoupon';
import PaymentOption from '../../components/paymentOption/PaymentOption';


const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const cartTotalAmount = useSelector(selectCartTotalAmount);
  const isError = useSelector((state) => state.cart.isError);
  const { coupon } = useSelector((state) => state.coupon);



  useEffect(() => {
    dispatch(getCartDB());

  },[cartItems,dispatch])

  // const { coupon } = useSelector((state) => state.coupon);
  useEffect(() => {

    dispatch(CALCULATE_SUBTOTAL({coupon}));
    dispatch(CALCULATE_TOTAL_QUANTITY());
    
  }, [cartItems, dispatch, coupon ]);



  const increaseCart = (cart) => {
    // const cartQuantity = getCartQuantityById(cartItems, cart._id);
    // if (cartQuantity === cart.quantity) {
    //   return toast.info("Max number of product reached!!!");
    // }
    dispatch(ADD_TO_CART(cart));
    dispatch(
      saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
    );
  };

  const decreaseCart = (cart) => {
    dispatch(DECREASE_CART(cart));
    dispatch(
      saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
    );
  };

  const removeFromCart = (cart) => {
    dispatch(REMOVE_FROM_CART(cart));
    dispatch(
      saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
    );
  };

  const clearCart = () => {
    dispatch(CLEAR_CART());
    dispatch(saveCartDB({ cartItems: [] }));
  };


  // console.log(JSON.parse(localStorage.getItem("cartItems")));


  return (
    <section>
      <div className={`container ${styles.table} m-auto`}>
        <h2>Shopping Cart</h2>
        {JSON.parse(localStorage.getItem("cartItems"))?.length === 0 ? (
                <>
                    <p>Your cart is currently empty.</p>
                    <br />
                    <div>
                      <Link to="/shop">&larr; Continue shopping</Link>
                    </div>
                </>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>s/n</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {JSON.parse(localStorage.getItem("cartItems"))?.map((cart, index) => {
                  const { _id, name, price, image, cartQuantity } = cart;
                  return (
                    <tr key={_id}>
                      <td>{index + 1}</td>
                      <td>
                        <p>
                          <b>{name}</b>
                        </p>
                        <img
                          src={image[0]}
                          alt={name}
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>{price}</td>
                      <td>
                        <div className={styles.count}>
                          <button
                            className="--btn"
                            onClick={() => decreaseCart(cart)}
                          >
                            -
                          </button>
                          <p>
                            <b>{cartQuantity}</b>
                          </p>
                          <button
                            className="--btn"
                            onClick={() => increaseCart(cart)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{(price * cartQuantity).toFixed(2)}</td>
                      <td className={styles.icons}>
                        <FaTrashAlt
                          size={19}
                          color="red"
                          onClick={() => removeFromCart(cart)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className={styles.summary}>
              <button className="--btn --btn-danger" onClick={clearCart}>
                Clear Cart
              </button>
              <div className={styles.checkout}>
                <div>
                  <Link to="/shop">&larr; Continue shopping</Link>
                </div>
                <br />
                  <Card className={styles.card}>
                    <p>
                      <b> {`Cart item(s): ${cartTotalQuantity}`}</b>
                    </p>
                    <div className={styles.text}>
                      <h4>Subtotal:</h4>
                      <h3>{`$${cartTotalAmount?.toFixed(2)}`}</h3>
                    </div>
                    <VerifyCoupon />
                    <div className="--underline --my"></div>
                    
                    <PaymentOption />
                  </Card>

              </div>
            </div>
            

          </>
        )}
      </div>
    </section>
  )
}

export default Cart
