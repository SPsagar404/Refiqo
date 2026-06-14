# Refiqo — Setup, Environment & Deployment

## Prerequisites
- Node.js 20+, npm 10+
- Docker (for local Postgres) — or any Postgres 15+
- For mobile: Expo CLI (`npx expo`), Android Studio / a device with Expo Go
- (Optional, prod) Supabase project, Firebase project, OAuth apps

> **Project structure:** Refiqo is three **standalone** projects — `backend/`, `mobile/`, `admin/` — each with its own `package.json`, dependencies, `.env`, and scripts. Set up and run each one independently; there is no root install or shared workspace.

## 1. Install (per project)
```bash
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install
```

## 2. Environment variables
Each project has its own `.env`. Copy the example inside each project and fill in values:
```bash
cd backend && cp .env.example .env
cd ../admin && cp .env.example .env.local
cd ../mobile && cp .env.example .env
```

### Backend (`backend/.env`)
| Var | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://refiqo:refiqo@localhost:5432/refiqo` | Prisma connection |
| `PORT` | `4000` | API port |
| `JWT_ACCESS_SECRET` | `change-me` | access token signing |
| `JWT_REFRESH_SECRET` | `change-me-too` | refresh token signing |
| `JWT_ACCESS_TTL` | `15m` | access lifetime |
| `JWT_REFRESH_TTL` | `30d` | refresh lifetime |
| `ADAPTER_MODE` | `local` | `local` (mocks) or `cloud` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | — | required when `ADAPTER_MODE=cloud` |
| `SUPABASE_BUCKET` | `refiqo` | storage bucket |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | — | FCM (cloud) |
| `GOOGLE_CLIENT_ID` / `LINKEDIN_CLIENT_ID` / `GITHUB_CLIENT_ID` (+secrets) | — | OAuth (cloud) |
| `CORS_ORIGINS` | `http://localhost:3000` | admin/web origins |

### Mobile (`mobile/.env`)
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |
| `EXPO_PUBLIC_ADAPTER_MODE` | `local` |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | for realtime (cloud) |

### Admin (`admin/.env.local`)
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |

## 3. Database (inside `backend/`)
```bash
cd backend
docker compose up -d        # starts Postgres on :5432
npm run prisma:generate     # prisma generate
npm run prisma:migrate      # prisma migrate dev
npm run prisma:seed         # seed catalog + demo data + super-admin
```
Prisma Studio: `npm run prisma:studio`.

## 4. Run (each in its own terminal)
```bash
cd backend && npm run start:dev   # http://localhost:4000  | Swagger: /docs
cd admin   && npm run dev         # http://localhost:3000
cd mobile  && npm run start       # Expo dev server (press a for Android)
```

Default seeded credentials (dev only):
- Super admin: `admin@refiqo.dev` / `Admin@123`
- Demo user: `sagar@refiqo.dev` / `User@123`

## 5. Switching to cloud providers
Set `ADAPTER_MODE=cloud` and provide Supabase/Firebase/OAuth keys. No code changes — adapters are selected by env. See ARCHITECTURE §1.

## 6. Deployment
- **Backend**: Dockerfile → any container host (Render/Fly/Railway/ECS) + managed Postgres. Run `prisma migrate deploy` on release.
- **Admin**: Vercel (Next.js) — set `NEXT_PUBLIC_API_URL`.
- **Mobile**: EAS Build → `eas build -p android` → `eas submit` to Play Store. Configure FCM + OAuth redirect URIs.

## 7. Useful scripts (run inside each project)
**backend/**
| Script | Action |
| --- | --- |
| `npm run start:dev` | run API in watch mode |
| `npm run prisma:generate / :migrate / :seed / :studio` | Prisma tasks |
| `npm run lint` / `npm run typecheck` / `npm run test` | quality gates |
| `docker compose up/down` | local Postgres |

**admin/**
| `npm run dev` / `npm run build` / `npm run start` | Next.js dev/build/serve |
| `npm run lint` / `npm run typecheck` | quality gates |

**mobile/**
| `npm run start` | Expo dev server |
| `npm run android` | run on Android |
| `npm run lint` / `npm run typecheck` / `npm run test` | quality gates |
