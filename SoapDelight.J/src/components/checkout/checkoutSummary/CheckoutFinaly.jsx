import React from 'react';
import styles from "./CheckoutSummary.module.scss";
import Card from "../../card/Card";
import { useSelector } from "react-redux";
import { selectCartItems, selectCartTotalAmount, selectCartTotalQuantity } from "../../../redux/features/cart/cartSlice";
import { CartDiscount } from '../../verifyCoupon/VerifyCoupon';

const CheckoutFinal = ({ selectedShippingFee, totalWithShipping }) => {
    const cartItems = useSelector(selectCartItems);
    const cartTotalAmount = useSelector(selectCartTotalAmount);
    const cartTotalQuantity = useSelector(selectCartTotalQuantity);

    // 确保这两个值是数字，并且能够调用 `toFixed`
    if (typeof totalWithShipping !== 'number' || typeof selectedShippingFee !== 'number') {
        console.error('Invalid props:', { totalWithShipping, selectedShippingFee });
        return <div>出现错误，请检查数据。</div>;
    }
    
    return (
        <div>
            <h3>结账总结</h3>
            <div>
                {cartItems.length === 0 ? (
                    <p>你的购物车是空的。</p>
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
                            <h3>{`$${totalWithShipping.toFixed(2)}`}</h3>
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

export default CheckoutFinal;
