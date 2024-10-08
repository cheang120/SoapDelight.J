import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import Home from './pages/home/Home'
import About from './pages/About'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Header from './components/Header'
import FooterCom from './components/Footer'
import axios from "axios"
import {ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import PrivateRoute from './components/PrivateRoute'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {getLoginStatus, selectIsLoggedIn, selectUser} from "./redux/features/auth/authSlice"
import Verify from './components/Verify'
import Forgot from './pages/Forgot'
import Reset from './pages/Reset'
// import { Card } from './components/Card'
import {ProductAdmin} from './pages/productAdmin/ProductAdmin'
import AdminOnlyRoute from './components/hiddenLink/AdminOnlyRoute'
import NotFound from './pages/404/NotFound'
import Product from './pages/shop/Product'
import ProductDetails from './components/product/productDetails/ProductDetails'
import Cart from './pages/cart/Cart'
import CheckoutDetails from './pages/checkout/CheckoutDetails'
import { Checkout } from './pages/checkout/Checkout'
import CheckoutSuccess from './pages/checkout/CheckoutSuccess'
import OrderHistory from './pages/order/OrderHistory'
import OrderDetails from './pages/order/OrderDetails'
import Wishlist from './pages/wishlist/Wishlist'
import ReviewProduct from './pages/reviewProduct/ReviewProduct'
import Contact from './pages/Contact'


axios.defaults.withCredentials = true




function App() {
  axios.defaults.withCredentials = true

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
// console.log(user);

  const dispatch = useDispatch()
  useEffect(()=>{
    dispatch(getLoginStatus())
  },[dispatch])

  useEffect(() => {
    if (isLoggedIn && user === null) {
      dispatch(getUser());
    }
    // console.log(user);
  }, [dispatch, isLoggedIn, user]);

  return (
    <BrowserRouter>
    <ToastContainer />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/contact" element={<Contact />} />
        <Route element={<PrivateRoute />} >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route 
            path='/productAdmin/*' 
            element={
               <AdminOnlyRoute>
                <ProductAdmin />
               </AdminOnlyRoute>
            } 
          />
          {/* <Route 
            path='/order-history/*' 
            element={
               <AdminOnlyRoute>
                <OrderHistory />
               </AdminOnlyRoute>
            } 
          />
          <Route 
            path='/order-details/:id/*' 
            element={
               <AdminOnlyRoute>
                <OrderDetails />
               </AdminOnlyRoute>
            } 
          /> */}
        </Route>

        <Route path="/verify/:verificationToken" element={<Verify />} />
        {/* <Route path="/projects" element={<Projects />} /> */}
        {/* <Route path="/cart" element={<Card />} /> */}
        <Route path="/forgotpassword" element={<Forgot />} />
        <Route path='/resetPassword/:resetToken' element={<Reset />} />
        <Route path='*' element={<NotFound />} />

        <Route path="/shop" element={<Product />} />
        <Route path="/product-details/:id" element={<ProductDetails />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/order-details/:id" element={<OrderDetails />} />
        <Route path="/checkout-details" element={<CheckoutDetails />} />
        <Route path="/checkout-stripe" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/review-product/:id" element={<ReviewProduct />} />

      </Routes>
      <FooterCom />
    </BrowserRouter>
  )
}

export default App
