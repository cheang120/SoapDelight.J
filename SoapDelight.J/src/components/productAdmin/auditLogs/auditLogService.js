import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/audit-logs/admin`;

const getAuditLogs = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

const auditLogService = {
  getAuditLogs,
};

export default auditLogService;
