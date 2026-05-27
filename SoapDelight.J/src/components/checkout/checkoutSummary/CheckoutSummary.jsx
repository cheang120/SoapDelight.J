import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CALCULATE_SUBTOTAL,
  selectCartItems,
  selectCartTotalAmount,
  selectCartTotalQuantity,
  selectCouponDiscountAmount,
  getDeliveryMethodLabel,
  selectProductCartItems,
  selectProductSubtotal,
  selectSelectedDeliveryMethod,
  selectShippingFee,
} from "../../../redux/features/cart/cartSlice";
import { isCouponValid } from "../../../redux/features/coupon/couponSlice";
import styles from "./CheckoutSummary.module.scss";
import VerifyCoupon from "../../verifyCoupon/VerifyCoupon";
import { FaRegImage } from "react-icons/fa";

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const SummaryImage = ({ image, name }) => {
  const [failed, setFailed] = useState(false);
  const src = Array.isArray(image) ? image[0] : image;

  if (!src || failed) {
    return (
      <div className={styles.imageFallback}>
        <FaRegImage size={16} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "結帳商品"}
      className={styles.image}
      onError={() => setFailed(true)}
    />
  );
};

const CheckoutSummary = ({
  title = "訂單摘要",
  showCouponEditor = false,
  showItems = true,
}) => {
  const dispatch = useDispatch();
  const { coupon } = useSelector((state) => state.coupon);
  const cartItems = useSelector(selectCartItems);
  const productItems = useSelector(selectProductCartItems);
  const cartTotalAmount = useSelector(selectCartTotalAmount);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const productSubtotal = useSelector(selectProductSubtotal);
  const couponDiscountAmount = useSelector(selectCouponDiscountAmount);
  const selectedDeliveryMethod = useSelector(selectSelectedDeliveryMethod);
  const shippingFee = useSelector(selectShippingFee);
  const hasValidCoupon = isCouponValid(coupon);
  const showCouponSummary = hasValidCoupon && couponDiscountAmount > 0;
  const subtotalAfterDiscount = Math.max(
    productSubtotal - couponDiscountAmount,
    0
  );

  useEffect(() => {
    dispatch(CALCULATE_SUBTOTAL({ coupon }));
  }, [cartItems, coupon, dispatch]);

  if (productItems.length === 0) {
    return (
      <div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.emptyText}>你的購物車目前沒有商品。</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.caption}>訂單內共有 {cartTotalQuantity} 件商品</p>
        </div>
      </div>

      {showItems && (
        <div className={styles.items}>
          {productItems.map((item) => {
            const { _id, name, price, cartQuantity, image } = item;
            return (
              <article key={_id} className={styles.item}>
                <SummaryImage image={image} name={name} />
                <div className={styles.itemDetails}>
                  <h3>{name || "未命名商品"}</h3>
                  <p>數量 {cartQuantity}</p>
                </div>
                <p className={styles.itemTotal}>
                  {formatMoney(Number(price || 0) * Number(cartQuantity || 0))}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <div className={styles.rows}>
        <div className={styles.row}>
          <span>商品小計</span>
          <strong>{formatMoney(productSubtotal)}</strong>
        </div>

        {showCouponSummary && (
          <>
            <div className={`${styles.row} ${styles.discountRow}`}>
              <span>
                優惠
                <br />
                <small>
                  {coupon.name}
                  {coupon.discount ? ` (${coupon.discount}% off)` : ""}
                </small>
              </span>
              <strong>-{formatMoney(couponDiscountAmount)}</strong>
            </div>

            <div className={styles.row}>
              <span>優惠後小計</span>
              <strong>{formatMoney(subtotalAfterDiscount)}</strong>
            </div>
          </>
        )}

        {showCouponEditor && (
          <div className={styles.couponSection}>
            <VerifyCoupon />
          </div>
        )}

        {selectedDeliveryMethod ? (
          <>
            <div className={styles.row}>
              <span>送貨方式</span>
              <strong className={styles.methodValue}>
                {getDeliveryMethodLabel(selectedDeliveryMethod.name)}
              </strong>
            </div>
            <div className={styles.row}>
              <span>運費</span>
              <strong>{formatMoney(shippingFee)}</strong>
            </div>
          </>
        ) : (
          <div className={styles.shippingNote}>
            <p>請選擇送貨方式</p>
            <span>請先返回購物車選擇送貨方式或本地自取。</span>
          </div>
        )}
      </div>

      <div className={styles.totalRow}>
        <span>總數</span>
        <strong>{formatMoney(cartTotalAmount)}</strong>
      </div>
    </div>
  );
};

export default CheckoutSummary;
