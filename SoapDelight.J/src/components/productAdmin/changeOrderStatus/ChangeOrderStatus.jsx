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
          <p className={styles.eyebrow}>訂單狀態</p>
          <h4 className={styles.title}>更新訂單狀態</h4>
          <p className={styles.subtitle}>
            選擇此訂單目前最新的處理階段。
          </p>
        </div>

        <form onSubmit={(e) => updateOrder(e, id)} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="order-status">
              訂單狀態
            </label>
            <select
              id="order-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.select}
            >
              <option value="" disabled>
                -- 請選擇 --
              </option>
              <option value="Order Placed...">已下單</option>
              <option value="Processing...">處理中</option>
              <option value="Shipped...">已寄出</option>
              <option value="Delivered">已送達</option>
            </select>
          </div>

          <button type="submit" className={styles.button}>
            更新狀態
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChangeOrderStatus;
