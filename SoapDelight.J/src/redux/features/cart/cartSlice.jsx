import { createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify';

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
        // const cartQuantity = getCartQuantityById(
        //   state.cartItems,
        //   action.payload._id
        // );
        // console.log(cartQuantity, action.payload);
  
        const productIndex = state.cartItems.findIndex(
          (item) => item._id === action.payload._id
        );
  
        if (productIndex >= 0) {
          // Item already exists in the cart
          // Increase the cartQuantity
        //   if (cartQuantity === action.payload.quantity) {
        //     state.cartItems[productIndex].cartQuantity += 0;
        //     toast.info("Max number of product reached!!!");
        //   } else {
        //     state.cartItems[productIndex].cartQuantity += 1;
        //     toast.info(`${action.payload.name} increased by one`, {
        //       position: "top-left",
        //     });
        //   }
            state.cartItems[productIndex].cartQuantity += 1;
            toast.info(`${action.payload.name} increased by one`, {
              position: "top-left",
            });
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
  }
});

export const {
    ADD_TO_CART
} = cartSlice.actions

export default cartSlice.reducer