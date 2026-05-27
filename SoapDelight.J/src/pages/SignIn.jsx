import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaTimes } from "react-icons/fa";
import { BsCheck2All } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import OAuth from "../components/OAuth";
import { signInStart, signInFailure, signInSuccess } from "../redux/user/userSlice";
import { getCartDB, saveCartDB } from "../redux/features/cart/cartSlice";
import AuthShell, {
  authInlineLinkClassName,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "../components/auth/AuthShell";

const initialState = {
  email: "",
  password: "",
};

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

const PasswordChecklist = ({ uCase, num, sChar, passLength }) => {
  const timesIcon = <FaTimes color="red" size={15} />;
  const checkIcon = <BsCheck2All color="green" size={15} />;
  const switchIcon = (condition) => (condition ? checkIcon : timesIcon);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
      <ul className="space-y-2">
        <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
          {switchIcon(uCase)}
          <span className="ml-2">包含英文大小寫</span>
        </li>
        <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
          {switchIcon(num)}
          <span className="ml-2">包含數字 (0-9)</span>
        </li>
        <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
          {switchIcon(sChar)}
          <span className="ml-2">包含特殊符號 (!@#$%^&*)</span>
        </li>
        <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
          {switchIcon(passLength)}
          <span className="ml-2">至少 6 個字元</span>
        </li>
      </ul>
    </div>
  );
};

export default function SignIn() {
  const [formData, setFormData] = useState(initialState);
  const { password } = formData;
  const [submitting, setSubmitting] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [uCase, setUCase] = useState(false);
  const [num, setNum] = useState(false);
  const [sChar, setSChar] = useState(false);
  const [passLength, setPassLength] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const redirect = urlParams.get("redirect");
  const { error } = useSelector((state) => state.user);

  const togglePassword1 = () => {
    setShowPassword1(!showPassword1);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  useEffect(() => {
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
      setUCase(true);
    } else {
      setUCase(false);
    }
    if (password.match(/([0-9])/)) {
      setNum(true);
    } else {
      setNum(false);
    }
    if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) {
      setSChar(true);
    } else {
      setSChar(false);
    }
    if (password.length > 5) {
      setPassLength(true);
    } else {
      setPassLength(false);
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return dispatch(signInFailure("請填寫所有必填欄位。"));
    }

    if (!validateEmail(formData.email)) {
      return dispatch(signInFailure("請輸入有效的電郵地址。"));
    }

    if (!formData.password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
      return dispatch(signInFailure("密碼必須包含英文大寫及小寫字母。"));
    }
    setSubmitting(true);
    try {
      dispatch(signInStart());
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "登入失敗");
      }

      dispatch(signInSuccess(data));
      if (redirect === "cart") {
        dispatch(
          saveCartDB({ cartItems: JSON.parse(localStorage.getItem("cartItems")) })
        );
        return navigate("/cart");
      }
      dispatch(getCartDB());
      navigate("/dashboard?tab=profile");
    } catch (error) {
      const message = error.response?.data?.message || error.message || "登入失敗";
      dispatch(signInFailure(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="歡迎回來"
      title="登入"
      subtitle="登入後即可查看帳戶資料、訂單紀錄與你的收藏清單。"
      footer={
        <>
          <Link to="/" className={authInlineLinkClassName}>
            首頁
          </Link>
          <span>還未有帳戶？</span>
          <Link to="/sign-up" className={authInlineLinkClassName}>
            註冊
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            電郵地址
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            id="email"
            onChange={handleChange}
            className={authInputClassName}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className={authLabelClassName}>
            密碼
            </label>
            <Link to="/forgotpassword" className={`${authInlineLinkClassName} text-xs sm:text-sm`}>
              忘記密碼
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword1 ? "text" : "password"}
              placeholder="密碼"
              className={`${authInputClassName} pr-12`}
              required
              id="password"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={togglePassword1}
              aria-label={showPassword1 ? "隱藏密碼" : "顯示密碼"}
            >
              {showPassword1 ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
        </div>

        <PasswordChecklist uCase={uCase} num={num} sChar={sChar} passLength={passLength} />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className={authPrimaryButtonClassName}>
          {submitting ? "登入中..." : "登入"}
        </button>

        <OAuth />
      </form>
    </AuthShell>
  );
}
