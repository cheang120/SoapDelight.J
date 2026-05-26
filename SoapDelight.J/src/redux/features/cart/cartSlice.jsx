import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify';
import { getCartQuantityById } from '../../../utils';
import { isCouponValid } from '../coupon/couponSlice';
import cartService from './cartService';
const FRONTEND_URL = import.meta.env.VITE_REACT_APP_FRENTEND_URL
const CART_STORAGE_KEY = "cartItems";
const DELIVERY_STORAGE_KEY = "selectedDeliveryMethod";
export const LOCAL_PICKUP_ID = "local-pickup";
export const LOCAL_PICKUP_METHOD = {
  _id: LOCAL_PICKUP_ID,
  name: "澳門本地自取",
  price: 0,
  category: "Shipping",
  isPickup: true,
};

export const getDeliveryMethodLabel = (methodName = "", { concise = false } = {}) => {
  if (!methodName) return "";
  if (methodName === LOCAL_PICKUP_METHOD.name || methodName === LOCAL_PICKUP_ID) {
    return LOCAL_PICKUP_METHOD.name;
  }

  const normalized = String(methodName).trim();
  if (normalized.startsWith("郵寄 - ")) {
    return concise ? normalized.replace(/^郵寄 -\s*/, "") : normalized;
  }

  return normalized;
};

const readStorage = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

const removeStorage = (key) => {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key);
};

const normalizeShippingItem = (item) => ({
  ...item,
  category: "Shipping",
  cartQuantity: 1,
});

const normalizeCartItems = (items = []) => {
  const nextItems = Array.isArray(items) ? items : [];
  const productItems = nextItems.filter((item) => item?.category !== "Shipping");
  const shippingItems = nextItems
    .filter((item) => item?.category === "Shipping")
    .map(normalizeShippingItem);

  return shippingItems.length > 0
    ? [...productItems, shippingItems[shippingItems.length - 1]]
    : productItems;
};

const deriveSelectedDeliveryMethod = (cartItems = [], storedMethod = null) => {
  const shippingItem = cartItems.find((item) => item?.category === "Shipping");

  if (shippingItem) {
    return {
      ...shippingItem,
      _id: shippingItem._id,
      name: shippingItem.name,
      price: Number(shippingItem.price || 0),
      regularPrice: shippingItem.regularPrice ?? shippingItem.price,
      category: "Shipping",
      cartQuantity: 1,
      isPickup: false,
    };
  }

  if (storedMethod?.isPickup || storedMethod?._id === LOCAL_PICKUP_ID) {
    return {
      ...LOCAL_PICKUP_METHOD,
      ...storedMethod,
      _id: LOCAL_PICKUP_ID,
      price: Number(storedMethod?.price || 0),
      category: "Shipping",
      cartQuantity: 1,
      isPickup: true,
    };
  }

  return null;
};

const syncCartStorage = (state) => {
  writeStorage(CART_STORAGE_KEY, state.cartItems);
  if (state.selectedDeliveryMethod) {
    writeStorage(DELIVERY_STORAGE_KEY, state.selectedDeliveryMethod);
  } else {
    removeStorage(DELIVERY_STORAGE_KEY);
  }
};

const isExpectedAuthSyncError = (message) => {
  if (typeof message !== "string") return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not authorized") ||
    normalized.includes("unauthorized") ||
    normalized.includes("401")
  );
};

// Apply discoount to cart
function applyDiscount(cartTotalAmount, discountPercentage) {
  var discountAmount = (discountPercentage / 100) * cartTotalAmount;
  var updatedTotal = cartTotalAmount - discountAmount;
  return updatedTotal;
}

const initialCartItems = normalizeCartItems(readStorage(CART_STORAGE_KEY, []));
const initialSelectedDeliveryMethod = deriveSelectedDeliveryMethod(
  initialCartItems,
  readStorage(DELIVERY_STORAGE_KEY, null)
);

const initialState = {
    cartItems: initialCartItems,
    cartTotalQuantity: 0,
    cartTotalAmount: 0,
    initialCartTotalAmount: 0,
    productSubtotal: 0,
    couponDiscountAmount: 0,
    shippingFee: Number(initialSelectedDeliveryMethod?.price || 0),
    totalWithShippingFee: 0,
    selectedDeliveryMethod: initialSelectedDeliveryMethod,
    previousURL: "",
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
}

