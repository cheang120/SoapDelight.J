import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/subscribers`;

const getSubscribers = async ({ status = "all", q = "" } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q.trim()) params.set("q", q.trim());

  const queryString = params.toString();
  const response = await axios.get(`${API_URL}/admin/overview${queryString ? `?${queryString}` : ""}`);
  return response.data;
};

const subscriberService = {
  getSubscribers,
};

export default subscriberService;
