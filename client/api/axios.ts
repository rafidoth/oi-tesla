import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // You can attach tokens or custom headers here if needed:
    // const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error(
        `API Error [${error.response.status}]:`,
        error.response.data || error.message
      );
    } else if (error.request) {
      console.error("Network Error: No response received from server", error.message);
    } else {
      console.error("Request Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
