# @shubhmilan/api

Fastify + Sequelize + MySQL backend for ShubhMilan.

## Quick reference

```bash
pnpm dev                # start dev server on :4000
pnpm db:sync            # sync Sequelize models to MySQL (alter: true)
pnpm db:seed            # load plans + superadmin
pnpm test               # run Vitest suite
```

Server mounts at `/api/v1`. Response shape is always `{ ok: boolean, data?, error? }`.

### Superadmin (seeded)
- email: `admin@shubhmilan.com`
- password: `Admin@123`