// Save Cart To DB
export const saveCartDB = createAsyncThunk(
  "cart/saveCartDB",
  async (cartData, thunkAPI) => {
    try {
      return await cartService.saveCartDB(cartData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get Cart from DB
export const getCartDB = createAsyncThunk(
  "cart/getCartDB",
  
  async (_, thunkAPI) => {
    try {
      return await cartService.getCartDB();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    ADD_TO_CART(state, action) {
        if (action.payload?.category === "Shipping") {
          const productItems = state.cartItems.filter(
            (item) => item.category !== "Shipping"
          );
          const shippingItem = normalizeShippingItem(action.payload);
          state.cartItems = [...productItems, shippingItem];
          state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
            state.cartItems,
            state.selectedDeliveryMethod
          );
          syncCartStorage(state);
          toast.success(`${action.payload.name} selected as delivery method`, {
            position: "top-left",
          });
          return;
        }
        // console.log(action.payload);
        // const product = action.payload
        // console.log(product);
        const cartQuantity = getCartQuantityById(
          state.cartItems,
          action.payload._id
        );
        // console.log(cartQuantity, action.payload);
  
        const productIndex = state.cartItems.findIndex(
          (item) => item._id === action.payload._id
        );
  
        if (productIndex >= 0) {
          // Item already exists in the cart
          // Increase the cartQuantity
          if (cartQuantity === action.payload.quantity) {
            state.cartItems[productIndex].cartQuantity += 0;
            toast.info("Max number of product reached!!!");
          } else {
            state.cartItems[productIndex].cartQuantity += 1;
            toast.success(`${action.payload.name} increased by one`, {
              position: "top-left",
            });
          }

        } else {
          // Item doesn't exists in the cart
          // Add item to the cart
          const tempProduct = { ...action.payload, cartQuantity: 1 };
          state.cartItems.push(tempProduct);
          toast.success(`${action.payload.name} added to cart`, {
            position: "top-left",
          });
        }
        state.cartItems = normalizeCartItems(state.cartItems);
        state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
          state.cartItems,
          state.selectedDeliveryMethod
        );
        syncCartStorage(state);
    },
    DECREASE_CART(state, action) {
        // console.log(action.payload);
        const productIndex = state.cartItems.findIndex(
          (item) => item._id === action.payload._id
        );
  
        if (state.cartItems[productIndex].cartQuantity > 1) {
          state.cartItems[productIndex].cartQuantity -= 1;
          toast.success(`${action.payload.name} decreased by one`, {
            position: "top-left",
          });
        } else if (state.cartItems[productIndex].cartQuantity === 1) {
          const newCartItem = state.cartItems.filter(
            (item) => item._id !== action.payload._id
          );
          state.cartItems = newCartItem;
          toast.success(`${action.payload.name} removed from cart`, {
            position: "top-left",
          });
        }
        state.cartItems = normalizeCartItems(state.cartItems);
        state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
          state.cartItems,
          state.selectedDeliveryMethod
        );
        syncCartStorage(state);
    },

    REMOVE_FROM_CART(state, action) {
        const newCartItem = state.cartItems.filter(
          (item) => item._id !== action.payload._id
        );
  
        state.cartItems = newCartItem;
        toast.success(`${action.payload.name} removed from cart`, {
          position: "top-left",
        });

        state.cartItems = normalizeCartItems(state.cartItems);
        state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
          state.cartItems,
          state.selectedDeliveryMethod
        );
        syncCartStorage(state);
    },
    CLEAR_CART(state) {
        state.cartItems = [];
        state.cartTotalQuantity = 0;
        state.cartTotalAmount = 0;
        state.initialCartTotalAmount = 0;
        state.productSubtotal = 0;
        state.couponDiscountAmount = 0;
        state.shippingFee = 0;
        state.totalWithShippingFee = 0;
        state.selectedDeliveryMethod = null;
        toast.info(`Cart cleared`, {
          position: "top-left",
        });

        syncCartStorage(state);
    },
    CALCULATE_TOTAL_QUANTITY(state, action) {
        const array = [];
        state.cartItems
          ?.filter((item) => item.category !== "Shipping")
          .map((item) => {
          const { cartQuantity } = item;
          const quantity = cartQuantity;
          return array.push(quantity);
        });
        const totalQuantity = array.reduce((a, b) => {
          return a + b;
        }, 0);
        state.cartTotalQuantity = totalQuantity;
    },

    CALCULATE_SUBTOTAL(state, action) {
      const coupon = action.payload?.coupon;
      const productItems = state.cartItems.filter(
        (item) => item.category !== "Shipping"
      );
      const shippingItem = state.cartItems.find(
        (item) => item.category === "Shipping"
      );
      const productSubtotal = productItems.reduce((total, item) => {
        return total + Number(item.price || 0) * Number(item.cartQuantity || 0);
      }, 0);
      const shippingFee = shippingItem
        ? Number(shippingItem.price || 0)
        : state.selectedDeliveryMethod?.isPickup
          ? 0
          : 0;
      const couponDiscountAmount =
        isCouponValid(coupon) && coupon?.discount
          ? (Number(coupon.discount) / 100) * productSubtotal
          : 0;
      const discountedProductSubtotal = Math.max(
        productSubtotal - couponDiscountAmount,
        0
      );

      state.productSubtotal = productSubtotal;
      state.initialCartTotalAmount = productSubtotal;
      state.couponDiscountAmount = couponDiscountAmount;
      state.shippingFee = shippingFee;
      state.cartTotalAmount = discountedProductSubtotal + shippingFee;
      state.totalWithShippingFee = state.cartTotalAmount;
    },
    

    // 更新购物车中的邮寄费用
    SET_SHIPPING_FEE(state, action) {
      state.shippingFee = action.payload;
      state.totalWithShippingFee = state.cartTotalAmount + action.payload;
    },

    SELECT_DELIVERY_METHOD(state, action) {
      const method = action.payload;

      if (!method) {
        state.selectedDeliveryMethod = null;
        state.cartItems = state.cartItems.filter((item) => item.category !== "Shipping");
        syncCartStorage(state);
        return;
      }

      if (method.isPickup || method._id === LOCAL_PICKUP_ID) {
        state.selectedDeliveryMethod = {
          ...LOCAL_PICKUP_METHOD,
          ...method,
          _id: LOCAL_PICKUP_ID,
          price: Number(method.price || 0),
          category: "Shipping",
          cartQuantity: 1,
          isPickup: true,
        };
        state.cartItems = state.cartItems.filter((item) => item.category !== "Shipping");
        syncCartStorage(state);
        return;
      }

      const productItems = state.cartItems.filter((item) => item.category !== "Shipping");
      const shippingItem = normalizeShippingItem(method);
      state.cartItems = [...productItems, shippingItem];
      state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
        state.cartItems,
        state.selectedDeliveryMethod
      );
      syncCartStorage(state);
    },

    // 更新购物车
    UPDATE_CART(state, action) {
      state.cartItems = normalizeCartItems(action.payload);
      state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
        state.cartItems,
        state.selectedDeliveryMethod
      );
      syncCartStorage(state);
    },
  },
  extraReducers: (builder) => {
    builder
      // Save Cart To DB
      .addCase(saveCartDB.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveCartDB.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        console.log(action.payload);
      })
      .addCase(saveCartDB.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        if (!isExpectedAuthSyncError(action.payload)) {
          toast.error(action.payload);
        }
      })
      // Get Cart From DB
      .addCase(getCartDB.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCartDB.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        const cartItems = normalizeCartItems(
          Array.isArray(action.payload) ? action.payload : []
        );
        state.cartItems = cartItems;
        state.selectedDeliveryMethod = deriveSelectedDeliveryMethod(
          cartItems,
          state.selectedDeliveryMethod
        );
        syncCartStorage(state);
        // console.log(action.payload.length);
        // console.log(action.payload);

        // if (action.payload.length > 0 ) {
        //   // window.location.href =  FRONTEND_URL+"/cart";
        // } else {
        //   // window.location.href = FRONTEND_URL;
        // }

      })
      .addCase(getCartDB.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        if (!isExpectedAuthSyncError(action.payload)) {
          toast.error(action.payload);
        }
      });
  },
});

export const {
    ADD_TO_CART,
    DECREASE_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    CALCULATE_SUBTOTAL,
    SET_SHIPPING_FEE,
    SELECT_DELIVERY_METHOD,
    UPDATE_CART,
    CALCULATE_TOTAL_QUANTITY,
    // CALCULATE_SUBTOTAL
} = cartSlice.actions

export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartTotalQuantity = (state) => state.cart.cartTotalQuantity;
export const selectProductCartItems = createSelector([selectCartItems], (cartItems) =>
  cartItems.filter((item) => item.category !== "Shipping")
);
export const selectShippingCartItem = createSelector([selectCartItems], (cartItems) =>
  cartItems.find((item) => item.category === "Shipping") || null
);
export const selectCartTotalAmount = (state) => state.cart.cartTotalAmount;
export const selectProductSubtotal = (state) => state.cart.productSubtotal;
export const selectCouponDiscountAmount = (state) =>
  state.cart.couponDiscountAmount;
export const selectShippingFee = (state) => state.cart.shippingFee;
export const selectTotalWithShipping = (state) => state.cart.totalWithShippingFee;
export const selectSelectedDeliveryMethod = (state) =>
  state.cart.selectedDeliveryMethod;
export default cartSlice.reducer
