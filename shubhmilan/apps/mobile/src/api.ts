import { createApiClient, type TokenProvider } from '@shubhmilan/api-client';

import { secureStorage } from './secure-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

let cachedAccess: string | null = null;
let cachedRefresh: string | null = null;

const tokenProvider: TokenProvider = {
  getAccessToken: () => cachedAccess,
  getRefreshToken: () => cachedRefresh,
  setTokens: (tokens) => {
    cachedAccess = tokens.accessToken;
    cachedRefresh = tokens.refreshToken;
    void secureStorage.setItem('access', tokens.accessToken);
    void secureStorage.setItem('refresh', tokens.refreshToken);
  },
  clearTokens: () => {
    cachedAccess = null;
    cachedRefresh = null;
    void secureStorage.removeItem('access');
    void secureStorage.removeItem('refresh');
  },
};

export async function hydrateTokens() {
  cachedAccess = (await secureStorage.getItem('access')) ?? null;
  cachedRefresh = (await secureStorage.getItem('refresh')) ?? null;
}

export const api = createApiClient({ baseUrl: API_URL, tokenProvider });
export { tokenProvider };
