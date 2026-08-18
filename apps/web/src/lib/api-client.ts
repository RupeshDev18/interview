import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    withCredentials: true, // Send httpOnly refresh token cookie
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach access token from memory store
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Auto-refresh on 401
  let isRefreshing = false;
  let refreshQueue: Array<(token: string) => void> = [];

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

      // If 401 and not already retrying and not a refresh request itself
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh')
      ) {
        if (isRefreshing) {
          // Queue request until token is refreshed
          return new Promise<string>((resolve) => {
            refreshQueue.push(resolve);
          }).then((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await client.post<{ data: { accessToken: string } }>(
            '/auth/refresh',
          );
          const { accessToken } = response.data.data;

          useAuthStore.getState().setAccessToken(accessToken);

          // Flush queue
          refreshQueue.forEach((cb) => cb(accessToken));
          refreshQueue = [];

          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          return client(originalRequest);
        } catch {
          // Refresh failed — clear auth and redirect to login
          useAuthStore.getState().clearAuth();
          refreshQueue = [];
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
