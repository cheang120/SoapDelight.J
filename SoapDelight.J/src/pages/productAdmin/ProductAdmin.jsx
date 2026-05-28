import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import styles from "./ProductAdmin.module.scss";
import Navbar from "../../components/productAdmin/navbar/Navbar";
// import { AdminHome } from "../../components/productAdmin/adminHome/AdminHome.jsx";
import Category from "../../components/productAdmin/category/Category.jsx";
import Brand from "../../components/productAdmin/brand/Brand.jsx";
import AddProduct from "../../components/productAdmin/addProduct/AddProduct.jsx";
import ViewProducts from "../../components/productAdmin/viewProducts/ViewProducts.jsx";
import EditProduct from "../../components/productAdmin/editProduct/EditProduct.jsx";
import AdminHome from "../../components/productAdmin/adminHome/AdminHome.jsx";
import { useSelector } from "react-redux";
import Coupon from "../../components/productAdmin/coupon/Coupon.jsx";
import Orders from "../../components/productAdmin/orders/Orders.jsx";
import OrderDetails from "../../components/productAdmin/orders/OrderDetails.jsx";
import ShippingMethods from "../../components/productAdmin/shippingMethods/ShippingMethods.jsx";
import Subscribers from "../../components/productAdmin/subscribers/Subscribers.jsx";
import Campaigns from "../../components/productAdmin/campaigns/Campaigns.jsx";
import InventoryLocations from "../../components/productAdmin/inventoryLocations/InventoryLocations.jsx";
import StockMovements from "../../components/productAdmin/stockMovements/StockMovements.jsx";
import ConsignmentReports from "../../components/productAdmin/consignmentReports/ConsignmentReports.jsx";
import CompanyProfile from "../../components/productAdmin/companyProfile/CompanyProfile.jsx";


export const ProductAdmin = () => {
  const { currentUser } = useSelector((state) => state.user);
  const userRole = currentUser?.role;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (userRole === "author" || userRole === "admin") {
    return (
      <div className={`${styles.admin} ${isSidebarCollapsed ? styles.adminCollapsed : ""}`}>
        <aside className={`${styles.navbar} ${isSidebarCollapsed ? styles.navbarCollapsed : ""}`}>
            <Navbar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          </aside>
        <main className={styles.content}>
          <div className={styles.contentInner}>
            <Routes>
              <Route path="home" element={<AdminHome />} />
              <Route path="all-products" element={<ViewProducts />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="edit-product/:id" element={<EditProduct />} />
              <Route path="orders" element={<Orders />} />
              <Route path="order-details/:id" element={<OrderDetails />} />
              <Route path="coupon" element={<Coupon />} />
              <Route path="category" element={<Category />} />
              <Route path="brand" element={<Brand />} />
              <Route path="shipping-methods" element={<ShippingMethods />} />
              <Route path="company-profile" element={<CompanyProfile />} />
              <Route path="subscribers" element={<Subscribers />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="inventory-locations" element={<InventoryLocations />} />
              <Route path="stock-movements" element={<StockMovements />} />
              <Route path="consignment-reports" element={<ConsignmentReports />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-base font-medium text-zinc-950 dark:text-white">
          請以管理員帳戶登入。
        </p>
      </div>
    </div>
  );

};
