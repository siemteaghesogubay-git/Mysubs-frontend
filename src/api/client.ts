import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthTokens } from "../types/auth";

const baseURL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({ baseURL });

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthTokens(tokens: AuthTokens | null) {
  accessToken = tokens?.token ?? null;
  refreshToken = tokens?.refreshToken ?? null;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];
const resolveQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !original || original._retry || !refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) return reject(error);
          original._retry = true;
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post<AuthTokens>(`${baseURL}/api/auth/refresh`, { refreshToken });
      setAuthTokens(data);
      resolveQueue(data.token);
      original.headers.Authorization = `Bearer ${data.token}`;
      return apiClient(original);
    } catch (refreshError) {
      setAuthTokens(null);
      resolveQueue(null);
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);