import React from 'react'
import styles from  './Navbar.module.scss'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../redux/features/auth/authSlice.js'
import { FaUserCircle } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");


const Navbar = () => {
    const user = useSelector(selectUser)
    const username = user?.username
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
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
