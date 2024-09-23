import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CALCULATE_SUBTOTAL, SET_SHIPPING_FEE, selectCartItems, selectCartTotalAmount, selectCartTotalQuantity } from '../../../redux/features/cart/cartSlice';
import Card from '../../card/Card';
import styles from "./CheckoutSummary.module.scss";
import { Link, useLocation } from 'react-router-dom';
import { CartDiscount } from '../../verifyCoupon/VerifyCoupon';


const CheckoutSummary = () => {
    const { coupon } = useSelector((state) => state.coupon);
    const cartItems = useSelector(selectCartItems);
    const cartTotalAmount = useSelector(selectCartTotalAmount);
    const cartTotalQuantity = useSelector(selectCartTotalQuantity);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(CALCULATE_SUBTOTAL({ coupon }));
    }, [cartItems, dispatch, coupon]);

    // 篩選出類別為 "Shipping" 的產品
    const shippingItems = cartItems.filter(item => item.category === "Shipping");

    return (
        <div>
            <h3 className='text-2xl mb-5'>結帳摘要</h3>
            <div>
                {cartItems.length === 0 ? ( 
                    <>
                        <p>你的購物車是空的</p>
                        <button className="--btn">
                            <Link to="/#products">返回購物</Link>
                        </button>
                    </>
                ) : (
                    <div>
                        <p><b>{`购物车商品数量: ${cartTotalQuantity}`}</b></p>

                        {/* 显示购物车金额 */}
                        <div className={styles.text}>
                            <h4>購物車金額：</h4>
                            <h3>{`$${cartTotalAmount.toFixed(2)}`}</h3>
                        </div>

                        {/* 使用优惠券的组件 */}
                        <CartDiscount />

                        {/* 显示 Shipping 相关的产品 */}
                        {shippingItems.length > 0 && (
                            <div className={`${styles.text} flex`}>
                                {/* <h4>郵寄地點费用:</h4> */}
                                {shippingItems.map((item) => (
                                    // <Card key={item._id} cardClass={styles.card}>
                                    //     <h4>{item.name}</h4>
                                    //     <p>费用: {item.price}</p>
                                    // </Card>
                                    <div className={styles.text}> 
                                        <h4>其中郵寄费用：</h4>
                                        <h3>{`$${item.price}`}.00</h3>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 逐个显示购物车商品 */}
                        {cartItems
                        .filter(item => item.category !== "Shipping") // 排除類別為 "Shipping" 的產品
                        .map((item, index) => {
                            const { _id, name, price, cartQuantity } = item;
                            return (
                            <Card key={_id} cardClass={styles.card}>
                                <h4>商品：{name}</h4>
                                <p>数量：{cartQuantity}</p>
                                <p>單價：{price}</p>
                                <p>總價：{(price * cartQuantity).toFixed(2)}</p>
                            </Card>
                            );
                        })}

                    </div>
                )}
            </div>
        </div>
    );
}

export default CheckoutSummary;

