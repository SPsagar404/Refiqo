# Refiqo

> Professional referral networking platform — connect job seekers with verified professionals who can refer them.

Refiqo is a production-grade MVP made of **three independent, standalone projects** backed by a single PostgreSQL database. Each project lives in its own folder, has its own `package.json`/dependencies, and is installed, run, built, and deployed on its own — there is **no shared monorepo workspace**. Shared contracts (enums, Zod schemas, types) are defined inside each project.

| Project | Stack | Folder |
| --- | --- | --- |
| **Backend API** | NestJS · TypeScript · PostgreSQL · Prisma · JWT · REST + Swagger | `backend/` |
| **Mobile** (Android-first, iOS-ready) | React Native · Expo · TypeScript · React Navigation · React Hook Form · Zod · Zustand · TanStack Query | `mobile/` |
| **Admin Panel** | Next.js · TypeScript · Tailwind · ShadCN UI · TanStack Table | `admin/` |

Cloud services (Supabase Storage, Supabase Realtime, Firebase Cloud Messaging, OAuth providers) are integrated behind **adapter interfaces** so the stack runs locally with Docker Postgres + mock adapters, and switches to real providers by adding keys to each project's `.env`.

## Quick start

Each project is set up and run independently (see [`docs/SETUP.md`](docs/SETUP.md) for full details).

```bash
# Backend
cd backend
npm install
docker compose up -d        # local Postgres
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev           # http://localhost:4000  (Swagger: /docs)

# Admin panel
cd admin
npm install
npm run dev                 # http://localhost:3000

# Mobile app
cd mobile
npm install
npm run start              # Expo dev server (press a for Android)
```

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — implementation plan & screen-by-screen requirements
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system & app architecture
- [`docs/DATABASE.md`](docs/DATABASE.md) — data model & ER overview
- [`docs/API.md`](docs/API.md) — REST API contract
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 10-phase delivery roadmap
- [`docs/SETUP.md`](docs/SETUP.md) — setup, env vars, deployment

## Repository layout

Three standalone projects + shared reference material. Nothing at the root ties them together — each folder is its own project you can clone/deploy on its own.

```
Refiqo/
├── backend/          Standalone NestJS API (clean architecture, feature modules)
│   ├── prisma/       schema, migrations, seed
│   ├── src/
│   ├── docker-compose.yml   local Postgres for the backend
│   ├── package.json
│   └── .env
├── mobile/           Standalone Expo React Native app (feature-based)
│   ├── src/
│   ├── app.json
│   ├── package.json
│   └── .env
├── admin/            Standalone Next.js admin panel
│   ├── src/
│   ├── package.json
│   └── .env.local
├── docs/             Shared planning & reference documentation
└── screens/          Design reference (source of truth for UI)
```
