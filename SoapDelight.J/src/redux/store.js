import { configureStore } from "@reduxjs/toolkit";
import userReducer from './user/userSlice'
// import authReducer from "../redux/features/auth/authSlice";
// import emailReducer from "../redux/features/email/emailSlice";
// import filterReducer from "../redux/features/auth/filterSlice";

export const store = configureStore({
  reducer: {
    user:userReducer
    // auth: authReducer,
    // email: emailReducer,
    // filter: filterReducer,
  },
});