import { createApiClient, type TokenProvider } from '@shubhmilan/api-client';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

let cachedAccess: string | null = null;
let cachedRefresh: string | null = null;

const tokenProvider: TokenProvider = {
  getAccessToken: () => cachedAccess,
  getRefreshToken: () => cachedRefresh,
  setTokens: (tokens) => {
    cachedAccess = tokens.accessToken;
    cachedRefresh = tokens.refreshToken;
    void SecureStore.setItemAsync('access', tokens.accessToken);
    void SecureStore.setItemAsync('refresh', tokens.refreshToken);
  },
  clearTokens: () => {
    cachedAccess = null;
    cachedRefresh = null;
    void SecureStore.deleteItemAsync('access');
    void SecureStore.deleteItemAsync('refresh');
  },
};

export async function hydrateTokens() {
  cachedAccess = (await SecureStore.getItemAsync('access').catch(() => null)) ?? null;
  cachedRefresh = (await SecureStore.getItemAsync('refresh').catch(() => null)) ?? null;
}

export const api = createApiClient({ baseUrl: API_URL, tokenProvider });
export { tokenProvider };
