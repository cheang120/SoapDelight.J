import axios from "axios";
import { API_BASE_URL } from "../../../utils/apiBase";

const API_URL = `${API_BASE_URL}/company-profile`;

const getCompanyProfile = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const updateCompanyProfile = async (payload) => {
  const response = await axios.patch(API_URL, payload);
  return response.data;
};

const companyProfileService = {
  getCompanyProfile,
  updateCompanyProfile,
};

export default companyProfileService;
