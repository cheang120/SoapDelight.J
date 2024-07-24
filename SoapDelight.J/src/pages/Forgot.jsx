import React, { useState } from "react";
import { AiOutlineMail } from "react-icons/ai";
import { BiLogIn } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
// import Card from "../../components/card/Card";
// import Loader from "../../components/loader/Loader";
// import PasswordInput from "../../components/passwordInput/PasswordInput";
import { validateEmail } from "../redux/features/auth/authService";
// import { forgotPassword, RESET } from "../../redux/features/auth/authSlice";
import {forgotFailure,forgotStart} from '../redux/user/userSlice'
// import styles from "./auth.module.scss";

const Forgot = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();

//   const { isLoading } = useSelector((state) => state.auth);

  const forgot = async (e) => {
    e.preventDefault();

    if (!email) {
    //   return toast.error("Please enter an email");
      return dispatch(forgotFailure('Please enter an email.'));

    }

    if (!validateEmail(email)) {
    //   return toast.error("Please enter a valid email");
      return dispatch(forgotFailure('Please enter a valid email.'));

    }

    const userData = {
      email,
    };

    try {
        dispatch(forgotStart());
        const res = await fetch('/api/auth/forgotPassword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        const data = await res.json();
  
        if (res.ok) {
          toast.success(data.message);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        dispatch(forgotFailure(error.message));
        toast.error(error.message);
      }

    // await dispatch(forgotPassword(userData));
    // await dispatch(RESET(userData));
  };

  return (
    <div>
      {/* {isLoading && <Loader />} */}
      <div>
        <div >
          <div className="--flex-center">
            <AiOutlineMail size={35} color="#999" />
          </div>
          <h2>Forgot Password</h2>

          <form onSubmit={forgot}>
            <input
              type="email"
              placeholder="Email"
              required
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="--btn --btn-primary --btn-block">
              Get Reset Email
            </button>
            <div >
              <p>
                <Link to="/">- Home</Link>
              </p>
              <p>
                <Link to="/sign-in">- Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Forgot;