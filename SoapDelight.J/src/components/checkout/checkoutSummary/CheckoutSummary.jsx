import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CALCULATE_SUBTOTAL, SET_SHIPPING_FEE, selectCartItems, selectCartTotalAmount, selectCartTotalQuantity } from '../../../redux/features/cart/cartSlice';
import Card from '../../card/Card';
import styles from "./CheckoutSummary.module.scss";
import { Link, useLocation } from 'react-router-dom';
import { CartDiscount } from '../../verifyCoupon/VerifyCoupon';


const CheckoutSummary = ({ selectedShippingFee }) => {
    const { coupon } = useSelector((state) => state.coupon);
    const cartItems = useSelector(selectCartItems);
    const cartTotalAmount = useSelector(selectCartTotalAmount);
    const cartTotalQuantity = useSelector(selectCartTotalQuantity);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(CALCULATE_SUBTOTAL({ coupon }));
    }, [cartItems, dispatch, coupon]);

    useEffect(() => {
      dispatch(SET_SHIPPING_FEE(selectedShippingFee || 0));
  }, [selectedShippingFee, dispatch]);


    // 计算总金额（购物车总额 + 邮寄费）
    // const totalWithShipping = cartTotalAmount + (selectedShippingFee || 0);
    // console.log('Received Shipping Fee:', selectedShippingFee);

    return (
        <div>
            <h3>结账摘要</h3>
            <div>
                {cartItems.length === 0 ? (
                    <>
                        <p>你的购物车是空的。</p>
                        <button className="--btn">
                            <Link to="/#products">返回购物</Link>
                        </button>
                    </>
                ) : (
                    <div>
                        <p><b>{`购物车商品数量: ${cartTotalQuantity}`}</b></p>

                        {/* 显示购物车金额 */}
                        <div className={styles.text}>
                            <h4>购物车金额:</h4>
                            <h3>{`$${cartTotalAmount.toFixed(2)}`}</h3>
                        </div>

                        {/* 使用优惠券的组件 */}
                        <CartDiscount />

                        {/* 显示邮寄费用 */}
                        <div className={styles.text}>
                            <h4>邮寄费用:</h4>
                            <h3>{`$${selectedShippingFee ? selectedShippingFee.toFixed(2) : 0}`}</h3>
                        </div>

                        {/* 显示总金额（购物车总额 + 邮寄费用） */}
                        <div className={styles.text}>
                            <h4>总金额 (含邮费):</h4>
                            {/* <h3>{`$${totalWithShipping.toFixed(2)}`}</h3> */}
                        </div>




                        {/* 逐个显示购物车商品 */}
                        {cartItems.map((item, index) => {
                            const { _id, name, price, cartQuantity } = item;
                            return (
                                <Card key={_id} cardClass={styles.card}>
                                    <h4>商品: {name}</h4>
                                    <p>数量: {cartQuantity}</p>
                                    <p>单价: {price}</p>
                                    <p>总价: {(price * cartQuantity).toFixed(2)}</p>
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

