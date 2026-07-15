// api.js
// --------
// One shared axios instance for talking to the FastAPI backend.
// It automatically attaches the saved JWT token (if any) to every request.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
