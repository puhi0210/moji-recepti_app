import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "../auth/tokenStorage";
import type { AuthTokens } from "../types/auth.types";
import { getServerBaseUrl } from "../utils/serverUrlStorage";

type RetryRequest = AxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: () => void | Promise<void>) {
  unauthorizedHandler = handler;
}

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (token) {
      request.resolve(token);
    }
  });

  failedQueue = [];
}

async function refreshAccessToken(): Promise<AuthTokens> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  const serverBaseUrl = await getServerBaseUrl();

  const response = await axios.post(`${serverBaseUrl}/auth/refresh`, {
    refreshToken,
  });

  const tokens = response.data?.data?.tokens;

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error("Refresh response missing tokens.");
  }

  await saveTokens(tokens);

  return tokens;
}

export const api = axios.create({
  timeout: 15000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const serverBaseUrl = await getServerBaseUrl();
    const accessToken = await getAccessToken();

    config.baseURL = serverBaseUrl;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequest | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };

            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const tokens = await refreshAccessToken();

      processQueue(null, tokens.accessToken);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${tokens.accessToken}`,
      };

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();

      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "API request failed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error.";
}