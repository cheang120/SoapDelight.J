import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from './user/userSlice'
import themeReducer from './theme/themeSlice'
import { thunk } from 'redux-thunk';  // 使用命名导入
import authReducer from '../redux/features/auth/authSlice'
// import rootReducer from './reducers';
// import emailReducer from "../redux/features/email/emailSlice";
import filterReducer from "../redux/features/auth/filterSlice";

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import categoryReducer from "../redux/features/categoryAndBrand/categoryAndBrandSlice"

const rootReducer = combineReducers({
  auth:authReducer,
  user: userReducer,
  theme: themeReducer,
  filter: filterReducer
})

const persistConfig = {
  key: 'root',
  storage,
  version: 1
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: 
    persistedReducer ,
    category: categoryReducer,




  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(thunk),
});

export const persistor = persistStore(store);