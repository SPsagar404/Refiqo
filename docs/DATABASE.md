# Refiqo — Database Design

PostgreSQL via Prisma ORM. Source of truth: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) (standalone backend project).
UUID primary keys, `createdAt`/`updatedAt` on every table, soft-delete via `deletedAt` where relevant.

## Entity relationship overview

```
User 1───1 ReferrerProfile            (a user may also be a referrer)
User 1───* Experience
User 1───* Education
User 1───1 ReferralPreference
User 1───1 AvailabilitySetting
User 1───* Resume
User 1───* PortfolioLink
User *───* Skill              (via UserSkill)
User 1───* Device             (FCM tokens)
User 1───* Session            (refresh tokens)
User 1───* AuthProvider       (oauth identities)

User (seeker)   1───* ReferralRequest *───1 User (referrer)
ReferralRequest 1───1 Resume (attached)
ReferralRequest *───1 Job        (optional link)

Conversation *───* User (via ConversationParticipant)
Conversation 1───* Message
Message      1───* Attachment

User 1───* Notification
Company 1───* User / ReferrerProfile / Job
Location 1───* User / Job
AdminUser (separate principal for admin panel)
PlatformSetting (singleton key/value config, incl. match weights)
Announcement (admin broadcasts)
```

## Tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `User` | account + seeker/professional profile | email(unique), passwordHash, fullName, jobTitle, experienceYears, companyId, locationId, phone, linkedinUrl, portfolioUrl, about, avatarUrl, isVerified, onboardingStep, onboardingComplete, role, status |
| `AuthProvider` | OAuth identities | userId, provider(GOOGLE/LINKEDIN/GITHUB), providerUserId |
| `Session` | refresh-token sessions | userId, refreshTokenHash, userAgent, ip, expiresAt, revokedAt |
| `ReferrerProfile` | referrer-specific data | userId(unique), canRefer, verificationStatus, referralsGiven, responseRatePct, avgResponseHours, ratingAvg, ratingCount |
| `Skill` | global skill catalog | name(unique), slug, isPopular |
| `UserSkill` | user↔skill join | userId, skillId, proficiency? |
| `Experience` | work history | userId, companyId/companyName, title, startDate, endDate, current, description |
| `Education` | education history | userId, degree, fieldOfStudy, institution, graduationYear, currentlyPursuing |
| `Resume` | uploaded resumes | userId, fileKey, fileName, mimeType, sizeBytes, isPrimary |
| `PortfolioLink` | portfolio/featured projects | userId, type(WEBSITE/LINKEDIN/GITHUB/OTHER), url, description, title? |
| `ReferralPreference` | step-4 prefs | userId, categories[], roles[], preferredCompanies[], preferredLocations[] |
| `AvailabilitySetting` | step-5 prefs | userId, availabilityStatus, responseTime, contactMethods[] |
| `Company` | normalized companies | name(unique), logoUrl, domain |
| `Location` | normalized locations | city, country (unique pair) |
| `Job` | admin-managed jobs | title, companyId, locationId, type, description, applyUrl, status, postedByAdminId |
| `ReferralRequest` | seeker→referrer request | seekerId, referrerId, jobRole, jobLink, message, note, resumeId, status, rejectionReason, statusHistory(json) |
| `Conversation` | chat thread | createdById, lastMessageAt |
| `ConversationParticipant` | membership + read state | conversationId, userId, lastReadAt |
| `Message` | chat message | conversationId, senderId, body, type(TEXT/FILE/IMAGE), deliveredAt, readAt |
| `Attachment` | message file | messageId, fileKey, fileName, mimeType, sizeBytes |
| `Notification` | user notifications | userId, type, title, body, data(json), readAt |
| `Device` | push tokens | userId, fcmToken(unique), platform |
| `AdminUser` | admin principals | email(unique), passwordHash, name, role(ADMIN/SUPER_ADMIN), permissions[] |
| `PlatformSetting` | config (incl. match weights) | key(unique), value(json) |
| `Announcement` | broadcasts | title, body, audience, createdByAdminId, sentAt |

## Enums
`UserRole` (USER, REFERRER, ADMIN, SUPER_ADMIN) · `UserStatus` (ACTIVE, DISABLED, SUSPENDED) ·
`OAuthProvider` (GOOGLE, LINKEDIN, GITHUB) · `VerificationStatus` (UNVERIFIED, PENDING, VERIFIED) ·
`ReferralStatus` (PENDING, UNDER_REVIEW, ACCEPTED, REJECTED) · `ReferralCategory` (FULL_TIME, INTERNSHIP, CONTRACT, PART_TIME, FREELANCE, OTHER) ·
`AvailabilityStatus` (AVAILABLE_NOW, AVAILABLE_1_2_WEEKS, LIMITED, NOT_AVAILABLE) ·
`ResponseTime` (WITHIN_24H, WITHIN_2_3_DAYS, WITHIN_A_WEEK, MORE_THAN_A_WEEK) ·
`ContactMethod` (IN_APP_CHAT, EMAIL, LINKEDIN, PHONE_CALL, VIDEO_CALL) ·
`MessageType` (TEXT, FILE, IMAGE) · `PortfolioType` (WEBSITE, LINKEDIN, GITHUB, OTHER) ·
`NotificationType` (REFERRAL_ACCEPTED, REFERRAL_REJECTED, NEW_MESSAGE, REFERRAL_REQUEST_RECEIVED, REFERRAL_UNDER_REVIEW, REMINDER, MILESTONE, WELCOME) ·
`JobStatus` (DRAFT, OPEN, CLOSED) · `WorkMode` (ONSITE, REMOTE, HYBRID).

## Indexing & integrity
- Unique: `User.email`, `Skill.name`, `(Location.city, Location.country)`, `Device.fcmToken`, `(AuthProvider.provider, providerUserId)`.
- Composite indexes: `ReferralRequest(referrerId, status)`, `ReferralRequest(seekerId, status)`, `Message(conversationId, createdAt)`, `Notification(userId, readAt)`, `UserSkill(skillId)`.
- FK on delete: cascade for owned children (skills, experiences, messages); restrict for referenced lookups (company/location).
- Seed: skill catalog, popular roles, sample companies/locations, demo users + referrers, one super-admin.
