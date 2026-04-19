# ShubhMilan — Build Instructions for Claude Code

You are building a production-grade, real-world matrimonial platform called **ShubhMilan** targeting the Indian market. This document is the single source of truth for the build. Read it completely before writing any code, and re-read relevant sections before starting each phase.

---

## 0. Reference prototype

An HTML/CSS/JS prototype already exists at `./app.html` (single-file). It defines the visual design language, color system, typography, iconography, component look & feel, data model shape, AI matching logic, verification tiers, kundli/Guna Milan flow, and full page structure. **Read it end-to-end before writing any design code.** Every screen in the real app must match or exceed the prototype's visual quality. Treat `app.html` as the design spec.

---

## 1. Goal

Ship three surfaces from one codebase wherever possible:

1. **iOS app** (App Store)
2. **Android app** (Google Play)
3. **Responsive website** — marketing site + logged-in web app

Every feature must actually work against a real backend with a real database. No mocks in the final build.

---

## 2. Locked tech decisions (do not substitute)

| Layer | Choice |
| --- | --- |
| Mobile (iOS + Android) | **React Native + Expo (SDK 51+)** with **Expo Router** |
| Web app (logged-in) | **react-native-web** built from the same mobile codebase |
| Marketing site (SEO) | **Next.js 14 (App Router)** on Vercel |
| Language | **TypeScript strict mode** everywhere |
| Backend | **Node.js 20 + Fastify** (or Express if simpler) |
| ORM | **Prisma** |
| Database | **MySQL 8** |
| Auth | **JWT access token + rotating refresh token**, OTP via SMS + email |
| File storage | **Cloudflare R2** (S3-compatible) with signed URLs |
| Realtime (chat, presence) | **Socket.IO** |
| Push notifications | **Firebase Cloud Messaging** (via Expo Notifications) |
| Payments | **Razorpay** (India) |
| Monorepo tool | **pnpm workspaces + Turborepo** |
| Shared validation | **Zod** schemas in a shared package |
| Testing | **Vitest** (backend), **Jest + React Native Testing Library** (frontend), **Playwright** (web E2E) |
| Lint/format | **ESLint + Prettier** |
| CI | **GitHub Actions** |

---

## 3. Monorepo layout

Create exactly this structure:

