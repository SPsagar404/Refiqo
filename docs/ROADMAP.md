# Refiqo — Development Roadmap

Ten phases. Each phase ships something runnable and demoable. ✅ = done this engagement, 🚧 = in progress, ⬜ = pending.

## Phase 1 — Foundation 🚧
Three **standalone** projects (`backend/`, `mobile/`, `admin/`), each self-contained — no monorepo/workspaces.
- [x] Docs: PLAN, ARCHITECTURE, DATABASE, API, ROADMAP, SETUP.
- [x] **backend/**: standalone NestJS project — config (Zod-validated env), Prisma module, common (filters/interceptors/guards/pipes/decorators), Swagger, helmet, throttler, pino; Prisma schema for all entities + `init` migration + seed; own contracts (enums/zod/types). _Verified: typecheck + build + boot + e2e smoke against Docker Postgres._
- [x] **mobile/**: standalone Expo project — navigation (gated Auth↔Onboarding↔App), theme/design tokens, UI primitives, axios client (JWT + refresh) / TanStack Query / Zustand store, own contracts. _Verified: typecheck + `expo export` bundle._
- [ ] **admin/**: standalone Next.js project — Tailwind + ShadCN + layout, api/query setup, own contracts.
- [ ] Per-project CI lint/typecheck workflow.

## Phase 2 — Authentication 🚧 (backend ✅)
- [x] Backend `auth` module: signup/login, JWT access + rotating refresh sessions (Argon2), `/me`, session list/revoke, forgot/reset, OAuth via swappable `OAuthPort` (local adapter). _Verified e2e._
- [x] Mobile: Login (OAuth buttons stubbed), Signup, Forgot Password; token storage (SecureStore), auth store, route gating.
- [ ] Admin: admin login. _(Backend `/admin/auth/login` + admin-JWT done.)_

## Phase 3 — Onboarding 🚧 (backend ✅)
- [x] Backend `onboarding` endpoints (per-step persist + complete) + `users`/profile + `skills` + `files` (StoragePort local adapter, signed upload/confirm/download). _Verified e2e._
- [x] Mobile: 5-step wizard (Basic Info, Skills, Resume/Portfolio, Preferences, Availability) + Profile Created screen, resume upload via StoragePort flow.

## Phase 4 — Dashboard 🚧 (backend ✅)
- [x] Backend: `referrers` discovery (filters), top-matches + recommended; weighted matching algorithm (admin-tunable via PlatformSetting). _Verified e2e._
- [x] Mobile: Dashboard (top matches/recommended/recent chats), Search/Discovery (filters), Referrer Profile, bottom-tab shell with center FAB.

## Phase 5 — Referral System 🚧 (backend ✅)
- [x] Backend `referral` module: create, list (seeker/referrer), detail, status transitions (state machine) + history. _Verified e2e._
- [x] Mobile: Send Referral Request, My Requests (All/Pending/Accepted/Rejected tabs), Request Detail (status timeline + message).

## Phase 6 — Chat 🚧 (backend ✅)
- [x] Backend `chat` module + `RealtimePort` (local in-memory pub/sub + SSE stream, Socket.IO/Supabase-ready); conversations, cursor-paginated messages, read receipts, typing, presence. _Verified e2e._
- [x] Mobile: 1:1 chat with bubbles, read receipts, polling (Realtime stand-in); conversation list on dashboard. _(typing/presence/attachments pending real Realtime adapter)_

## Phase 7 — Notifications 🚧 (backend ✅)
- [x] Backend `notification` module + `PushPort` (local no-op adapter, FCM-ready), event fan-out on referral/chat actions, per-type prefs. _Verified e2e._
- [x] Mobile: Notification Center (All/Unread/Mentions tabs, Today/Yesterday/Earlier grouping, typed icons, mark read/all), unread badge on dashboard. _(deep linking pending)_

## Phase 8 — Admin Panel 🚧 (backend ✅)
- [x] Backend `admin` module: metrics, user/referrer/referral/job management, announcements, reports (growth/success/breakdown), settings — guarded by separate admin JWT principal. _Verified e2e._
- [ ] Admin web UI: Dashboard, User/Referrer/Referral/Job management, Communications, Reports, Settings, Admin Profile (TanStack Table, charts).

## Phase 9 — Testing 🚧 (backend ✅)
- [x] Backend: unit (matching algorithm, pagination, sort, Zod DTOs) + e2e (supertest) on auth/referral/chat — **45 tests** (24 unit + 21 e2e), all green against Docker Postgres.
- [x] Shared: Zod schema tests (auth/referral/onboarding DTOs).
- [x] Coverage gates + CI: `backend/.github/workflows/ci.yml` (lint · typecheck · build · unit-cov, plus a Postgres-backed e2e job); coverage thresholds on the pure logic.
- [ ] Mobile: component + hook tests (RNTL), critical-flow e2e. _(pending mobile app)_

## Phase 10 — Production Release ⬜
- Real adapters wired (Supabase, FCM, OAuth), secrets management.
- EAS build/submit (Android), backend container + managed Postgres, admin on Vercel.
- Observability (logs/metrics/Sentry), backups, rate-limit tuning, Play Store assets & privacy policy.

---
**Status:** Backend complete for Phases 1–9 (all feature modules + tests, verified against Docker Postgres). **Mobile app built for Phases 1–7** (16 screens, all feature modules; typechecks + bundles via `expo export`). Next: the **admin** (Next.js) panel, then mobile tests + Phase 10 (Release: Supabase/Cloudinary/FCM cloud adapters).
