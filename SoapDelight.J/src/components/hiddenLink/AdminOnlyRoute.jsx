import React, { Children } from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from '../../redux/features/auth/authSlice'
import { Link } from 'react-router-dom';

const AdminOnlyRoute = ({children}) => {
    const { currentUser } = useSelector((state) => state.user);

    const user = useSelector(selectUser)
    // console.log(user);
    // const userRole = user.role
    const userRole = currentUser ? currentUser.role : null;

    if (userRole === "author" || userRole === "admin") {
        return children
    }

  return (
    <section style={{height:"80vh"}}>
      <div className="container">
        <h2>Permission denied</h2>
        <p>This page can only be viewed by an admin user.</p>
        <br />
        <Link to={"/"}>
            <button>Back to Home</button>
        </Link>
      </div>
    </section>
  )
}

export const AdminOnlyLink = (children) => {
    const { currentUser } = useSelector((state) => state.user);
    const userRole = currentUser ? currentUser.role : null;
    if (userRole === "author") {
        return children
    }
    return null
}

export default AdminOnlyRoute
