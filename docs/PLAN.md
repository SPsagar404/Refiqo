# Refiqo — Implementation Plan

This document is the product requirements source, derived directly from the design screens in `/screens`.
It enumerates every screen, its components, fields, actions, validation, and status flows.

> **Brand note:** mockups read "ReferGo"; per stakeholder decision the product/codebase brand is **Refiqo**.

---

## 1. Navigation map (from `App flow.png`)

```
Login / Signup
   └─> Onboarding (5 steps, linear with stepper)
         Step 1  Basic Information
         Step 2  Skills & Expertise
         Step 3  Resume & Portfolio
         Step 4  Referral Preferences
         Step 5  Referral Availability
   └─> Profile Created Successfully
         └─> Dashboard (Home)

Bottom tabs:  Home · Search · [ + FAB ] · Requests · Profile

Home (Dashboard)
   ├─> Referrer Profile ──> Send Referral Request ──> (My Requests)
   ├─> Chat list / Recent Chats ──> Chat (1:1)
   └─> Notifications

Search (Referrer Discovery) ──> Referrer Profile ──> Send Referral Request
Requests (My Requests)      ──> Request Detail
Profile (My Profile)        ──> edit sub-screens, settings, sign out
+ FAB                       ──> quick action: new referral request
```

The mobile app has **two top-level stacks**: `AuthStack` (login + onboarding) and `AppStack` (tabs + detail screens), gated by auth + onboarding-complete state.

---

## 2. Screen specifications

### 2.1 Login (`login.png`)
- **Header art**: logo "Refiqo", tagline "Get the right referral. Faster." + sub copy.
- **OAuth buttons**: Continue with Google · LinkedIn · GitHub.
- **Divider**: "OR".
- **Form**: Email address, Password (show/hide toggle).
- **Links**: Forgot password? · "Don't have an account? Sign up".
- **Primary action**: Sign In.
- **Validation**: email format; password min 8.
- **States**: idle, submitting (button loader), error (invalid credentials banner).

### 2.2 Onboarding — Step 1 Basic Information (`Basic Information.png`)
Stepper: `Basic Info · Skills · Resume · Preferences · Availability` (step 1 active).
- **Personal Details**: Full Name*, Current Job Title*, Total Experience* (dropdown), Current Company, Location* (city, country).
- **Contact & Links**: Email Address*, Phone Number* (country code + number), LinkedIn Profile, Portfolio/Website (optional).
- **Education**: Highest Degree (dropdown), Field of Study, University/College, Graduation Year (dropdown), "Currently Pursuing Higher Education" (checkbox).
- **About You**: About Me (textarea), What are you looking for?, Preferred Work Mode (dropdown: On-site/Remote/Hybrid), Willing to Relocate (toggle).
- **Action**: Continue to Next Step.
- **Validation**: required fields marked *; email format; phone digits; LinkedIn/portfolio URL format; about max 500.

### 2.3 Onboarding — Step 2 Skills & Expertise (`skills and experties.png`)
- **Skill search** input ("Search skills e.g. Java, Python, AWS").
- **Popular Skills** chips (toggle to add): Java, Spring Boot, Microservices, JavaScript, AWS, MySQL, React.js, Node.js, Python, Docker, MongoDB …
- **Search Results** list (add custom skill if no match).
- **Your Selected Skills**: removable tags; empty state "No skills added yet".
- **Action**: Continue to Next Step.
- **Validation**: at least 1 skill (recommend ≥3).

### 2.4 Onboarding — Step 3 Resume & Portfolio (`resume and portfolio.png`)
- **Upload Your Resume**: drag/drop or browse. Formats PDF/DOC/DOCX, max 5MB. Uploaded card shows filename, size, success tick, remove. Resume Tips list.
- **Add Portfolio (optional)**: Type tabs (Website · LinkedIn · GitHub · Other Link), Portfolio URL, Portfolio Description, Featured Projects (Add Project — title/url/description repeater).
- **Review Your Information**: summary of resume + portfolio with Change/Edit.
- **Action**: Continue.
- **Validation**: file type + size; URL formats.

### 2.5 Onboarding — Step 4 Referral Preferences (`Referral preferences.png`)
- **Referral Categories** (multi-select chips): Full-time Jobs, Internships, Contract Roles, Part-time Jobs, Freelance Projects, Other Opportunities.
- **Preferred Roles**: add input + Suggested Roles chips (Backend/Frontend/Full Stack Developer, Data Analyst, DevOps Engineer, UI/UX Designer, Data Scientist…). Selected roles list (clearable).
- **Preferred Locations** (optional, add tags) and **Preferred Companies** (optional, add tags).
- **Action**: Continue to Next Step.
- **Validation**: ≥1 category; ≥1 role.

### 2.6 Onboarding — Step 5 Referral Availability (`Referral availability.png`)
- **Availability Status** (single select): Available Now · Available in 1–2 Weeks · Limited Availability · Not Available Right Now.
- **Response Time** (single select): Within 24 Hours · Within 2–3 Days · Within a Week · More than a Week.
- **Preferred Contact Method** (multi-select): In-App Chat · Email · LinkedIn · Phone Call · Video Call.
- **Availability Summary** (read-back).
- **Action**: Complete Profile.

