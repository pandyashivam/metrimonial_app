'use client';
import { createApiClient, type TokenProvider } from '@shubhmilan/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_KEY = 'shubhmilan.admin.access';
const REFRESH_KEY = 'shubhmilan.admin.refresh';

const storage: TokenProvider = {
  getAccessToken: () =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(REFRESH_KEY),
  setTokens: (t) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS_KEY, t.accessToken);
    window.localStorage.setItem(REFRESH_KEY, t.refreshToken);
  },
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = createApiClient({ baseUrl: API_URL, tokenProvider: storage });
export const tokenProvider = storage;
