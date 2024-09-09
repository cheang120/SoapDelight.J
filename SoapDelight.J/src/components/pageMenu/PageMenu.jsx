import React from "react";
import { NavLink } from "react-router-dom";
import "./PageMenu.scss";

const PageMenu = () => {
  return (
    <div>
      <nav className=" --p --mb">
        <ul className="home-links">
          {/* <li>
            <NavLink to="/dashboard?tab=profile" >Profile</NavLink>
          </li> */}
          {/* <li>
            <NavLink to="/wallet">My Wallet</NavLink>
          </li> */}
          <li>
            <NavLink to="/wishlist">Wishlist</NavLink>
          </li>

        </ul>
      </nav>
    </div>
  );
};

export default PageMenu;