import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector,shallowEqual } from "react-redux";
import PasswordInput from '../components/PasswordInput';
import OAuth from '../components/OAuth';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaTimes } from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';
import {  validateEmail } from '../redux/features/auth/authService';
import { signup,RESET } from '../redux/features/auth/authSlice.js';
import { signInStart, signInFailure,signInSuccess } from '../redux/user/userSlice';



const initialState = {
  username:"",
  email:"",
  password:"",
  password2:""
}


export default function SignUp() {
  const [formData, setFormData] = useState(initialState);
  const {username, email, password, password2} = formData

  const dispatch = useDispatch()
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const togglePassword1 = () => {
    setShowPassword1(!showPassword1);
  };
  
  const togglePassword2 = () => {
    setShowPassword2(!showPassword2);
  };



  const handleChange = (e) => {
    // console.log(e.target.value);
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  useEffect(() => {
    // Check Lower and Uppercase
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
        setUCase(true);
    }else {
        setUCase(false);
    }
    // Check for numbers
    if (password.match(/([0-9])/)) {
        setNum(true);
    } else {
        setNum(false);
    }
    // Check for special character
    if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) {
        setSChar(true);
    } else {
        setSChar(false);
    }
    // Check for PASSWORD LENGTH
    if (password.length > 5) {
        setPassLength(true);
    } else {
        setPassLength(false);
    }
}, [password]);

