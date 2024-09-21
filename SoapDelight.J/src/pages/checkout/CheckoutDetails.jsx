import { useEffect, useState } from "react";
import { CountryDropdown } from "react-country-region-selector";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Card from '../../components/card/Card'
import styles from "./CheckoutForm.module.scss"
import { SAVE_BILLING_ADDRESS, SAVE_SHIPPING_ADDRESS, selectBillingAddress, selectPaymentMethod, selectShippingAddress } from "../../redux/features/checkout/checkoutSlice";
import { toast } from "react-toastify";
import CheckoutSummary from "../../components/checkout/checkoutSummary/CheckoutSummary";
import { selectShippingFee } from "../../redux/features/cart/cartSlice";
// import { selectShippingFee } from "../../redux/features/cart/cartSlice";

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

const CheckoutDetails = () => {
    const [shippingAddress, setShippingAddress] = useState({
        ...initialAddressState,
    });
    const [billingAddress, setBillingAddress] = useState({
        ...initialAddressState,
    });
    const paymentMethod = useSelector(selectPaymentMethod);
    const shipAddress = useSelector(selectShippingAddress);
    const billAddress = useSelector(selectBillingAddress);

    // const selectedShippingFee = location.state?.selectedShippingFee || 0;
    const selectedShippingFee = useSelector(selectShippingFee); // 从 store 获取

    // const [selectedShippingFee, setSelectedShippingFee] = useState(0);


    // const selectedShippingFee = useSelector(selectShippingFee);  // 从 Redux store 获取
    const location = useLocation();
    // const selectedShippingFee = location.state?.selectedShippingFee || 0;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleShipping = (e) => {
        const { name, value } = e.target;
        setShippingAddress({
          ...shippingAddress,
          [name]: value,
        });
    };


    const handleBilling = (e) => {
        const { name, value } = e.target;
        setBillingAddress({
          ...billingAddress,
          [name]: value,
        });
    };



    useEffect(() => {
        if (shipAddress && Object.keys(shipAddress).length > 0) {
          setShippingAddress({ ...shipAddress });
        }
        if (billAddress && Object.keys(billAddress).length > 0) {
          setBillingAddress({ ...billAddress });
        }
      }, [shipAddress, billAddress]);


    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(SAVE_SHIPPING_ADDRESS(shippingAddress));
        dispatch(SAVE_BILLING_ADDRESS(billingAddress));

        if (paymentMethod === "stripe") {
          navigate("/checkout-stripe");
        }

      };
      
  return (
    <section>
      <div className={`container m-auto ${styles.checkout}`}>
        <h2 className="mt-10 text-3xl">結帳明細</h2>
        <form 
            onSubmit={handleSubmit}
        >
          <div>
            <Card cardClass={styles.card}>
              <h3>Shipping Address</h3>
              <label>Recipient Name</label>
              <input
                type="text"
                placeholder="Recipient Name"
                required
                name="name"
                value={shippingAddress.name}
                onChange={(e) => handleShipping(e)}
              />
              <label>Address line 1</label>
              <input
                type="text"
                placeholder="Address line 1"
                required
                name="line1"
                value={shippingAddress.line1}
                onChange={(e) => handleShipping(e)}
              />
              <label>Address line 2</label>
              <input
                type="text"
                placeholder="Address line 2"
                name="line2"
                value={shippingAddress.line2}
                onChange={(e) => handleShipping(e)}
              />
              <label>City</label>
              <input
                type="text"
                placeholder="City"
                required
                name="city"
                value={shippingAddress.city}
                onChange={(e) => handleShipping(e)}
              />
              <label>State</label>
              <input
                type="text"
                placeholder="State"
                required
                name="state"
                value={shippingAddress.state}
                onChange={(e) => handleShipping(e)}
              />
              <label>Postal code</label>
              <input
                type="text"
                placeholder="Postal code"
                required
                name="postal_code"
                value={shippingAddress.postal_code}
                onChange={(e) => handleShipping(e)}
              />
              {/* COUNTRY INPUT */}
              <label>Country</label>
              <CountryDropdown
                className={styles.select}
                valueType="short"
                value={shippingAddress.country}
                onChange={(val) =>
                  handleShipping({
                    target: {
                      name: "country",
                      value: val,
                    },
                  })
                }
              />
              <label>Phone</label>
              <input
                type="text"
                placeholder="Phone"
                required
                name="phone"
                value={shippingAddress.phone}
                onChange={(e) => handleShipping(e)}
              />
            </Card>
            {/* BILLING ADDRESS */}
            <Card cardClass={styles.card}>
              <h3>Billing Address</h3>
              <label>Recipient Name</label>
              <input
                type="text"
                placeholder="Name"
                required
                name="name"
                value={billingAddress.name}
                onChange={(e) => handleBilling(e)}
              />
              <label>Address line 1</label>
              <input
                type="text"
                placeholder="Address line 1"
                required
                name="line1"
                value={billingAddress.line1}
                onChange={(e) => handleBilling(e)}
              />
              <label>Address line 2</label>
              <input
                type="text"
                placeholder="Address line 2"
                name="line2"
                value={billingAddress.line2}
                onChange={(e) => handleBilling(e)}
              />
              <label>City</label>
              <input
                type="text"
                placeholder="City"
                required
                name="city"
                value={billingAddress.city}
                onChange={(e) => handleBilling(e)}
              />
              <label>State</label>
              <input
                type="text"
                placeholder="State"
                required
                name="state"
                value={billingAddress.state}
                onChange={(e) => handleBilling(e)}
              />
              <label>Postal code</label>
              <input
                type="text"
                placeholder="Postal code"
                required
                name="postal_code"
                value={billingAddress.postal_code}
                onChange={(e) => handleBilling(e)}
              />
              {/* COUNTRY INPUT */}
              <label>Country</label>
              <CountryDropdown
                className={styles.select}
                valueType="short"
                value={billingAddress.country}
                onChange={(val) =>
                  handleBilling({
                    target: {
                      name: "country",
                      value: val,
                    },
                  })
                }
              />
              <label>Phone</label>
              <input
                type="text"
                placeholder="Phone"
                required
                name="phone"
                value={billingAddress.phone}
                onChange={(e) => handleBilling(e)}
              />
              <button type="submit" className="--btn --btn-primary">
                Proceed To Checkout
              </button>
            </Card>
          </div>
          <div>
            <Card cardClass={styles.card}>
              <CheckoutSummary />
            </Card>
          </div>
        </form>
      </div>
    </section>
  )
}

export default CheckoutDetails
