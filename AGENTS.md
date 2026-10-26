<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Hostel Meal Management System — Agent Guidelines

> **IMPORTANT:** This document is the single source of truth for all AI agents working on this project. Read it in full before writing any code. The project is a **fully implemented, production-grade full-stack application**. Do NOT stub, scaffold, or restart anything that already exists — build only what is explicitly missing.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Versions](#2-tech-stack--versions)
3. [Folder Structure](#3-folder-structure)
4. [Business Rules & Permissions](#4-business-rules--permissions)
5. [Backend: meal-server/](#5-backend-meal-server)
   - [Database Models](#51-database-models)
   - [API Endpoints Reference](#52-api-endpoints-reference)
   - [Running the Backend](#53-running-the-backend)
6. [Frontend: meal-client/](#6-frontend-meal-client)
   - [Context Providers](#61-context-providers)
   - [Pages & Routes](#62-pages--routes)
   - [Components](#63-components)
   - [API Client](#64-api-client-srclibapits)
   - [Running the Frontend](#65-running-the-frontend)
7. [Environment Variables](#7-environment-variables)
8. [Critical Known Issues & Constraints](#8-critical-known-issues--constraints)
9. [Seeding the Database](#9-seeding-the-database)
10. [Full Local Development Setup](#10-full-local-development-setup)
11. [Localization & Styling Rules](#11-localization--styling-rules)
12. [Future Tasks & Open Issues](#12-future-tasks--open-issues)

---

## 1. Project Overview

A role-based **Hostel Meal Management System** with three distinct user roles: **Student**, **Admin (Warden)**, and **Chef (Mess Manager)**.

- Students choose their weekly lunch preferences (Friday-only window).
- Admin controls the global meal lock, manages student accounts, applies punishments/blocks, and can manually override any meal selection.
- Chef marks daily attendance (breakfast/lunch/dinner). Lunch lists are **strictly pre-selection-gated**; breakfast and dinner show all students.
- An absence-based **Red-Flag** penalty system auto-flags students who miss a pre-selected lunch.

---

## 2. Tech Stack & Versions

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.4.3 |
| Frontend | React | 19.3.0 |
| Frontend | TypeScript | ^5 |
| Frontend | Tailwind CSS | ^4 |
| Frontend | DaisyUI | 5.7.50 |
| Frontend | lucide-react | ^1.61.0 |
| Frontend | better-auth | ^1.7.13 |
| Backend | Express.js | ^5.3.0 |
| Backend | Mongoose | ^9.11.4 |
| Database | MongoDB Atlas | — |
| Runtime | Node.js | (LTS) |

---

## 3. Folder Structure

```
weekly-meal/
├── AGENTS.md                   ← This file
├── meal-client/                ← Next.js 16 frontend
│   ├── .env
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          ← Root layout with <Providers>, <Navbar>, <Footer>
│       │   ├── page.tsx            ← Landing page
│       │   ├── globals.css         ← Tailwind + DaisyUI CSS imports
│       │   ├── providers.tsx       ← Theme > Language > MealApp providers
│       │   ├── api/
│       │   │   └── auth/
│       │   │       └── [...all]/
│       │   │           └── route.ts   ← Better Auth route handler
│       │   ├── login/
│       │   │   └── page.tsx        ← Role-selector login (Student / Admin / Chef tabs)
│       │   └── dashboard/
│       │       ├── admin/
│       │       │   └── page.tsx
│       │       ├── chef/
│       │       │   └── page.tsx
│       │       └── student/
│       │           └── page.tsx
│       ├── components/
│       │   ├── Navbar.tsx          ← Sticky navbar, role-isolated nav links, theme + lang toggles
│       │   └── Footer.tsx
│       ├── context/
│       │   ├── ThemeContext.tsx    ← light/dark toggle, persisted in localStorage, sets data-theme on <html>
│       │   ├── LanguageContext.tsx ← en/ar toggle, sets dir="rtl" on <html>, translation dictionary
│       │   └── MealAppContext.tsx  ← Role state, API calls, optimistic updates, mock fallback data
│       └── lib/
│           ├── api.ts              ← Centralized typed API client
│           ├── auth.ts             ← Better Auth server config
│           └── auth-client.ts      ← Better Auth client config
└── meal-server/                ← Express.js backend
    ├── .env
    ├── .gitignore
    ├── index.js                ← Entry point; mounts all routes
    ├── seed.js                 ← One-time MongoDB data seeder
    ├── package.json
    ├── config/
    │   └── db.js               ← Mongoose connectDB() helper
    ├── models/
    │   ├── User.js
    │   ├── MealSelection.js
    │   ├── Attendance.js
    │   └── SystemConfig.js
    ├── controllers/
    │   ├── studentController.js
    │   ├── adminController.js
    │   └── chefController.js
    └── routes/
        ├── mealRoutes.js       ← /api/meals/*
        ├── adminRoutes.js      ← /api/admin/*
        └── chefRoutes.js       ← /api/chef/*
```

---

## 4. Business Rules & Permissions

### Student
- Can view the weekly meal schedule (Saturday through Friday).
- **Breakfast** and **Dinner** are auto-selected and fixed every day — no toggles shown.
- **Lunch selection is ONLY allowed on Fridays** (day `getDay() === 5`). On all other days, all lunch checkboxes are visually disabled and non-interactive.
- A `simulateFriday: true` flag in `POST /api/meals/select` body bypasses the Friday restriction in development mode (`NODE_ENV=development`). The Student Dashboard exposes a dev-mode toggle for this.
- Cannot modify meals once:
  - The Admin has activated the **Global Lock**, or
  - The student is individually **Blocked** by the Admin.
- The student sees real-time warning banners when:
  - They are blocked (`isBlocked: true`) — shows penalty reason.
  - They are red-flagged (`isRedFlagged: true`) — shows absence warning.
  - The global lock is active (`isGlobalLocked: true`).

### Admin (Warden)
- Can create `student` and `chef` accounts.
- Can view all users with role filtering.
- Can **toggle the global lock** (freeze/unfreeze all meal selections for everyone).
- Can **block or unblock** any individual student's meal privileges with an optional penalty reason.
- Can **override any student's lunch selection** for any day — even when the global lock is active.

### Chef (Mess Manager)
- Views a **daily attendance interface** restricted to today's date.
- **Breakfast tab**: Shows ALL registered students (all are eligible).
- **Dinner tab**: Shows ALL registered students (all are eligible).
- **Lunch tab**: Shows **ONLY** students whose `MealSelection.lunchSelections[today] === true`. Students who did NOT pre-select lunch for that specific day are **completely hidden** from the list.
- Can mark each student as `present` or `absent` for each meal session.
- **Red-Flag Logic**:
  - If a student is marked `absent` for **lunch**, their `isRedFlagged` is set to `true`.
  - If a student is marked `present` for **any meal**, their `isRedFlagged` is cleared to `false`.
  - Red-flagged students display a red visual alert badge.

### Week Boundary
- A "week" starts on **Saturday** and ends on **Friday**.
- `weekStartDate` is always the ISO date string (YYYY-MM-DD) of the nearest past Saturday.
- `getCurrentWeekStartDate()` in `studentController.js` computes this from any target date.

---

## 5. Backend: `meal-server/`

The backend is **fully implemented and verified**. The server uses Express 5 (ESM modules), Mongoose 9, and MongoDB Atlas.

### 5.1 Database Models

#### `User` (`models/User.js`)
| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trimmed |
| `email` | String | required, unique, lowercase |
| `role` | `'student' \| 'admin' \| 'chef'` | required, default `'student'` |
| `room` | String | optional, for students |
| `isBlocked` | Boolean | default `false` |
| `isRedFlagged` | Boolean | default `false` |
| `penaltyReason` | String | populated when `isBlocked = true` |
| `createdAt / updatedAt` | Date | auto via `timestamps: true` |

#### `MealSelection` (`models/MealSelection.js`)
| Field | Type | Notes |
|---|---|---|
| `studentId` | ObjectId ref `User` | required |
| `weekStartDate` | String `YYYY-MM-DD` | required, Saturday of the week |
| `lunchSelections` | Object | keys: `sat, sun, mon, tue, wed, thu, fri` — Boolean each |
| `isLocked` | Boolean | default `false` |
| `createdAt` | Date | TTL index: 365 days |

Unique compound index: `{ studentId, weekStartDate }`.

#### `Attendance` (`models/Attendance.js`)
| Field | Type | Notes |
|---|---|---|
| `studentId` | ObjectId ref `User` | required |
| `date` | String `YYYY-MM-DD` | required |
| `mealType` | `'breakfast' \| 'lunch' \| 'dinner'` | required |
| `status` | `'present' \| 'absent'` | required |
| `createdAt` | Date | TTL index: 365 days |

Unique compound index: `{ studentId, date, mealType }`.

#### `SystemConfig` (`models/SystemConfig.js`)
| Field | Type | Notes |
|---|---|---|
| `key` | String | always `"global_settings"` |
| `isGlobalLocked` | Boolean | default `false` |

---

### 5.2 API Endpoints Reference

**Base URL:** `http://localhost:5000`

#### Health Check
```
GET /
Response: { status: "online", service: "...", version: "1.0.0", endpoints: {...} }
```

---

#### Student Routes — `/api/meals`

**`GET /api/meals/my-selection`**

Fetch the current student's weekly meal selection + global lock state.

| Query Param | Type | Required | Notes |
|---|---|---|---|
| `studentId` | string (ObjectId) | Yes* | Can also be sent as `x-user-id` header |
| `weekStartDate` | string `YYYY-MM-DD` | No | Defaults to current week's Saturday |

Success Response `200`:
```json
{
  "success": true,
  "student": {
    "id": "...",
    "name": "Ahmed Al-Mansoor",
    "email": "ahmed@hostel.edu",
    "room": "A-204",
    "isBlocked": false,
    "isRedFlagged": false,
    "penaltyReason": null
  },
  "isGlobalLocked": false,
  "isFriday": false,
  "selection": {
    "studentId": "...",
    "weekStartDate": "2025-10-25",
    "lunchSelections": { "sat": true, "sun": true, "mon": true, "tue": true, "wed": true, "thu": true, "fri": false },
    "isLocked": false
  },
  "fixedMeals": {
    "breakfast": { "fixed": true, "note": "Standard continental breakfast included daily" },
    "dinner": { "fixed": true, "note": "Standard hot dinner meal included daily" }
  }
}
```

---

**`POST /api/meals/select`**

Save/update the student's weekly lunch selections.

Request Body:
```json
{
  "studentId": "...",
  "weekStartDate": "2025-10-25",
  "lunchSelections": { "sat": true, "sun": false, "mon": true, "tue": true, "wed": false, "thu": true, "fri": false },
  "simulateFriday": true
}
```

- Validates the user is not blocked.
- Validates the global lock is not active.
- Validates it is Friday (or `simulateFriday: true` in `NODE_ENV=development`).

Error codes: `400` (not Friday / missing fields), `403` (blocked or globally locked), `404` (student not found), `500`.

---

#### Admin Routes — `/api/admin`

**`POST /api/admin/toggle-global-lock`**

Toggle or explicitly set the global meal selection lock.

Request Body (all optional):
```json
{ "isLocked": true }
```
If `isLocked` is omitted, the lock is toggled. If `isLocked` is `true`/`false`, it is set explicitly.

Success Response `200`:
```json
{
  "success": true,
  "isGlobalLocked": true,
  "message": "Global selection lock is now ACTIVATED (Locked)."
}
```

---

**`POST /api/admin/toggle-block`**

Block or unblock a specific student's meal privileges.

Request Body:
```json
{
  "studentId": "...",
  "isBlocked": true,
  "reason": "Disciplinary notice — noise violation"
}
```
- `isBlocked`: Optional boolean. If omitted, the current value is toggled.
- `reason`: Optional string. Applied as `penaltyReason` when blocking. Cleared when unblocking.

Success Response `200`:
```json
{
  "success": true,
  "message": "Student meal privileges BLOCKED.",
  "student": { "id": "...", "name": "...", "isBlocked": true, "penaltyReason": "..." }
}
```

---

**`POST /api/admin/override-meal`**

Manually override a student's lunch selection for any day (bypasses all locks).

Request Body (two modes):

*Mode 1 — single day override:*
```json
{
  "studentId": "...",
  "weekStartDate": "2025-10-25",
  "day": "mon",
  "selected": false
}
```
*Mode 2 — full week override:*
```json
{
  "studentId": "...",
  "weekStartDate": "2025-10-25",
  "lunchSelections": { "sat": true, "sun": true, "mon": false, "tue": true, "wed": true, "thu": false, "fri": false }
}
```

---

**`GET /api/admin/users`**

Fetch all users, optionally filtered by role.

| Query Param | Type | Notes |
|---|---|---|
| `role` | `'student' \| 'admin' \| 'chef'` | Optional filter |

Success Response `200`:
```json
{
  "success": true,
  "count": 4,
  "users": [ { "_id": "...", "name": "...", "email": "...", "role": "...", "isBlocked": false, ... } ]
}
```

---

**`POST /api/admin/users`**

Create a new student or chef account.

Request Body:
```json
{
  "name": "New Student",
  "email": "newstudent@hostel.edu",
  "role": "student",
  "room": "D-405"
}
```
- `name` and `email` are required.
- `role` defaults to `"student"` if omitted.
- Returns `400` if the email already exists.

---

#### Chef Routes — `/api/chef`

**`GET /api/chef/today-list`**

Fetch the attendance list for today's meal session.

| Query Param | Type | Notes |
|---|---|---|
| `mealType` | `'breakfast' \| 'lunch' \| 'dinner'` | Defaults to `'lunch'` |
| `date` | string `YYYY-MM-DD` | Defaults to today |
| `day` | `'sat' \| 'sun' \| 'mon' \| 'tue' \| 'wed' \| 'thu' \| 'fri'` | Defaults to today's day key |

- For `breakfast`/`dinner`: returns ALL students.
- For `lunch`: returns ONLY students with `lunchSelections[day] === true`.

Student record in response:
```json
{
  "id": "...",
  "name": "Ahmed Al-Mansoor",
  "room": "A-204",
  "email": "ahmed@hostel.edu",
  "isBlocked": false,
  "isRedFlagged": false,
  "mealType": "lunch",
  "preSelected": true,
  "attendanceStatus": "unmarked"
}
```
`attendanceStatus` is `"present"`, `"absent"`, or `"unmarked"`.

---

**`POST /api/chef/check-in`**

Record or update a student's meal attendance.

Request Body:
```json
{
  "studentId": "...",
  "date": "2025-10-27",
  "mealType": "lunch",
  "status": "absent"
}
```
- `date` defaults to today if omitted.
- `studentId`, `mealType`, and `status` are required.
- **Red-Flag Logic** (lunch only):
  - `status: "absent"` → `student.isRedFlagged = true`
  - `status: "present"` → `student.isRedFlagged = false`
- For non-lunch meals: if `status: "present"` and student is red-flagged, the flag is cleared.

---

### 5.3 Running the Backend

```powershell
cd meal-server
npm run dev        # node --watch index.js (auto-restarts on file changes)
# or
npm start          # node index.js (production)
```

Server starts on port `5000` by default (configurable via `PORT` env var).

---

## 6. Frontend: `meal-client/`

The frontend is **fully implemented and build-verified**. All pages have complete logic — no stubs.

### 6.1 Context Providers

All providers are mounted in `src/app/providers.tsx` in this order:
```
ThemeProvider > LanguageProvider > MealAppProvider
```

| Context | File | Purpose |
|---|---|---|
| `ThemeContext` | `src/context/ThemeContext.tsx` | light/dark toggle, persists to `localStorage`, sets `data-theme` attribute on `<html>` |
| `LanguageContext` | `src/context/LanguageContext.tsx` | English/Arabic toggle, sets `dir="rtl"` on `<html>` when Arabic is active; full translation dictionary |
| `MealAppContext` | `src/context/MealAppContext.tsx` | Role state, all API calls with optimistic updates, rich local mock data fallback when backend is offline, `backendOnline` status indicator |

`MealAppContext` contains `PREDEFINED_ACCOUNTS` — placeholder ObjectId strings for Student, Admin, and Chef roles used during local development. **After seeding MongoDB, replace these with the actual `_id` values returned by the seed script.**

### 6.2 Pages & Routes

| Route | File | Role | Description |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Public | Landing page with feature cards and backend status pills |
| `/login` | `src/app/login/page.tsx` | Public | Role-selector tabs (Student / Admin / Chef) → redirects to role dashboard |
| `/dashboard/student` | `src/app/dashboard/student/page.tsx` | Student | 7-day meal grid, Friday-only checkbox enforcement, warning banners (blocked/red-flag/global lock), simulate-Friday dev toggle |
| `/dashboard/admin` | `src/app/dashboard/admin/page.tsx` | Admin | Global lock toggle, student roster with block/unblock modals, penalty note inputs, manual meal overrides, user creation form, metrics cards |
| `/dashboard/chef` | `src/app/dashboard/chef/page.tsx` | Chef | Breakfast/Lunch/Dinner tabs, strict lunch pre-selection filter, mark present/absent, red-flag badge indicators, stats cards |

### 6.3 Components

| Component | File | Notes |
|---|---|---|
| `Navbar` | `src/components/Navbar.tsx` | Sticky, role-isolated navigation links; language toggle; theme toggle; sign-out |
| `Footer` | `src/components/Footer.tsx` | Static footer |

### 6.4 API Client (`src/lib/api.ts`)

Base URL: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"`

All functions are fully typed with TypeScript. Exported functions:

**Student:**
- `getMySelection(studentId: string, weekStartDate?: string)`
- `selectLunch(payload: { studentId: string; weekStartDate: string; lunchSelections: Record<string, boolean>; simulateFriday?: boolean })`

**Admin:**
- `toggleGlobalLock(isLocked?: boolean)`
- `toggleBlockStudent(payload: { studentId: string; isBlocked: boolean; reason?: string })`
- `overrideStudentMeal(payload: { studentId: string; weekStartDate?: string; day?: string; selected?: boolean; lunchSelections?: Record<string, boolean> })`
- `getUsers(role?: string)`
- `createUser(payload: { name: string; email: string; role: string; room?: string })`

**Chef:**
- `getTodayList(mealType: string, date?: string, day?: string)`
- `checkInStudent(payload: { studentId: string; date?: string; mealType: string; status: 'present' | 'absent' })`

### 6.5 Running the Frontend

> **⚠️ CRITICAL — ALWAYS use `--webpack` flag.** Turbopack causes a fatal crash with DaisyUI CSS imports. The `package.json` scripts already include this flag — never remove it.

```powershell
cd meal-client
npm run dev        # next dev --webpack  (development, port 3000)
npm run build      # next build --webpack (production build)
npm start          # next start (production server)
```

---

## 7. Environment Variables

### `meal-client/.env`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### `meal-server/.env`
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```
> `NODE_ENV=development` enables the `simulateFriday` bypass in `POST /api/meals/select`.

---

## 8. Critical Known Issues & Constraints

| Issue | Root Cause | Solution / Status |
|---|---|---|
| **Turbopack crash** | DaisyUI CSS import causes a Webpack-style panic in Turbopack | Always pass `--webpack` to `next dev` and `next build`. Already baked into `package.json`. **Never remove.** |
| **DaisyUI v5 import style** | `@plugin "daisyui"` (PostCSS plugin syntax) causes Turbopack crash | Use CSS import style in `globals.css`: `@import "daisyui/daisyui.css"; @import "daisyui/themes.css";` |
| **Google Fonts removed** | `next/font/google` fetches from `fonts.googleapis.com` at build time (fails offline) | Removed from `layout.tsx`. Use system fonts or self-host. |
| **Case-sensitive folder** | Windows git treats `Components/` and `components/` as the same; Linux/CI does not | Folder is correctly named `components/` (lowercase). Do NOT rename it back. |
| **`PREDEFINED_ACCOUNTS` IDs** | Placeholder ObjectIds in `MealAppContext.tsx` don't match seeded MongoDB `_id` values | After running `npm run seed`, fetch real IDs and update the constant. |
| **`isPenalized` vs `isBlocked`** | Early context used `isPenalized`; backend model uses `isBlocked` | All context files and pages now consistently use `isBlocked`. |

---

## 9. Seeding the Database

Run once after the backend is started and connected to MongoDB Atlas:

```powershell
cd meal-server
npm run seed
```

This creates:
- 4 students: Ahmed Al-Mansoor (A-204), Omar Tariq (B-108, **blocked**), Khalid Bin Ziyad (C-301), Zaid Mostafa (A-102)
- 1 admin: Dr. Ibrahim (Hostel Warden)
- 1 chef: Chef Mahmoud Hassan
- A `MealSelection` record for each student for the current week (Khalid does NOT have Monday lunch selected — use this to test strict lunch filtering in the Chef dashboard)
- A `SystemConfig` record with `isGlobalLocked: false`

After seeding, retrieve the ObjectIds to update `PREDEFINED_ACCOUNTS` in `MealAppContext.tsx`:
```powershell
# In the meal-server directory, start a quick node REPL or run:
# (connect to Atlas and query: db.users.find({}, { name: 1, role: 1 }))
```

---

## 10. Full Local Development Setup

Run both servers simultaneously in two separate terminals:

```powershell
# Terminal 1 — Backend
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-server
npm run dev
# Server: http://localhost:5000

# Terminal 2 — Frontend
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-client
npm run dev
# App: http://localhost:3000
```

First-time setup (once):
```powershell
# Install backend dependencies
cd meal-server
npm install

# Install frontend dependencies
cd ..\meal-client
npm install

# Seed the database (backend must be running and connected)
cd ..\meal-server
npm run seed
```

---

## 11. Localization & Styling Rules

- **UI Languages:** English (default) and Arabic (`dir="rtl"`).
- When Arabic is selected, `LanguageContext` sets `document.documentElement.dir = "rtl"` and `document.documentElement.lang = "ar"`.
- All UI-facing strings must use the translation dictionary in `LanguageContext.tsx`. Add new keys there first.
- **Backend code, database field names, API params, and variable names must always be in English.** Only UI text uses Arabic translations.
- Theme: Light (default) and Dark mode via DaisyUI `data-theme` attribute on `<html>`. Theme is persisted to `localStorage`.
- Responsive design: All pages are fully responsive — mobile, tablet, desktop — using Tailwind CSS utility classes and DaisyUI components.

---

## 12. Tasks & Milestones Tracking

- [x] **Remove hardcoded mock data**: Fully migrated to real MongoDB Atlas database operations via Next.js Server Actions.
- [x] **Unified Login System**: Single login for Admin, Chef, and Student with bcrypt verification and dynamic routing.
- [x] **Password Reset & Change Architecture**:
  - Auto-generated default password `Dorm@1234` with `isPasswordReset: true` on user creation.
  - Admin single-click password reset action to restore default password.
  - Self-service password change via `updatePasswordAction` with bcrypt hashing and `isPasswordReset: false` status update.
- [x] **Route Protection (Middleware)**: Edge-wide route guard in `src/middleware.ts` using secure `meal_session` cookies to protect `/dashboard/*` routes and isolate roles.
- [x] **Production Gating**: Strictly disabled `simulateFriday` in production builds (`NODE_ENV === "production"`), locking selection to the real calendar Friday (`getDay() === 5`).
- [x] **UI/UX Modernization**: Redesigned dashboards, modals, statistics cards, and responsive layouts with DaisyUI and Tailwind CSS.
- [ ] **Audit Logs & Recovery**: Log admin actions (blocking students, overriding meal choices) into an `auditlogs` collection.
- [ ] **Rate Limiting & Brute Force Protection**: Implement IP/email rate limiting on login actions.
- [ ] **HTTPS & Deployment Setup**: Production domain configuration, SSL, and containerized/Vercel deployment setup.



# Hostel Dining System - Project Status & Roadmap (Agent Context)

## What Is Already Production-Ready

### 1. Architecture & Database Integration
- Direct connection to MongoDB Atlas via native client connection caching in Next.js Server Actions.
- Clean, secure password hashing with `bcryptjs` (salt rounds = 10).
- TTL indexes configured for 365-day automated data retention.

### 2. Business Rules & Workflows
- Unified role-agnostic login that dynamically routes users to `/dashboard/admin`, `/dashboard/chef`, or `/dashboard/student`.
- Admin user management: creation with default password (`Dorm@1234`), password reset capability, meal overrides, and global lock toggle.
- Student Friday-only lunch selection constraints with real-time disciplinary block/red-flag banners.
- Chef daily attendance module strictly filtering students who pre-selected lunch.

### 3. Build & Type Health
- Passes `next build --webpack` with zero TypeScript or bundling errors.

---

## Critical Gaps Before Serving Real Users

| Area | Current State | Requirement for Real Production |
| :--- | :--- | :--- |
| **Route Protection (Middleware)** | ✅ **COMPLETED**: Implemented `src/middleware.ts` using httpOnly session cookies (`meal_session`). Edge guards protect `/dashboard/*` with role enforcement, and redirect unauthenticated users to `/login`. | Fully active and verified in build. |
| **Friday Simulation Toggle** | ✅ **COMPLETED**: The dev simulator button in Student Dashboard and context toggle logic are strictly gated behind `process.env.NODE_ENV !== "production"`. In production, only the real Friday calendar day (`getDay() === 5`) allows meal selection. | Fully active and verified in build. |
| **Password Change & Reset** | ✅ **COMPLETED**: Implemented `updatePasswordAction` Server Action with `bcryptjs` hashing, MongoDB user update, and `isPasswordReset: false` flip. Admin reset resets to hashed `Dorm@1234` with `isPasswordReset: true`. | Fully active and verified in build. |
| **Audit Logs & Recovery** | Actions execute directly against MongoDB without audit history. | Admin actions (blocking a student, meal overrides) should ideally write to an `AuditLog` collection. |
| **Rate Limiting & Brute Force** | The login Server Action does not rate-limit repeated bad passwords. | Add a rate limiter (e.g., Upstash Redis or a simple Mongo attempt counter) to prevent brute-force attacks on the single login form. |
| **HTTPS & Production Env** | Running locally with `localhost` URLs. | Configure custom domain, SSL, production environment variables (`NEXT_PUBLIC_APP_URL`, production DB URI with restricted IP whitelist), and deployment host (Vercel, AWS, or Docker). |

---

## Recommended Next Steps to Launch
1. [x] **Add `middleware.ts`**: Protected `/dashboard/*` routes so unauthorized users are kicked back to `/login` immediately before rendering.
2. [x] **Gate Dev Toggles**: Wrapped `toggleFridaySimulation` in `process.env.NODE_ENV !== "production"`.
3. [x] **Fix Password Change**: Wired direct MongoDB Server Action with bcryptjs and session cookie synchronization.
4. [ ] **Audit Logs & Rate Limiting**: Implement MongoDB-backed audit logging for admin actions and rate limiting for login attempts.

### Recent Session Execution Report (Completed)
- **Password Management**: Implemented `updatePasswordAction` in `src/app/actions/authActions.ts`, updated `PasswordChangeModal.tsx` with one-click autofill for default credentials, show/hide eye toggle, validation, and database password reset flag updates.
- **Middleware & Session Cookies**: Implemented `src/middleware.ts` validating `meal_session` cookies. Restricts unauthorized access to dashboards and enforces role segregation at the edge.
- **Production Guardrails**: Friday simulation toggle hidden in production UI and locked in context.
- **Build Status**: Verified via `next build --webpack` - passed with zero TypeScript and bundle errors.