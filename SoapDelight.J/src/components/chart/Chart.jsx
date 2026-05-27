import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import styles from "./Chart.module.scss";

import { useSelector } from "react-redux";
import { selectOrders } from "../../redux/features/order/OrderSlice";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      backgroundColor: "#18181b",
      padding: 12,
      titleFont: {
        size: 13,
      },
      bodyFont: {
        size: 13,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#71717a",
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(228, 228, 231, 0.72)",
      },
      ticks: {
        color: "#71717a",
        precision: 0,
      },
    },
  },
};

const Chart = ({ orders: ordersProp }) => {
  const reduxOrders = useSelector(selectOrders);
  const orders = Array.isArray(ordersProp)
    ? ordersProp
    : Array.isArray(reduxOrders)
      ? reduxOrders
      : [];

  const orderStatuses = orders.map((item) => item?.orderStatus);

  const getOrderCount = (arr, value) => {
    return arr.filter((n) => n === value).length;
  };

  const [q1, q2, q3, q4] = [
    "Order Placed...",
    "Processing...",
    "Shipped...",
    "Delivered",
  ];

  const placed = getOrderCount(orderStatuses, q1);
  const processing = getOrderCount(orderStatuses, q2);
  const shipped = getOrderCount(orderStatuses, q3);
  const delivered = getOrderCount(orderStatuses, q4);

  const data = {
    labels: ["已下單", "處理中", "已寄出", "已送達"],
    datasets: [
      {
        label: "訂單數量",
        data: [placed, processing, shipped, delivered],
        backgroundColor: ["#18181b", "#71717a", "#a1a1aa", "#047857"],
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 52,
      },
    ],
  };

  return (
    <div className={styles.charts}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.eyebrow}>訂單</p>
            <h3>訂單狀態</h3>
          </div>
          <span>共 {orders.length} 張</span>
        </div>
        <div className={styles.chartBody}>
          <Bar options={options} data={data} />
        </div>
      </div>
    </div>
  );
};

export default Chart;