```
shubhmilan/
├── apps/
│   ├── mobile/              # Expo React Native (iOS, Android, web build)
│   ├── web/                 # Next.js marketing + SEO site
│   └── admin/               # Next.js admin panel (superadmin)
├── server/
│   └── api/                 # Node + Fastify + Prisma
├── packages/
│   ├── types/               # Shared TS types
│   ├── validation/          # Shared Zod schemas
│   ├── api-client/          # Typed fetch wrapper used by mobile + web
│   ├── ui/                  # Shared React Native components (for mobile + app-web)
│   └── config/              # Shared ESLint, TS, Prettier configs
├── infra/
│   ├── docker/              # docker-compose for local dev (mysql, redis, minio)
│   └── migrations/          # SQL snapshots
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Use **pnpm** only. Every package must have its own `package.json` and `tsconfig.json` extending `packages/config`.

---

## 4. Build phases (in order)

Do not skip ahead. Complete and verify each phase before starting the next.

### Phase 1 — Repo bootstrap
### Phase 2 — Database + Prisma schema
### Phase 3 — Backend API (auth first, then features)
### Phase 4 — Shared packages (types, validation, api-client, ui)
### Phase 5 — Mobile app (Expo)
### Phase 6 — Web marketing site (Next.js)
### Phase 7 — Admin panel
### Phase 8 — Realtime, notifications, payments
### Phase 9 — Testing, CI, store-ready builds

After each phase, run the full test suite and confirm all acceptance criteria in Section 18 before moving on.

---

## 5. Database schema (Prisma)

Model the following entities. Use `cuid()` for IDs. Add `createdAt` and `updatedAt` to every table. Use soft deletes (`deletedAt`) for user-facing data.

- **User** — id, email (unique), phone (unique), passwordHash, role (USER/ADMIN/SUPERADMIN), status (ACTIVE/SUSPENDED/DELETED), emailVerifiedAt, phoneVerifiedAt, lastLoginAt
- **Profile** — userId (1:1), fullName, gender, dob, height, weight, maritalStatus, motherTongue, religion, caste, subCaste, gotra, manglik, rashi, nakshatra, education, occupation, income, city, state, country, diet, smoking, drinking, aboutMe, familyValues, personalityTraits (JSON), hobbies (JSON), languages (JSON), complexion, bodyType
- **Family** — profileId, fatherName, fatherOccupation, motherName, motherOccupation, siblings (JSON), familyType, familyStatus, nativePlace
- **Horoscope** — profileId, birthTime, birthPlace, charan, nadi, gana, yoni, doshas (JSON)
- **Partnerpreference** — profileId, ageMin, ageMax, heightMin, heightMax, religions (JSON), castes (JSON), motherTongues (JSON), education (JSON), occupation (JSON), incomeMin, cities (JSON), diet (JSON), manglik
- **Photo** — profileId, r2Key, isPrimary, privacy (PUBLIC/MEMBERS/REQUEST), uploadedAt, moderationStatus (PENDING/APPROVED/REJECTED)
- **Verification** — profileId, emailVerified, phoneVerified, aadhaarVerified, selfieVerified, videoKycVerified, backgroundVerified, trustScore (0–100), tier (BASIC/VERIFIED/PREMIUM)
- **Interest** — fromProfileId, toProfileId, status (SENT/ACCEPTED/DECLINED/WITHDRAWN), sentAt, respondedAt
- **Shortlist** — ownerProfileId, savedProfileId, savedAt
- **Block** — blockerProfileId, blockedProfileId, reason, createdAt
- **Report** — reporterProfileId, reportedProfileId, reason, detail, status (OPEN/RESOLVED/DISMISSED), createdAt
- **Conversation** — id, profileAId, profileBId, lastMessageAt
- **Message** — conversationId, senderProfileId, body, mediaUrl, readAt, createdAt
- **ProfileView** — viewerProfileId, viewedProfileId, viewedAt
- **MatchScore** — profileAId, profileBId, score, reasons (JSON), computedAt (cache table)
- **Subscription** — userId, planId, status, startsAt, endsAt, razorpayOrderId, razorpayPaymentId
- **Plan** — id, name, priceInr, durationDays, features (JSON), active
- **OTP** — target (phone/email), code (hashed), purpose, expiresAt, usedAt
- **Device** — userId, fcmToken, platform, lastSeenAt
- **AdminLog** — adminUserId, action, targetType, targetId, meta (JSON), createdAt

Add indexes on every foreign key, on `Profile(gender, religion, city)`, `Message(conversationId, createdAt)`, `Interest(toProfileId, status)`, `ProfileView(viewedProfileId, viewedAt)`.

Write migrations as part of this phase. Seed 30 realistic sample profiles for dev using the same shape as `SAMPLE_PROFILES` in `app.html`.

---

## 6. Backend API (Fastify + Prisma)

### Conventions
- Base URL: `/api/v1`
- All responses: `{ ok: boolean, data?, error? }`
- Auth: `Authorization: Bearer <accessToken>`
- Refresh endpoint issues rotated refresh token; store refresh tokens hashed in DB
- Validate every request body/query with Zod schemas imported from `packages/validation`
- Use Fastify hooks for auth, rate limiting (`@fastify/rate-limit`), and request logging
- Return `TypedAPIResponse<T>` shapes — share types with frontend via `packages/types`

### Required endpoints (minimum)

**Auth**
- `POST /auth/signup` — email/phone + password → sends OTP
- `POST /auth/verify-otp` — creates account + tokens
- `POST /auth/login` — password or OTP
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/resend-otp`

**Profile (self)**
- `GET /me` / `PATCH /me`
- `GET /me/profile` / `PUT /me/profile`
- `GET /me/family` / `PUT /me/family`
- `GET /me/horoscope` / `PUT /me/horoscope`
- `GET /me/preference` / `PUT /me/preference`
- `POST /me/photos` (multipart → R2) / `DELETE /me/photos/:id` / `PATCH /me/photos/:id/primary`
- `GET /me/verification` / `POST /me/verification/:step` (email, phone, aadhaar, selfie, video, background)
- `GET /me/completeness` — returns % and missing fields

**Discovery**
- `GET /profiles` — filters: age, height, religion, caste, city, education, diet, manglik, verified, online, lastActive; cursor-pagination
- `GET /profiles/:id` — respects photo privacy, logs a ProfileView
- `GET /matches/ai` — server-side AI match using the same weighting as `aiMatchScore` in the prototype
- `GET /matches/kundli/:otherId` — Ashtakoot 8-point Guna Milan calculation
- `GET /matches/new-today`, `/matches/premium`, `/matches/nearby`

