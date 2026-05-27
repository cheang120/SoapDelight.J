import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/inventory`;

const getLocations = async () => {
  const response = await axios.get(`${API_URL}/locations`);
  return response.data;
};

const createLocation = async (payload) => {
  const response = await axios.post(`${API_URL}/locations`, payload);
  return response.data;
};

const updateLocation = async (id, payload) => {
  const response = await axios.patch(`${API_URL}/locations/${id}`, payload);
  return response.data;
};

const getInventoryOverview = async () => {
  const response = await axios.get(`${API_URL}/overview`);
  return response.data;
};

const ensureDefaultLocations = async () => {
  const response = await axios.post(`${API_URL}/locations/ensure-defaults`);
  return response.data;
};

const getProductInventory = async (productId) => {
  const response = await axios.get(`${API_URL}/products/${productId}`);
  return response.data;
};

const updateProductLocationMapping = async (productId, payload) => {
  const response = await axios.patch(
    `${API_URL}/products/${productId}/location-mapping`,
    payload
  );
  return response.data;
};

const createProductionInMovement = async (payload) => {
  const response = await axios.post(`${API_URL}/movements/production-in`, payload);
  return response.data;
};

const createTransferMovement = async (payload) => {
  const response = await axios.post(`${API_URL}/movements/transfer`, payload);
  return response.data;
};

const createAdjustmentMovement = async (payload) => {
  const response = await axios.post(`${API_URL}/movements/adjust`, payload);
  return response.data;
};

const getMovements = async (params = {}) => {
  const response = await axios.get(`${API_URL}/movements`, { params });
  return response.data;
};

const inventoryService = {
  getLocations,
  createLocation,
  updateLocation,
  getInventoryOverview,
  ensureDefaultLocations,
  getProductInventory,
  updateProductLocationMapping,
  createProductionInMovement,
  createTransferMovement,
  createAdjustmentMovement,
  getMovements,
};

export default inventoryService;
