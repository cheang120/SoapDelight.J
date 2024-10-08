import React from 'react'
import styles from  './Navbar.module.scss'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../redux/features/auth/authSlice.js'
import { FaUserCircle } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");


const Navbar = () => {
    const { currentUser } = useSelector((state) => state.user);

    const username = currentUser.username
  return (
    <div className={styles.navbar}>
      <div className={styles.user}>
        <FaUserCircle size={40} color="#fff" />
        <h4 color='black'>{username}</h4>
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
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
