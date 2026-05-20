import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CALCULATE_SUBTOTAL,
  selectCartItems,
  selectCartTotalAmount,
  selectCartTotalQuantity,
} from "../../../redux/features/cart/cartSlice";
import styles from "./CheckoutSummary.module.scss";
import VerifyCoupon, { CartDiscount } from "../../verifyCoupon/VerifyCoupon";
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
      alt={name || "Checkout item"}
      className={styles.image}
      onError={() => setFailed(true)}
    />
  );
};

const CheckoutSummary = ({
  title = "Order Summary",
  showCouponEditor = false,
  showItems = true,
}) => {
  const dispatch = useDispatch();
  const { coupon } = useSelector((state) => state.coupon);
  const { initialCartTotalAmount } = useSelector((state) => state.cart);
  const cartItems = useSelector(selectCartItems);
  const cartTotalAmount = useSelector(selectCartTotalAmount);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);

  useEffect(() => {
    dispatch(CALCULATE_SUBTOTAL({ coupon }));
  }, [cartItems, coupon, dispatch]);

  const discountAmount = coupon
    ? Math.max(Number(initialCartTotalAmount || 0) - Number(cartTotalAmount || 0), 0)
    : 0;

  const productItems = cartItems.filter((item) => item.category !== "Shipping");
  const shippingItems = cartItems.filter((item) => item.category === "Shipping");

  if (cartItems.length === 0) {
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
          <p className={styles.caption}>{cartTotalQuantity} item(s) in your order</p>
        </div>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span>Subtotal</span>
          <strong>{formatMoney(initialCartTotalAmount || cartTotalAmount)}</strong>
        </div>

        {coupon && (
          <div className={`${styles.row} ${styles.discountRow}`}>
            <span>Coupon discount</span>
            <strong>-{formatMoney(discountAmount)}</strong>
          </div>
        )}

        {shippingItems.length > 0 && (
          <div className={styles.shippingNote}>
            <p>Delivery / Pickup</p>
            <span>
              {shippingItems.map((item) => item.name).join(" / ")}
            </span>
          </div>
        )}

        {!shippingItems.length && (
          <div className={styles.shippingNote}>
            <p>Delivery note</p>
            <span>澳門本地送貨或自取安排，會按結帳資料確認。</span>
          </div>
        )}
      </div>

      <div className={styles.couponSection}>
        {showCouponEditor ? <VerifyCoupon /> : <CartDiscount />}
      </div>

      {showItems && (
        <div className={styles.items}>
          {productItems.map((item) => {
            const { _id, name, price, cartQuantity, image } = item;
            return (
              <article key={_id} className={styles.item}>
                <SummaryImage image={image} name={name} />
                <div className={styles.itemDetails}>
                  <h3>{name || "Untitled product"}</h3>
                  <p>Qty {cartQuantity}</p>
                </div>
                <p className={styles.itemTotal}>
                  {formatMoney(Number(price || 0) * Number(cartQuantity || 0))}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <div className={styles.totalRow}>
        <span>Total</span>
        <strong>{formatMoney(cartTotalAmount)}</strong>
      </div>
    </div>
  );
};

export default CheckoutSummary;
