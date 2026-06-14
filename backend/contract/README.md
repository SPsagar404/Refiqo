# Refiqo API — OpenAPI contract

`openapi.json` is the generated OpenAPI 3.0 spec for the backend (61 endpoints, all
modules). Import it into any OpenAPI client to explore and test the API.

## Regenerate

```bash
cd backend
npm run openapi:generate     # writes contract/openapi.json (no DB needed)
```

## Import & test

**Swagger Editor** — https://editor.swagger.io → *File ▸ Import file* → pick `openapi.json`.
**Postman** — *Import* → `openapi.json` (creates a collection).
**Insomnia** — *Import* → `openapi.json`.

You can also use the **live Swagger UI** while the server runs: http://localhost:4000/docs

### 1. Start the API

```bash
cd backend
docker compose up -d
npx prisma migrate deploy && npx ts-node prisma/seed.ts   # first time only
npm run start:dev          # http://localhost:4000/api/v1
```

### 2. Get a token

`POST /api/v1/auth/login` with a seeded account:

| Role | Email | Password |
| --- | --- | --- |
| Seeker | `seeker@refiqo.com` | `Password@123` |
| Referrer | `priya@refiqo.com` | `Password@123` |
| Admin (use `POST /api/v1/admin/auth/login`) | `admin@refiqo.com` | `Admin@12345` |

Copy `data.accessToken` from the response.

### 3. Authorize

In Swagger UI / Editor click **Authorize** and paste the token (scheme `bearer`).
For Postman, set a collection-level Bearer Token. Admin endpoints (`/admin/*`)
use the separate admin token from `/admin/auth/login`.

### 4. Request bodies

Every endpoint, its method, path, and auth requirement are in the spec. Request
**body field definitions** are documented in [`../../docs/API.md`](../../docs/API.md)
(the API validates with Zod, so paste the JSON body shown there). Example login body:

```json
{ "email": "seeker@refiqo.com", "password": "Password@123" }
```

> Want fully described request/response bodies (auto-filled "Try it out" forms)?
> That requires wiring Zod→OpenAPI schemas — ask and I'll add it.
