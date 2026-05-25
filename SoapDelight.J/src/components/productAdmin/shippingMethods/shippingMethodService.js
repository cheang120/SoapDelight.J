import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/shipping-methods`;

const getAdminShippingMethods = async () => {
  const response = await axios.get(`${API_URL}/admin`);
  return response.data;
};

const createShippingMethod = async (formData) => {
  const response = await axios.post(API_URL, formData);
  return response.data;
};

const updateShippingMethod = async (id, formData) => {
  const response = await axios.patch(`${API_URL}/${id}`, formData);
  return response.data;
};

const deleteShippingMethod = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

const shippingMethodService = {
  getAdminShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
};

export default shippingMethodService;
