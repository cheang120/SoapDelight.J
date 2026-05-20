import { useEffect, useState } from "react";
import { CountryDropdown } from "react-country-region-selector";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CheckoutForm.module.scss";
import {
  SAVE_BILLING_ADDRESS,
  SAVE_PAYMENT_METHOD,
  SAVE_SHIPPING_ADDRESS,
  selectBillingAddress,
  selectShippingAddress,
} from "../../redux/features/checkout/checkoutSlice";
import { selectCartItems } from "../../redux/features/cart/cartSlice";
import CheckoutSummary from "../../components/checkout/checkoutSummary/CheckoutSummary";

const initialAddressState = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  phone: "",
};

const addressFields = [
  { name: "name", label: "Recipient Name", placeholder: "收件人姓名 / Recipient Name" },
  { name: "line1", label: "Address line 1", placeholder: "地址第一行 / Address line 1" },
  { name: "line2", label: "Address line 2", placeholder: "地址第二行（選填） / Address line 2" },
  { name: "city", label: "City", placeholder: "城市 / City" },
  { name: "state", label: "State", placeholder: "地區 / State" },
  { name: "postal_code", label: "Postal code", placeholder: "郵遞區號 / Postal code" },
  { name: "phone", label: "Phone", placeholder: "聯絡電話 / Phone" },
];

const CheckoutDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const shipAddress = useSelector(selectShippingAddress);
  const billAddress = useSelector(selectBillingAddress);
  const { currentUser } = useSelector((state) => state.user);

  const [shippingAddress, setShippingAddress] = useState({ ...initialAddressState });
  const [billingAddress, setBillingAddress] = useState({ ...initialAddressState });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (shipAddress && typeof shipAddress === "object" && Object.keys(shipAddress).length > 0) {
      setShippingAddress({ ...initialAddressState, ...shipAddress });
    }
    if (billAddress && typeof billAddress === "object" && Object.keys(billAddress).length > 0) {
      setBillingAddress({ ...initialAddressState, ...billAddress });
    }
  }, [shipAddress, billAddress]);

  const handleShipping = (e) => {
    const { name, value } = e.target;
    setShippingAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBilling = (e) => {
    const { name, value } = e.target;
    setBillingAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(SAVE_SHIPPING_ADDRESS(shippingAddress));
    dispatch(SAVE_BILLING_ADDRESS(billingAddress));
    dispatch(SAVE_PAYMENT_METHOD("stripe"));
    navigate("/checkout-stripe");
  };

  const renderAddressSection = (title, subtitle, values, handler, type) => (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className={styles.formGrid}>
        {addressFields.map((field) => {
          const isOptional = field.name === "line2";
          const isFullWidth = field.name === "line1" || field.name === "line2";
          return (
            <div
              key={`${type}-${field.name}`}
              className={`${styles.field} ${isFullWidth ? styles.fieldFull : ""}`}
            >
              <label htmlFor={`${type}-${field.name}`}>
                {field.label}
                {!isOptional && <span> *</span>}
              </label>
              <input
                id={`${type}-${field.name}`}
                type="text"
                placeholder={field.placeholder}
                required={!isOptional}
                name={field.name}
                value={values[field.name]}
                onChange={handler}
              />
            </div>
          );
        })}

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor={`${type}-country`}>
            Country <span>*</span>
          </label>
          <CountryDropdown
            id={`${type}-country`}
            className={styles.select}
            valueType="short"
            value={values.country}
            onChange={(value) =>
              handler({
                target: {
                  name: "country",
                  value,
                },
              })
            }
          />
        </div>
      </div>
    </section>
  );

  if (cartItems.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.emptyState}>
            <p className={styles.eyebrow}>Checkout</p>
            <h1>Your cart is empty.</h1>
            <p>先加入想要的商品，再完成結帳流程。</p>
            <Link to="/shop" className={styles.primaryButton}>
              Continue Shopping / 繼續選購
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Checkout Details</p>
            <h1>結帳資料</h1>
            <p className={styles.lead}>
              填寫收件及帳單資料，下一步會進入安全付款頁面。
            </p>
          </div>
          <Link to="/cart" className={styles.secondaryLink}>
            &larr; Back to Cart
          </Link>
        </div>

        {!currentUser && (
          <div className={styles.notice}>
            <p>
              你可以先填寫資料並查看訂單摘要。付款前如需要登入，我們會在下一步清楚提示。
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.layout}>
          <div className={styles.formColumn}>
            {renderAddressSection(
              "Shipping Address",
              "送貨或自取聯絡資料",
              shippingAddress,
              handleShipping,
              "shipping"
            )}

            {renderAddressSection(
              "Billing Address",
              "帳單資料",
              billingAddress,
              handleBilling,
              "billing"
            )}
          </div>

          <aside className={styles.summaryColumn}>
            <div className={styles.summaryCard}>
              <CheckoutSummary title="Order Summary" showCouponEditor />

              <div className={styles.summaryFooter}>
                <button type="submit" className={styles.primaryButton}>
                  Continue to Payment / 前往付款
                </button>
                <p>
                  Payment is completed securely on the next step via Stripe.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
};

export default CheckoutDetails;
