import React, { useState } from "react";
import styles from "./ChangeOrderStatus.module.scss";
import { Spinner } from "../../Loader";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { updateOrderStatus } from "../../../redux/features/order/OrderSlice";

const ChangeOrderStatus = () => {
  const { id } = useParams();
  const [status, setStatus] = useState("");
  const { isLoading } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  const updateOrder = async (e, orderId) => {
    e.preventDefault();
    const formData = {
      orderStatus: status,
    };

    await dispatch(updateOrderStatus({ id: orderId, formData }));
  };

  return (
    <section className={styles.status}>
      {isLoading && <Spinner />}

      <div className={styles.card}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>ORDER STATUS</p>
          <h4 className={styles.title}>Update Order Status</h4>
          <p className={styles.subtitle}>
            Choose the latest fulfilment stage for this order.
          </p>
        </div>

        <form onSubmit={(e) => updateOrder(e, id)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="order-status">
              Order status
            </label>
            <select
              id="order-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.select}
            >
              <option value="" disabled>
                -- Choose one --
              </option>
              <option value="Order Placed...">Order Placed...</option>
              <option value="Processing...">Processing...</option>
              <option value="Shipped...">Shipped...</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <button type="submit" className={styles.button}>
            Update Status
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChangeOrderStatus;
