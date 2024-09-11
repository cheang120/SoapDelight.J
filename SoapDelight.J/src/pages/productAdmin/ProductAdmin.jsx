import React from "react";
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
import {useDispatch, useSelector} from 'react-redux'
import Coupon from "../../components/productAdmin/coupon/Coupon.jsx";
import Orders from "../../components/productAdmin/orders/Orders.jsx";
import OrderDetails from "../../components/productAdmin/orders/OrderDetails.jsx";


export const ProductAdmin = () => {
  const { currentUser } = useSelector((state) => state.user);
  const userRole = currentUser.role
    // console.log(userRole);
    if (userRole === 'author' || userRole === 'admin'){
      return (
        <div className={styles.admin}>
          <div className={styles.navbar}>
            <Navbar />
          </div>
          <div className={styles.content}>
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
            </Routes>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-center h-96 items-center">
          <p>Please Login as Admin User!</p>
        </div>
      )
    }

};

