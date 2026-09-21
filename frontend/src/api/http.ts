import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  timeout: 120000,
});

//请求发出前：如果有token，自动加到Header
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//响应是401:token 失效，清掉并提示（后面可跳转登录页）
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);
