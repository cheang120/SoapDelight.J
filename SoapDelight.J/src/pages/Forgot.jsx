import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { validateEmail } from "../redux/features/auth/authService";
import { forgotFailure, forgotStart, forgotSuccess } from "../redux/user/userSlice";
import AuthShell, {
  authInlineLinkClassName,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "../components/auth/AuthShell";

const Forgot = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.user);

  const forgot = async (e) => {
    e.preventDefault();

    if (!email) {
      return dispatch(forgotFailure("請輸入電郵地址。"));
    }

    if (!validateEmail(email)) {
      return dispatch(forgotFailure("請輸入有效的電郵地址。"));
    }

    const userData = {
      email,
    };

    setSubmitting(true);
    try {
      dispatch(forgotStart());
      const res = await fetch("/api/auth/forgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (res.ok) {
        dispatch(forgotSuccess());
        toast.success(data.message);
        navigate("/");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      dispatch(forgotFailure(error.message));
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="帳戶協助"
      title="忘記密碼"
      subtitle="輸入你的電郵地址，我們會寄送重設密碼連結給你。"
      footer={
        <>
          <Link to="/" className={authInlineLinkClassName}>
            首頁
          </Link>
          <span>記得密碼了？</span>
          <Link to="/sign-in" className={authInlineLinkClassName}>
            登入
          </Link>
        </>
      }
    >
      <form onSubmit={forgot} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            電郵地址
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="name@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClassName}
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <button type="submit" className={authPrimaryButtonClassName} disabled={submitting}>
          {submitting ? "寄送中..." : "取得重設密碼電郵"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Forgot;
