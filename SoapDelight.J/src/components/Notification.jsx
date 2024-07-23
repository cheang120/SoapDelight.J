import React from "react";
import { useDispatch } from "react-redux";
import { RESET, sendVerificationEmail } from "../redux/features/auth/authSlice";
import { TextInput } from "flowbite-react";



const Notification = () => {
  const dispatch = useDispatch();

  const sendVerEmail = async () => {
    await dispatch(sendVerificationEmail());
    await dispatch(RESET());
  };

  return (
    <div className="container">
        <TextInput
          type='email'
          id='email'
          placeholder='Please verify your email!'
          onChange={handleChange}
        />
    </div>
  );
};

export default Notification;