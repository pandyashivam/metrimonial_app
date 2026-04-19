# ShubhMilan

> Trusted Indian matrimony, built from scratch. Mobile (iOS + Android), web, and admin — from one TypeScript monorepo.

This repository follows the phased plan in [`../BUILD_INSTRUCTIONS.md`](../BUILD_INSTRUCTIONS.md). The visual language and data model mirror [`../prototype/app.html`](../prototype/app.html).

---

## One codebase → iOS + Android + Web

The core product ships to three surfaces from **one** set of source files:

```
                       apps/mobile/ (Expo SDK 51 + Expo Router)
                              │
                              ├──────────── packages/ui         (RN components, work on web via react-native-web)
                              ├──────────── packages/api-client (pure TS fetch wrapper)
                              ├──────────── packages/types      (pure TS)
                              └──────────── packages/validation (Zod — also used by the server)
                              │
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   iOS (Xcode)          Android (Gradle)       Web (react-native-web)
   pnpm mobile:ios      pnpm mobile:android    pnpm mobile:web
```

- `packages/ui` components (`Button`, `ProfileCard`, `TrustDonut`, `AIScoreBadge`, etc.) are written with React Native primitives (`View`, `Text`, `Pressable`, `StyleSheet`). Metro bundler aliases `react-native` → `react-native-web` automatically at build time — same JSX, three targets.
- `packages/api-client` is platform-agnostic TypeScript; it uses `fetch` (works everywhere) and `SecureStore` is injected by the caller (mobile wires `expo-secure-store`, admin wires `localStorage`).
- `packages/validation` Zod schemas are the wire contract — **enforced on both the server AND the mobile app** for every form submission.

Two other Next.js surfaces exist for platform-specific needs that don't benefit from react-native-web:

- `apps/web/` — **marketing & SEO only** (landing, pricing, safety, blog, legal). Server-rendered HTML is better for SEO than an SPA, and marketing pages have 0% overlap with the logged-in experience.
- `apps/admin/` — **internal admin panel**. Dense tables, data-grid-heavy — native web idioms fit better than RN here.

### Run commands

```bash
# Single codebase, three platforms:
pnpm --filter @shubhmilan/mobile ios          # iOS simulator (requires Xcode)
pnpm --filter @shubhmilan/mobile android      # Android emulator
pnpm --filter @shubhmilan/mobile web          # web dev server — open in browser
pnpm --filter @shubhmilan/mobile build:web    # static SPA for CDN deploy

# The other two surfaces (independent Next.js apps):
pnpm dev:web     # marketing (3000)
pnpm dev:admin   # admin (3001)
```

### Platform compatibility matrix (mobile app deps)

| Package | iOS | Android | Web |
|---|---|---|---|
| `@shubhmilan/ui` (RN primitives) | ✅ | ✅ | ✅ via react-native-web |
| `@tanstack/react-query` | ✅ | ✅ | ✅ |
| `zustand` | ✅ | ✅ | ✅ |
| `tweetnacl` + `tweetnacl-util` (E2E chat) | ✅ | ✅ | ✅ pure JS |
| `socket.io-client` | ✅ | ✅ | ✅ |
| `expo-router` | ✅ | ✅ | ✅ |
| `expo-secure-store` | ✅ Keychain | ✅ Keystore | ⚠️ falls back to localStorage — see note |
| `expo-crypto` (random bytes) | ✅ | ✅ | ✅ uses `crypto.getRandomValues` |
| `expo-image-picker` | ✅ | ✅ | ✅ hidden `<input type=file>` |
| `expo-image-manipulator` | ✅ | ✅ | ✅ WebAssembly |
| `expo-notifications` | ✅ APNs | ✅ FCM | ⚠️ Web Push API (limited on iOS Safari) |

**Web security note:** on the web, `expo-secure-store` falls back to `localStorage`. That means the E2E chat private key is in the browser's localStorage rather than iOS Keychain / Android Keystore. This is a known tradeoff — document it in your privacy page and consider migrating to Web Crypto API with non-extractable keys if it becomes a concern. For the mobile app, the private key is properly sealed inside the secure enclave.

---

## Stack at a glance

