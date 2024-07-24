import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Home from './pages/Home'
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
import { useDispatch } from 'react-redux'
import {getLoginStatus} from "./redux/features/auth/authSlice"
import Verify from './components/Verify'
import Forgot from './pages/Forgot'
import Reset from './pages/Reset'

axios.defaults.withCredentials = true




function App() {
  const dispatch = useDispatch()
  useEffect(()=>{
    dispatch(getLoginStatus())
  },[dispatch])

  return (
    <BrowserRouter>
    <ToastContainer />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route element={<PrivateRoute />} >
          <Route path="/dashboard" element={<Dashboard />} />

        </Route>
        <Route path="/verify/:verificationToken" element={<Verify />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/forgotpassword" element={<Forgot />} />
        <Route path='/resetPassword/:resetToken' element={<Reset />} />
      </Routes>
      <FooterCom />
    </BrowserRouter>
  )
}

export default App
