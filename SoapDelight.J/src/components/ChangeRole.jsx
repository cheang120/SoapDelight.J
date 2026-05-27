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
      toast.error("請選擇角色。");
      return;
    }

    const userData = {
      role: userRole,
      id: _id,
    };

    const emailData = {
      subject: "帳戶角色已更改 - SoapDelight.J",
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
      toast.success("使用者角色已成功更新。");
    } catch (error) {
      toast.error("未能更新使用者角色。");
    }
  };

  return (
    <div className=''>
      <form
        className=" flex items-center justify-center"
        onSubmit={changeRole}
      >
        <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
          <option value="">-- 請選擇 --</option>
          <option value="subscriber">訂閱者</option>
          <option value="author">作者</option>
          <option value="admin">管理員</option>
          <option value="suspended">已停權</option>
        </select>
        <button className="flex items-center justify-center ml-2 z-10 text-base font-normal px-2 py-1 mr-0.5 border border-transparent rounded-md cursor-pointer transition duration-300 text-white bg-blue-500">
          <FaCheck size={15} />
        </button>
      </form>
    </div>
  )
}

export default ChangeRole;
