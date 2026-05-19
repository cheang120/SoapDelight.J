const normalizeBackendUrl = (url) => (url || "").trim().replace(/\/+$/, "");

export const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${normalizeBackendUrl(import.meta.env.VITE_REACT_APP_BACKEND_URL) || ""}/api`;

