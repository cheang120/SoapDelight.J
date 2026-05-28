import React, { useEffect, useState } from "react";
import styles from "./Navbar.module.scss";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";

const navSections = [
  {
    key: "main",
    label: "主要功能",
    short: "主",
    items: [
      { to: "/productAdmin/home", label: "管理首頁", short: "首" },
      { to: "/productAdmin/all-products", label: "查看商品", short: "品" },
      { to: "/productAdmin/orders", label: "訂單", short: "單" },
    ],
  },
  {
    key: "inventory",
    label: "存貨與寄賣",
    short: "存",
    items: [
      { to: "/productAdmin/stock-movements", label: "存貨流動", short: "流" },
      { to: "/productAdmin/consignment-reports", label: "寄賣回報", short: "寄" },
    ],
  },
  {
    key: "settings",
    label: "系統設定",
    short: "設",
    items: [
      { to: "/productAdmin/company-profile", label: "商戶資料", short: "商" },
      { to: "/productAdmin/inventory-locations", label: "存貨地點", short: "點" },
      { to: "/productAdmin/category", label: "分類", short: "類" },
      { to: "/productAdmin/brand", label: "品牌", short: "牌" },
      { to: "/productAdmin/coupon", label: "優惠券", short: "券" },
      { to: "/productAdmin/shipping-methods", label: "送貨方式", short: "送" },
    ],
  },
  {
    key: "marketing",
    label: "行銷工具",
    short: "銷",
    items: [
      { to: "/productAdmin/subscribers", label: "訂閱者", short: "訂" },
      { to: "/productAdmin/campaigns", label: "推廣電郵", short: "郵" },
    ],
  },
];

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");

const Navbar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const username = currentUser?.username || "管理員";

  const [openSections, setOpenSections] = useState({
    main: true,
    inventory: true,
    settings: false,
    marketing: false,
  });

  useEffect(() => {
    const matchedSection = navSections.find((section) =>
      section.items.some((item) => location.pathname.startsWith(item.to))
    );

    if (matchedSection) {
      setOpenSections((prev) => ({ ...prev, [matchedSection.key]: true }));
    }
  }, [location.pathname]);

  const handleSectionToggle = (sectionKey) => {
    if (isCollapsed) {
      setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));
      onToggleCollapse?.();
      return;
    }

    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

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
        {navSections.map((section) => {
          const isOpen = openSections[section.key];
          const hasActiveItem = section.items.some((item) =>
            location.pathname.startsWith(item.to)
          );
          const visibleItems = !isCollapsed && isOpen ? section.items : [];

          return (
            <div className={styles.section} key={section.key}>
              <button
                type="button"
                className={`${styles.sectionToggle} ${
                  isCollapsed ? styles.sectionToggleCollapsed : ""
                } ${hasActiveItem ? styles.sectionToggleActive : ""}`}
                onClick={() => handleSectionToggle(section.key)}
                aria-expanded={isOpen}
                title={section.label}
              >
                <span className={isCollapsed ? styles.sectionShort : ""}>
                  {isCollapsed ? section.short : section.label}
                </span>
                {!isCollapsed && (
                  <span className={styles.sectionChevron}>
                    {isOpen ? "⌃" : "⌄"}
                  </span>
                )}
              </button>

              {visibleItems.length > 0 && (
                <ul>
                  {visibleItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={activeLink}
                        data-short={item.short}
                        title={item.label}
                      >
                        <span className={styles.linkText}>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Navbar;
