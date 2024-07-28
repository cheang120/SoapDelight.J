import React, { useState } from "react";
import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { AiOutlineMail } from "react-icons/ai";
import { BiLogIn } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
          navigate('/');
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
    <div className="min-h-screen flex flex-col justify-center items-center mx-auto max-w-4xl px-4">
        <div className="border border-transparent w-2/3 rounded-lg shadow-<your-shadow-class> overflow-hidden">
            <div className="block text-lg font-light p-4 mx-auto w-full border border-gray-300 border-b-3 rounded-md outline-none">
            <div className="flex justify-center items-center">
                <AiOutlineMail size={35} color="#999" />
            </div>
            <h2 className="text-center mb-6">Forgot Password</h2>

            <form onSubmit={forgot} className="flex flex-col items-center">
                <input
                type="email"
                placeholder="Email"
                required
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full mb-5 border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                />

                <div className="flex items-center justify-between w-full mb-5">
                <p className="hover:text-blue-500">
                    <Link to="/">Home</Link>
                </p>
                <Button type="submit" gradientDuoTone='purpleToPink' className="text-lg font-normal px-2 py-1  rounded-md cursor-pointer flex items-center justify-center transition duration-300 --btn-primary --btn-block">
                    Get Reset Email
                </Button>
                <p className="hover:text-blue-500">
                    <Link to="/sign-in">Login</Link>
                </p>
                </div>
            </form>
            </div>
        </div>
    </div>
  );
};

export default Forgot;