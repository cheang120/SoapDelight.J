import React, { useEffect, useMemo, useState } from "react";
import styles from "./AdminHome.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Chart from "../../chart/Chart";
import {
  getProducts,
  selectProducts,
} from "../../../redux/features/product/productSlice";
import {
  CALC_TOTAL_ORDER_AMOUNT,
  getOrders,
  selectOrders,
  selectTotalOrderAmount,
} from "../../../redux/features/order/OrderSlice";
import subscriberService from "../subscribers/subscriberService";
import campaignService from "../campaigns/campaignService";

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const isShippingProduct = (product) =>
  String(product?.category || "").trim().toLowerCase() === "shipping";

const KpiCard = ({ label, value, helper }) => (
  <article className={styles.kpiCard}>
    <p className={styles.kpiLabel}>{label}</p>
    <p className={styles.kpiValue}>{value}</p>
    <p className={styles.kpiHelper}>{helper}</p>
  </article>
);

const AdminHome = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const orders = useSelector(selectOrders);
  const totalOrderAmount = useSelector(selectTotalOrderAmount);
  const [subscriberRows, setSubscriberRows] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const realProducts = useMemo(
    () => safeProducts.filter((product) => !isShippingProduct(product)),
    [safeProducts]
  );
  const activeSubscribers = useMemo(
    () =>
      Array.isArray(subscriberRows)
        ? subscriberRows.filter((row) => row?.subscriptionStatus === "active")
        : [],
    [subscriberRows]
  );
  const sentCampaigns = useMemo(
    () =>
      Array.isArray(campaigns)
        ? campaigns.filter((campaign) => campaign?.status === "sent")
        : [],
    [campaigns]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (safeProducts.length === 0) {
      dispatch(getProducts());
    }
    if (safeOrders.length === 0) {
      dispatch(getOrders());
    }
  }, [dispatch, safeProducts.length, safeOrders.length]);

  useEffect(() => {
    dispatch(CALC_TOTAL_ORDER_AMOUNT());
  }, [dispatch, safeOrders]);

  useEffect(() => {
    let shouldIgnore = false;

    const loadDashboardExtras = async () => {
      try {
        const [subscriberData, campaignData] = await Promise.all([
          subscriberService.getSubscribers({ status: "all" }),
          campaignService.getCampaigns(),
        ]);

        if (shouldIgnore) return;
        setSubscriberRows(Array.isArray(subscriberData) ? subscriberData : []);
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      } catch {
        if (shouldIgnore) return;
        setSubscriberRows([]);
        setCampaigns([]);
      }
    };

    loadDashboardExtras();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  const kpis = [
    {
      label: "Total sales / 總銷售額",
      value: formatMoney(totalOrderAmount),
      helper: "Completed revenue",
    },
    {
      label: "Orders / 訂單",
      value: safeOrders.length,
      helper: "Customer orders",
    },
    {
      label: "Products / 商品",
      value: realProducts.length,
      helper: "Shipping excluded",
    },
    {
      label: "Active subscribers / 有效訂閱者",
      value: activeSubscribers.length,
      helper: "Email subscribers",
    },
    {
      label: "Campaigns / 推廣電郵",
      value: Array.isArray(campaigns) ? campaigns.length : 0,
      helper: `${sentCampaigns.length} sent campaigns`,
    },
  ];

  return (
    <section className={styles.home}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Dashboard</p>
          <h2 className={styles.title}>Admin Home / 管理首頁</h2>
          <p className={styles.subtitle}>
            Review sales, orders, products, subscribers and campaign activity.
          </p>
        </div>
        <Link to="/productAdmin/add-product" className={styles.addProductButton}>
          Add Product / 新增商品
        </Link>
      </header>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <Chart orders={safeOrders} />

        <aside className={styles.summaryCard}>
          <p className={styles.summaryEyebrow}>Recent activity / 最新概覽</p>
          <div className={styles.summaryRows}>
            <div>
              <span>Latest order</span>
              <strong>
                {safeOrders[0]?.createdAt
                  ? new Date(safeOrders[0].createdAt).toLocaleDateString("en-GB")
                  : "-"}
              </strong>
            </div>
            <div>
              <span>Latest sent campaign</span>
              <strong>
                {sentCampaigns[0]?.sentAt
                  ? new Date(sentCampaigns[0].sentAt).toLocaleDateString("en-GB")
                  : "-"}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default AdminHome;
