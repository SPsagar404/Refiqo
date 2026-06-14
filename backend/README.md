# Refiqo — Backend API

Standalone NestJS + Prisma + PostgreSQL service. REST under `/api/v1`, interactive docs at `/docs`.

## Setup

```bash
npm install
cp .env.example .env          # adjust secrets as needed
docker compose up -d          # local Postgres on :5432
npm run prisma:generate
npm run prisma:migrate        # creates schema + first migration
npm run prisma:seed           # demo users, skills, companies, super-admin
npm run start:dev             # http://localhost:4000/api/v1  (docs: /docs)
```

## Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@refiqo.com` | `Admin@12345` |
| Seeker | `seeker@refiqo.com` | `Password@123` |
| Referrer | `priya@refiqo.com` / `rahul@refiqo.com` | `Password@123` |

## Architecture

Clean-architecture feature modules under `src/modules/*` (controller → service → Prisma).
Cross-cutting concerns in `src/common` (exception filter, transform/logging interceptors,
JWT + roles guards, Zod validation pipe). External providers sit behind **ports** with
local/cloud adapters selected by `ADAPTER_MODE` — runs fully offline in dev.

- Success envelope: `{ data, meta? }` · Error envelope: `{ statusCode, error, message, code, details? }`
- Auth: JWT access (15m) + rotating refresh sessions (30d), Argon2 hashing.
- See `../docs/ARCHITECTURE.md` and `../docs/API.md`.

## Scripts

`start:dev` · `build` · `lint` · `typecheck` · `test` · `test:e2e` ·
`prisma:generate` · `prisma:migrate` · `prisma:seed` · `prisma:studio`

## OAuth in dev

The local OAuth adapter accepts a base64url-encoded JSON id token, e.g.:

```bash
TOKEN=$(node -e "console.log(Buffer.from(JSON.stringify({sub:'g-1',email:'x@y.com',name:'X'})).toString('base64url'))")
curl -X POST localhost:4000/api/v1/auth/oauth/google -H 'Content-Type: application/json' -d "{\"idToken\":\"$TOKEN\"}"
```
