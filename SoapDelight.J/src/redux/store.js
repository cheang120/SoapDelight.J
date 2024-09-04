import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from './user/userSlice';
import themeReducer from './theme/themeSlice';
import { thunk } from 'redux-thunk';
import authReducer from '../redux/features/auth/authSlice';
import filterReducer from "../redux/features/auth/filterSlice";
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import categoryReducer from "../redux/features/categoryAndBrand/categoryAndBrandSlice";
import productReducer from "../redux/features/product/productSlice"
import filtersReducer from '../redux/features/product/filtersSlice'
import couponReducer from "../redux/features/coupon/couponSlice"
import cartReducer from "./features/cart/cartSlice"
import checkoutReducer from "./features/checkout/checkoutSlice.jsx"
import orderReducer from "./features/order/OrderSlice.jsx"

// Combine all reducers into a single root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  theme: themeReducer,
  filter: filterReducer,
  filters:filtersReducer,
  category: categoryReducer, // Ensure categoryReducer is included here
  product: productReducer,
  coupon:couponReducer,
  cart:cartReducer,
  checkout: checkoutReducer,
  order:orderReducer
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
};

// Apply persist to the root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(thunk),
});

// Export the persistor
export const persistor = persistStore(store);