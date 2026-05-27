import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaTimes } from "react-icons/fa";
import { BsCheck2All } from "react-icons/bs";
import { toast } from "react-toastify";
import OAuth from "../components/OAuth";
import { validateEmail } from "../redux/features/auth/authService";
import { signInStart, signInFailure, signInSuccess } from "../redux/user/userSlice";
import { API_BASE_URL } from "../utils/apiBase";
import AuthShell, {
  authInlineLinkClassName,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "../components/auth/AuthShell";

const initialState = {
  username: "",
  email: "",
  phone: "",
  password: "",
  password2: "",
  subscribe: false,
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

export default function SignUp() {
  const [formData, setFormData] = useState(initialState);
  const { password } = formData;
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [uCase, setUCase] = useState(false);
  const [num, setNum] = useState(false);
  const [sChar, setSChar] = useState(false);
  const [passLength, setPassLength] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.user);

  const togglePassword1 = () => {
    setShowPassword1(!showPassword1);
  };

  const togglePassword2 = () => {
    setShowPassword2(!showPassword2);
  };

  const handleChange = (e) => {
    const { id, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [id]: type === "checkbox" ? checked : value.trim(),
    });
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

  const handleSubmit = async (signinData) => {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signinData),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "登入失敗");
    }
    dispatch(signInSuccess(data));
    navigate("/dashboard?tab=profile");
    return data;
  };

  const saveSignupSubscription = async () => {
    if (!formData.subscribe) return true;

    const preferredChannels = formData.phone ? ["email", "whatsapp"] : ["email"];

    try {
      const response = await fetch(`${API_BASE_URL}/subscribers/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.username,
          phone: formData.phone,
          preferredChannels,
          source: "signup",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "未能儲存訂閱設定。");
      }

      toast.success("帳戶已建立，訂閱設定亦已儲存。");
      return true;
    } catch (subscriptionError) {
      toast.warn(
        "帳戶已建立，但未能儲存訂閱設定。你可稍後在帳戶中更新。"
      );
      return false;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.password2) {
      return dispatch(signInFailure("請填寫所有必填欄位。"));
    }
    if (formData.password.length < 6) {
      return dispatch(signInFailure("密碼至少需要 6 個字元。"));
    }
    if (!validateEmail(formData.email)) {
      return dispatch(signInFailure("請輸入有效的電郵地址。"));
    }
    if (formData.password !== formData.password2) {
      return dispatch(signInFailure("兩次輸入的密碼不一致。"));
    }
    if (!formData.password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
      return dispatch(
        signInFailure("密碼必須包含英文大寫及小寫字母。")
      );
    }

    setSubmitting(true);
    try {
      setErrorMessage(null);
      dispatch(signInStart());
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "註冊失敗");
      }

      await saveSignupSubscription();

      await fetch("/api/auth/sendVerificationEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      await handleSubmit({ email: formData.email, password: formData.password });
    } catch (error) {
      dispatch(signInFailure(error.message));
      if (error.message.includes("Email already registered")) {
        setErrorMessage("此電郵地址已被註冊，請使用另一個電郵地址。");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const visibleError = errorMessage || error;

  return (
    <AuthShell
      eyebrow="建立帳戶"
      title="註冊"
      subtitle="建立帳戶後即可管理個人資料、訂單紀錄與收藏清單。"
      footer={
        <>
          <Link to="/" className={authInlineLinkClassName}>
            首頁
          </Link>
          <span>已經有帳戶？</span>
          <Link to="/sign-in" className={authInlineLinkClassName}>
            登入
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSignup}>
        <div>
          <label htmlFor="username" className={authLabelClassName}>
            用戶名稱
          </label>
          <input
            type="text"
            placeholder="用戶名稱"
            id="username"
            onChange={handleChange}
            className={authInputClassName}
          />
        </div>

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
          <label htmlFor="phone" className={authLabelClassName}>
            WhatsApp 號碼（選填）
          </label>
          <input
            type="tel"
            placeholder="WhatsApp 號碼"
            id="phone"
            onChange={handleChange}
            className={authInputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className={authLabelClassName}>
            密碼
          </label>
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

        <div>
          <label htmlFor="password2" className={authLabelClassName}>
            確認密碼
          </label>
          <div className="relative">
            <input
              type={showPassword2 ? "text" : "password"}
              placeholder="確認密碼"
              className={`${authInputClassName} pr-12`}
              required
              id="password2"
              name="password2"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={togglePassword2}
              aria-label={showPassword2 ? "隱藏確認密碼" : "顯示確認密碼"}
            >
              {showPassword2 ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
        </div>

        <PasswordChecklist uCase={uCase} num={num} sChar={sChar} passLength={passLength} />

        <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          <input
            type="checkbox"
            id="subscribe"
            checked={formData.subscribe}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-zinc-300"
          />
          <span>
            我同意接收 SoapDelight.J 的優惠、新品更新及推廣訊息。
          </span>
        </label>

        {visibleError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {visibleError}
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className={authPrimaryButtonClassName}>
          {submitting ? "註冊中..." : "註冊"}
        </button>

        <OAuth />
      </form>
    </AuthShell>
  );
}
