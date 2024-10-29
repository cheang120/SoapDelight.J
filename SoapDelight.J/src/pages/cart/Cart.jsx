import React, { useEffect, useState } from 'react'
import { ADD_TO_CART, CALCULATE_SUBTOTAL, CALCULATE_TOTAL_QUANTITY, CLEAR_CART, 
  DECREASE_CART, REMOVE_FROM_CART, getCartDB, saveCartDB, selectCartItems, 
  selectCartTotalAmount, selectCartTotalQuantity  } from '../../redux/features/cart/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from "./Cart.module.scss";
import { FaTrashAlt } from 'react-icons/fa';
import { Card } from 'flowbite-react';
import VerifyCoupon from '../../components/verifyCoupon/VerifyCoupon';
import PaymentOption from '../../components/paymentOption/PaymentOption';
import CarouselItem from '../../components/carousel/CarouselItem';
import ShippingCarouselItem from '../../components/carousel/ShippingCarousel';


const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const cartTotalAmount = useSelector(selectCartTotalAmount);  // 商品总价
  const isError = useSelector((state) => state.cart.isError);
  const { coupon } = useSelector((state) => state.coupon);

  const products = useSelector((state) => state.product.products); // 获取所有产品
  window.scrollTo(0, 0);

  const shippingProducts = products.filter(product => product.category === "Shipping");
  const [selectedShipping, setSelectedShipping] = useState(null);

  const handleShippingChange = (e) => {
    const selectedProduct = shippingProducts.find(product => product.id === e.target.value);
    setSelectedShipping(selectedProduct);
  };

  useEffect(() => {
    dispatch(getCartDB());
  }, [cartItems, dispatch]);

  useEffect(() => {
    dispatch(CALCULATE_SUBTOTAL({ coupon }));
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [cartItems, dispatch, coupon]);
  // console.log(cartItems)

  return (
    <section className='min-h-screen'>
      <div className={`container ${styles.table} m-auto`}>
        <h2 className='py-10 text-2xl'>Shopping Cart</h2>

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
                    const { _id, name, price, image, cartQuantity,category } = cart;
                    return (
                      <tr key={_id} className="border-b even:dark:bg-gray-700 dark:border-gray-600">
                        <td>{index + 1}</td>
                        <td>
                          <p className='w-80'>
                            <b>{name}</b>
                          </p>
                          {category !== 'Shipping' && (
                            <img
                              src={image[0]}
                              alt={name}
                              style={{ width: "100px" }}
                            />
                          )}
                        </td>
                        <td>{price}</td>
                        <td>
                          <div className={styles.count}>
                          <button
                            className="--btn"
                            onClick={() => dispatch(DECREASE_CART(cart))}  // 在点击时 dispatch action
                          >
                            -
                          </button>
                            <p>
                              <b>{cartQuantity}</b>
                            </p>
                          <button
                            className="--btn"
                            onClick={() => dispatch(ADD_TO_CART(cart))}  // 在点击时 dispatch action
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
                            onClick={() => dispatch(REMOVE_FROM_CART(cart))} 
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
              <button className='bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded mb-4 md:mb-0'  onClick={() => {
                dispatch(CLEAR_CART());
                localStorage.removeItem("cartItems");  // Clear localStorage
              }}>
                清除購物車
              </button>
              <div className='w-full md:w-1/2'>
                <div className='text-center md:text-left'>
                  <Link to="/shop" className='text-blue-500 hover:underline'>&larr; Continue shopping</Link>
                </div>
                <br />
                <Card className='bg-white p-4 shadow-lg rounded-lg mb-5'>
                  <p className='text-lg font-bold'>
                    {`Cart item(s): ${cartTotalQuantity}`}
                  </p>

                  {/* 显示购物车商品总价 */}
                  <div className='flex justify-between items-center mt-4'>
                    <h4 className='text-xl font-semibold dark:text-gray-200'>Subtotal (Cart Total):</h4>
                    <h3 className='text-2xl font-bold dark:text-gray-200'>{`$${cartTotalAmount?.toFixed(2)}`}</h3>
                  </div>

                  <VerifyCoupon />

                  {shippingProducts.length > 0 && (
                    <div>
                      <h3 className='py-2 text-xl'>郵寄地點：</h3>
                      <div className=''>
                        {shippingProducts.map(item => (
                          <ShippingCarouselItem 
                            key={item.id}
                            name={item.name}
                            url={item.image[0]}
                            price={item.price}
                            regularPrice={item.regularPrice}
                            description={item.description}
                            product={item}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='border-t border-gray-200 my-4'></div>
                  <PaymentOption />
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Cart;
