import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/consignment-reports/admin`;

const getConsignmentReports = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

const getConsignmentReportById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

const createConsignmentReport = async (payload) => {
  const response = await axios.post(API_URL, payload);
  return response.data;
};

const updateConsignmentReport = async (id, payload) => {
  const response = await axios.patch(`${API_URL}/${id}`, payload);
  return response.data;
};

const confirmConsignmentReport = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/confirm`);
  return response.data;
};

const consignmentReportService = {
  getConsignmentReports,
  getConsignmentReportById,
  createConsignmentReport,
  updateConsignmentReport,
  confirmConsignmentReport,
};

export default consignmentReportService;