### 2.7 Profile Created Successfully (`profile created.png`)
- Success check + "Profile Created Successfully".
- **Profile Completion Status**: Status=Complete, Visibility=Active, Verification=Verified.
- **What next**: Explore Referrers · Send Referral Requests · Chat & Build Connections.
- **Profile Summary**, **Security & Privacy**, **Recommended Actions**.
- **Actions**: Go To Dashboard · Explore Referrers.

### 2.8 Dashboard / Home (`dashboard.png`)
- Greeting "Hi {firstName} 👋" + subtitle; notification bell with unread badge.
- **Search bar**: roles, skills or companies.
- **Top Matches For You**: horizontal carousel of match cards (match % badge, company logos, role title, skill tags, referrer mini-card, Request Referral). "See all".
- **Recommended Referrers**: cards (avatar, name, title, Can Refer/Pending status, chat icon). "View all".
- **Recent Chats**: avatar, name, last message preview, time. "View all".
- **Bottom nav**: Home · Search · [+ FAB] · Requests · Profile.
- **Matching algorithm inputs**: skills overlap, experience band, preferred companies, preferred locations, referral preferences. (See ARCHITECTURE §matching.)

### 2.9 Referrer Discovery / Search
- Search input + Filters: Company, Location, Experience, Skills, Availability.
- Result list of referrer cards → Referrer Profile.
- Pagination (infinite scroll), empty/loading/error states.

### 2.10 Referrer Profile (`referer profile.png`)
- Back, share, overflow menu.
- Avatar + online dot, Name, **Can Refer** badge, title, company (+logo), location, "Responds in ~Nhrs".
- **Stat row**: Yrs Exp · Employer · Referrals Given · Response Rate · Avg Response · Rating.
- **Skills** tags (View all). **About**. **Experience** (logo, role, dates). **Education**. **Identity Verified** (email verified, company verified).
- **Action**: Request Referral.

### 2.11 Send Referral Request (`send referal request.png`)
- Referrer summary card.
- **Job Role*** (dropdown), **Job Link** (optional, URL), **Message*** (textarea, 500 max, prefilled template, char counter), **Attach Resume*** (file card w/ remove), **Add a Note** (optional, 200 max).
- Tips to increase chances.
- **Action**: Send Referral Request.
- **Validation**: role required; message required; resume required; URL format.

### 2.12 My Requests (`my requests.png`)
- Tabs: **All · Pending · Accepted · Rejected**. Count "Requests (N)". Sort "Most Recent". Filter icon.
- Cards: avatar, name, title, company, location, exp, **status badge**, role, time ago. Rejected shows **Reason**.
- Tap → Request Detail (timeline + chat link).

### 2.13 Chat (`chat.png`)
- Header: back, avatar, name, **Online** status, call/video/overflow.
- Sub-header: role, company · location, Can Refer badge.
- Date separators. Bubbles: sent (right, accent) / received (left). Timestamps. **Read receipts** (✓ sent, ✓✓ delivered/read). File attachment bubble (name, size). Emoji support.
- **Typing indicator**, **online status** (realtime).
- Input: attach (+), text, emoji, send.

### 2.14 Notifications (`notification.png`)
- Header + settings. Tabs: **All · Unread · Mentions**.
- Grouped: Today / Yesterday / Earlier.
- Item: typed colored icon, bold actor + text, time ago, unread dot.
- **Types**: referral accepted, referral rejected, new message, referral request received, request under review, reminder (pending requests), milestone/congrats, welcome.
- **Deep linking** to the related entity. Mark read/unread.

### 2.15 My Profile (`my profile.png`)
- Settings icon. Avatar, Name, **Verified** badge, email, phone, bio, location.
- Stat row (as referrer profile).
- Menu: Personal Information · Experience & Education · Skills · Resume · Notification Preferences · Privacy & Security · Help & Support · About Refiqo.
- **Sign Out** (destructive).

### 2.16 Admin Panel (`admin panel.png`)
Sidebar navigation; modules:
- **Dashboard**: user metrics, referral metrics, charts.
- **User Management**: table (search, filter, disable user).
- **Referrer Management**: table, verify/suspend referrer.
- **Referral Management**: requests table, update status.
- **Job Management**: CRUD jobs.
- **Communications**: announcements, broadcast messages.
- **Reports & Analytics**: user growth, referral growth, success rate, donut breakdowns.
- **Platform Settings**: configuration management.
- **Admin Profile**: permissions, security settings.

---

## 3. Cross-cutting requirements
- **Auth**: email signup/login, Google/LinkedIn/GitHub OAuth, JWT access + refresh, forgot/reset password, secure logout, session list.
- **Validation**: Zod schemas mirrored across projects (RHF on the clients, DTOs on the server), kept in sync with `API.md`. Each standalone project defines its own copy — no shared package.
- **State**: Zustand for client/UI/session; TanStack Query for server cache.
- **Files**: resume + images via Supabase Storage adapter (local mock in dev).
- **Realtime**: Supabase Realtime adapter for chat/presence/typing (Socket.IO-ready interface).
- **Push**: FCM adapter for notifications.
- **Security**: bcrypt/argon2 hashing, helmet, rate limiting, input sanitization, RBAC, signed upload URLs.

## 4. Build sequence
See [`ROADMAP.md`](ROADMAP.md). Foundation → Auth → Onboarding → Dashboard → Referral System → Chat → Notifications → Admin → Testing → Release.
