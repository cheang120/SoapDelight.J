import React from 'react'
import styles from  './Navbar.module.scss'
import { useSelector } from 'react-redux'
import { FaUserCircle } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");


const Navbar = () => {
    const { currentUser } = useSelector((state) => state.user);

    const username = currentUser?.username || "管理員";
  return (
    <div className={styles.navbar}>
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
        <ul>
          <li>
            <NavLink to={'/productAdmin/home'} className={activeLink}>
              管理首頁
            </NavLink>
          </li>
          <li>
            <NavLink to={'/productAdmin/all-products'} className={activeLink}>
              查看商品
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/inventory-locations" className={activeLink}>
              存貨地點
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/stock-movements" className={activeLink}>
              存貨流動
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/consignment-reports" className={activeLink}>
              寄賣回報
            </NavLink>
          </li>
          <li>
            <NavLink to={'/productAdmin/orders'} className={activeLink}>
              訂單
            </NavLink>
          </li>
          <li>
            <NavLink to={'/productAdmin/category'} className={activeLink}>
              分類
            </NavLink>
          </li>
          <li>
            <NavLink to={'/productAdmin/brand'} className={activeLink}>
              品牌
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/coupon" className={activeLink}>
              優惠券
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/shipping-methods" className={activeLink}>
              送貨方式
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/subscribers" className={activeLink}>
              訂閱者
            </NavLink>
          </li>
          <li>
            <NavLink to="/productAdmin/campaigns" className={activeLink}>
              推廣電郵
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
