import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

// export const API_URL = `${API_BASE_URL}/user/`;
export const API_URL = `${API_BASE_URL}/auth/`;

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
