# Refiqo — Mobile (Expo)

Standalone Expo React Native app (Android-first, iOS-ready) consuming the backend API.

## Stack

Expo SDK 51 · React Navigation · TanStack Query · Zustand · React Hook Form + Zod ·
Axios · expo-secure-store. Dark theme design system in `src/theme`.

## Setup

```bash
npm install
npm run start          # Expo dev server — press "a" for Android
npm run typecheck      # tsc --noEmit
```

### Point the app at the backend

The API base URL is `app.json` → `expo.extra.apiBaseUrl` (default `http://localhost:4000/api/v1`).

- **Android emulator:** use `http://10.0.2.2:4000/api/v1` (emulator alias for the host).
- **Physical device (Expo Go):** use your machine's LAN IP, e.g. `http://192.168.1.x:4000/api/v1`.

Start the backend first (`cd ../backend && npm run start:dev`) and sign in with a seeded
account (`seeker@refiqo.com` / `Password@123`).

## Architecture

Feature-based (`src/features/<feature>`), each with its own screens + `*Api.ts`.

```
src/
├── app / navigation/   RootNavigator gates Auth ↔ Onboarding ↔ App (tabs + stack)
├── features/           auth · onboarding · dashboard · discovery · referrers ·
│                       referrals · chat · notifications · profile
├── components/ui/      design-system primitives (Button, Input, Card, Chip, …)
├── lib/                apiClient (JWT + refresh), queryClient, storage, files, format
├── stores/             authStore (Zustand, SecureStore-backed)
├── theme/              design tokens
└── types/              enums · models · zod schemas (mirrored from docs/API.md)
```

- **Auth:** backend JWT today (access + rotating refresh; auto-refresh on 401). Supabase
  Auth is the production target — swap the `lib/apiClient` + `stores/authStore` layer.
- **Realtime chat:** the chat screen polls every 4s as a local stand-in for Supabase Realtime.
- **Files:** uploads go through the backend `/files` signed-URL flow (Cloudinary/Supabase in prod).

## Screens

Login · Signup · Forgot Password · Onboarding (5 steps + Profile Created) · Dashboard ·
Discovery · Referrer Profile · Send Referral · My Requests · Request Detail · Chat ·
Notifications · Profile.
