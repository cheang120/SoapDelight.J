import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../../utils/apiBase";
import {
  getInspectionStatusLabel,
  getOrderStatusLabel,
  getRefundStatusLabel,
  getReturnStatusLabel,
  getStockRestoreStatusLabel,
} from "../../../utils/statusLabels";
import styles from "./RefundReturnRecords.module.scss";

const API_URL = `${API_BASE_URL}/order/admin/refund-return-records`;

const filterOptions = [
  { value: "all", label: "全部" },
  { value: "unshipped_refund", label: "未出貨退款" },
  { value: "shipped_return", label: "已出貨退貨退款" },
  { value: "no_refund", label: "不設退款" },
  { value: "follow_up", label: "處理中 / 需跟進" },
];

const money = (value, currency = "HKD") => {
  const amount = Number(value || 0);
  return `${currency} $${amount.toLocaleString("en-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const dateText = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : "-");

const getFilterValue = (record) => {
  if (record.typeLabel === "退貨不設退款") return "no_refund";
  if (record.typeLabel === "已出貨退貨退款") return "shipped_return";
  if (record.typeLabel === "退款處理中 / 需跟進") return "follow_up";
  return "unshipped_refund";
};

const RefundReturnRecords = () => {
  const [summary, setSummary] = useState({});
  const [records, setRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setSummary(response.data?.summary || {});
      setRecords(Array.isArray(response.data?.records) ? response.data.records : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "未能載入退款 / 退貨紀錄");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    if (activeFilter === "all") return records;
    return records.filter((record) => getFilterValue(record) === activeFilter);
  }, [activeFilter, records]);

  const summaryCards = [
    { label: "紀錄總數", value: summary.totalRecords ?? 0 },
    { label: "實際退款總額", value: money(summary.totalRefundAmount) },
    { label: "Stripe 手續費扣除", value: money(summary.totalStripeFeeDeducted) },
    { label: "額外扣除退回運費", value: money(summary.totalReturnShippingDeducted) },
    { label: "不設退款個案", value: summary.noRefundCaseCount ?? 0 },
    { label: "已補回 ONLINE", value: summary.totalRestoredQuantity ?? 0 },
    { label: "未補回庫存", value: summary.totalNotRestockedCount ?? 0 },
  ];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>退款 / 退貨</p>
          <h2 className={styles.title}>退款 / 退貨紀錄</h2>
          <p className={styles.subtitle}>
            集中查看退款、退貨及不設退款個案，方便核對處理結果。此頁只作查看，不會修改訂單、Stripe 或庫存資料。
          </p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={loadRecords} disabled={loading}>
          {loading ? "重新整理中..." : "重新整理"}
        </button>
      </header>

      <div className={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <article className={styles.summaryCard} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className={styles.filters}>
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={activeFilter === option.value ? styles.filterActive : styles.filterButton}
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <p>顯示 {filteredRecords.length} / {records.length} 筆紀錄</p>
        </div>

        {loading && records.length === 0 ? (
          <div className={styles.empty}>正在載入退款 / 退貨紀錄...</div>
        ) : filteredRecords.length === 0 ? (
          <div className={styles.empty}>暫時沒有退款 / 退貨紀錄</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>訂單</th>
                  <th>客人</th>
                  <th>類型</th>
                  <th>狀態</th>
                  <th>Stripe 付款金額</th>
                  <th>Stripe 手續費</th>
                  <th>額外扣除退回運費</th>
                  <th>實際退款金額</th>
                  <th>商品檢查</th>
                  <th>庫存處理</th>
                  <th>Stripe refund ID</th>
                  <th>查看</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const currency = record.paymentCurrency || "HKD";
                  const eventDate =
                    record.refundSucceededAt ||
                    record.noRefundClosedAt ||
                    record.stockRestoredAt ||
                    record.updatedAt ||
                    record.createdAt;

                  return (
                    <tr key={record.orderId}>
                      <td data-label="日期">{dateText(eventDate)}</td>
                      <td data-label="訂單">
                        <strong>{shortId(record.orderId)}</strong>
                        <small>{record.orderId}</small>
                      </td>
                      <td data-label="客人">
                        <span>{record.customerName || "-"}</span>
                        <small>{record.customerEmail || "-"}</small>
                      </td>
                      <td data-label="類型">
                        <span className={styles.badge}>{record.typeLabel || "-"}</span>
                      </td>
                      <td data-label="狀態">
                        <span>{getOrderStatusLabel(record.orderStatus)}</span>
                        <small>
                          {record.refundStatus && record.refundStatus !== "none"
                            ? getRefundStatusLabel(record.refundStatus)
                            : getReturnStatusLabel(record.returnStatus)}
                        </small>
                      </td>
                      <td data-label="Stripe 付款金額">{money(record.paymentAmount, currency)}</td>
                      <td data-label="Stripe 手續費">{money(record.stripeFeeAmount, currency)}</td>
                      <td data-label="額外扣除退回運費">{money(record.returnShippingDeduction, currency)}</td>
                      <td data-label="實際退款金額">
                        <strong>{money(record.refundAmount, currency)}</strong>
                      </td>
                      <td data-label="商品檢查">
                        {getInspectionStatusLabel(record.returnInspectionStatus)}
                        {record.returnedItemsRestockable ? <small>可重新上架</small> : null}
                      </td>
                      <td data-label="庫存處理">
                        {record.stockRestoreLabel ||
                          getStockRestoreStatusLabel(record.stockRestoreStatus)}
                      </td>
                      <td data-label="Stripe refund ID">
                        <small>{record.stripeRefundId || "-"}</small>
                      </td>
                      <td data-label="查看">
                        <Link className={styles.detailLink} to={`/productAdmin/order-details/${record.orderId}`}>
                          查看訂單
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default RefundReturnRecords;
