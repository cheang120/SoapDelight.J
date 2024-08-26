import { createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify';
import { getCartQuantityById } from '../../../utils';

const initialState = {
    cartItems: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
    cartTotalQuantity: 0,
    cartTotalAmount: 0,
    fixedCartTotalAmount: 0,
    previousURL: "",
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
}



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
        state.cartItems.map((item) => {
          const { price, cartQuantity } = item;
          const cartItemAmount = price * cartQuantity;
          return array.push(cartItemAmount);
        });
        const totalAmount = array.reduce((a, b) => {
          return a + b;
        }, 0);
        state.cartTotalAmount = totalAmount
        // state.fixedCartTotalAmount = totalAmount;
        // if (action.payload && action.payload.coupon !== null) {
        //   const discountedTotalAmount = applyDiscount(
        //     totalAmount,
        //     action.payload.coupon.discount
        //   );
        //   state.cartTotalAmount = discountedTotalAmount;
        // } else {
        //   state.cartTotalAmount = totalAmount;
        // }
      },
  }
});

export const {
    ADD_TO_CART,
    DECREASE_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    CALCULATE_SUBTOTAL,

    CALCULATE_TOTAL_QUANTITY,
    // CALCULATE_SUBTOTAL
} = cartSlice.actions

export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartTotalQuantity = (state) => state.cart.cartTotalQuantity;

export const selectCartTotalAmount = (state) => state.cart.cartTotalAmount;

export default cartSlice.reducer