**Interactions**
- `POST /interests` / `PATCH /interests/:id` (accept/decline/withdraw) / `GET /interests/sent|received`
- `POST /shortlist/:profileId` / `DELETE /shortlist/:profileId` / `GET /shortlist`
- `POST /block/:profileId` / `DELETE /block/:profileId`
- `POST /report/:profileId`
- `POST /views/:profileId` (idempotent per day)

**Chat**
- `GET /conversations` / `GET /conversations/:id/messages?cursor=`
- `POST /conversations/:id/messages`
- Realtime via Socket.IO: `message:new`, `message:read`, `typing`, `presence`
- Enforce: chat unlocked only after mutual interest OR premium plan

**Payments**
- `GET /plans`
- `POST /subscriptions/order` → Razorpay order
- `POST /subscriptions/verify` → webhook-backed verification
- `GET /me/subscription`

**Admin (role=ADMIN/SUPERADMIN)**
- `GET /admin/users` / `GET /admin/reports` / `PATCH /admin/reports/:id`
- `POST /admin/verify/:profileId` (manual verification)
- `PATCH /admin/users/:id/status`
- `POST /admin/plans` / `PATCH /admin/plans/:id`
- `GET /admin/stats` (DAU, MAU, signups, revenue, reports)
- `GET /admin/logs`

### Security requirements (mandatory)
- bcrypt for passwords (cost 12)
- OTP codes hashed before storing (bcrypt)
- Rate limit `/auth/*` at 5 req/min/IP
- Refresh tokens rotated on every use; old tokens invalidated
- Helmet, CORS allowlist per environment
- Input validation on every route via Zod; reject unknown fields
- Photos served via short-lived signed R2 URLs (not public)
- Row-level authorization: never trust client-supplied `profileId`
- Audit log every admin action to `AdminLog`
- Encrypt PII-sensitive columns at rest (aadhaar last 4, phone) using AES-256
- All timestamps in UTC; convert on client

---

## 7. Shared packages

- **`packages/types`** — Prisma client types re-exported + hand-written UI types (`MatchReason`, `VerificationTier`, etc.)
- **`packages/validation`** — Zod schemas for every API body. Import on both sides.
- **`packages/api-client`** — `createApiClient(baseUrl, tokenProvider)` returning fully typed methods (`api.profiles.list(...)`, etc.). Handles refresh on 401.
- **`packages/ui`** — React Native + react-native-web components: `Button`, `Input`, `Card`, `Avatar`, `Chip`, `Badge`, `ProfileCard`, `TrustDonut`, `AIScoreBadge`, `VerificationBadge`, `GunaRing`, `EmptyState`, `Toast`, `Modal`, `BottomSheet`, `PhotoGallery`. Match the visual language of `app.html` exactly.

---

## 8. Mobile app (Expo)

### Navigation (Expo Router)
```
app/
├── (auth)/
│   ├── welcome.tsx
│   ├── signup.tsx
│   ├── login.tsx
│   └── otp.tsx
├── (onboarding)/
│   ├── basics.tsx
│   ├── family.tsx
│   ├── horoscope.tsx
│   ├── preference.tsx
│   ├── photos.tsx
│   └── verify.tsx
├── (tabs)/
│   ├── home.tsx
│   ├── search.tsx
│   ├── matches.tsx      # AI matches
│   ├── messages.tsx
│   └── me.tsx
├── profile/[id].tsx
├── chat/[conversationId].tsx
├── kundli/[otherId].tsx
├── verify/index.tsx
├── settings/
├── premium.tsx
└── _layout.tsx
```

### State & data
- **TanStack Query** for all server state (caching, pagination, optimistic updates)
- **Zustand** for local UI state (filters, onboarding draft)
- **MMKV** for token storage and offline persistence
- **React Hook Form + Zod** for every form

### Required features
- OTP login + biometric re-auth (expo-local-authentication)
- Photo upload with client-side compression (expo-image-manipulator), crop, privacy picker
- Swipeable profile cards with shortlist / interest / skip
- Advanced filter screen (all the filters from the prototype)
- AI match screen showing score + reasons (same visual as prototype)
- Kundli match screen with Ashtakoot wheel + 8-point table
- Verification screen with 6-step tier progression, selfie capture, document upload
- Chat with typing indicators, read receipts, media attachments
- Push notifications: new interest, interest accepted, new message, premium match
- Deep links (`shubhmilan://profile/:id`, universal links on web)
- Offline screen + retry queue for mutations
- Haptics on key actions
- Dark mode support (respect system)
- Accessibility: every interactive element has `accessibilityLabel`, min 44×44pt tap targets, dynamic type

