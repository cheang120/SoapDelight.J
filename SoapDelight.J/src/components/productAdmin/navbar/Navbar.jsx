import React from "react";
import styles from "./Navbar.module.scss";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const navSections = [
  {
    label: "主要功能",
    items: [
      { to: "/productAdmin/home", label: "管理首頁", short: "首" },
      { to: "/productAdmin/all-products", label: "查看商品", short: "品" },
      { to: "/productAdmin/orders", label: "訂單", short: "單" },
    ],
  },
  {
    label: "存貨與寄賣",
    items: [
      { to: "/productAdmin/stock-movements", label: "存貨流動", short: "流" },
      { to: "/productAdmin/consignment-reports", label: "寄賣回報", short: "寄" },
    ],
  },
  {
    label: "系統設定",
    items: [
      { to: "/productAdmin/inventory-locations", label: "存貨地點", short: "點" },
      { to: "/productAdmin/category", label: "分類", short: "類" },
      { to: "/productAdmin/brand", label: "品牌", short: "牌" },
      { to: "/productAdmin/coupon", label: "優惠券", short: "券" },
      { to: "/productAdmin/shipping-methods", label: "送貨方式", short: "送" },
    ],
  },
  {
    label: "行銷工具",
    items: [
      { to: "/productAdmin/subscribers", label: "訂閱者", short: "訂" },
      { to: "/productAdmin/campaigns", label: "推廣電郵", short: "郵" },
    ],
  },
];

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");

const Navbar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { currentUser } = useSelector((state) => state.user);
  const username = currentUser?.username || "管理員";

  return (
    <div className={`${styles.navbar} ${isCollapsed ? styles.collapsed : ""}`}>
      <button
        type="button"
        className={styles.toggle}
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
        title={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
      >
        {isCollapsed ? "›" : "‹"}
      </button>

      <div className={styles.user}>
        <div className={styles.avatar}>
          <FaUserCircle size={32} />
        </div>
        <div className={styles.userText}>
          <p className={styles.userLabel}>登入身份</p>
          <h4>{username}</h4>
        </div>
      </div>

      <nav>
        {navSections.map((section) => (
          <div className={styles.section} key={section.label}>
            <p className={styles.sectionLabel}>{section.label}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={activeLink} data-short={item.short} title={item.label}>
                    <span className={styles.linkText}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Navbar;
