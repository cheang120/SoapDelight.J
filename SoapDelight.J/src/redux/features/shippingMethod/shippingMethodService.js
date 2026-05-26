import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/shipping-methods`;

const getActiveShippingMethods = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const shippingMethodService = {
  getActiveShippingMethods,
};

export default shippingMethodService;
