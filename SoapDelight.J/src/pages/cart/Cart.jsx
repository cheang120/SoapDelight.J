import React, { useEffect, useState } from 'react'
import {   ADD_TO_CART, CALCULATE_SUBTOTAL, CALCULATE_TOTAL_QUANTITY, CLEAR_CART, 
  DECREASE_CART, REMOVE_FROM_CART, getCartDB, saveCartDB, selectCartItems, SET_SHIPPING_FEE,
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
  const [selectedShippingFee, setSelectedShippingFee] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('');

  const regions = {
    英國: 439,
    美國: 299,
    中國: 99,
    // 其他地區可自行添加
  };

  


  useEffect(() => {
    dispatch(getCartDB());

  },[cartItems,dispatch])

  // const { coupon } = useSelector((state) => state.coupon);
  useEffect(() => {

    dispatch(CALCULATE_SUBTOTAL({coupon}));
    dispatch(CALCULATE_TOTAL_QUANTITY());
    
  }, [cartItems, dispatch, coupon ]);


    // 處理郵寄地區選擇
    const handleShippingChange = (region) => {
      setSelectedRegion(region);
      const shippingFee = regions[region];
      dispatch(SET_SHIPPING_FEE(shippingFee));
      dispatch(CALCULATE_SUBTOTAL({ coupon }));
    };
  
  // 計算最終總價（購物車總額 + 郵寄費）
  // const totalWithShipping = cartTotalAmount + selectedShippingFee;
  const totalWithShipping = cartTotalAmount;


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
    <section className='min-h-screen'>
      <div className={`container ${styles.table} m-auto`}>
        <h2 className=' py-10 text-2xl'>Shopping Cart</h2>
        {JSON.parse(localStorage.getItem("cartItems"))?.length === 0 ? (
                <>
                  <div className='p-10'>
                      <p>Your cart is currently empty.</p>
                      <br />
                      <div>
                        <Link to="/shop">&larr; Continue shopping</Link>
                      </div>
                  </div>
                    
                </>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table>
                <thead className="bg-gray-200 dark:bg-gray-700">
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
                      <tr key={_id} className="border-b even:dark:bg-gray-700 dark:border-gray-600">
                        <td>{index + 1}</td>
                        <td>
                          <p className='w-80'>
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
                          <div className='py-2 px-6'>
                          <FaTrashAlt
                            size={19}
                            color="red"
                            onClick={() => removeFromCart(cart)}
                          />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className='mt-10 flex flex-col md:flex-row md:justify-between items-center md:items-start'>
              <button className='bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded mb-4 md:mb-0' onClick={clearCart}>
                Clear Cart
              </button>
              <div className='w-full  md:w-1/2'>
                <div className='text-center md:text-left'>
                  <Link to="/shop" className='text-blue-500 hover:underline'>&larr; Continue shopping</Link>
                </div>
                <br />
                <Card className='bg-white p-4 shadow-lg rounded-lg mb-5'>
                  <p className='text-lg font-bold'>
                    {`Cart item(s): ${cartTotalQuantity}`}
                  </p>
                  <div className='flex justify-between items-center mt-4'>
                    <h4 className='text-xl font-semibold'>Subtotal:</h4>
                    <h3 className='text-2xl font-bold text-gray-700'>{`$${cartTotalAmount?.toFixed(2)}`}</h3>
                  </div>
                  <VerifyCoupon />

                  {/* 地區選擇和郵費顯示 */}
                  <div className='my-5'>
                    <label>Choose your shipping region:</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => handleShippingChange(e.target.value)}
                      className='p-2 border rounded-md'
                    >
                      <option value="">Select a region</option>
                      {Object.keys(regions).map((region) => (
                        <option key={region} value={region}>
                          {region} - ${regions[region]}
                        </option>
                      ))}
                    </select>
                  </div>

                                  {/* 總價顯示（包含郵費） */}
                  <h4 className='text-xl font-semibold'>
                    {`Total with Shipping: $${totalWithShipping.toFixed(2)}`}
                  </h4>
                  
                  <div className='border-t border-gray-200 my-4'></div>
                  <PaymentOption selectedShippingFee={selectedShippingFee}/>
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
