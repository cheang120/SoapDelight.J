import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

export const API_URL = `${API_BASE_URL}/order/`;

// Create New Order
const createOrder = async (formData) => {
  const response = await axios.post(API_URL, formData);
  return response.data.message;
};

// Get all products
const getOrders = async () => {
  const response = await axios.get(API_URL);
  // console.log(response.data);
  return response.data;
};

// Get a Product
const getOrder = async (id) => {
  const response = await axios.get(API_URL + id);
  return response.data;
};
// Update Product
const updateOrderStatus = async (id, formData) => {
  const response = await axios.patch(`${API_URL}${id}`, formData);
  return response.data.message;
};

const getRefundPreview = async (id) => {
  const response = await axios.get(`${API_URL}admin/${id}/refund-preview`);
  return response.data;
};

const cancelRefund = async (id, formData) => {
  const response = await axios.post(`${API_URL}admin/${id}/cancel-refund`, formData);
  return response.data;
};

const getReturnRefundPreview = async (id) => {
  const response = await axios.get(`${API_URL}admin/${id}/return-refund-preview`);
  return response.data;
};

const createReturnRequest = async (id, formData) => {
  const response = await axios.post(`${API_URL}admin/${id}/return-request`, formData);
  return response.data;
};

const receiveReturnRefund = async (id, formData) => {
  const response = await axios.post(
    `${API_URL}admin/${id}/receive-return-refund`,
    formData
  );
  return response.data;
};

const closeReturnNoRefund = async (id, formData) => {
  const response = await axios.post(
    `${API_URL}admin/${id}/close-return-no-refund`,
    formData
  );
  return response.data;
};

const orderService = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getRefundPreview,
  cancelRefund,
  getReturnRefundPreview,
  createReturnRequest,
  receiveReturnRefund,
  closeReturnNoRefund,
};

export default orderService;