const [uCase, setUCase] = useState(false)
  const [num, setNum] = useState(false)
  const [sChar, setSChar] = useState(false)
  const [passLength, setPassLength] = useState(false)

  const timesIcon = <FaTimes color='red' size={15} />
  const checkIcon = <BsCheck2All color='green' size={15} />

  const switchIcon = (condition) => {
    if (condition) {
      return checkIcon
    }
    return timesIcon
  }

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!formData.username || !formData.email || !formData.password) {
  //     return setErrorMessage('Please fill out all fields.');
  //   }
  //   if (formData.password.length < 6) {
  //     return setErrorMessage("Password must be up to 6 characters");
  //   }
  //   if (!validateEmail(formData.email)) {
  //     return setErrorMessage("Please enter a valid email");
  //   }
  //   if (password !== password2) {
  //     return setErrorMessage("Passwords do not match");
  //   }
  //   if (!formData.password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
  //     return setErrorMessage("Passwords must contain Uppercase and Lowercase");
  //   }

  //   try {
  //     setLoading(true);
  //     setError(false);
  //     const res = await fetch('/api/auth/signup', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(formData),
  //     });
  //     const data = await res.json();
  //     console.log(data);
  //     setLoading(false);
  //     if (data.success === false) {
  //       setError(true);
  //       return;
  //     }

  //         // Assume the API returns a token on successful signup
  //   const { token } = data;

  //   // Store the token in localStorage
  //   localStorage.setItem('authToken', token);


  //     await fetch('/api/auth/sendVerificationEmail', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ email: formData.email }),
  //     });

  //     navigate('/dashboard');

  //   } catch (error) {
  //     setLoading(false);
  //     setError(true);
  //   }
  // };

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Signin failed');
      }
      dispatch(signInSuccess(data));
      navigate('/dashboard?tab=profile');
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.password2) {
      return dispatch(signInFailure('Please fill out all fields.'));
    }
    if (formData.password.length < 6) {
      return dispatch(signInFailure("Password must be at least 6 characters"));
    }
    if (!validateEmail(formData.email)) {
      return dispatch(signInFailure("Please enter a valid email"));
    }
    if (formData.password !== formData.password2) {
      return dispatch(signInFailure("Passwords do not match"));
    }
    if (!formData.password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
      return dispatch(signInFailure("Passwords must contain both uppercase and lowercase letters"));
    }
  
    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      await fetch('/api/auth/sendVerificationEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      // Automatically login after signup
      await handleSubmit({ email: formData.email, password: formData.password });
  
    } catch (error) {
      dispatch(signInFailure(error.message));
            if (error.message.includes("Email already registered")) {
        setErrorMessage("This email is already registered. Please use a different email.");
      } else {
        setErrorMessage(error.message);
      }
    }
  };


  return (
    <div className='min-h-screen py-20 mx-auto px-10 md:w-4/5'>
      <div className='flex mr-4 ml-4 sm:mr-7 sm:ml-7  mx-auto flex-col md:flex-row md:items-center gap-10 md:gap-6'>
        {/* left */}
        <div className='flex-1 px-4 md:px-6 sm:px-10 flex flex-col items-center'>
          <Link to='/' className='font-bold dark:text-white text-4xl mb-5'>
            <span className='px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white text-lg sm:text-2xl lg:text-4xl'>
              SoapDelight.J
            </span>
          </Link>
          <p className='text-md mt-5'>
            <b>SoapDelight.J</b>為您帶來全新的澳門品牌，致力於提供品質天然的手工護膚品及手工皂。我們的產品以天然植物草本為基礎， 避免使用人工合成的有害防腐劑和硅油等成分。
          </p>
          <p className='text-md mt-5'>
              我們的手工皂和護膚品經過精心製作，不僅能夠潔淨肌膚，還能提供滋養和保護， 讓您的肌膚焕發健康光彩。 品牌故事源於一位媽媽對小朋友的愛與關懷。她希望為自己的小朋友提供天然的護膚體驗。 透過學習芳療和手工護膚品的知識，開始製作天然手工護膚品，並將自己的愛和熱情注入其中。 
          </p>
          <p className='text- mt-5'>
            選擇SoapDelight.J， 您將獲得一個全新的護膚體驗。我們的產品不僅能保護和滋養肌膚，還能提供舒緩和放鬆的芳香療效。讓您的肌膚在天然的芳香中得到愛和呵護。 我們相信，天然是最好的選擇。讓SoapDelight.J成為您護膚品選擇的首選，讓您的肌膚感受到天然植物的美好。
          </p>
        </div>

        {/* right */}
        <div className='flex-1 px-4 md:px-6 sm:px-10'>
          <form 
            className='flex flex-col gap-4' 
            onSubmit={handleSignup}
          >
            <div>
              <Label value='Your username' />
              <TextInput
                type='text'
                placeholder='Username'
                id='username'
                onChange={handleChange}

              />
            </div>
            <div>
              <Label value='Your email' />
              <TextInput
                type='email'
                placeholder='name@company.com'
                id='email'
                onChange={handleChange}
              />
            </div>


            <div className="relative">
              <Label value='Your password' />
              <input
                type={showPassword1 ? "text" : "password"}
                placeholder='Password'
                className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                required
                id='password'
                // name='password'

                onChange={handleChange}
              />
              <div className=" absolute top-[50%] cursor-pointer right-0 flex items-center pr-3 z-50" onClick={togglePassword1}>
                {showPassword1 ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </div>
            </div>

            <div className="relative">
              <Label value='Confirm Password' />
              <input
                type={showPassword2 ? "text" : "password"}
                placeholder='Confirm Password'
                className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                required
                id='password2'
                name='password2'
                // name={name}
                // value={value}
                onChange={handleChange}
              />
              <div className=" absolute top-[50%] cursor-pointer right-0 flex items-center pr-3 z-50" onClick={togglePassword2}>
                {showPassword2 ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </div>
            </div>

            {/* Password Strength */}
            <div className='rounded overflow-hidden p-1 mb-1'>
                <ul className=''>
                  <li>
                    <span className='flex justify-start items-center text-[0.63rem]'>
                     {switchIcon(uCase)}
                      &nbsp; Lowercase & Uppercase
                    </span>
                  </li>
                  <li>
                    <span className='flex justify-start items-center text-[0.63rem]'>
                            {switchIcon(num)}
                            &nbsp; Number (0-9)
                    </span>
                    </li>
                    <li>
                    <span className='flex justify-start items-center text-[0.63rem]'>
                            {switchIcon(sChar)}
                            &nbsp; Special Character (!@#$%^&*)
                    </span>
                    </li>
                    <li>
                    <span className='flex justify-start items-center text-[0.63rem]'>
                            {switchIcon(passLength)}
                            &nbsp; At least 6 Character
                    </span>
                  </li>
                </ul>
            </div>


            <Button
              gradientDuoTone='purpleToPink'
              type='submit'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Loading...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            <OAuth />
          </form>
          <div className='flex gap-2 text-sm mt-5'>
          <Link to='/' className='text-blue-500'>
              Home
            </Link>
            <span>Have an account?</span>
            <Link to='/sign-in' className='text-blue-500'>
              Sign In
            </Link>
          </div>
          {errorMessage && (
            <Alert className='mt-5' color='failure'>
              {errorMessage}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}