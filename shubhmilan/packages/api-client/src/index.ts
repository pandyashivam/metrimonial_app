import type {
  ApiResponse,
  AuthTokens,
  CursorPage,
  Interest,
  LoginResponse,
  MatchResult,
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

export interface EncryptedMessage {
  id: string;
  conversationId: string;
  senderProfileId: string;
  ciphertext: string;
  nonce: string;
  encrypted: boolean;
  mediaUrl: string | null;
  mediaMime: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  peerId: string;
  peerName: string;
  peerPublicKey: string | null;
  peerPhotoUrl: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
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

  async function uploadFile<T>(path: string, file: File | Blob, fieldName = 'file'): Promise<T> {
    const form = new FormData();
    form.append(fieldName, file);
    const headers = new Headers();
    const accessToken = opts.tokenProvider.getAccessToken();
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    const res = await fetchImpl(`${opts.baseUrl}${path}`, {
      method: 'POST',
      body: form,
      headers,
    });
    const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
    if (!json || !json.ok) {
      throw new ApiError(
        res.status,
        json?.ok === false ? json.error.code : 'UPLOAD',
        json?.ok === false ? json.error.message : 'Upload failed',
      );
    }
    return json.data;
  }

  return {
    raw: { request, uploadFile },
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
      forgotPassword: (body: { identifier: string }) =>
        request<{ ok: true }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      resetPassword: (body: { target: string; code: string; password: string }) =>
        request<{ ok: true }>('/auth/reset-password', {
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
      family: () => request<unknown>('/me/family'),
      updateFamily: (body: unknown) =>
        request<unknown>('/me/family', { method: 'PUT', body: JSON.stringify(body) }),
      updateHoroscope: (body: unknown) =>
        request<unknown>('/me/horoscope', { method: 'PUT', body: JSON.stringify(body) }),
      verification: () => request<VerificationStatus>('/me/verification'),
      completeness: () => request<{ percent: number; missing: string[] }>('/me/completeness'),
      exportData: () => request<unknown>('/me/export'),
      deleteAccount: () => request<{ ok: true }>('/me', { method: 'DELETE' }),
      setVisibility: (hidden: boolean) =>
        request<{ hidden: boolean }>('/me/visibility', {
          method: 'PATCH',
          body: JSON.stringify({ hidden }),
        }),
      viewers: () => request<{ id: string; fullName: string; viewedAt: string }[]>('/me/viewers'),
      publicKey: () => request<{ publicKey: string | null }>('/me/public-key'),
      uploadPublicKey: (publicKey: string) =>
        request<{ id: string; publicKey: string }>('/me/public-key', {
          method: 'PUT',
          body: JSON.stringify({ publicKey }),
        }),
      photos: () =>
        request<
          { id: string; url: string; isPrimary: boolean; privacy: string; moderationStatus: string }[]
        >('/me/photos'),
      uploadPhoto: (file: File | Blob) =>
        uploadFile<{ id: string; url: string; isPrimary: boolean; privacy: string }>(
          '/me/photos',
          file,
        ),
      setPrimaryPhoto: (id: string) =>
        request<{ ok: true }>(`/me/photos/${id}/primary`, { method: 'PATCH' }),
      setPhotoPrivacy: (id: string, privacy: 'PUBLIC' | 'MEMBERS' | 'REQUEST') =>
        request<{ id: string; privacy: string }>(`/me/photos/${id}/privacy`, {
          method: 'PATCH',
          body: JSON.stringify({ privacy }),
        }),
      deletePhoto: (id: string) =>
        request<{ ok: true }>(`/me/photos/${id}`, { method: 'DELETE' }),
      registerDevice: (body: { fcmToken: string; platform: 'ios' | 'android' | 'web' }) =>
        request<{ id: string }>('/me/devices', { method: 'POST', body: JSON.stringify(body) }),
      notificationPrefs: () =>
        request<{
          newInterest: boolean;
          interestAccepted: boolean;
          newMessage: boolean;
          profileViewed: boolean;
          premiumMatch: boolean;
          verificationApproved: boolean;
        }>('/me/notification-prefs'),
      setNotificationPrefs: (
        body: Partial<{
          newInterest: boolean;
          interestAccepted: boolean;
          newMessage: boolean;
          profileViewed: boolean;
          premiumMatch: boolean;
          verificationApproved: boolean;
        }>,
      ) =>
        request<unknown>('/me/notification-prefs', {
          method: 'PUT',
          body: JSON.stringify(body),
        }),
    },
    profiles: {
      list: (query: Record<string, string | number | boolean | undefined> = {}) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined && v !== null) params.set(k, String(v));
        }
        return request<CursorPage<ProfileSummary>>(`/profiles?${params.toString()}`);
      },
      get: (id: string) => request<Profile & { photos: { id: string; r2Key: string }[] }>(
        `/profiles/${encodeURIComponent(id)}`,
      ),
      publicKey: (id: string) =>
        request<{ publicKey: string | null }>(
          `/profiles/${encodeURIComponent(id)}/public-key`,
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
      entitlements: () =>
        request<{
          tier: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';
          canSendMoreInterests: boolean;
          canSeeWhoViewedMe: boolean;
          canUseAdvancedFilters: boolean;
          canChatBeforeMatch: boolean;
          canSeeContactDetails: boolean;
          canAccessHoroscopeReport: boolean;
          interestsRemainingThisMonth: number;
        }>('/interests/entitlements'),
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
    block: {
      add: (profileId: string, reason?: string) =>
        request<{ ok: true }>(`/block/${encodeURIComponent(profileId)}`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }),
      remove: (profileId: string) =>
        request<{ ok: true }>(`/block/${encodeURIComponent(profileId)}`, { method: 'DELETE' }),
    },
    report: {
      create: (profileId: string, reason: string, detail?: string) =>
        request<unknown>(`/report/${encodeURIComponent(profileId)}`, {
          method: 'POST',
          body: JSON.stringify({ reason, detail }),
        }),
    },
    views: {
      log: (profileId: string) =>
        request<{ ok: true } | { alreadyLogged: true }>(
          `/views/${encodeURIComponent(profileId)}`,
          { method: 'POST' },
        ),
    },
    chat: {
      conversations: () => request<ConversationSummary[]>('/conversations'),
      messages: (conversationId: string, cursor?: string) => {
        const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
        return request<CursorPage<EncryptedMessage>>(
          `/conversations/${conversationId}/messages${q}`,
        );
      },
      send: (conversationId: string, body: { ciphertext: string; nonce: string; mediaUrl?: string; mediaMime?: string }) =>
        request<EncryptedMessage>(`/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      markRead: (conversationId: string) =>
        request<{ ok: true }>(`/conversations/${conversationId}/read`, { method: 'POST' }),
      uploadMedia: (file: File | Blob) =>
        uploadFile<{ key: string; url: string; expiresInSeconds: number }>(
          '/chat-media/upload',
          file,
        ),
      signMedia: (key: string) =>
        request<{ url: string; expiresInSeconds: number }>('/chat-media/sign', {
          method: 'POST',
          body: JSON.stringify({ key }),
        }),
    },
    content: {
      list: (kind?: string) => {
        const params = new URLSearchParams();
        if (kind) params.set('kind', kind);
        return request<
          Array<{
            id: string;
            kind: string;
            slug: string;
            title: string;
            excerpt: string | null;
            coverKey: string | null;
            publishedAt: string | null;
            meta: Record<string, unknown> | null;
          }>
        >(`/content?${params.toString()}`);
      },
      get: (kind: string, slug: string) =>
        request<unknown>(`/content/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`),
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
    verification: {
      get: () => request<VerificationStatus>('/me/verification'),
      requestEmail: () => request<{ sent: true }>('/me/verification/email/request', { method: 'POST' }),
      verifyEmail: (code: string) =>
        request<{ verified: true }>('/me/verification/email/verify', {
          method: 'POST',
          body: JSON.stringify({ code }),
        }),
      requestPhone: () => request<{ sent: true }>('/me/verification/phone/request', { method: 'POST' }),
      verifyPhone: (code: string) =>
        request<{ verified: true }>('/me/verification/phone/verify', {
          method: 'POST',
          body: JSON.stringify({ code }),
        }),
      submitSelfie: () =>
        request<{ submitted: true }>('/me/verification/selfie/submit', { method: 'POST' }),
      submitVideo: () =>
        request<{ submitted: true; status: 'pending' }>('/me/verification/video/submit', {
          method: 'POST',
        }),
      requestBackground: () =>
        request<{ submitted: true; status: 'pending' }>('/me/verification/background/request', {
          method: 'POST',
        }),
    },
    ai: {
      status: () => request<{ enabled: boolean }>('/ai/status'),
      improveAbout: (aboutMe: string) =>
        request<{ improved: string }>('/ai/improve-about', {
          method: 'POST',
          body: JSON.stringify({ aboutMe }),
        }),
      suggestTraits: (aboutMe: string) =>
        request<{ personality: string[]; hobbies: string[] }>('/ai/suggest-traits', {
          method: 'POST',
          body: JSON.stringify({ aboutMe }),
        }),
      reindex: () => request<{ indexed: boolean }>('/ai/reindex-self', { method: 'POST' }),
      coach: (question: string) =>
        request<{ reply: string }>('/ai/coach', {
          method: 'POST',
          body: JSON.stringify({ question }),
        }),
    },
    admin: {
      stats: () =>
        request<{
          totalUsers: number;
          signups24h: number;
          signupsMonth: number;
          activeSubs: number;
          openReports: number;
          revenueInr: number;
        }>('/admin/stats'),
      users: (q: Record<string, string | number | undefined> = {}) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(q)) if (v != null) params.set(k, String(v));
        return request<unknown>(`/admin/users?${params.toString()}`);
      },
      setUserStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') =>
        request<unknown>(`/admin/users/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      reports: (q: Record<string, string | number | undefined> = {}) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(q)) if (v != null) params.set(k, String(v));
        return request<unknown>(`/admin/reports?${params.toString()}`);
      },
      resolveReport: (id: string, status: 'RESOLVED' | 'DISMISSED') =>
        request<unknown>(`/admin/reports/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      pendingVerifications: () => request<unknown>('/admin/verifications/pending'),
      approveStep: (profileId: string, step: string) =>
        request<unknown>(`/admin/verify/${profileId}`, {
          method: 'POST',
          body: JSON.stringify({ step }),
        }),
      logs: () => request<unknown>('/admin/logs'),
      transactions: (q: Record<string, string | undefined> = {}) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(q)) if (v) params.set(k, v);
        return request<unknown>(`/admin/transactions?${params.toString()}`);
      },
      contentList: (q: { kind?: string; status?: string; limit?: number; offset?: number } = {}) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(q)) if (v != null && v !== '') params.set(k, String(v));
        return request<unknown>(`/admin/content?${params.toString()}`);
      },
      contentCreate: (body: {
        kind: 'SUCCESS_STORY' | 'BLOG_POST' | 'EVENT';
        slug: string;
        title: string;
        excerpt?: string | null;
        body: string;
        coverKey?: string | null;
        meta?: Record<string, unknown> | null;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      }) => request<unknown>('/admin/content', { method: 'POST', body: JSON.stringify(body) }),
      contentUpdate: (id: string, body: Record<string, unknown>) =>
        request<unknown>(`/admin/content/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      contentDelete: (id: string) =>
        request<{ ok: true }>(`/admin/content/${id}`, { method: 'DELETE' }),
      createPlan: (body: {
        name: string;
        priceInr: number;
        durationDays: number;
        features: string[];
        active: boolean;
      }) => request<Plan>('/admin/plans', { method: 'POST', body: JSON.stringify(body) }),
      updatePlan: (
        id: string,
        body: Partial<{
          name: string;
          priceInr: number;
          durationDays: number;
          features: string[];
          active: boolean;
        }>,
      ) => request<Plan>(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      impersonate: (userId: string, reason?: string) =>
        request<{
          user: { id: string; email: string };
          tokens: { accessToken: string; refreshToken: string; expiresIn: number };
        }>(`/admin/users/${userId}/impersonate`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }),
      getMaintenance: () =>
        request<{ enabled: boolean; message: string; allowUserIds?: string[] }>(
          '/admin/settings/maintenance',
        ),
      setMaintenance: (body: { enabled: boolean; message?: string; allowUserIds?: string[] }) =>
        request<{ enabled: boolean; message: string }>('/admin/settings/maintenance', {
          method: 'PUT',
          body: JSON.stringify(body),
        }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
