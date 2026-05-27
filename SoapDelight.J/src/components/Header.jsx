import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaMoon, FaShoppingBag, FaSun, FaTimes, FaUserCircle } from "react-icons/fa";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { toggleTheme } from "../redux/theme/themeSlice";
import { signoutSuccess } from "../redux/user/userSlice";
import { getWishlist } from "../redux/features/auth/authSlice";
import { CALCULATE_TOTAL_QUANTITY, selectCartItems, selectCartTotalQuantity } from "../redux/features/cart/cartSlice";

const desktopLinks = [
  { label: "首頁", to: "/" },
  { label: "選購", to: "/shop" },
  { label: "關於我們", to: "/about" },
  { label: "聯絡我們", to: "/contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { wishlist = [] } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.theme);
  const cartItems = useSelector(selectCartItems);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const userRole = currentUser?.role;
  const canManageProducts = userRole === "author" || userRole === "admin";
  const profilePicture = currentUser?.profilePicture?.trim();
  const showProfileImage = profilePicture && !avatarFailed;
  const wishlistCount = Array.isArray(wishlist)
    ? wishlist.filter((item) => item?.category !== "Shipping").length
    : 0;
  const hasWishlistItems = Boolean(currentUser && wishlistCount > 0);

  useEffect(() => {
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [dispatch, cartItems]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profilePicture]);

  useEffect(() => {
    if (currentUser?._id) {
      dispatch(getWishlist());
    }
  }, [currentUser?._id, dispatch]);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
        return;
      }
      dispatch(signoutSuccess());
      localStorage.setItem("cartItems", JSON.stringify([]));
      setAccountOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.log(error.message);
    }
  };

  const navClass = ({ isActive }) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 ${
      isActive
        ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
        : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white" aria-label="SoapDelight.J 首頁">
          SoapDelight.J
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="主要導覽">
          {desktopLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/wishlist"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              hasWishlistItems
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            }`}
            aria-label={hasWishlistItems ? `收藏清單已有 ${wishlistCount} 件商品` : "收藏清單"}
          >
            <FaHeart size={16} />
          </Link>

          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            aria-label={`購物車共有 ${cartTotalQuantity} 件商品`}
          >
            <FaShoppingBag size={17} />
            {cartTotalQuantity > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[11px] font-medium text-white dark:bg-white dark:text-zinc-950">
                {cartTotalQuantity}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 md:flex"
            aria-label="切換深色或淺色模式"
          >
            {theme === "light" ? <FaSun size={16} /> : <FaMoon size={15} />}
          </button>

          <div className="relative hidden md:block">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex h-9 items-center gap-2 rounded-full px-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  aria-label="帳戶選單"
                  aria-expanded={accountOpen}
                >
                  {showProfileImage ? (
                    <img
                      src={profilePicture}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <FaUserCircle size={22} />
                  )}
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                      <p className="font-medium text-zinc-950 dark:text-white">{currentUser.username}</p>
                      <p className="truncate text-xs text-zinc-500">{currentUser.email}</p>
                    </div>
                    <Link className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900" to="/dashboard?tab=profile">
                      我的帳戶
                    </Link>
                    <Link className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900" to="/order-history">
                      我的訂單
                    </Link>
                    {canManageProducts && (
                      <Link className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900" to="/productAdmin/home">
                        商品管理
                      </Link>
                    )}
                    <button type="button" onClick={handleSignout} className="w-full rounded px-3 py-2 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900">
                      登出
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-800 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-300" to="/sign-in">
                登入
              </Link>
            )}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes size={18} /> : <HiOutlineMenuAlt3 size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-[70] px-3 pb-3 md:hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm dark:bg-black/35" />
          <div className="relative mx-auto max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[1.75rem] border border-white/90 bg-[rgba(255,255,255,0.98)] px-5 py-5 shadow-[0_25px_60px_rgba(15,23,42,0.2)] backdrop-blur-3xl backdrop-saturate-150 dark:border-zinc-800/80 dark:bg-[rgba(9,9,11,0.95)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
            <nav className="flex flex-col" aria-label="手機導覽">
            {desktopLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="border-b border-zinc-100 py-4 text-lg font-medium tracking-tight text-zinc-950 transition hover:text-zinc-700 dark:border-zinc-800 dark:text-white dark:hover:text-zinc-300 sm:text-xl"
              >
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <Link
                  to="/dashboard?tab=profile"
                  className="border-b border-zinc-100 py-4 text-lg font-medium tracking-tight text-zinc-950 transition hover:text-zinc-700 dark:border-zinc-800 dark:text-white dark:hover:text-zinc-300 sm:text-xl"
                >
                  我的帳戶
                </Link>
                {canManageProducts && (
                  <Link
                    to="/productAdmin/home"
                    className="border-b border-zinc-100 py-4 text-lg font-medium tracking-tight text-zinc-950 transition hover:text-zinc-700 dark:border-zinc-800 dark:text-white dark:hover:text-zinc-300 sm:text-xl"
                  >
                    商品管理
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignout}
                  className="border-b border-zinc-100 py-4 text-left text-lg font-medium tracking-tight text-zinc-950 transition hover:text-zinc-700 dark:border-zinc-800 dark:text-white dark:hover:text-zinc-300 sm:text-xl"
                >
                  登出
                </button>
              </>
            ) : (
              <Link
                to="/sign-in"
                className="border-b border-zinc-100 py-4 text-lg font-medium tracking-tight text-zinc-950 transition hover:text-zinc-700 dark:border-zinc-800 dark:text-white dark:hover:text-zinc-300 sm:text-xl"
              >
                登入
              </Link>
            )}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="mt-5 flex items-center gap-3 text-left text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              {theme === "light" ? <FaSun /> : <FaMoon />}
              切換顯示模式
            </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
