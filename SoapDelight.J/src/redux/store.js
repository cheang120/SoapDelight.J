import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from './user/userSlice'
import themeReducer from './theme/themeSlice'
import authReducer from "./features/auth/authSlice";
// import emailReducer from "../redux/features/email/emailSlice";
// import filterReducer from "../redux/features/auth/filterSlice";

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({
  user:userReducer,
  theme:themeReducer
})

const persistConfig = {
  key:'root',
  storage,
  version:1
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  // reducer: {
  //   // user:userReducer,
  //   // auth: authReducer,
  //   // email: emailReducer,
  //   // filter: filterReducer,

  // },
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);