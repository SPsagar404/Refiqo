# Refiqo — Architecture

> **Project topology:** Refiqo is **three standalone projects** (`backend/`, `mobile/`, `admin/`), each independently installed, built, and deployed. There is **no shared workspace package**. Shared contracts (enums, Zod validation schemas, DTO/response types) are defined **within each project**, kept in sync against this doc and the API contract in `API.md`. The backend's Prisma schema + `API.md` are the canonical source; client projects mirror the subset they use.

## 1. System overview

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Mobile (Expo)│     │ Admin (Next.js)│     │  Public site   │
└───────┬───────┘     └───────┬───────┘     └───────────────┘
        │  HTTPS / JWT        │  HTTPS / JWT
        └──────────┬──────────┘
                   ▼
          ┌──────────────────┐        ┌──────────────────────┐
          │  NestJS REST API  │◄──────►│ Adapters (interfaces) │
          │  (clean arch)     │        │  Storage / Realtime / │
          └─────────┬────────┘        │  Push / OAuth         │
                    │                  └─────────┬─────────────┘
                    ▼                            ▼
            ┌──────────────┐      local dev: mocks │ prod: Supabase, FCM
            │ PostgreSQL    │      ─────────────────┘
            │ (Prisma ORM)  │
            └──────────────┘
```

All external dependencies are accessed through **ports (interfaces)** with swappable **adapters**:

| Port | Local adapter (dev) | Production adapter |
| --- | --- | --- |
| `StoragePort` | Filesystem + local signed URLs | Supabase Storage |
| `RealtimePort` | In-memory pub/sub + SSE | Supabase Realtime → (Socket.IO) |
| `PushPort` | Console/no-op | Firebase Cloud Messaging |
| `OAuthPort` | Stubbed provider responses | Google / LinkedIn / GitHub |

This keeps the codebase runnable with zero cloud accounts and makes provider swaps a config change, satisfying the "future migration to Socket.IO" requirement.

## 2. Backend — Clean Architecture (NestJS)

Each feature module is layered:

```
modules/<feature>/
├── <feature>.controller.ts      # HTTP layer: routes, DTO binding, swagger
├── <feature>.service.ts         # Use cases / application logic
├── <feature>.repository.ts      # Persistence (Prisma) behind an interface
├── dto/                         # Zod-backed DTOs (create/update/query)
├── entities/                    # Domain types/mappers
└── <feature>.module.ts
```

**Modules**: `auth`, `users`, `referrers`, `skills`, `resume`, `portfolio`, `referral`, `chat`, `notification`, `admin`, plus infrastructure modules `prisma`, `config`, `storage`, `realtime`, `push`, `common`.

**Cross-cutting (global)**:
- `AllExceptionsFilter` → consistent error envelope.
- `TransformInterceptor` → consistent success envelope `{ data, meta }`.
- `LoggingInterceptor` → structured request logs (pino).
- `JwtAuthGuard` + `RolesGuard` (RBAC) + `@Roles()`/`@Public()` decorators.
- `ZodValidationPipe` → validate body/query/params against shared schemas.
- `ThrottlerGuard` → rate limiting.

**Dependency rule**: controllers depend on services; services depend on repository interfaces and ports; nothing in the domain/application layer imports Prisma directly.

## 3. Mobile — Feature-based architecture (Expo)

```
src/
├── app/                 # navigation (Auth/App stacks, tabs) + providers
├── features/
│   ├── auth/            # screens, hooks, api, store
│   ├── onboarding/      # 5-step wizard, per-step state
│   ├── dashboard/
│   ├── discovery/
│   ├── referrer/
│   ├── referral/
│   ├── chat/
│   ├── notifications/
│   └── profile/
├── components/ui/       # design-system primitives (Button, Input, …)
├── lib/                 # apiClient, queryClient, storage, realtime, push
├── stores/              # zustand stores (auth/session, ui)
├── theme/               # design tokens (colors, spacing, typography)
└── types/               # contracts: enums, zod schemas, API DTO/response types (project-local)
```

- **Navigation**: React Navigation. Root switches `AuthStack` ↔ `AppStack` from `useAuthStore`. Tabs match the design (Home/Search/FAB/Requests/Profile).
- **Forms**: React Hook Form + `zodResolver` using this project's own Zod schemas (mirrored from `API.md`).
- **Server state**: TanStack Query (query keys per feature, optimistic updates for chat/requests, infinite queries for lists).
- **Client state**: Zustand (auth tokens via SecureStore, onboarding draft, UI flags). Selectors prevent unnecessary re-renders.
- **Realtime**: `RealtimeClient` abstraction (Supabase channel in prod, polling/SSE locally).

## 4. Admin — Next.js (App Router)

```
src/
├── app/(dashboard)/...   # protected routes per module
├── app/(auth)/login
├── components/ui/        # ShadCN components
├── components/tables/    # TanStack Table wrappers
├── lib/                  # api client, auth, query client
└── hooks/
```

- Auth via admin JWT; `RolesGuard` on backend restricts to `ADMIN`/`SUPER_ADMIN`.
- Tables use TanStack Table with server-side pagination/sort/filter.

## 5. Matching algorithm (Dashboard "Top Matches")

Score a referrer for a seeker as a weighted sum (0–100):

```
score =  0.40 * skillOverlap            # |seeker.skills ∩ referrer.skills| / |seeker.skills|
       + 0.20 * companyPreferenceMatch  # referrer.company ∈ seeker.preferredCompanies
       + 0.15 * locationMatch           # referrer.location ∈ seeker.preferredLocations
       + 0.15 * rolePreferenceMatch     # referrer can refer for seeker.preferredRoles
       + 0.10 * availabilityBoost       # AVAILABLE_NOW > 1-2wk > limited
```

MVP computes this in SQL/JS at request time with indexes on skills and company/location FKs; the weights live in `PlatformSettings` so admins can tune them. A `pgvector`/search-service path is documented for scale but out of MVP scope.

## 6. Environments
- **local**: Docker Postgres + mock adapters. No external accounts needed.
- **staging/prod**: managed Postgres + Supabase + Firebase + real OAuth. Same code, env-driven adapter selection (`ADAPTER_MODE=local|cloud`).

## 7. Key conventions
- TypeScript strict everywhere; no `any` in domain code.
- Each project owns its contracts (enums + zod + types); they mirror the canonical Prisma schema + `API.md`. No cross-project imports.
- API responses always `{ data, meta? }`; errors always `{ statusCode, message, error, code, details? }`.
- Snake-free, camelCase JSON; UUID v4 primary keys; UTC timestamps.
