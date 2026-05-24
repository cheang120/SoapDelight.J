import React, { useEffect } from "react";
import ListOfOrders from "../../../pages/order/ListOfOrder";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getOrders, selectOrders } from "../../../redux/features/order/OrderSlice";
import styles from "./Orders.module.scss";

const Orders = () => {
  const orders = useSelector(selectOrders);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(getOrders());
  }, [dispatch]);

  const openOrderDetails = (id) => {
    navigate("/productAdmin/order-details/" + id);
  };
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>ORDERS</p>
          <h2 className={styles.title}>All Orders</h2>
          <p className={styles.subtitle}>
            Open an order to review details and update its status.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <ListOfOrders orders={orders || []} openOrderDetails={openOrderDetails} />
      </div>
    </section>
  );
};

export default Orders;
