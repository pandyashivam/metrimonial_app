# Getting started

This guide walks you from a fresh clone to a running ShubhMilan platform on your laptop — all four surfaces (API, web, admin, mobile) talking to a real MySQL database.

---

## 1. Prerequisites

Install these once:

| Tool | Min version | Install |
| --- | --- | --- |
| **Node.js** | 20.x | [nodejs.org](https://nodejs.org) or `nvm install 20 && nvm use 20` |
| **pnpm** | 9.x | `npm install -g pnpm` |
| **MySQL** | 8.x | Install via [mysql.com](https://dev.mysql.com/downloads/) or use SQLYog with a local MySQL instance |
| **Git** | any | [git-scm.com](https://git-scm.com) |
| **Xcode** (for iOS) | 15+ | Mac App Store — only needed if you want to run on the iOS simulator |
| **Android Studio** (for Android) | Flamingo+ | [developer.android.com](https://developer.android.com/studio) — only needed if you want to run on an Android emulator |

Verify:

```bash
node --version     # → v20.x.x
pnpm --version     # → 9.x.x
mysql --version    # → mysql  Ver 8.x.x
```

### Windows tip
If you're on Windows, run pnpm commands from **Git Bash**, **WSL2**, or **PowerShell 7**. You can manage MySQL using **SQLYog** or any other MySQL GUI.

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

The default `.env` is wired for a local MySQL on `localhost:3306` with user `root` and no password. Edit `DB_*` variables if your setup differs.

---

## 3. Create the database

Using SQLYog, MySQL CLI, or any client:

```sql
CREATE DATABASE IF NOT EXISTS shubhmilan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Or via CLI:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS shubhmilan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 4. Sync schema + seed data

```bash
# From shubhmilan/
pnpm db:sync               # runs Sequelize sync — creates/alters all tables
pnpm db:seed               # loads plans + superadmin user
```

### What got seeded

- **Superadmin** — `admin@shubhmilan.com` / `Admin@123`
- **4 plans** — Free, Silver (₹499/3mo), Gold (₹999/6mo), Platinum (₹1999/12mo)

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
    [DEV SMS] +919900020001 | SIGNUP | code=482913
    ```

5. Enter the OTP in the app; you'll be logged in and dropped into Home.

### b. Try the AI match API directly

```bash
# Get an access token
curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"identifier":"admin@shubhmilan.com","password":"Admin@123"}' | jq

# Use the accessToken from above:
TOKEN="<paste here>"
curl -s http://localhost:4000/api/v1/ai/status \
  -H "authorization: Bearer $TOKEN" | jq
```

---

## 7. Common tasks

### Reset the database

Drop and recreate the database, then re-sync:

```bash
mysql -u root -e "DROP DATABASE shubhmilan; CREATE DATABASE shubhmilan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
pnpm db:sync
pnpm db:seed
```

### Change a model

Edit `server/api/src/db.ts`, then run:

```bash
pnpm db:sync
```

Sequelize `sync({ alter: true })` will add/modify columns to match.

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

## 8. Useful URLs

| What | URL |
| --- | --- |
| API root | http://localhost:4000 |
| API v1 prefix | http://localhost:4000/api/v1 |
| Marketing | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Expo dev tools | http://localhost:8081 |
| Expo web build | http://localhost:8081 → press `w` |

---

## 9. Troubleshooting

**`pnpm install` errors with peer dep warnings** — those are safe; the monorepo uses explicit workspace linking.

**API can't connect to MySQL** — check that MySQL is running and the `DB_*` variables in `.env` match your setup. Test with `mysql -u root -e "SELECT 1"`.

**OTP not arriving** — in dev, OTPs print to the API server log (stdout). Look for `[DEV SMS]` or `[DEV EMAIL]`. To wire real SMS, set `TWILIO_*` in `.env`.

**Port already in use** — something else is bound. `lsof -i :4000` on macOS/Linux or `netstat -ano | findstr 4000` on Windows to find the culprit.

**Expo QR code doesn't work on phone** — make sure the phone and laptop are on the same Wi-Fi. If not, use `pnpm dev:mobile -- --tunnel` to get a ngrok-style link.

**"Cannot find module '@shubhmilan/*'"** — run `pnpm install` from the monorepo root. Workspace packages are linked automatically via pnpm.

---

## 10. Gemini AI integration

The AI features (match re-ranking, aboutMe rewriting, trait suggestion, coach chat) use Google Gemini. The key lives **only** on the API server.

Set it in `.env` when you're ready:

```
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

When the key is missing, every AI endpoint returns `AI_DISABLED` and the mobile UI shows a "feature unavailable" state. The server falls back to the pure-heuristic matching score. Endpoints:

- `GET /api/v1/ai/status` — `{ enabled: boolean }`
- `POST /api/v1/ai/improve-about` — rewrites aboutMe
- `POST /api/v1/ai/suggest-traits` — extract personality + hobbies from text
- `POST /api/v1/ai/reindex-self` — refresh this user's embedding (also runs lazily)
- `POST /api/v1/ai/coach` — profile-coach chat turn

---

## 11. End-to-end encrypted chat

Chat uses Curve25519 + XSalsa20-Poly1305 (`nacl.box`) for authenticated, forward-secret-per-message encryption between peers. The server is never in possession of plaintext.

- On first login, the mobile app generates a keypair with `expo-crypto`, stores the secret key in SecureStore, and uploads the public key via `PUT /me/public-key`.
- Sending: client encrypts with `nacl.box(plaintext, nonce, peerPublicKey, secretKey)` → sends base64 `{ciphertext, nonce}`.
- Receiving: client decrypts with `nacl.box.open(…, peerPublicKey, secretKey)`.
- Server persists opaque ciphertext + nonce only. Moderation uses metadata + user reports — never message content.

---

## 12. Admin panel

Admin UI runs at **http://localhost:3001** and is gated behind ADMIN / SUPERADMIN role.

- Login: `admin@shubhmilan.com` / `Admin@123` (seeded SUPERADMIN).
- Surfaces: Dashboard, Users, Verifications queue, Reports, Plans, Transactions, Audit log, Settings.
- Every mutating admin action is captured in the `AdminLog` table for forensic traceability.

---

## 13. AWS S3 Storage

Photos and chat media are stored in AWS S3. Set the following in `.env`:

```
AWS_S3_REGION=ap-south-1
AWS_S3_ACCESS_KEY_ID=your-key
AWS_S3_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=shubhmilan-photos
AWS_S3_PUBLIC_URL=https://your-bucket.s3.ap-south-1.amazonaws.com
```

When credentials are provided, photo uploads and chat media will use S3. The `AWS_S3_PUBLIC_URL` is optional — if not set, public URLs default to `https://{bucket}.s3.{region}.amazonaws.com/{key}`.