### Performance
- Lazy-load images with `expo-image` + blurhash
- Virtualize lists with `FlashList`
- Prefetch next page on scroll
- Debounce search inputs
- Memoize ProfileCard heavily

---

## 9. Web marketing site (Next.js)

At `apps/web`. Public pages only:
- `/` — landing with hero, features, success story carousel, stats, pricing
- `/how-it-works`
- `/safety` (trust & verification messaging)
- `/success-stories` + `/success-stories/[slug]`
- `/pricing`
- `/blog` + `/blog/[slug]` (MDX)
- `/about`, `/contact`, `/terms`, `/privacy`, `/grievance`
- `/login` and `/signup` — redirect to mobile app on mobile devices, otherwise load the react-native-web app bundle at `/app`

### SEO requirements
- Next.js App Router with metadata API
- Open Graph + Twitter cards on every page
- JSON-LD structured data (Organization, FAQPage, BlogPosting)
- `sitemap.xml` + `robots.txt` generated
- Image optimization via `next/image`
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Hreflang for future multi-language

---

## 10. Admin panel (`apps/admin`)

Next.js app, protected by SUPERADMIN role. Pages:
- Dashboard (DAU, MAU, signups graph, revenue, open reports count)
- Users — search, filter, view profile, suspend/restore, impersonate (with audit log)
- Verifications — queue of pending manual reviews, approve/reject with reason
- Reports — moderation queue with full context (both profiles, chat excerpts if relevant)
- Plans — CRUD for subscription plans
- Content — edit success stories, events, blog posts
- Transactions — Razorpay ledger, refunds
- Settings — feature flags, maintenance mode, email/SMS templates
- Audit log — full AdminLog with filters

Use shadcn/ui + Tailwind for speed; it's internal, doesn't need the full design system.

---

## 11. AI matching engine

Implement server-side in `server/api/src/services/matching.ts`. Replicate the prototype's `aiMatchScore(me, other)` logic but run it in batch SQL-aware fashion:

- Precompute top-100 matches per user nightly into `MatchScore` table
- On-demand recompute when preference or profile changes materially
- Weighted signals (same as prototype): religion (15), mother tongue (10), diet (8), education tier (10), shared hobbies (12), caste preference (8), manglik compatibility (10), personality trait overlap (12), trust score (10), family values (5)
- Return `{ score: 0-100, reasons: [{ icon, text }] }`
- Log matches served for A/B testing (store variant, position, whether user interacted)

For v2 (after launch) wire up embedding similarity on the `aboutMe` free-text field using OpenAI `text-embedding-3-small` and pgvector-style cosine sim stored in a sidecar table.

---

## 12. Identity verification

Implement the 6-step tier flow from the prototype:

1. **Email** — magic-link verification
2. **Phone** — SMS OTP (MSG91 or Twilio)
3. **Aadhaar** — integrate **Digio** or **HyperVerge** sandbox for now; production key swap later
4. **Selfie** — in-app camera capture → face-match against uploaded photo (HyperVerge or manual review fallback)
5. **Video KYC** — short recorded prompt, queued for human review
6. **Background** — optional paid step; mark as `pending` and expose in admin panel

Each completed step bumps `trustScore` and recomputes `tier`:
- BASIC: 0–40
- VERIFIED: 41–80
- PREMIUM_TRUST: 81–100

Display tier badge on every card; restrict messaging to verified-only users in filters.

---

## 13. Payments (Razorpay)

- Implement `order → checkout → webhook verify` flow
- Store Razorpay signature verification server-side (never trust client)
- Webhook endpoint must be idempotent
- Default plans to seed: Free, Silver (₹999/3mo), Gold (₹1999/6mo), Platinum (₹2999/12mo)
- Gate features: unlimited interests, who-viewed-me, advanced filters, chat before match, horoscope reports, premium badge

---

## 14. Realtime (Socket.IO)

- Room per conversation (`conv:<id>`)
- Presence room per user (`user:<id>`)
- Events: `message:new`, `message:read`, `typing`, `presence:update`, `interest:new`
- Reconnect with exponential backoff
- Authenticate socket handshake via JWT

