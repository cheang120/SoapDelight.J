import axios from "axios";
import { API_BASE_URL } from "../utils/apiBase";

const API_URL = `${API_BASE_URL}/journal`;

export const JOURNAL_CATEGORIES = [
  "全部",
  "香氣知識",
  "日常護理",
  "手作理念",
  "生活選物",
  "送禮靈感",
];

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

export const getPublishedArticles = async ({ category } = {}) => {
  const response = await axios.get(API_URL, {
    params: cleanParams({ category: category === "全部" ? "" : category }),
  });
  return response.data;
};

export const getPublishedArticle = async (slug) => {
  const response = await axios.get(`${API_URL}/${encodeURIComponent(slug)}`);
  return response.data;
};

export const getAdminArticles = async ({ status, category } = {}) => {
  const response = await axios.get(`${API_URL}/admin`, {
    params: cleanParams({
      status: status === "all" ? "" : status,
      category: category === "全部" ? "" : category,
    }),
  });
  return response.data;
};

export const getAdminArticle = async (id) => {
  const response = await axios.get(`${API_URL}/admin/${encodeURIComponent(id)}`);
  return response.data;
};

export const createArticle = async (payload) => {
  const response = await axios.post(`${API_URL}/admin`, payload);
  return response.data;
};

export const updateArticle = async (id, payload) => {
  const response = await axios.patch(`${API_URL}/admin/${encodeURIComponent(id)}`, payload);
  return response.data;
};

export const updateArticleStatus = async (id, status) => {
  const response = await axios.patch(`${API_URL}/admin/${encodeURIComponent(id)}/status`, { status });
  return response.data;
};

export const createCampaignDraft = async (id) => {
  const response = await axios.post(`${API_URL}/admin/${encodeURIComponent(id)}/campaign-draft`);
  return response.data;
};

export const deleteArticle = async (id) => {
  const response = await axios.delete(`${API_URL}/admin/${encodeURIComponent(id)}`);
  return response.data;
};

const journalService = {
  getPublishedArticles,
  getPublishedArticle,
  getAdminArticles,
  getAdminArticle,
  createArticle,
  updateArticle,
  updateArticleStatus,
  createCampaignDraft,
  deleteArticle,
};

export default journalService;
