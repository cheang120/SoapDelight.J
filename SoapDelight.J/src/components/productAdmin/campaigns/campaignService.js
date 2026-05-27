import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/campaigns/admin`;

const getCampaigns = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getEligibleRecipientCount = async () => {
  const response = await axios.get(`${API_URL}/eligible-recipients/count`);
  return response.data;
};

const createCampaign = async (formData) => {
  const response = await axios.post(API_URL, formData);
  return response.data;
};

const updateCampaign = async (id, formData) => {
  const response = await axios.patch(`${API_URL}/${id}`, formData);
  return response.data;
};

const sendTestCampaign = async (id, email) => {
  const response = await axios.post(`${API_URL}/${id}/test`, { email });
  return response.data;
};

const sendCampaign = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/send`);
  return response.data;
};

const deleteCampaign = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

const campaignService = {
  getCampaigns,
  getEligibleRecipientCount,
  createCampaign,
  updateCampaign,
  sendTestCampaign,
  sendCampaign,
  deleteCampaign,
};

export default campaignService;
