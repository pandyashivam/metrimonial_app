import type {
  ApiResponse,
  AuthTokens,
  Conversation,
  CursorPage,
  Interest,
  LoginResponse,
  MatchResult,
  Message,
  PartnerPreference,
  Plan,
  Profile,
  ProfileSummary,
  PublicUser,
  Subscription,
  VerificationStatus,
} from '@shubhmilan/types';

export interface TokenProvider {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokenProvider: TokenProvider;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(opts: ApiClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  let refreshPromise: Promise<AuthTokens | null> | null = null;

  async function refresh(): Promise<AuthTokens | null> {
    if (refreshPromise) return refreshPromise;
    const refreshToken = opts.tokenProvider.getRefreshToken();
    if (!refreshToken) return null;
    refreshPromise = (async () => {
      try {
        const res = await fetchImpl(`${opts.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const json = (await res.json()) as ApiResponse<{ tokens: AuthTokens }>;
        if (!json.ok) return null;
        opts.tokenProvider.setTokens(json.data.tokens);
        return json.data.tokens;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function request<T>(
    path: string,
    init: RequestInit = {},
    retried = false,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('content-type') && init.body && !(init.body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }
    const accessToken = opts.tokenProvider.getAccessToken();
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

    const res = await fetchImpl(`${opts.baseUrl}${path}`, { ...init, headers });
    if (res.status === 401 && !retried && accessToken) {
      const refreshed = await refresh();
      if (refreshed) return request<T>(path, init, true);
      opts.tokenProvider.clearTokens();
    }
    const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
    if (!json) {
      throw new ApiError(res.status, 'NETWORK', `Request failed with status ${res.status}`);
    }
    if (!json.ok) {
      throw new ApiError(res.status, json.error.code, json.error.message, json.error.details);
    }
    return json.data;
  }

  return {
    raw: { request },
    auth: {
      signup: (body: { email: string; phone: string; password: string }) =>
        request<{ pending: true; target: string }>('/auth/signup', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      verifyOtp: (body: {
        target: string;
        code: string;
        purpose: 'SIGNUP' | 'LOGIN' | 'RESET' | 'VERIFY_EMAIL' | 'VERIFY_PHONE';
      }) =>
        request<LoginResponse>('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      login: (body: { identifier: string; password?: string; otp?: string }) =>
        request<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
      refresh: () => refresh(),
      resendOtp: (body: { target: string; purpose: string }) =>
        request<{ ok: true }>('/auth/resend-otp', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
    },
    me: {
      get: () => request<PublicUser>('/me'),
      profile: () => request<Profile>('/me/profile'),
      updateProfile: (body: Partial<Profile>) =>
        request<Profile>('/me/profile', { method: 'PUT', body: JSON.stringify(body) }),
      preference: () => request<PartnerPreference>('/me/preference'),
      updatePreference: (body: Partial<PartnerPreference>) =>
        request<PartnerPreference>('/me/preference', {
          method: 'PUT',
          body: JSON.stringify(body),
        }),
      verification: () => request<VerificationStatus>('/me/verification'),
      completeness: () =>
        request<{ percent: number; missing: string[] }>('/me/completeness'),
    },
    profiles: {
      list: (query: Record<string, string | number | boolean | undefined> = {}) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined && v !== null) params.set(k, String(v));
        }
        return request<CursorPage<ProfileSummary>>(`/profiles?${params.toString()}`);
      },
      get: (id: string) => request<Profile & { photos: { id: string; url: string }[] }>(
        `/profiles/${encodeURIComponent(id)}`,
      ),
    },
    matches: {
      ai: () => request<MatchResult[]>('/matches/ai'),
      kundli: (otherId: string) =>
        request<import('@shubhmilan/types').GunaMilanResult>(
          `/matches/kundli/${encodeURIComponent(otherId)}`,
        ),
      newToday: () => request<ProfileSummary[]>('/matches/new-today'),
      premium: () => request<ProfileSummary[]>('/matches/premium'),
      nearby: () => request<ProfileSummary[]>('/matches/nearby'),
    },
    interests: {
      send: (toProfileId: string, note?: string) =>
        request<Interest>('/interests', {
          method: 'POST',
          body: JSON.stringify({ toProfileId, note }),
        }),
      respond: (id: string, action: 'ACCEPT' | 'DECLINE' | 'WITHDRAW') =>
        request<Interest>(`/interests/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        }),
      sent: () => request<Interest[]>('/interests/sent'),
      received: () => request<Interest[]>('/interests/received'),
    },
    shortlist: {
      add: (profileId: string) =>
        request<{ ok: true }>(`/shortlist/${encodeURIComponent(profileId)}`, { method: 'POST' }),
      remove: (profileId: string) =>
        request<{ ok: true }>(`/shortlist/${encodeURIComponent(profileId)}`, {
          method: 'DELETE',
        }),
      list: () => request<ProfileSummary[]>('/shortlist'),
    },
    chat: {
      conversations: () => request<Conversation[]>('/conversations'),
      messages: (conversationId: string, cursor?: string) => {
        const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
        return request<CursorPage<Message>>(`/conversations/${conversationId}/messages${q}`);
      },
      send: (conversationId: string, body: string, mediaUrl?: string) =>
        request<Message>(`/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body, mediaUrl }),
        }),
    },
    payments: {
      plans: () => request<Plan[]>('/plans'),
      createOrder: (planId: string) =>
        request<{ orderId: string; amount: number; keyId: string; receipt: string }>(
          '/subscriptions/order',
          { method: 'POST', body: JSON.stringify({ planId }) },
        ),
      verify: (body: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
      }) =>
        request<Subscription>('/subscriptions/verify', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      mySubscription: () => request<Subscription | null>('/me/subscription'),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
