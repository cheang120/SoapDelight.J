import React from 'react'
import styles from  './Navbar.module.scss'
import { useSelector } from 'react-redux'
import { FaUserCircle } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");


const Navbar = () => {
    const { currentUser } = useSelector((state) => state.user);

    const username = currentUser?.username || "Admin";
  return (
    <div className={styles.navbar}>
      <div className={styles.user}>
        <div className={styles.avatar}>
          <FaUserCircle size={32} />
        </div>
        <div className={styles.userText}>
          <p className={styles.userLabel}>Logged in as</p>
          <h4>{username}</h4>
        </div>
      </div>
      <nav>
        <ul>
            <li>
                <NavLink to={'/productAdmin/home'} className={activeLink}>
                    Home
                </NavLink>
            </li>
            <li>
                <NavLink to={'/productAdmin/all-products'} className={activeLink}>
                    View Products
                </NavLink>
            </li>
            <li>
                <NavLink to={'/productAdmin/add-product'} className={activeLink}>
                    Add Product
                </NavLink>
            </li>
            <li>
                <NavLink to={'/productAdmin/orders'} className={activeLink}>
                    Orders
                </NavLink>
            </li>
            <li>
                <NavLink to={'/productAdmin/category'} className={activeLink}>
                    Category
                </NavLink>
            </li>
            <li>
                <NavLink to={'/productAdmin/brand'} className={activeLink}>
                    Brand
                </NavLink>
            </li>
            <li>
              <NavLink to="/productAdmin/coupon" className={activeLink}>
                Coupon
              </NavLink>
            </li>
            <li>
              <NavLink to="/productAdmin/shipping-methods" className={activeLink}>
                Shipping Methods
              </NavLink>
            </li>
            <li>
              <NavLink to="/productAdmin/subscribers" className={activeLink}>
                Subscribers
              </NavLink>
            </li>
            <li>
              <NavLink to="/productAdmin/campaigns" className={activeLink}>
                Campaigns
              </NavLink>
            </li>
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
