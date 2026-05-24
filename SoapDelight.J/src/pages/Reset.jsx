import { useEffect, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BsCheck2All } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthShell, {
  authInlineLinkClassName,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "../components/auth/AuthShell";

const initialState = {
  password: "",
  password2: "",
};

const Reset = () => {
  const [formData, setFormData] = useState(initialState);
  const { password, password2 } = formData;
  const [submitting, setSubmitting] = useState(false);
  const { resetToken } = useParams();

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [uCase, setUCase] = useState(false);
  const [num, setNum] = useState(false);
  const [sChar, setSChar] = useState(false);
  const [passLength, setPassLength] = useState(false);

  const navigate = useNavigate();

  const togglePassword1 = () => {
    setShowPassword1((previous) => !previous);
  };

  const togglePassword2 = () => {
    setShowPassword2((previous) => !previous);
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

  const timesIcon = <FaTimes color="red" size={15} />;
  const checkIcon = <BsCheck2All color="green" size={15} />;

  const switchIcon = (condition) => {
    if (condition) {
      return checkIcon;
    }
    return timesIcon;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const reset = async (e) => {
    e.preventDefault();

    if (!password || !password2) {
      return;
    }
    if (password.length < 6) {
      return;
    }
    if (password !== password2) {
      return;
    }
    if (!password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/resetPassword/${resetToken}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error! status: ${response.status}`);
      }

      navigate("/sign-in");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="ACCOUNT SECURITY"
      title="Reset Password"
      subtitle="Enter your new password below."
      footer={
        <>
          <Link to="/" className={authInlineLinkClassName}>
            Home
          </Link>
          <span>Need to go back?</span>
          <Link to="/sign-in" className={authInlineLinkClassName}>
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={reset} className="flex flex-col gap-5">
        <div>
          <label htmlFor="password" className={authLabelClassName}>
            Your password
          </label>
          <div className="relative">
            <input
              type={showPassword1 ? "text" : "password"}
              placeholder="Password"
              className={`${authInputClassName} pr-12`}
              required
              id="password"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={togglePassword1}
              aria-label={showPassword1 ? "Hide password" : "Show password"}
            >
              {showPassword1 ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="password2" className={authLabelClassName}>
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showPassword2 ? "text" : "password"}
              placeholder="Confirm Password"
              className={`${authInputClassName} pr-12`}
              required
              id="password2"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={togglePassword2}
              aria-label={showPassword2 ? "Hide password confirmation" : "Show password confirmation"}
            >
              {showPassword2 ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <ul className="space-y-2">
            <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
              {switchIcon(uCase)}
              <span className="ml-2">Lowercase &amp; Uppercase</span>
            </li>
            <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
              {switchIcon(num)}
              <span className="ml-2">Number (0-9)</span>
            </li>
            <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
              {switchIcon(sChar)}
              <span className="ml-2">Special Character (!@#$%^&*)</span>
            </li>
            <li className="flex items-center text-[0.72rem] text-zinc-500 dark:text-zinc-400">
              {switchIcon(passLength)}
              <span className="ml-2">At least 6 characters</span>
            </li>
          </ul>
        </div>

        <button type="submit" className={authPrimaryButtonClassName} disabled={submitting}>
          {submitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Reset;
