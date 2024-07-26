import React, { useEffect, useState } from 'react'
import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { MdPassword } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';
import { signInStart, signInFailure,signInSuccess } from '../redux/user/userSlice';
import axios from 'axios';


const initialState = {
    password:"",
    password2:""
}

const Reset = () => {
    const [formData, setFormData] = useState(initialState)
    const {password, password2} = formData
    const { resetToken } = useParams();

    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [uCase, setUCase] = useState(false)
    const [num, setNum] = useState(false)
    const [sChar, setSChar] = useState(false)
    const [passLength, setPassLength] = useState(false)

    const dispatch = useDispatch();
    const navigate = useNavigate();
    // console.log(resetToken);

    const togglePassword1 = () => {
      setShowPassword1(!showPassword1);
    };
    
    const togglePassword2 = () => {
      setShowPassword2(!showPassword2);
    };

    // console.log(password);

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

  const timesIcon = <FaTimes color='red' size={15} />
  const checkIcon = <BsCheck2All color='green' size={15} />

  const switchIcon = (condition) => {
    if (condition) {
      return checkIcon
    }
    return timesIcon
  }

  const handleChange = (e) => {
    // console.log(e.target.value);
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

    const reset = async (e) => {
        e.preventDefault();
        // console.log(formData);
        if (!password || !password2) {
            return toast.error('Please fill out all fields.');
        }
        if (password.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }
        if (password !== password2) {
            return toast.error("Passwords do not match");
        }
        if (!password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
            return toast.error("Passwords must contain both uppercase and lowercase letters");
        }

        try {
            console.log("Sending request to reset password...");
            // console.log(resetToken);
            const response = await fetch(`/api/auth/resetPassword/${resetToken}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ password })
            });
        
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            const data = await response.json();
            // console.log(data);
            navigate('/sign-in');
          } catch (error) {
            console.error('Error:', error);
          }
        
    }
  return (
    <div className=''>
            <div>
                <div className='--flex-center'>
                    <MdPassword size={35} color="#999" />
                </div>
                <h2>Reset Password</h2>
                <form onSubmit={reset}>
                    <div className="relative">
                        <Label value='Your password' />
                        <input
                            type={showPassword1 ? "text" : "password"}
                            placeholder='Password'
                            className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                            required
                            id='password'
                            onChange={handleChange}
                        />
                        <div className="absolute inset-y-11 cursor-pointer right-0 flex items-center pr-3 z-50" onClick={togglePassword1}>
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
                            onChange={handleChange}
                        />
                        <div className="absolute inset-y-11 cursor-pointer right-0 flex items-center pr-3 z-50" onClick={togglePassword2}>
                            {showPassword2 ? (
                                <AiOutlineEyeInvisible size={20} />
                            ) : (
                                <AiOutlineEye size={20} />
                            )}
                        </div>
                    </div>

                    <button type='submit' className='--btn --btn-primary --btn-block '>
                        Reset Password
                    </button>
                    <div>
                        <p><Link to='/'>- Home</Link></p>
                        <p><Link to='/login'>- Login</Link></p>
                    </div>
                </form>
            </div>
    </div>
  )
}

export default Reset