---

## 15. Push notifications

- Use `expo-notifications` to get push tokens
- Store in `Device` table per user
- Server sends via FCM (Android) and APNs via Expo Push (iOS)
- Categories: new_interest, interest_accepted, new_message, profile_viewed, premium_match, verification_approved
- Allow per-category toggles in settings screen

---

## 16. Design system (from prototype)

Extract into `packages/ui/tokens.ts`:

```ts
export const colors = {
  primary: '#8b1e3f',
  primaryDark: '#6d1731',
  primaryLight: '#a83d5f',
  accent: '#c8a45c',
  accentDark: '#a8853d',
  bg: '#fdfbf7',
  surface: '#ffffff',
  text: '#2a1a22',
  textMuted: '#6b5560',
  border: '#efe6dd',
  success: '#2f8f5e',
  danger: '#c0392b',
  warn: '#d98a1c',
};
export const fonts = {
  body: 'Inter',
  display: 'PlayfairDisplay',
};
export const radii = { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 };
export const shadows = { card: '0 6px 24px rgba(139,30,63,0.08)' };
```

All icons: **@expo/vector-icons** (FontAwesome 6 set) to match the prototype.

---

## 17. Testing requirements

- Unit tests on every service in `server/api/src/services/*` (target ≥ 80% coverage)
- Integration tests on every API route (Fastify inject)
- Component tests for every shared UI primitive
- E2E: Playwright script covering signup → onboarding → search → interest → chat → premium purchase
- Visual regression on 10 key mobile screens using Storybook + Chromatic (optional)

All tests run in GitHub Actions on PR. Block merge if any fail.

---

## 18. Definition of done (acceptance criteria)

A feature is complete only when:

1. Implemented on backend with Zod validation, authz check, tests, and logging
2. Consumed via typed `api-client` (no raw fetches in app code)
3. Implemented on mobile with loading / empty / error states handled
4. Implemented on web (if applicable)
5. Accessibility checked (labels, contrast, tap targets)
6. Works end-to-end against a real MySQL dev DB (no mocks)
7. Passes lint, type-check, and all tests
8. Documented in a `README.md` section within the affected package/app

---

## 19. Local dev setup

Provide a single `pnpm dev` command (via Turborepo pipeline) that:
1. Starts Docker services (MySQL, Redis, MinIO as R2 stand-in)
2. Runs Prisma migrate + seed
3. Starts API on `:4000`
4. Starts Next.js web on `:3000`
5. Starts Expo on `:8081`
6. Starts admin on `:3001`

Also provide `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

---

## 20. Deployment targets

- **API**: Docker container on Railway / Render / Fly.io (start with Railway free tier)
- **MySQL**: PlanetScale free tier or Railway MySQL
- **Web + Admin**: Vercel
- **R2**: Cloudflare account
- **Mobile**: Expo EAS Build → TestFlight + Play internal testing first, then production

Write deployment docs in `/README.md` for each surface.

---

## 21. Guardrails while coding

- Never commit secrets. Use `.env` (gitignored) + `.env.example` for every app.
- Never write business logic inside route handlers — put it in services.
- Never use `any` in TypeScript. If a type is unknown, use `unknown` and narrow.
- Never expose raw DB IDs for guessable paths — use `cuid()` always.
- Never call a third-party API from the client. Always proxy through the backend.
- If a spec in this document conflicts with the prototype, this document wins. If something is ambiguous, stop and ask before inventing.
- Commit in small logical units. One phase = multiple commits. Push after every working feature.

---

## 22. Delivery order (your first week)

1. Day 1 — Phase 1 (repo, Turborepo, pnpm workspaces, shared configs, Docker compose)
2. Day 2 — Phase 2 (Prisma schema + migrations + seed) + Phase 3 auth endpoints
3. Day 3 — Profile/photo endpoints + R2 uploads + shared packages (types, validation, api-client)
4. Day 4 — Expo app scaffold + auth + onboarding flow
5. Day 5 — Home + search + profile view + interest/shortlist
6. Day 6 — AI matches + kundli + verification flow UI (backend stubs for 3rd-party verifiers)
7. Day 7 — Chat (Socket.IO) + push + payment stub + Next.js marketing shell

After week 1, demo the working flows end-to-end, then continue with admin panel, payments production, tests, CI, and store submission.

---

**Start now with Phase 1. Confirm you've read this document fully before writing any code.**
