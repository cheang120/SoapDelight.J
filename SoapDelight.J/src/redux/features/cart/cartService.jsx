import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL
// export const API_URL = `${BACKEND_URL}/api/user/`;
export const API_URL = `${BACKEND_URL}/api/auth/`;

// Save Cart
const saveCartDB = async (cartData) => {
  const response = await axios.patch(API_URL + "saveCart", cartData);
  return response.data;
};

// Get Cart
const getCartDB = async () => {
  const response = await axios.get(API_URL + "getCart");
  return response.data;
};

const cartService = {
  saveCartDB,
  getCartDB,
};

export default cartService;
