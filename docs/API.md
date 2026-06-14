# Refiqo — REST API Contract

Base URL: `/api/v1`. Auth: `Authorization: Bearer <accessToken>`. Interactive docs: `GET /docs` (Swagger).

## Conventions
- **Success**: `200/201` → `{ "data": <payload>, "meta": { ...pagination? } }`
- **Error**: `{ "statusCode": 400, "error": "Bad Request", "message": "...", "code": "VALIDATION_ERROR", "details": [...] }`
- **Pagination** (list endpoints): query `?page=1&limit=20&sort=-createdAt&search=...&<filters>` → `meta: { page, limit, total, totalPages }`.
- All bodies validated by Zod DTOs (shared with the client).

## Auth — `/auth`
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `{ fullName, email, password }` | creates user, returns tokens |
| POST | `/auth/login` | `{ email, password }` | returns `{ user, accessToken, refreshToken }` |
| POST | `/auth/oauth/:provider` | `{ idToken }` | provider ∈ google\|linkedin\|github |
| POST | `/auth/refresh` | `{ refreshToken }` | rotates refresh token |
| POST | `/auth/logout` | `{ refreshToken }` | revokes session |
| POST | `/auth/forgot-password` | `{ email }` | sends reset link/code |
| POST | `/auth/reset-password` | `{ token, password }` | sets new password |
| GET | `/auth/me` | — | current user + onboarding state |
| GET | `/auth/sessions` | — | active sessions |
| DELETE | `/auth/sessions/:id` | — | revoke a session |

## Onboarding — `/onboarding`
| Method | Path | Body |
| --- | --- | --- |
| GET | `/onboarding` | current draft + step |
| PATCH | `/onboarding/basic-info` | step-1 fields |
| PATCH | `/onboarding/skills` | `{ skillIds[], customSkills[] }` |
| PATCH | `/onboarding/resume-portfolio` | `{ resumeId, portfolioLinks[] }` |
| PATCH | `/onboarding/preferences` | `{ categories[], roles[], preferredCompanies[], preferredLocations[] }` |
| PATCH | `/onboarding/availability` | `{ availabilityStatus, responseTime, contactMethods[] }` |
| POST | `/onboarding/complete` | — → marks complete, returns profile summary |

## Users / Profile — `/users`
| GET | `/users/me` | full profile |
| PATCH | `/users/me` | update personal info |
| PUT | `/users/me/experience` · `/education` · `/skills` | replace collections |
| GET/PATCH | `/users/me/notification-preferences` | settings |
| GET/PATCH | `/users/me/privacy` | privacy settings |
| POST | `/users/me/devices` | register FCM token |

## Skills — `/skills`
| GET | `/skills?search=&popular=true` | catalog/autocomplete |
| POST | `/skills` | create custom skill (dedup by slug) |

## Resume & Files — `/files`
| POST | `/files/upload-url` | `{ kind, fileName, mimeType, sizeBytes }` → signed upload URL + fileKey |
| POST | `/files/confirm` | `{ fileKey }` → persists Resume/Attachment row |
| GET | `/files/:id/download-url` | signed download URL (authz checked) |

## Referrers — `/referrers`
| GET | `/referrers` | discovery: `?search=&company=&location=&minExp=&skills=&availability=&page=` |
| GET | `/referrers/top-matches` | personalized matches (dashboard) |
| GET | `/referrers/recommended` | recommended list |
| GET | `/referrers/:id` | full referrer profile |

## Referral Requests — `/referrals`
| POST | `/referrals` | `{ referrerId, jobRole, jobLink?, message, note?, resumeId }` |
| GET | `/referrals?role=seeker\|referrer&status=&page=` | my requests / incoming |
| GET | `/referrals/:id` | detail + status history |
| PATCH | `/referrals/:id/status` | referrer/admin: `{ status, rejectionReason? }` |

## Chat — `/conversations`
| GET | `/conversations` | thread list (last message, unread count) |
| POST | `/conversations` | `{ participantId }` (idempotent get-or-create) |
| GET | `/conversations/:id/messages?cursor=` | paginated history |
| POST | `/conversations/:id/messages` | `{ body?, type, attachment? }` |
| POST | `/conversations/:id/read` | mark read |
| GET | `/conversations/realtime-token` | token/credentials for RealtimePort |

Realtime events (via RealtimePort): `message.created`, `message.read`, `typing`, `presence`.

## Notifications — `/notifications`
| GET | `/notifications?filter=all\|unread\|mentions&page=` | list grouped by day on client |
| GET | `/notifications/unread-count` | badge |
| POST | `/notifications/:id/read` · `/notifications/read-all` | mark read |
| GET/PATCH | `/notifications/preferences` | per-type toggles |

## Admin — `/admin` (role: ADMIN/SUPER_ADMIN)
| POST | `/admin/auth/login` | admin login |
| GET | `/admin/metrics` | dashboard metrics |
| GET | `/admin/users` · PATCH `/admin/users/:id/status` | manage users |
| GET | `/admin/referrers` · PATCH `/admin/referrers/:id/verification` | verify/suspend |
| GET | `/admin/referrals` · PATCH `/admin/referrals/:id/status` | manage requests |
| GET/POST/PATCH/DELETE | `/admin/jobs` | job CRUD |
| GET/POST | `/admin/announcements` | broadcasts |
| GET | `/admin/reports/*` | growth/success analytics |
| GET/PATCH | `/admin/settings` | platform config (incl. match weights) |

## Security
- Rate limit: 10 req/10s default; tighter on auth endpoints.
- RBAC via `@Roles()` + `RolesGuard`; `@Public()` opts out of `JwtAuthGuard`.
- File uploads: type/size validation, signed URLs, ownership checks on download.
- All inputs sanitized; no raw SQL (Prisma parameterized queries only).
