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
import {
  selectProductCartItems,
  selectSelectedDeliveryMethod,
} from "../../redux/features/cart/cartSlice";
import CheckoutSummary from "../../components/checkout/checkoutSummary/CheckoutSummary";

const initialAddressState = {
  email: "",
  phone: "",
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

const contactFields = [
  { name: "email", label: "Email", placeholder: "電郵地址 / Email", type: "email" },
  { name: "phone", label: "Phone", placeholder: "聯絡電話 / Phone", type: "tel" },
];

const deliveryFields = [
  { name: "name", label: "Recipient Name", placeholder: "收件人姓名 / Recipient Name" },
  { name: "line1", label: "Address line 1", placeholder: "地址第一行 / Address line 1" },
  { name: "line2", label: "Address line 2", placeholder: "地址第二行（選填） / Address line 2" },
  { name: "city", label: "City / Area", placeholder: "城市 / 地區 / City / Area" },
  { name: "state", label: "State / Region", placeholder: "州 / 地區 / State / Region" },
  { name: "postal_code", label: "Postal code", placeholder: "郵遞區號 / Postal code" },
];

const CheckoutDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productItems = useSelector(selectProductCartItems);
  const selectedDeliveryMethod = useSelector(selectSelectedDeliveryMethod);
  const shipAddress = useSelector(selectShippingAddress);
  const billAddress = useSelector(selectBillingAddress);
  const { currentUser } = useSelector((state) => state.user);

  const [shippingAddress, setShippingAddress] = useState({ ...initialAddressState });
  const [billingAddress, setBillingAddress] = useState({ ...initialAddressState });
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const nextShippingAddress = {
      ...initialAddressState,
      email: currentUser?.email || "",
    };

    if (shipAddress && typeof shipAddress === "object" && Object.keys(shipAddress).length > 0) {
      setShippingAddress({ ...nextShippingAddress, ...shipAddress });
    } else {
      setShippingAddress(nextShippingAddress);
    }

    if (billAddress && typeof billAddress === "object" && Object.keys(billAddress).length > 0) {
      setBillingAddress({ ...initialAddressState, ...billAddress });
      setUseShippingAsBilling(false);
    } else {
      setBillingAddress({ ...initialAddressState, email: currentUser?.email || "" });
      setUseShippingAsBilling(true);
    }
  }, [shipAddress, billAddress, currentUser?.email]);

  const handleFieldChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleShipping = handleFieldChange(setShippingAddress);
  const handleBilling = handleFieldChange(setBillingAddress);

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedShipping = {
      ...shippingAddress,
      email: shippingAddress.email?.trim(),
    };
    const normalizedBilling = useShippingAsBilling
      ? { ...normalizedShipping }
      : {
          ...billingAddress,
          email: billingAddress.email?.trim() || normalizedShipping.email,
          phone: billingAddress.phone?.trim() || normalizedShipping.phone,
        };

    dispatch(SAVE_SHIPPING_ADDRESS(normalizedShipping));
    dispatch(SAVE_BILLING_ADDRESS(normalizedBilling));
    dispatch(SAVE_PAYMENT_METHOD("stripe"));
    navigate("/checkout-stripe");
  };

  const renderFieldGroup = (fields, values, handler, type) => (
    <>
      {fields.map((field) => {
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
              type={field.type || "text"}
              placeholder={field.placeholder}
              required={!isOptional}
              name={field.name}
              value={values[field.name]}
              onChange={handler}
            />
          </div>
        );
      })}
    </>
  );

  const renderAddressSection = (title, subtitle, fields, values, handler, type) => (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className={styles.formGrid}>
        {renderFieldGroup(fields, values, handler, type)}

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor={`${type}-country`}>
            Country / Region <span>*</span>
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

  if (productItems.length === 0) {
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

  if (!selectedDeliveryMethod) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.emptyState}>
            <p className={styles.eyebrow}>Delivery Method</p>
            <h1>Please choose a delivery method first.</h1>
            <p>請先返回購物車選擇送貨方式或本地自取，再繼續結帳。</p>
            <Link to="/cart" className={styles.primaryButton}>
              Back to Cart / 返回購物車
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
              填寫聯絡及收貨資料，下一步會進入安全付款頁面。
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
              "Contact Information / 聯絡資料",
              "訂單更新與確認資訊會以此聯絡方式為準。",
              contactFields,
              shippingAddress,
              handleShipping,
              "contact"
            )}

            {renderAddressSection(
              "Delivery Information / 收貨資料",
              "請填寫收件人及送貨地址資料。",
              deliveryFields,
              shippingAddress,
              handleShipping,
              "shipping"
            )}

            <section className={styles.panel}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={useShippingAsBilling}
                  onChange={(e) => setUseShippingAsBilling(e.target.checked)}
                />
                <span>
                  Billing details are the same as delivery details
                  <small>帳單資料與收貨資料相同</small>
                </span>
              </label>
            </section>

            {!useShippingAsBilling &&
              renderAddressSection(
                "Billing Address / 帳單資料",
                "如需分開帳單地址，可於此填寫。",
                deliveryFields,
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
