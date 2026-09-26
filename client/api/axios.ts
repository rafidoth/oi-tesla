import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

import { useAuthStore } from "@/features/auth/store/auth.store";

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login?expired=true";
      }
    }

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

export const baseUrlWrapper = (relativeUrl: string) : string => `${process.env.NEXT_PUBLIC_API_URL}${relativeUrl}`
export default apiClient;
