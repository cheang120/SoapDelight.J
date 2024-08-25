import { Avatar, Button, Dropdown, Navbar, Sidebar, TextInput } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';
import { useEffect, useState } from 'react';
import { HiOutlineMenuAlt3, HiUser } from "react-icons/hi";
import { FaShoppingCart, FaTimes, FaUserCircle } from "react-icons/fa";
import { AdminOnlyLink } from './hiddenLink/AdminOnlyRoute';
import { CALCULATE_TOTAL_QUANTITY, selectCartItems, selectCartTotalQuantity } from '../redux/features/cart/cartSlice';
// import { Sidebar } from 'flowbite-react';


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


  // const role = obj?.role;
  // console.log(userRole);
  // console.log(currentUser);
  const userRole = currentUser ? currentUser.role : null;


  // const [searchTerm, setSearchTerm] = useState('');

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(location.search);
  //   const searchTermFromUrl = urlParams.get('searchTerm');
  //   if (searchTermFromUrl) {
  //     setSearchTerm(searchTermFromUrl);
  //   }
  // }, [location.search]);

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
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const hideMenu = () => {
    setShowMenu(false);
  };

  const cart = (
    <span className='flex'>
      <FaShoppingCart size={20} className='text-purple-500'/> 
      <p className='ml-1 text-purple-500'>
        {cartTotalQuantity}
      </p>
    </span>
  );

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   const urlParams = new URLSearchParams(location.search);
  //   urlParams.set('searchTerm', searchTerm);
  //   const searchQuery = urlParams.toString();
  //   navigate(`/search?${searchQuery}`);
  // };

  useEffect(() => {
    // dispatch(CALCULATE_SUBTOTAL({ coupon }));
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [cartItems, dispatch]);

  return (
    <Navbar
      className={`
        border-b-2 list-none z-50
        ${scrollPage ? 'z-50 fixed top-0 w-full  transition-all duration-500 bg-white' : 'null'}
      `}
    >
      <Link
        to='/'
        className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white'
      >
        {/* <img src="/logo.svg" alt="SoapDelight.J" className='w-10 ' /> */}
        <p className='text-purple-500'>Soap<span className='text-yellow-400'>Delight.J</span></p>
      </Link>
      {/* <form 
        // onSubmit={handleSubmit}
      >
        <TextInput
          type='text'
          placeholder='Search...'
          rightIcon={AiOutlineSearch}
          className='hidden sm:inline'
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form> */}

      <div className='flex gap-2 md:order-2'>
        <Button
          className='w-12 h-10 '
          color='gray'
          pill
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === 'light' ? <FaSun /> : <FaMoon />}
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
            {(userRole === 'author' ||  userRole === 'admin')  && (
            <Link to='/productAdmin/home'>

              <Dropdown.Item>ProductAdmin</Dropdown.Item>

            </Link>
          )}
          {/* <AdminOnlyLink>
            <Link to='/productAdmin/home'>

              <Dropdown.Item>ProductAdmin</Dropdown.Item>

            </Link>
          </AdminOnlyLink> */}
            <Dropdown.Divider />
            <Dropdown.Item 
              onClick={handleSignout}
            >
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
        {/* <form 
          // onSubmit={handleSubmit}
        >
          <TextInput
            type='text'
            placeholder='Search...'
            rightIcon={AiOutlineSearch}
            className='block sm:hidden mb-10'
            // value={searchTerm}
            // onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form> */}

        <Navbar.Link active={path === '/'} as={'div'} >
          <Link to='/' >Home</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/about'} as={'div'}>
          <Link to='/about'>About</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/projects'} as={'div'}>
          <Link to='/projects'>Projects</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/cart'} as={'div'} className='none cursor-pointer'>
          <Link to='/cart'>{cart}</Link>
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}