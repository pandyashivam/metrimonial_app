# ShubhMilan

> Trusted Indian matrimony, built from scratch. Mobile (iOS + Android), web, and admin — from one TypeScript monorepo.

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

---

## Stack at a glance

| Surface | Tech |
| --- | --- |
| Mobile (iOS + Android + web app) | Expo SDK 51 · Expo Router · React Native · react-native-web |
| Marketing site | Next.js 14 App Router · SEO-first |
| Admin panel | Next.js 14 · SUPERADMIN-gated |
| API | Node 20 · Fastify 4 · Socket.IO · Zod |
| ORM & DB | Sequelize · MySQL 8 (direct connection) |
| AI | Google Gemini (embeddings + chat + content) |
| Storage | AWS S3 (photos & chat media) |
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
│   └── api/                 Fastify + Sequelize backend
├── packages/
│   ├── config/              Shared TS / ESLint / Prettier configs
│   ├── types/               Shared TS types
│   ├── validation/          Shared Zod schemas
│   ├── api-client/          Typed fetch client (refresh-on-401 built in)
│   └── ui/                  RN design system + tokens (maps to prototype)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Run it locally

New? Jump to **[GETTING_STARTED.md](./GETTING_STARTED.md)** for the step-by-step guide. TL;DR:

```bash
# From shubhmilan/ root (one-time)
pnpm install
cp .env.example .env

# Create the database in MySQL (via SQLYog or CLI):
#   CREATE DATABASE shubhmilan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

pnpm db:sync                   # sync Sequelize models to MySQL
pnpm db:seed                   # load plans + superadmin

# Then in separate terminals (or `pnpm dev` for all at once)
pnpm dev:api                   # http://localhost:4000
pnpm dev:web                   # http://localhost:3000
pnpm dev:admin                 # http://localhost:3001
pnpm dev:mobile                # Expo dev tools on :8081
```

### Seeded credentials

- **Superadmin** → `admin@shubhmilan.com` / `Admin@123`

---

## Security & privacy highlights

- **Messages are end-to-end encrypted** with Curve25519 + XSalsa20-Poly1305 (`nacl.box`). Private keys live in iOS Keychain / Android Keystore via SecureStore. The server stores opaque ciphertext + nonce only.
- **Passwords** use bcrypt(cost=12); OTPs are bcrypt-hashed before storage.
- **Refresh tokens** are hashed (SHA-256) before storage and rotated on every use.
- **PII at rest** (Aadhaar last-4) uses AES-256-GCM with a dedicated `PII_ENCRYPTION_KEY`.
- **Razorpay webhook** signature is verified (HMAC-SHA256) before any subscription mutation.
- **Admin actions** write to `AdminLog` for forensic traceability.
- **Gemini API key** lives only on the API server; it is never exposed to the client. Features degrade gracefully when the key is absent.

---

## Guardrails

- **No secrets in repo.** All env values live in `.env` (gitignored); `.env.example` documents every knob.
- **No mocks in the final build.** The backend talks to a real MySQL from day one.
- **Strict TypeScript everywhere.** `any` is a build-breaker.
- **cuid() IDs, indexed foreign keys.** See `server/api/src/db.ts`.
- **Shared Zod on both sides of the wire.** `packages/validation` is the contract.
