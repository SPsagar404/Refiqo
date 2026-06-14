import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the API base URL per platform:
 * - Web: the browser runs on the same host as the dev machine, so derive the
 *   API host from the page itself. This works regardless of the machine's
 *   (frequently-changing) LAN IP — no app.json edit needed to run on web.
 * - Native (device/emulator): use the configured `extra.apiBaseUrl`
 *   (a LAN IP for a physical phone, or 10.0.2.2 for an Android emulator).
 */
function resolveBaseURL(): string {
  const configured = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:4000/api/v1`;
  }
  return configured ?? 'http://localhost:4000/api/v1';
}

const baseURL = resolveBaseURL();

/**
 * Auth bridge: the auth store registers getters/handlers so the client can
 * attach the access token and transparently refresh on 401 without importing
 * the store (avoids a cycle).
 */
interface AuthBridge {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokens: (accessToken: string, refreshToken: string) => Promise<void> | void;
  onAuthFailure: () => Promise<void> | void;
}

let bridge: AuthBridge = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  onTokens: () => undefined,
  onAuthFailure: () => undefined,
};

export function registerAuthBridge(next: AuthBridge): void {
  bridge = next;
}

export const api: AxiosInstance = axios.create({ baseURL, timeout: 15000 });

/** Unwraps the backend's `{ data, meta }` envelope to just the payload. */
export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = bridge.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = bridge.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const data = res.data.data as { accessToken: string; refreshToken: string };
    await bridge.onTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await bridge.onAuthFailure();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshTokens();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  details?: { path: string; message: string }[];
}

/** Surfaces the backend's canonical error envelope as a typed Error. */
export function normalizeError(error: AxiosError): Error & { api?: ApiError } {
  const body = error.response?.data as ApiError | undefined;
  const message = body?.message ?? error.message ?? 'Something went wrong';
  const err = new Error(message) as Error & { api?: ApiError };
  if (body) err.api = body;
  return err;
}
