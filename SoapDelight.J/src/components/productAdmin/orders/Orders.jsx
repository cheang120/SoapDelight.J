import React, { useEffect, useMemo, useState } from "react";
import ListOfOrders from "../../../pages/order/ListOfOrder";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getOrders, selectOrders } from "../../../redux/features/order/OrderSlice";
import styles from "./Orders.module.scss";

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[#,$,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatOrderDateParts = (order) => {
  const dates = [order?.orderDate, order?.orderTime, order?.createdAt]
    .filter(Boolean)
    .map((value) => {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime())
        ? String(value)
        : [
            parsed.toLocaleDateString("en-GB"),
            parsed.toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            parsed.toISOString().slice(0, 10),
            String(value),
          ].join(" ");
    });

  return dates.join(" ");
};

const getOrderSearchText = (order) => {
  const id = String(order?._id || "");
  const shortId = id ? id.slice(-8).toUpperCase() : "";
  const amount = Number(order?.orderAmount || 0);
  const amountText = [
    amount.toFixed(2),
    String(amount),
    `$${amount.toFixed(2)}`,
    `$${amount}`,
  ].join(" ");

  return [
    id,
    shortId,
    `#${shortId}`,
    formatOrderDateParts(order),
    amountText,
  ]
    .join(" ")
    .toLowerCase();
};

const Orders = () => {
  const orders = useSelector(selectOrders);
  const [search, setSearch] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const safeOrders = Array.isArray(orders) ? orders : [];
  const searchTerm = search.trim().toLowerCase();
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return safeOrders;
    return safeOrders.filter((order) => {
      const orderSearchText = getOrderSearchText(order);
      return (
        orderSearchText.includes(searchTerm) ||
        normalizeSearchText(orderSearchText).includes(normalizedSearchTerm)
      );
    });
  }, [safeOrders, searchTerm, normalizedSearchTerm]);

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
          <p className={styles.eyebrow}>訂單</p>
          <h2 className={styles.title}>所有訂單</h2>
          <p className={styles.subtitle}>
            開啟訂單以查看詳情及更新狀態。
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchWrap}>
          <span className={styles.searchLabel}>搜尋訂單</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="以訂單 ID、日期或總額搜尋"
            className={styles.searchInput}
          />
        </label>
        <p className={styles.resultCount}>找到 {filteredOrders.length} 張訂單</p>
      </div>

      <div className={styles.card}>
        <ListOfOrders orders={filteredOrders} openOrderDetails={openOrderDetails} />
      </div>
    </section>
  );
};

export default Orders;
