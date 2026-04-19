# @shubhmilan/api

Fastify + Prisma + MySQL backend for ShubhMilan.

## Quick reference

```bash
pnpm dev                # start dev server on :4000
pnpm db:migrate         # create / apply migrations (requires Docker up)
pnpm db:seed            # load 8 sample profiles + plans + superadmin
pnpm db:studio          # open Prisma Studio
pnpm test               # run Vitest suite
```

Server mounts at `/api/v1`. Response shape is always `{ ok: boolean, data?, error? }`.

### Superadmin (seeded)
- email: `support@tenderfy.org`
- password: `Admin#12345`

### Demo users (seeded)
All sample profiles share password `Demo#12345`.
