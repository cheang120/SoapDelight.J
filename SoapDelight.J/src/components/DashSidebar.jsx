import { HiArrowSmRight, HiClipboardList, HiUser } from "react-icons/hi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signoutSuccess } from "../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

const navItemClass = (active) =>
  `flex min-h-11 items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
    active
      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
  }`;

export default function DashSidebar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [tab, setTab] = useState("profile");

  const userRole = currentUser?.role;

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }

    if (tabFromUrl === "users" && userRole !== "admin") {
      navigate("/dashboard?tab=profile");
    }
  }, [location.search, userRole, navigate]);

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-2 pb-4 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          導覽
        </p>
        <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
          {currentUser?.username || "帳戶"}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {currentUser?.email || "已登入"}
        </p>
      </div>

      <nav className="mt-4 space-y-2">
        <Link to="/dashboard?tab=profile" className={navItemClass(tab === "profile")}>
          <span className="flex items-center gap-3">
            <HiUser size={18} />
            個人資料
          </span>
          <span className="text-xs uppercase tracking-[0.18em] opacity-70">
            帳戶
          </span>
        </Link>

        <Link to="/order-history" className={navItemClass(false)}>
          <span className="flex items-center gap-3">
            <HiClipboardList size={18} />
            訂單
          </span>
          <span className="text-xs uppercase tracking-[0.18em] opacity-70">
            紀錄
          </span>
        </Link>

        {userRole === "admin" && (
          <Link to="/dashboard?tab=users" className={navItemClass(tab === "users")}>
            <span className="flex items-center gap-3">
              <HiUser size={18} />
              使用者
            </span>
            <span className="text-xs uppercase tracking-[0.18em] opacity-70">
              管理
            </span>
          </Link>
        )}

        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
          onClick={handleSignout}
        >
          <span className="flex items-center gap-3">
            <HiArrowSmRight size={18} />
            登出
          </span>
        </button>
      </nav>
    </div>
  );
}
