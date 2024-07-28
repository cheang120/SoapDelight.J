import axios from "axios"

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL
export const API_URL = `${BACKEND_URL}/api/auth/`

export const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


const signup = async (userData) => {
    const response = await axios.post(API_URL + "signup", userData)
    return response.data
}

const verifyUser = async (verificationToken) =>{
    console.log(verificationToken);
    const response = await axios.patch(`${API_URL} verifyUser/${verificationToken}`)
    return response.data.message
}

const sendVerificationEmail = async () => {
    const response = await axios.post(API_URL + "sendVerificationEmail");
    return response.data.message;
};

const forgotPassword = async (userData) => {
    const response = await axios.post('/api/auth/forgotPassword', userData)
    return response.data.message
}

// Reset Password
const resetPassword = async (userData, resetToken) => {
    const response = await axios.patch(
      `${API_URL}resetPassword/${resetToken}`,
      userData
    );
  
    return response.data.message;
};

// Get Login Status
// const getLoginStatus = async () => {
//     const response = await axios.get(API_URL + "loginStatus");
//     return response.data;
// };

const authService = {
    signup,verifyUser,sendVerificationEmail,forgotPassword,resetPassword
}

export default authService