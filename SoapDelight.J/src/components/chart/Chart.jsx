/* eslint-disable react/prop-types */
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

  const [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11] = [
    "Order Placed...",
    "Processing...",
    "Shipped...",
    "Delivered",
    "Cancellation / Refund Processing",
    "Cancelled / Refunded",
    "Return Requested / Awaiting Return",
    "Return Approved / No Return Required",
    "Return Received / Refund Processing",
    "Returned / Refunded",
    "Return Closed / No Refund",
  ];

  const placed = getOrderCount(orderStatuses, q1);
  const processing = getOrderCount(orderStatuses, q2);
  const shipped = getOrderCount(orderStatuses, q3);
  const delivered = getOrderCount(orderStatuses, q4);
  const refundProcessing = getOrderCount(orderStatuses, q5);
  const cancelledRefunded = getOrderCount(orderStatuses, q6);
  const returnRequested = getOrderCount(orderStatuses, q7);
  const returnApproved = getOrderCount(orderStatuses, q8);
  const returnRefundProcessing = getOrderCount(orderStatuses, q9);
  const returnedRefunded = getOrderCount(orderStatuses, q10);
  const returnClosedNoRefund = getOrderCount(orderStatuses, q11);

  const data = {
    labels: [
      "已下單",
      "處理中",
      "已寄出",
      "已送達",
      "退款處理中",
      "已取消退款",
      "等待退貨",
      "毋須退貨",
      "退貨退款中",
      "已退貨退款",
      "退貨無退款結案",
    ],
    datasets: [
      {
        label: "訂單數量",
        data: [
          placed,
          processing,
          shipped,
          delivered,
          refundProcessing,
          cancelledRefunded,
          returnRequested,
          returnApproved,
          returnRefundProcessing,
          returnedRefunded,
          returnClosedNoRefund,
        ],
        backgroundColor: [
          "#18181b",
          "#71717a",
          "#a1a1aa",
          "#047857",
          "#d97706",
          "#b91c1c",
          "#2563eb",
          "#7c3aed",
          "#ea580c",
          "#0f766e",
          "#52525b",
        ],
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
