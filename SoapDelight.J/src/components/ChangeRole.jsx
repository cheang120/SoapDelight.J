import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { getUsers, upgradeUser } from "../redux/features/auth/authSlice";
import { EMAIL_RESET, sendAutomatedEmail } from "../redux/features/email/emailSlice";

const ChangeRole = ({ _id, email, role }) => {
  const [userRole, setUserRole] = useState("");
  const dispatch = useDispatch();

  // Change User role
  const changeRole = async (e) => {
    e.preventDefault();

    if (!userRole) {
      toast.error("Please select a role");
      return;
    }

    const userData = {
      role: userRole,
      id: _id,
    };

    const emailData = {
      subject: "Account Role Changed - BabyCode",
      send_to: email,
      reply_to: "noreply@babycode",
      template: "changeRole",
      url: "/login",
    };

    try {
      await dispatch(upgradeUser(userData)).unwrap();
      await dispatch(sendAutomatedEmail(emailData)).unwrap();
      await dispatch(getUsers()).unwrap();
      dispatch(EMAIL_RESET());
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  return (
    <div className=''>
      <form
        className=" flex items-center justify-center"
        onSubmit={changeRole}
      >
        <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
          <option value="">-- select --</option>
          <option value="subscriber">Subscriber</option>
          <option value="author">Author</option>
          <option value="admin">Admin</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="flex items-center justify-center ml-2 z-10 text-base font-normal px-2 py-1 mr-0.5 border border-transparent rounded-md cursor-pointer transition duration-300 text-white bg-blue-500">
          <FaCheck size={15} />
        </button>
      </form>
    </div>
  )
}

export default ChangeRole;

