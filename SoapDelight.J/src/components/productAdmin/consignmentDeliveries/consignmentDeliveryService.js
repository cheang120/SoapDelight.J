import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/consignment-deliveries`;

const getConsignmentDeliveries = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

const getConsignmentDeliveryById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

const createConsignmentDelivery = async (payload) => {
  const response = await axios.post(`${API_URL}/admin`, payload);
  return response.data;
};

const updateConsignmentDelivery = async (id, payload) => {
  const response = await axios.patch(`${API_URL}/admin/${id}`, payload);
  return response.data;
};

const issueConsignmentDelivery = async (id) => {
  const response = await axios.post(`${API_URL}/admin/${id}/issue`);
  return response.data;
};

const cancelConsignmentDelivery = async (id) => {
  const response = await axios.post(`${API_URL}/admin/${id}/cancel`);
  return response.data;
};

const consignmentDeliveryService = {
  getConsignmentDeliveries,
  getConsignmentDeliveryById,
  createConsignmentDelivery,
  updateConsignmentDelivery,
  issueConsignmentDelivery,
  cancelConsignmentDelivery,
};

export default consignmentDeliveryService;
