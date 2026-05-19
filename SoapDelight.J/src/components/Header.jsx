import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaMoon, FaShoppingBag, FaSun, FaTimes, FaUserCircle } from "react-icons/fa";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { toggleTheme } from "../redux/theme/themeSlice";
import { signoutSuccess } from "../redux/user/userSlice";
import { CALCULATE_TOTAL_QUANTITY, selectCartItems, selectCartTotalQuantity } from "../redux/features/cart/cartSlice";

const desktopLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const mobileLinks = [
  { label: "選購全部", to: "/shop" },
  { label: "手作皂", to: "/shop?category=手作皂" },
  { label: "個人護理", to: "/shop?category=個人護理" },
  { label: "香薰蠟", to: "/shop?category=香薰蠟" },
  { label: "收藏清單", to: "/wishlist" },
  { label: "購物車", to: "/cart" },
  { label: "品牌故事", to: "/about" },
  { label: "聯絡我們", to: "/contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const cartItems = useSelector(selectCartItems);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const userRole = currentUser?.role;
  const canManageProducts = userRole === "author" || userRole === "admin";
  const profilePicture = currentUser?.profilePicture?.trim();
  const showProfileImage = profilePicture && !avatarFailed;

  useEffect(() => {
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [dispatch, cartItems]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profilePicture]);

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
    `text-sm transition-colors ${
      isActive ? "text-zinc-950" : "text-zinc-600 hover:text-zinc-950"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white" aria-label="SoapDelight.J home">
          SoapDelight.J
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {desktopLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/wishlist"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 md:flex"
            aria-label="Wishlist"
          >
            <FaHeart size={16} />
          </Link>

          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            aria-label={`Cart with ${cartTotalQuantity} items`}
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
            aria-label="Toggle color theme"
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
                  aria-label="Account menu"
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
                      My Account
                    </Link>
                    <Link className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900" to="/order-history">
                      My Orders
                    </Link>
                    {canManageProducts && (
                      <Link className="block rounded px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900" to="/productAdmin/home">
                        Product Admin
                      </Link>
                    )}
                    <button type="button" onClick={handleSignout} className="w-full rounded px-3 py-2 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900">
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-800 transition hover:border-zinc-950 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-300" to="/sign-in">
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes size={18} /> : <HiOutlineMenuAlt3 size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-white px-6 py-6 dark:bg-zinc-950 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {mobileLinks.map((link) => (
              <Link key={link.label} to={link.to} className="border-b border-zinc-100 py-4 text-2xl font-medium text-zinc-950 dark:border-zinc-800 dark:text-white">
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <Link to="/dashboard?tab=profile" className="border-b border-zinc-100 py-4 text-2xl font-medium text-zinc-950 dark:border-zinc-800 dark:text-white">
                  我的帳戶
                </Link>
                {canManageProducts && (
                  <Link to="/productAdmin/home" className="border-b border-zinc-100 py-4 text-2xl font-medium text-zinc-950 dark:border-zinc-800 dark:text-white">
                    Product Admin
                  </Link>
                )}
                <button type="button" onClick={handleSignout} className="border-b border-zinc-100 py-4 text-left text-2xl font-medium text-zinc-950 dark:border-zinc-800 dark:text-white">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/sign-in" className="border-b border-zinc-100 py-4 text-2xl font-medium text-zinc-950 dark:border-zinc-800 dark:text-white">
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="mt-6 flex items-center gap-3 text-left text-sm text-zinc-600 dark:text-zinc-300"
            >
              {theme === "light" ? <FaSun /> : <FaMoon />}
              Toggle theme
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
