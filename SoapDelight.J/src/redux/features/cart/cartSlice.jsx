import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify';
import { getCartQuantityById } from '../../../utils';
import cartService from './cartService';
const FRONTEND_URL = import.meta.env.VITE_REACT_APP_FRENTEND_URL

// Apply discoount to cart
function applyDiscount(cartTotalAmount, discountPercentage) {
  var discountAmount = (discountPercentage / 100) * cartTotalAmount;
  var updatedTotal = cartTotalAmount - discountAmount;
  return updatedTotal;
}

const initialState = {
    cartItems: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
    cartTotalQuantity: 0,
    cartTotalAmount: 0,
    initialCartTotalAmount: 0,
    shippingFee: 0,
    totalWithShippingFee: 0,
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
        // save cart to LS
        localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
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
        localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },

    REMOVE_FROM_CART(state, action) {
        const newCartItem = state.cartItems.filter(
          (item) => item._id !== action.payload._id
        );
  
        state.cartItems = newCartItem;
        toast.success(`${action.payload.name} removed from cart`, {
          position: "top-left",
        });
  
        localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    CLEAR_CART(state, action) {
        state.cartItems = [];
        toast.info(`Cart cleared`, {
          position: "top-left",
        });
  
        localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    CALCULATE_TOTAL_QUANTITY(state, action) {
        const array = [];
        state.cartItems?.map((item) => {
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
      const array = [];
      const nonShippingItems = []; // 新增：用來存放非 Shipping 的產品
    
      // 遍历购物车的商品
      state.cartItems.map((item) => {
        const { price, cartQuantity, category } = item;
        const cartItemAmount = price * cartQuantity;
        
        array.push(cartItemAmount); // 添加所有商品金額
    
        // 只添加非 Shipping 类别的商品到 nonShippingItems
        if (category !== "Shipping") {
          nonShippingItems.push(cartItemAmount);
        }
    
        return cartItemAmount;
      });
    
      // 计算所有商品的总金额
      const totalAmount = array.reduce((a, b) => a + b, 0);
      state.initialCartTotalAmount = totalAmount;
    
      // 计算不含 Shipping 商品的总金额
      const nonShippingTotalAmount = nonShippingItems.reduce((a, b) => a + b, 0);
    
      // 计算折扣后的总金额（只对非 Shipping 产品应用优惠券）
      if (action.payload && action.payload.coupon && action.payload.coupon.discount) {
        const discountedTotalAmount = applyDiscount(
          nonShippingTotalAmount,  // 修改：只对非 Shipping 产品应用折扣
          action.payload.coupon.discount
        );
        state.cartTotalAmount = discountedTotalAmount + (totalAmount - nonShippingTotalAmount); // 非 Shipping 产品折扣后加上 Shipping 产品金额
      } else {
        state.cartTotalAmount = totalAmount;
      }
    
      // 如果传递了邮寄费用，则计算含邮费的总金额
      if (action.payload && action.payload.shippingFee) {
        state.shippingFee = action.payload.shippingFee;  // 设置邮寄费用
        state.totalWithShippingFee = state.cartTotalAmount + action.payload.shippingFee;  // 计算总金额（商品总额 + 邮寄费）
      } else {
        state.totalWithShippingFee = state.cartTotalAmount;  // 没有邮寄费用时的总金额
      }
    },
    

    // 更新购物车中的邮寄费用
    SET_SHIPPING_FEE(state, action) {
      state.shippingFee = action.payload;
      state.totalWithShippingFee = state.cartTotalAmount + action.payload;
    },

    // 更新购物车
    UPDATE_CART(state, action) {
      state.cartItems = action.payload;
    },

    // 清空购物车
    CLEAR_CART(state) {
      state.cartItems = [];
      state.cartTotalAmount = 0;
      state.totalWithShippingFee = 0;
      state.shippingFee = 0;
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
        toast.error(action.payload);
        console.log(action.payload);
      })
      // Get Cart From DB
      .addCase(getCartDB.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCartDB.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        localStorage.setItem("cartItems", JSON.stringify(action.payload));
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
        toast.error(action.payload);
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
    UPDATE_CART,
    CALCULATE_TOTAL_QUANTITY,
    // CALCULATE_SUBTOTAL
} = cartSlice.actions

export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartTotalQuantity = (state) => state.cart.cartTotalQuantity;

export const selectCartTotalAmount = (state) => state.cart.cartTotalAmount;
export const selectShippingFee = (state) => state.cart.shippingFee;
export const selectTotalWithShipping = (state) => state.cart.totalWithShippingFee;
export default cartSlice.reducer