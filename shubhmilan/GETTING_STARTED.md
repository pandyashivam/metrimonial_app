# Getting started

This guide walks you from a fresh clone to a running ShubhMilan platform on your laptop — all four surfaces (API, web, admin, mobile) talking to a real MySQL database.

---

## 1. Prerequisites

Install these once:

| Tool | Min version | Install |
| --- | --- | --- |
| **Node.js** | 20.x | [nodejs.org](https://nodejs.org) or `nvm install 20 && nvm use 20` |
| **pnpm** | 9.x | `npm install -g pnpm` |
| **Docker Desktop** | any recent | [docker.com](https://www.docker.com/products/docker-desktop) — used to run MySQL, Redis, and MinIO locally |
| **Git** | any | [git-scm.com](https://git-scm.com) |
| **Xcode** (for iOS) | 15+ | Mac App Store — only needed if you want to run on the iOS simulator |
| **Android Studio** (for Android) | Flamingo+ | [developer.android.com](https://developer.android.com/studio) — only needed if you want to run on an Android emulator |

Verify:

```bash
node --version     # → v20.x.x
pnpm --version     # → 9.x.x
docker --version
```

### Windows tip
If you're on Windows, run pnpm and Docker commands from **Git Bash**, **WSL2**, or **PowerShell 7**. The shell in `.claude` worktrees is already Git Bash.

---

## 2. First-time setup

From the repo root (`shubhmilan/`):

```bash
# 1) Install all workspace dependencies (uses the lockfile)
pnpm install

# 2) Copy environment template
cp .env.example .env

# 3) (Optional but recommended) generate a real encryption key for PII
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# → paste output into PII_ENCRYPTION_KEY in .env
```

The default `.env` is wired for local Docker services — you don't need to edit anything else to get running.

---

## 3. Start the local data stack

```bash
pnpm db:up
```

This runs `docker compose` and starts:

| Service | Port | Purpose |
| --- | --- | --- |
| **MySQL 8** | 3306 | Primary DB. User/pass: `shubhmilan` / `shubhmilan`, db: `shubhmilan` |
| **Redis 7** | 6379 | Cache, queues |
| **MinIO** | 9000 (S3) · 9001 (console) | S3-compatible photo storage — stand-in for Cloudflare R2. Console login: `minioadmin` / `minioadmin` |
| **minio-init** | — | One-shot job that creates the `shubhmilan-photos` bucket |

Check everything is healthy:

```bash
docker ps
```

You should see all four containers running. If MySQL is still initialising, wait ~10 seconds before moving on.

### Stop the stack

```bash
pnpm db:down              # stop containers, keep data
# or
docker compose -f infra/docker/docker-compose.yml down -v   # also wipe volumes
```

---

## 4. Apply the schema + seed demo data

```bash
# From shubhmilan/
pnpm db:migrate            # runs Prisma migrate dev — creates tables
pnpm db:seed               # loads 8 sample profiles + 4 plans + superadmin
```

You can explore the database visually:

```bash
pnpm db:studio             # opens Prisma Studio on http://localhost:5555
```

### What got seeded

- **Superadmin** — `support@tenderfy.org` / `Admin#12345`
- **8 demo users** (Priya, Rahul, Anjali, Arjun, Kavya, Vikram, Sneha, Rohan) — each with an `ACTIVE` verification tier. Password for all: `Demo#12345`
- **4 plans** — Free, Silver ₹999/3mo, Gold ₹1999/6mo, Platinum ₹2999/12mo

---

## 5. Start the four dev servers

### Option A: one command for everything

```bash
pnpm dev
```

Turborepo runs all four in parallel. Each has its own coloured log prefix.

### Option B: one terminal per surface (recommended during focused work)

```bash
pnpm dev:api        # → http://localhost:4000      (Fastify + Socket.IO)
pnpm dev:web        # → http://localhost:3000      (Next.js marketing)
pnpm dev:admin      # → http://localhost:3001      (Next.js admin)
pnpm dev:mobile     # → http://localhost:8081      (Expo dev tools)
```

### Verify each surface

| What | URL | Expected |
| --- | --- | --- |
| API health | http://localhost:4000/health | `{"ok":true,"data":{"status":"healthy"}}` |
| API plans | http://localhost:4000/api/v1/plans | JSON with 4 plan objects |
| Marketing site | http://localhost:3000 | Hero + "Why ShubhMilan" + pricing |
| Admin | http://localhost:3001 | Sidebar layout with KPI placeholders |
| Expo | http://localhost:8081 | Dev tools. Press `w` to open web, scan QR for phone, or press `i` / `a` for simulators |

---

## 6. Try it end-to-end

### a. Sign up from the mobile app

1. Press `w` in the Expo terminal to open the web build (or run `pnpm dev:mobile` and scan the QR in the Expo Go app).
2. On the welcome screen, tap **Create a free profile**.
3. Fill in email + phone (any `+91…` number) + password (min 8, mix case, include a digit).
4. The backend writes an OTP to the server log — look for a line like:

    ```
    📱 [DEV SMS] +919900020001 | SIGNUP | code=482913
    ```

5. Enter the OTP in the app; you'll be logged in and dropped into Home.

### b. Log in as a seeded user

Use `priya.sharma@example.com` (or any sample) with password `Demo#12345`. Home, Matches, and Me all pull real data.

### c. Try the AI match API directly

```bash
# Get an access token for Priya
curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"identifier":"priya.sharma@example.com","password":"Demo#12345"}' | jq

# Use the accessToken from above:
TOKEN="<paste here>"
curl -s http://localhost:4000/api/v1/matches/ai \
  -H "authorization: Bearer $TOKEN" | jq
```

You'll get ranked matches with reasons (religion, mother tongue, shared hobbies, etc).

### d. Ashtakoot (Guna Milan) kundli match

```bash
# Priya's profile id → grab from /api/v1/me/profile, then compare with Rahul's id from /profiles
curl -s http://localhost:4000/api/v1/matches/kundli/<rahul_profile_id> \
  -H "authorization: Bearer $TOKEN" | jq
```

---

## 7. Common tasks

### Reset the database

```bash
pnpm --filter @shubhmilan/api db:reset
pnpm db:seed
```

### Create a new migration

```bash
# Edit server/api/prisma/schema.prisma, then:
pnpm --filter @shubhmilan/api db:migrate -- --name add_something
```

### Lint & typecheck everything

```bash
pnpm typecheck
pnpm lint
```

### Run tests

```bash
pnpm test
```

### Clean all build output and caches

```bash
pnpm clean
```

---

## 8. Useful URLs & dashboards

| What | URL |
| --- | --- |
| API root | http://localhost:4000 |
| API v1 prefix | http://localhost:4000/api/v1 |
| Prisma Studio | http://localhost:5555 (after `pnpm db:studio`) |
| MinIO console | http://localhost:9001 — `minioadmin` / `minioadmin` |
| Marketing | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Expo dev tools | http://localhost:8081 |
| Expo web build | http://localhost:8081 → press `w` |

---

## 9. Troubleshooting

**`pnpm install` errors with peer dep warnings** — those are safe; the monorepo uses explicit workspace linking.

**API can't connect to MySQL** — give the container ~10s after `pnpm db:up`. Run `docker logs shubhmilan-mysql` to confirm it reports "ready for connections".

**OTP not arriving** — in dev, OTPs print to the API server log (stdout). Look for `📱 [DEV SMS]` or `✉️  [DEV EMAIL]`. To wire real SMS, set `TWILIO_*` in `.env`.

**Port already in use** — something else is bound. `lsof -i :4000` on macOS/Linux or `netstat -ano | findstr 4000` on Windows to find the culprit.

**Expo QR code doesn't work on phone** — make sure the phone and laptop are on the same Wi-Fi. If not, use `pnpm dev:mobile -- --tunnel` to get a ngrok-style link.

**Prisma migration fails** — run `docker logs shubhmilan-mysql` to check the DB is up. If the DB exists but tables are broken, nuke and reseed: `pnpm --filter @shubhmilan/api db:reset && pnpm db:seed`.

**"Cannot find module '@shubhmilan/*'"** — run `pnpm install` from the monorepo root. Workspace packages are linked automatically via pnpm.

---

## 10. Next steps

Once you're running, the natural flow of work is:

1. Wire photo upload in the API (MinIO is running; see `server/api/README.md` for the R2 stub).
2. Flesh out the onboarding screens (`apps/mobile/app/(onboarding)/`) using the prototype as reference.
3. Implement admin endpoints in `server/api/src/routes/admin.ts` (mount from `src/app.ts`).
4. Replace FCM / Razorpay stubs with real keys (all env variables are in `.env.example`).
5. Add Vitest/Jest tests and turn on CI (`.github/workflows/ci.yml` — add when ready).

See `../BUILD_INSTRUCTIONS.md` §22 for the week-one delivery order the project was planned against.
