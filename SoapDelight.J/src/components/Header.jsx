import { Avatar, Button, Dropdown, Navbar, Sidebar, TextInput } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';
import { useEffect, useState } from 'react';
import { HiOutlineMenuAlt3, HiUser } from "react-icons/hi";
import { FaShoppingCart, FaTimes, FaUserCircle, FaRegHeart, FaHeart } from "react-icons/fa";
import { AdminOnlyLink } from './hiddenLink/AdminOnlyRoute';
import { CALCULATE_TOTAL_QUANTITY, getCartDB, selectCartItems, selectCartTotalQuantity } from '../redux/features/cart/cartSlice';
import Wishlist from '../pages/wishlist/Wishlist';

export default function Header() {
  const path = useLocation().pathname;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const [showMenu, setShowMenu] = useState(false);
  const [scrollPage, setScrollPage] = useState(false);
  const cartTotalQuantity = useSelector(selectCartTotalQuantity);
  const cartItems = useSelector(selectCartItems);

  const userRole = currentUser ? currentUser.role : null;

  const fixNavbar = () => {
    if (window.scrollY > 50) {
      setScrollPage(true);
    } else {
      setScrollPage(false);
    }
  };
  window.addEventListener("scroll", fixNavbar);

  const handleSignout = async () => {
    try {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
        localStorage.setItem("cartItems", JSON.stringify([]));
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [dispatch, cartItems]);

  const cart = (
    <span className='flex  '>
      <FaShoppingCart size={20}  />
      <p className='ml-1'>
        {cartTotalQuantity}
      </p>
    </span>
  );

  const wishlist = (
    <span className='flex'>
      <FaHeart size={20}  />
    </span>
  );

  return (
    <Navbar
      className={`
        list-none z-50 sticky top-0 backdrop-filter backdrop-blur-lg bg-white bg-opacity-70
        ${scrollPage ? 'shadow-md' : ''}
      `}
    >
      <Link
        to='/'
        className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white'
      >
        <img src="/logo.svg" alt="SoapDelight.J" className='w-14 h-14 ' />
      </Link>

      <div className='flex gap-2 md:order-2'>
        <Button
          className='w-12 h-10 border-purple-500 shadow-md'
          color='gray'
          pill
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === 'light' ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-purple-500" />}
        </Button>
        {currentUser ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar alt='user' img={currentUser.profilePicture} rounded />
            }
          >
            <Dropdown.Header>
              <span className='block text-sm'>@{currentUser.username}</span>
              <span className='block text-sm font-medium truncate'>
                {currentUser.email}
              </span>
            </Dropdown.Header>
            <Link to={'/dashboard?tab=profile'}>
              <Dropdown.Item>Profile</Dropdown.Item>
            </Link>
            {(userRole === 'author' || userRole === 'admin') && (
              <Link to='/productAdmin/home'>
                <Dropdown.Item>ProductAdmin</Dropdown.Item>
              </Link>
            )}
            <Link to='/order-history'>
              <Dropdown.Item>My Orders</Dropdown.Item>
            </Link>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignout}>
              Sign out
            </Dropdown.Item>
          </Dropdown>
        ) : (
          <Link to='/sign-in'>
            <Button gradientDuoTone='purpleToBlue' outline>
              Sign In
            </Button>
          </Link>
        )}

        <Navbar.Toggle />
      </div>

      <Navbar.Collapse>
  <Navbar.Link active={path === '/'} as={'div'}
    className={` relative ${path === '/' ? 'text-yellow-400 bg-purple-700' : 'text-purple-500 hover:text-yellow-400'}`}
  >
    <Link
      to='/'
      className={`relative ${path === '/' ? 'text-yellow-400' : 'text-purple-500 hover:text-yellow-400'}
        after:content-[''] after:absolute after:left-1/2 after:bottom-[-5px] after:w-0 after:h-[2px] after:bg-yellow-400
        after:transition-all after:duration-300 after:transform after:-translate-x-1/2 ${path === '/' ? 'after:w-full' : 'hover:after:w-full'}
      `}
    >
      Home
    </Link>
  </Navbar.Link>

  <Navbar.Link active={path === '/shop'} as={'div'} 
        className={` relative ${path === '/shop' ? 'text-yellow-400 bg-purple-700' : 'text-purple-500 hover:text-yellow-400'}`}
  >
    <Link
      to='/shop'
      className={` relative ${path === '/shop' ? 'text-yellow-400' : 'text-purple-500 hover:text-yellow-400'}
      after:content-[''] after:absolute after:left-1/2 after:bottom-[-5px] after:w-0 after:h-[2px] after:bg-yellow-400
      after:transition-all after:duration-300 after:transform after:-translate-x-1/2 ${path === '/shop' ? 'after:w-full' : 'hover:after:w-full'}
    `}
    >
      Shop
    </Link>
  </Navbar.Link>

  <Navbar.Link active={path === '/projects'} as={'div'}
    className={` relative ${path === '/projects' ? 'text-yellow-400 bg-purple-700' : 'text-purple-500 hover:text-yellow-400'}`}
  >
    <Link
      to='/projects'
      className={`relative ${path === '/projects' ? 'text-yellow-400' : 'text-purple-500 hover:text-yellow-400'}
      after:content-[''] after:absolute after:left-1/2 after:bottom-[-5px] after:w-0 after:h-[2px] after:bg-yellow-400
      after:transition-all after:duration-300 after:transform after:-translate-x-1/2 ${path === '/projects' ? 'after:w-full' : 'hover:after:w-full'}
    `}
    >
      Projects
    </Link>
  </Navbar.Link>

  <Navbar.Link active={path === '/cart'} as={'div'}
      className={` relative ${path === '/cart' ? 'text-yellow-400 bg-purple-700' : 'text-purple-500 hover:text-yellow-400'}`}
  >
    <Link
      to='/cart'
      className={`relative ${path === '/cart' ? 'text-yellow-400' : 'text-purple-500 hover:text-yellow-400'}
      after:content-[''] after:absolute after:left-1/2 after:bottom-[-5px] after:w-0 after:h-[2px] after:bg-yellow-400
      after:transition-all after:duration-300 after:transform after:-translate-x-1/2 ${path === '/cart' ? 'after:w-full' : 'hover:after:w-full'}
    `}
    >
      {cart}
    </Link>
  </Navbar.Link>

  <Navbar.Link active={path === '/wishlist'} as={'div'}
      className={` relative ${path === '/wishlist' ? 'text-yellow-400 bg-purple-700' : 'text-purple-500 hover:text-yellow-400'}`}
  >
    <Link
      to='/wishlist'
      className={`relative ${path === '/wishlist' ? 'text-yellow-400' : 'text-purple-500 hover:text-yellow-400'}
      after:content-[''] after:absolute after:left-1/2 after:bottom-[-5px] after:w-0 after:h-[2px] after:bg-yellow-400
      after:transition-all after:duration-300 after:transform after:-translate-x-1/2 ${path === '/wishlist' ? 'after:w-full' : 'hover:after:w-full'}
    `}
    >
      {wishlist}
    </Link>
  </Navbar.Link>
</Navbar.Collapse>

    </Navbar>
  );
}