| Surface | Tech |
| --- | --- |
| Mobile (iOS + Android + web app) | Expo SDK 51 · Expo Router · React Native · react-native-web |
| Marketing site | Next.js 14 App Router · SEO-first |
| Admin panel | Next.js 14 · SUPERADMIN-gated |
| API | Node 20 · Fastify 4 · Socket.IO · Zod |
| ORM & DB | Prisma · MySQL 8 |
| Local stack | Docker Compose (MySQL · Redis · MinIO) |
| Monorepo | pnpm workspaces · Turborepo |
| Shared | Zod schemas · typed fetch client · RN design-system components |

---

## Repository layout

```
shubhmilan/
├── apps/
│   ├── mobile/              Expo RN app (iOS / Android / web)
│   ├── web/                 Next.js marketing site
│   └── admin/               Next.js admin panel (superadmin)
├── server/
│   └── api/                 Fastify + Prisma backend
├── packages/
│   ├── config/              Shared TS / ESLint / Prettier configs
│   ├── types/               Shared TS types
│   ├── validation/          Shared Zod schemas
│   ├── api-client/          Typed fetch client (refresh-on-401 built in)
│   └── ui/                  RN design system + tokens (maps to prototype)
├── infra/docker/            docker-compose (MySQL · Redis · MinIO/R2)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Run it locally

New? Jump to **[GETTING_STARTED.md](./GETTING_STARTED.md)** for the step-by-step guide (prereqs, Docker, migrations, seed, all four dev servers, test users). TL;DR:

```bash
# From shubhmilan/ root (one-time)
pnpm install
cp .env.example .env
pnpm db:up                     # Docker MySQL + Redis + MinIO
pnpm db:migrate                # apply schema
pnpm db:seed                   # load 8 sample profiles + plans + superadmin

# Then in separate terminals (or `pnpm dev` for all at once)
pnpm dev:api                   # http://localhost:4000
pnpm dev:web                   # http://localhost:3000
pnpm dev:admin                 # http://localhost:3001
pnpm dev:mobile                # Expo dev tools on :8081
```

### Seeded credentials

- **Superadmin** → `support@tenderfy.org` / `Admin#12345`
- **Sample users** (8 profiles) → password for all: `Demo#12345`

---

## Phases

All nine phases of `BUILD_INSTRUCTIONS.md` are implemented end-to-end:

1. ✅ Repo bootstrap
2. ✅ Database + Prisma schema (incl. E2E encrypted messages, embeddings, match log) + seed
3. ✅ Backend API — auth, profile, discovery, AI match (+ OpenAI rerank), Guna Milan, interests, chat, plans, photos (R2/MinIO), shortlist/block/report/views, verification steps, devices, payments (Razorpay), AI assistance (OpenAI), admin
4. ✅ Shared packages — types, validation, api-client, ui, config
5. ✅ Mobile app — Expo Router with auth, 5 tabs, profile detail, onboarding (6 steps), verification screen, kundli, filter, premium, E2E-encrypted chat
6. ✅ Web — landing, how-it-works, safety, pricing, about, contact, grievance, terms, privacy, success stories, blog
7. ✅ Admin panel — login, dashboard, users, verifications, reports, plans, audit, transactions, settings
8. ✅ Realtime (Socket.IO), push (Expo Notifications registration), Razorpay (order/verify/webhook with signature validation)
9. ✅ Vitest tests (matching, crypto, tokens, verification, openai helpers) + GitHub Actions CI

## Security & privacy highlights

- **Messages are end-to-end encrypted** with Curve25519 + XSalsa20-Poly1305 (`nacl.box`). Private keys live in iOS Keychain / Android Keystore via SecureStore. The server stores opaque ciphertext + nonce only.
- **Passwords** use bcrypt(cost=12); OTPs are bcrypt-hashed before storage.
- **Refresh tokens** are hashed (SHA-256) before storage and rotated on every use.
- **PII at rest** (Aadhaar last-4) uses AES-256-GCM with a dedicated `PII_ENCRYPTION_KEY`.
- **Razorpay webhook** signature is verified (HMAC-SHA256) before any subscription mutation.
- **Admin actions** write to `AdminLog` for forensic traceability.
- **OpenAI key** lives only on the API server; it is never exposed to the client. Features degrade gracefully when the key is absent.

---

## Guardrails

- **No secrets in repo.** All env values live in `.env` (gitignored); `.env.example` documents every knob.
- **No mocks in the final build.** The backend talks to a real MySQL from day one.
- **Strict TypeScript everywhere.** `any` is a build-breaker.
- **cuid() IDs, soft deletes, indexed foreign keys.** See `server/api/prisma/schema.prisma`.
- **Shared Zod on both sides of the wire.** `packages/validation` is the contract.
