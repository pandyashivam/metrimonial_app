# ShubhMilan

> Trusted Indian matrimony, built from scratch. Mobile (iOS + Android), web, and admin — from one TypeScript monorepo.

This repository follows the phased plan in [`../BUILD_INSTRUCTIONS.md`](../BUILD_INSTRUCTIONS.md). The visual language and data model mirror [`../prototype/app.html`](../prototype/app.html).

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

Build order from `BUILD_INSTRUCTIONS.md`:

1. ✅ Repo bootstrap (this scaffold)
2. ✅ Database + Prisma schema + seed
3. ✅ Backend API — auth, profile, discovery, AI match, Guna Milan, interests, chat, plans
4. ✅ Shared packages — types, validation, api-client, ui, config
5. ✅ Mobile app — Expo Router with auth + 5 tabs + profile detail
6. ✅ Web marketing site — landing, pricing, safety, how-it-works, SEO
7. ✅ Admin panel — dashboard shell + nav
8. ⏳ Realtime (Socket.IO wired in api), push (stubbed), Razorpay payments (stubbed)
9. ⏳ Full test coverage, CI, EAS builds

The current scaffold gives every developer a runnable platform end-to-end. Fleshing out the remaining features is tracked in each app's own `README.md`.

---

## Guardrails

- **No secrets in repo.** All env values live in `.env` (gitignored); `.env.example` documents every knob.
- **No mocks in the final build.** The backend talks to a real MySQL from day one.
- **Strict TypeScript everywhere.** `any` is a build-breaker.
- **cuid() IDs, soft deletes, indexed foreign keys.** See `server/api/prisma/schema.prisma`.
- **Shared Zod on both sides of the wire.** `packages/validation` is the contract.
