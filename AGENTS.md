<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Hostel Meal Management System — Architecture & Operational Blueprint

> **CRITICAL DIRECTIVE FOR ALL DEVELOPERS & AI AGENTS:**
> This specification is the **exclusive, single source of truth** for the Hostel Meal Management System. It replaces all legacy documentation, meeting transcripts, changelogs, and historical notes. The system documented herein is a fully operational, production-grade application featuring dual-tier execution, cryptographic JWT authentication, edge-level middleware guards, role-isolated workflows, and a strictly disciplined MongoDB Atlas persistence layer. Every technical rule, schema definition, API contract, and operational boundary specified here is absolute.

---

## 1. System Architecture & Dual-Deployment Model

The system is constructed as a decoupled, multi-tiered enterprise architecture composed of a presentation/edge orchestration layer (`meal-client`) and an independent RESTful microservice API layer (`meal-server`), backed by a unified cloud database cluster (`MongoDB Atlas`).

```
                              ┌─────────────────────────────────────────────────────────┐
                              │                    BROWSER CLIENT                       │
                              │  - Next.js 16 Client Components (React 19)              │
                              │  - ThemeContext (DaisyUI 5.7), LanguageContext (EN/AR)  │
                              │  - MealAppContext (Optimistic UI & Client Cache)        │
                              └──────────────┬───────────────────────────┬──────────────┘
                                             │                           │
                   (Browser Requests & SSR)  │                           │  (Direct Client REST
                   Includes 'meal_session'   │                           │   with Bearer JWT)
                   HttpOnly Cookie           │                           │
                                             ▼                           │
              ┌────────────────────────────────────────────────┐         │
              │         MEAL-CLIENT (Next.js 16.4.3)            │         │
              │  - Edge Middleware (src/middleware.ts)         │         │
              │  - Server Actions (authActions, mealActions)   │         │
              │  - Cryptographic Engine (jose HS256)           │         │
              │  - Native Mongo Driver Pool (mongodb 7.7)      │         │
              └──────────────┬─────────────────────────────────┘         │
                             │                                           │
                             │ (Direct Server Action Driver Calls)       │
                             │                                           ▼
                             │                        ┌─────────────────────────────────────┐
                             │                        │      MEAL-SERVER (Express 5.3.0)    │
                             │                        │  - REST API Engine (CORS, Express)  │
                             │                        │  - JWT Middleware (jsonwebtoken)    │
                             │                        │  - Mongoose 9.11.4 ODM Layer        │
                             │                        │  - Rate Limiting & Admin Auditing   │
                             │                        └──────────────────┬──────────────────┘
                             │                                           │
                             ▼                                           ▼
              ┌─────────────────────────────────────────────────────────────────────────────┐
              │                         MONGODB ATLAS CLOUD REPLICA SET                     │
              │   Database: `weekly-meal`                                                   │
              │   Collections: users, mealselections, attendances, systemconfigs,           │
              │                login_attempts, auditlogs                                    │
              └─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Dual-Architecture Interaction Topology

The platform operates across two concurrent delivery models:

1. **Edge-SSR & Server Actions (`meal-client`)**:
   - Built on Next.js 16 (App Router) running on Node/Vercel Serverless.
   - Incoming route navigation (`/dashboard/*`) is intercepted at the edge by `src/middleware.ts`, validating the cryptographically sealed `meal_session` cookie via `jose`.
   - Core interactive user operations (login, password modifications, attendance recording, global lock toggling, student blocking) execute directly via Next.js Server Actions (`src/app/actions/*`). These actions communicate directly with MongoDB Atlas via the pooled singleton in `src/lib/mongodb.ts`.

2. **Decoupled REST API (`meal-server`)**:
   - Built on Express 5.3.0 running as an independent Node.js daemon (Render/Railway/Docker).
   - Serves as the central API gateway for programmatic external integrations, legacy clients, mess scanner terminals, and background schedulers.
   - Routes (`/api/auth`, `/api/meals`, `/api/admin`, `/api/chef`) enforce Bearer JWT verification via `middleware/auth.js` with strict role authorizations.
   - Utilizes Mongoose 9.11.4 schemas with strict schema typing, pre-compile indexes, and 365-day TTL expiry mechanisms.

3. **Client API Bridge (`src/lib/api.ts`)**:
   - Provides fully typed client-side fetchers targeting the Express backend.
   - Automatically attaches the Bearer token stored in `localStorage` (`meal_jwt_token`).
   - Translates backend JSON responses into standardized typed contracts (`ApiResponse<T>`, `StudentSelectionData`, `ChefTodayListResponse`).

---

## 2. Complete Security & Authentication Pipeline

```
                                  AUTHENTICATION LIFECYCLE
                                  
  ┌──────────────┐             ┌─────────────────────┐              ┌───────────────────────────┐
  │ User Inputs  │ ──────────> │   Rate-Limiter      │ ───────────> │  Database Password Check  │
  │ Credentials  │             │  (5 tries / 15 min) │              │  (bcrypt.compare vs hash) │
  └──────────────┘             └──────────┬──────────┘              └─────────────┬─────────────┘
                                          │ Fail Count >= 5                       │ Match OK
                                          ▼                                       ▼
                               ┌─────────────────────┐              ┌───────────────────────────┐
                               │ 15-Minute Lockout   │              │ Sign JWT Payload (HS256)  │
                               │ in `login_attempts` │              │ Expiration: 7 Days        │
                               └─────────────────────┘              └─────────────┬─────────────┘
                                                                                  │
                                      ┌───────────────────────────────────────────┴────────────────┐
                                      ▼                                                            ▼
                       ┌──────────────────────────────┐                             ┌──────────────────────────────┐
                       │  Edge HttpOnly Cookie        │                             │  Client LocalStorage Token   │
                       │  Name: `meal_session`        │                             │  Key: `meal_jwt_token`       │
                       │  Scope: Path=/, SameSite=Lax │                             │  Scope: SPA REST API Headers │
                       └──────────────┬───────────────┘                             └──────────────────────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │  Route Middleware Guard      │
                       │  src/middleware.ts           │
                       │  Validates role per path     │
                       └──────────────────────────────┘
```

### 2.1 Cryptographic Token Standards & Secrets
- **Algorithm**: HMAC SHA-256 (`HS256`).
- **Signature Secret**: Configured strictly through the `JWT_SECRET` environment variable in both environment tiers (minimum 32-character high-entropy cryptographic secret). In production, fallback defaults are forbidden.
- **Token Duration**: Exactly 7 days (`7d` / `604800` seconds).
- **Libraries**:
  - `meal-client`: `jose` (`SignJWT`, `jwtVerify`) for zero-dependency edge runtime compatibility.
  - `meal-server`: `jsonwebtoken` for Node.js Express middleware compatibility.
- **Session Payload Schema (`SessionPayload`)**:
  ```typescript
  export interface SessionPayload {
    id: string;              // User MongoDB ObjectId string
    name: string;            // Full display name
    email: string;           // Normalized lowercase unique email
    role: "student" | "admin" | "chef";
    room?: string;           // Student hostel room (e.g. "A-204")
    shift?: string;          // Chef operational shift
    isBlocked?: boolean;     // Warden disciplinary ban state
    penaltyReason?: string;  // Active ban description
    isRedFlagged?: boolean;  // Unexcused absence penalty state
    isPasswordReset?: boolean; // Forces password update upon initial login
  }
  ```

### 2.2 Edge Route Guard Execution Flow (`src/middleware.ts`)
The Next.js Edge Middleware intercepts all requests matching `["/dashboard/:path*", "/login"]`:
1. **Extraction**: Inspects `request.cookies.get("meal_session")`.
2. **Cryptographic Validation**: Executes `verifyJwtToken()` using `jose.jwtVerify`. If malformed or signature fails, `sessionUser` resolves to `null`.
3. **Root Dashboard Route (`/dashboard` or `/dashboard/`)**:
   - If unauthenticated: Redirects to `/login?from=/dashboard`.
   - If authenticated: Redirects to `/dashboard/${sessionUser.role}`.
4. **Role Isolation Route Guards (`/dashboard/*`)**:
   - If unauthenticated: Redirects to `/login?from=${pathname}`.
   - If `pathname.startsWith("/dashboard/admin")` and `role !== "admin"`: Redirects to `/dashboard/${sessionUser.role}`.
   - If `pathname.startsWith("/dashboard/chef")` and `role !== "chef"`: Redirects to `/dashboard/${sessionUser.role}`.
   - If `pathname.startsWith("/dashboard/student")` and `role !== "student"`: Redirects to `/dashboard/${sessionUser.role}`.
5. **Anti-Login Redirection (`/login`)**:
   - If a valid session cookie exists, the user is forbidden from viewing the login screen and redirected directly to `/dashboard/${sessionUser.role}`.

### 2.3 Password Security & Lifecycle
- **Hashing**: `bcryptjs` utilizing salt rounds of `10`.
- **Default Provisioning Password**: When an admin seeds the database or creates a student/chef via UI or API, the account is created with `Dorm@1234` and `isPasswordReset: true`.
- **Mandatory Password Change**: The system checks `user.isPasswordReset`. When `true`, the user is prompted to set a permanent password (minimum 6 characters) via `PasswordChangeModal.tsx`.
- **Self-Service Password Updates**: Handled by `updatePasswordAction()` (Server Action) and `POST /api/auth/change-password` (REST). If the user previously completed a reset, the existing password is verified before overwriting.
- **Administrative Password Reset**: Admins can invoke `resetPasswordAction()` or `POST /api/admin/reset-password`. The target user's password is restored to `Dorm@1234` and `isPasswordReset` is reset to `true`.

### 2.4 Brute-Force Rate Limiting Engine (`login_attempts`)
- **Collection**: `login_attempts`
- **Threshold**: Maximum **5** failed attempts per email address.
- **Lockout Duration**: **15 minutes** (`900,000` ms).
- **Execution Lifecycle**:
  1. On each authentication request, `checkRateLimit(email)` queries `login_attempts`.
  2. If `lockedUntil > Date.now()`, authentication is blocked immediately with a calculated remaining time message.
  3. If expired, the record is expunged and access is evaluated.
  4. Failed password comparisons call `recordFailedLoginAttempt(email)`, incrementing `attempts` and setting `lockedUntil` once 5 attempts are hit.
  5. Successful authentication triggers `clearFailedLoginAttempts(email)`, removing the record.

### 2.5 Administrative Audit Trail (`auditlogs`)
Every state-altering administrative or disciplinary operation creates an immutable entry in the `auditlogs` collection via `logAuditEvent()`:
- **Tracked Actions**:
  - `CREATE_USER`: Account creation (student or chef).
  - `DELETE_USER`: Account deletion and cascading data cleanup.
  - `RESET_PASSWORD`: Admin-enforced password reset to default.
  - `BLOCK_STUDENT` / `UNBLOCK_STUDENT`: Meal privilege suspensions with penalty reasons.
  - `OVERRIDE_LUNCH`: Manual warden intervention on weekly lunch schedules.
  - `TOGGLE_GLOBAL_LOCK`: Global meal selection lock freezes.
- **Captured Metadata**: Timestamp, actor ObjectId, actor email, actor role, target ObjectId, target email, and structured JSON change payload.

---

## 3. Comprehensive Business Rules & Role Matrices

### 3.1 Role Permissions Matrix

| Capability / Action | Student | Admin (Warden) | Chef (Mess Manager) |
|---|:---:|:---:|:---:|
| View Personal Weekly Schedule | Full | Read/Override | No |
| Select / Deselect Weekly Lunches | Unlocked Only | Anytime Override | No |
| View Global Attendance Roaster | No | Full List | Daily Session Only |
| Toggle Global Selection Lock | No | Full Control | No |
| Suspend Student Privileges (`isBlocked`) | No | Full Control | No |
| Mark Breakfast / Dinner Attendance | No | View Audits | Check-in Eligible |
| Mark Lunch Attendance | No | View Audits | Pre-Selected Only |
| Trigger / Clear Red-Flag Absences | No | View Flags | Auto on Lunch Absent |
| User Provisioning & Password Resets | Self Change | Full Control | Self Change |

---

### 3.2 Student Business Rules
1. **Operating Week Structure & Cycle Logic**:
   - The meal schedule follows a fixed 7-day cycle: **Saturday through Friday**.
   - Meal selection capability is tied directly and exclusively to the Admin's **Global Lock** toggle.
2. **Fixed Daily Meals (Breakfast & Dinner)**:
   - Breakfast and dinner are universally guaranteed daily allotments for all enrolled residents.
   - Compressed alongside Lunch into a **single clean horizontal line/row** per day.
3. **Global Lock Controlled Selection Window**:
   - When the Admin turns off the Global Lock (`isGlobalLocked: false`), students can freely modify their lunch selections.
   - When the Admin turns on the Global Lock (`isGlobalLocked: true`), meal selections are instantly frozen system-wide.
4. **Administrative Block Enforcements**:
   - If `user.isBlocked === true`, the student is barred from making meal selections.
   - An alert banner is displayed: `"ACCESS RESTRICTED: Your meal selection privileges have been temporarily suspended by the warden."`
5. **Absence Penalty Warning (Red-Flag)**:
   - If `user.isRedFlagged === true`, a warning banner is displayed: `"ABSENCE WARNING: You missed a previously pre-selected lunch. Please check in with the kitchen chef on your next meal to clear your red flag."`
6. **Global Lock State**:
   - If `SystemConfig.isGlobalLocked === true`, all student selection controls freeze system-wide.

---

### 3.3 Admin (Hostel Warden) Business Rules
1. **Global Selection Lock**:
   - Controls `SystemConfig.isGlobalLocked`.
   - Activating the lock immediately freezes meal selection for all students across the entire institution.
   - Deactivating the lock restores active student selection privileges.
2. **Attendance & Meal Report Generation**:
   - Full date-range filtering (From Date to To Date).
   - High-level KPIs and detailed student logs.
   - UTF-8 CSV download for spreadsheet analysis.
3. **Student Meal Privilege Suspension**:
   - Admins can block or unblock any student individually.
   - When blocking, an administrative reason is attached (`penaltyReason`), displayed directly on the student's dashboard.
   - When unblocking, `penaltyReason` is wiped.
4. **Direct Meal Override (Single-Day & Full-Week)**:
   - The warden can manually override any student's lunch selection for any day of the current week.
   - Bypasses all restrictions: global lock state and student block status.
5. **Account Management**:
   - Create student accounts (auto-assigns Room, hashes default password, seeds initial `MealSelection`).
   - Create chef accounts (assigns Shift schedule, hashes default password).
   - Delete users with cascading deletion of corresponding `MealSelection` and `Attendance` records.
   - Reset any user's password to `Dorm@1234`.

---

### 3.4 Chef (Mess Manager) Business Rules
1. **Daily Operational Session Isolation**:
   - The chef interface is locked strictly to **today's operating date**.
   - Divided into three distinct meal tabs: **Breakfast**, **Lunch**, and **Dinner**.
2. **Breakfast & Dinner Attendance**:
   - All enrolled, non-blocked students appear on the roster as eligible.
   - Marking a student present records attendance.
   - **Auto-Clearing Red Flags**: If a student arrives with an active `isRedFlagged` status and is marked `present` at breakfast or dinner, their red flag is automatically cleared.
3. **Lunch Attendance — Strict Pre-Selection Gating**:
   - **Mandatory Filter**: Only students whose `MealSelection.lunchSelections[todayKey] === true` appear in the lunch attendance list.
   - Students who opted out or failed to select lunch are completely excluded from the roster.
4. **Absence & Red-Flag Generation**:
   - If a student pre-selected lunch but does not attend, the chef marks them **Absent**.
   - Marking a student **Absent** for lunch immediately sets `User.isRedFlagged = true`.
   - Marking a student **Present** for lunch clears `isRedFlagged = false`.

---

## 4. Deep Directory & File Structure Guide

```
weekly-meal/
├── AGENTS.md                               ← Single Source of Truth Architecture Document
├── meal-client/                            ← Next.js 16.4.3 App Router Frontend & Edge Tier
│   ├── .env                                ← Client Environment Variables
│   ├── next.config.ts                      ← Next.js configuration (React Compiler, Turbopack)
│   ├── package.json                        ← Dependencies and build scripts
│   ├── tsconfig.json                       ← TypeScript compiler paths & strict settings
│   └── src/
│       ├── middleware.ts                   ← Edge runtime JWT route authentication guard
│       ├── app/
│       │   ├── globals.css                 ← Tailwind CSS 4, DaisyUI v5 CSS imports
│       │   ├── layout.tsx                  ← Root Layout (HTML shell, Theme, Navbar, Footer)
│       │   ├── page.tsx                    ← Public Landing Page with system metrics & pills
│       │   ├── providers.tsx               ← Nested Context Providers mounting pipeline
│       │   ├── actions/
│       │   │   ├── authActions.ts          ← Direct Server Actions for Login, User CRUD, Passwords
│       │   │   ├── mealActions.ts          ← Direct Server Actions for Meals, Locks, Overrides
│       │   │   └── auditActions.ts         ← Server Actions for fetching administrative audit logs
│       │   ├── api/
│       │   │   └── auth/
│       │   │       └── login/
│       │   │           └── route.ts        ← Next.js Route Handler for JWT cookie generation
│       │   ├── login/
│       │   │   └── page.tsx                ← Unified Role-Selector Login Page
│       │   └── dashboard/
│       │       ├── admin/
│       │       │   └── page.tsx            ← Warden Portal: Locks, Roster, Penalties, Overrides
│       │       ├── chef/
│       │       │   └── page.tsx            ← Mess Portal: Attendance, Lunch Gating, Red-Flags
│       │       └── student/
│       │           └── page.tsx            ← Resident Portal: 7-day Meal Grid, Friday selection
│       ├── components/
│       │   ├── Navbar.tsx                  ← Minimalist Top Navigation with Brand & Mobile Sidebar trigger
│       │   ├── DashboardSidebar.tsx        ← Role-Isolated Sidebar (Section 1: Profile & Pass, Section 2: Nav)
│       │   ├── Footer.tsx                  ← Application Footer
│       │   ├── PasswordChangeModal.tsx     ← Force password update modal for newly seeded accounts
│       │   └── ui/
│       │       ├── AlertBanner.tsx         ← Typed alert notification banner (DaisyUI styled)
│       │       ├── StatCard.tsx            ← Modular metric card with badges & theme accents
│       │       └── DatabaseStatusBadge.tsx ← Real-time MongoDB Atlas online status indicator
│       ├── context/
│       │   ├── ThemeContext.tsx            ← DaisyUI theme switcher (light/dark) via localStorage
│       │   ├── LanguageContext.tsx         ← English/Arabic dictionary & RTL layout switcher
│       │   └── MealAppContext.tsx          ← Master state provider, optimistic updates, session sync
│       └── lib/
│           ├── api.ts                      ← Typed HTTP client for Express backend communication
│           ├── audit.ts                    ← Rate limiting checks & audit logging persistence
│           ├── auth.ts                     ← Edge-compatible JWT signing and verification (jose)
│           └── mongodb.ts                  ← MongoDB native client connection pool & singleton
└── meal-server/                            ← Express 5.3.0 REST Backend Microservice Tier
    ├── .env                                ← Server Environment Variables
    ├── index.js                            ← Express application entry point & route mounting
    ├── package.json                        ← Server dependencies & execution scripts
    ├── seed.js                             ← Primary database seeder (SystemConfig & Admin user)
    ├── config/
    │   └── db.js                           ← Mongoose connection helper for MongoDB Atlas
    ├── controllers/
    │   ├── adminController.js              ← Logic for user CRUD, global lock, blocks, overrides
    │   ├── authController.js               ← Logic for login, JWT issuing, password changes
    │   ├── chefController.js               ← Logic for daily rosters, lunch gating, attendance
    │   └── studentController.js            ← Logic for student selections & Friday validation
    ├── middleware/
    │   └── auth.js                         ← JWT extraction, validation & role authorization
    ├── models/
    │   ├── Attendance.js                   ← Mongoose model for daily meal attendance
    │   ├── MealSelection.js                ← Mongoose model for weekly student lunch preferences
    │   ├── SystemConfig.js                 ← Mongoose model for global system settings
    │   └── User.js                         ← Mongoose model for user accounts and credentials
    └── routes/
        ├── adminRoutes.js                  ← /api/admin/* endpoints (Admin authorization)
        ├── authRoutes.js                   ← /api/auth/* endpoints (Public login, protected auth)
        ├── chefRoutes.js                   ← /api/chef/* endpoints (Chef & Admin authorization)
        └── mealRoutes.js                   ← /api/meals/* endpoints (Student selection endpoints)
```

---

## 5. Database Schemas & Data Retention Rules

Database: **`weekly-meal`** (hosted on MongoDB Atlas).

### 5.1 `users` Collection
Defined in `meal-server/models/User.js` and managed concurrently by `meal-client/src/app/actions/authActions.ts`.

```javascript
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin", "chef"], default: "student", required: true },
    room: { type: String, trim: true },             // For students (e.g. "A-204")
    shift: { type: String, trim: true },            // For chefs (e.g. "Morning & Lunch Session")
    isBlocked: { type: Boolean, default: false },   // Disciplinary meal suspension state
    isRedFlagged: { type: Boolean, default: false },// Missed lunch unexcused penalty state
    penaltyReason: { type: String, trim: true },    // Displayed on student dashboard if blocked
    isPasswordReset: { type: Boolean, default: true } // Triggers forced password change on first login
  },
  { timestamps: true }
);
```

- **Indexes**:
  - `{ email: 1 }`: Unique index to prevent duplicate accounts.
  - `{ role: 1 }`: Accelerated querying for student rosters and chef lists.

---

### 5.2 `mealselections` Collection
Defined in `meal-server/models/MealSelection.js`.

```javascript
const lunchSelectionsSchema = new mongoose.Schema(
  {
    sat: { type: Boolean, default: true },
    sun: { type: Boolean, default: true },
    mon: { type: Boolean, default: true },
    tue: { type: Boolean, default: true },
    wed: { type: Boolean, default: true },
    thu: { type: Boolean, default: true },
    fri: { type: Boolean, default: false },
  },
  { _id: false }
);

const mealSelectionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStartDate: { type: String, required: true, index: true }, // Format: "YYYY-MM-DD" (Saturday)
    lunchSelections: { type: lunchSelectionsSchema, default: () => ({}) },
    isLocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: "365d" } // 1-year TTL retention policy
  },
  { timestamps: true }
);

// Compound Unique Constraint: One record per student per calendar week
mealSelectionSchema.index({ studentId: 1, weekStartDate: 1 }, { unique: true });
```

- **TTL Expiration Policy**: `expires: "365d"` cleans up stale historic weekly selections after 1 year.

---

### 5.3 `attendances` Collection
Defined in `meal-server/models/Attendance.js`.

```javascript
const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: "YYYY-MM-DD"
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner"], required: true },
    status: { type: String, enum: ["present", "absent"], required: true },
    createdAt: { type: Date, default: Date.now, expires: "365d" } // 1-year TTL retention policy
  },
  { timestamps: true }
);

// Compound Unique Constraint: One record per student, per date, per meal session
attendanceSchema.index({ studentId: 1, date: 1, mealType: 1 }, { unique: true });
```

---

### 5.4 `systemconfigs` Collection
Defined in `meal-server/models/SystemConfig.js`.

```javascript
const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global_settings" },
    isGlobalLocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);
```

---

### 5.5 `login_attempts` Collection
Managed by `src/lib/audit.ts` for rate limiting.

| Field Name | Type | Description |
|---|---|---|
| `email` | String | Lowercase unique email being attempted (indexed) |
| `attempts` | Number | Integer counter of consecutive failed attempts |
| `lastAttempt` | Date | Timestamp of most recent failure |
| `lockedUntil` | Date | Lockout expiration time (Date.now() + 15 min) |

---

### 5.6 `auditlogs` Collection
Managed by `src/lib/audit.ts` and `auditActions.ts`.

| Field Name | Type | Description |
|---|---|---|
| `action` | String | `CREATE_USER`, `DELETE_USER`, `BLOCK_STUDENT`, etc. |
| `performedBy` | Object | `{ id, email, role, name }` of the operating administrator |
| `targetId` | String | MongoDB ObjectId string of target user |
| `targetEmail` | String | Email address of the target user |
| `details` | Object | Structured JSON map detailing modified fields |
| `timestamp` | Date | Explicit ISO execution timestamp |

---

## 6. Complete API Endpoints Reference (`meal-server`)

Base URL: `http://localhost:5000` (or production host domain). All protected endpoints require header `Authorization: Bearer <token>`.

### 6.1 Authentication Routes (`/api/auth`)

#### `POST /api/auth/login`
- **Access**: Public
- **Body**: `{ "email": "user@hostel.edu", "password": "password123" }`
- **Success (200)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "67...",
      "name": "Ahmed Al-Mansoor",
      "email": "ahmed@hostel.edu",
      "role": "student",
      "room": "A-204",
      "isBlocked": false,
      "isRedFlagged": false,
      "penaltyReason": null,
      "isPasswordReset": false
    }
  }
  ```

#### `POST /api/auth/change-password`
- **Access**: Protected (`verifyToken`)
- **Body**: `{ "userId": "67...", "currentPassword": "Dorm@1234", "newPassword": "NewSecurePassword!" }`
- **Success (200)**:
  ```json
  { "success": true, "message": "Password updated successfully.", "user": { "id": "...", "isPasswordReset": false } }
  ```

#### `GET /api/auth/me/:userId`
- **Access**: Protected (`verifyToken`)
- **Success (200)**: Returns user profile object without password field.

---

### 6.2 Student Meal Routes (`/api/meals`)

#### `GET /api/meals/my-selection`
- **Access**: Protected (`verifyToken`)
- **Query Params**: `studentId` (required), `weekStartDate` (optional, defaults to current Saturday)
- **Success (200)**:
  ```json
  {
    "success": true,
    "student": { "id": "...", "name": "...", "room": "...", "isBlocked": false, "isRedFlagged": false },
    "isGlobalLocked": false,
    "isFriday": true,
    "selection": {
      "studentId": "...",
      "weekStartDate": "2026-10-24",
      "lunchSelections": { "sat": true, "sun": true, "mon": true, "tue": true, "wed": true, "thu": true, "fri": false },
      "isLocked": false
    },
    "fixedMeals": {
      "breakfast": { "fixed": true, "note": "Standard continental breakfast included daily" },
      "dinner": { "fixed": true, "note": "Standard hot dinner meal included daily" }
    }
  }
  ```

#### `POST /api/meals/select`
- **Access**: Protected (`verifyToken`)
- **Body**:
  ```json
  {
    "studentId": "67...",
    "weekStartDate": "2026-10-24",
    "lunchSelections": { "sat": true, "sun": false, "mon": true, "tue": true, "wed": false, "thu": true, "fri": false }
  }
  ```
- **Constraints Enforced**:
  - Returns `403` if student `isBlocked`.
  - Returns `403` if `isGlobalLocked` is active.
  - Returns `400` if not Friday (real calendar Friday strictly required).

---

### 6.3 Admin Routes (`/api/admin`)
All routes require `verifyToken` AND `requireRole("admin")`.

#### `POST /api/admin/toggle-global-lock`
- **Body**: `{ "isLocked": true }` (optional boolean; toggles if omitted)
- **Success (200)**: `{ "success": true, "isGlobalLocked": true, "message": "Global selection lock is now ACTIVATED (Locked)." }`

#### `POST /api/admin/toggle-block`
- **Body**: `{ "studentId": "67...", "isBlocked": true, "reason": "Late arrival & kitchen violation" }`
- **Success (200)**: Updates student record and sets/clears `penaltyReason`.

#### `POST /api/admin/override-meal`
- **Body**:
  ```json
  {
    "studentId": "67...",
    "weekStartDate": "2026-10-24",
    "day": "mon",
    "selected": true
  }
  ```
  *(Or full week by passing `lunchSelections` object)*.

#### `GET /api/admin/users`
- **Query Params**: `role` (optional: `student` | `admin` | `chef`)
- **Success (200)**: `{ "success": true, "count": 12, "users": [...] }`

#### `POST /api/admin/users`
- **Body**: `{ "name": "Zaid Mostafa", "email": "zaid@hostel.edu", "role": "student", "room": "B-302" }`
- **Success (201)**: Creates user with hashed `Dorm@1234` password and seeds initial `MealSelection`.

#### `POST /api/admin/reset-password`
- **Body**: `{ "userId": "67..." }`
- **Success (200)**: Re-hashes password to `Dorm@1234` and sets `isPasswordReset: true`.

#### `DELETE /api/admin/users/:id`
- **Success (200)**: Deletes user record and cascades deletion over `MealSelection` and `Attendance` collections.

---

### 6.4 Chef Attendance Routes (`/api/chef`)
All routes require `verifyToken` AND `requireRole("chef", "admin")`.

#### `GET /api/chef/today-list`
- **Query Params**:
  - `mealType`: `breakfast` | `lunch` | `dinner` (default: `lunch`)
  - `date`: `YYYY-MM-DD` (default: today)
  - `day`: `sat` | `sun` | `mon` | `tue` | `wed` | `thu` | `fri` (default: today)
- **Logic**:
  - For `breakfast` and `dinner`: Returns all non-blocked students.
  - For `lunch`: Queries `mealselections` for the current week and **only returns students whose `lunchSelections[day] === true`**.
- **Success (200)**:
  ```json
  {
    "success": true,
    "date": "2026-10-26",
    "day": "mon",
    "mealType": "lunch",
    "totalEligible": 4,
    "students": [
      {
        "id": "67...",
        "name": "Ahmed Al-Mansoor",
        "room": "A-204",
        "email": "ahmed@hostel.edu",
        "isBlocked": false,
        "isRedFlagged": false,
        "mealType": "lunch",
        "preSelected": true,
        "attendanceStatus": "unmarked"
      }
    ]
  }
  ```

#### `POST /api/chef/check-in`
- **Body**: `{ "studentId": "67...", "date": "2026-10-26", "mealType": "lunch", "status": "absent" }`
- **Red-Flag Logic**:
  - `mealType === "lunch"` and `status === "absent"`: Sets `User.isRedFlagged = true`.
  - `mealType === "lunch"` and `status === "present"`: Sets `User.isRedFlagged = false`.
  - Any meal session with `status === "present"`: Clears existing `isRedFlagged` to `false`.

---

## 7. Client State Architecture & Providers

Mounted in `src/app/providers.tsx` in strict sequence:
```tsx
<ThemeProvider>
  <LanguageProvider>
    <MealAppProvider>
      {children}
    </MealAppProvider>
  </LanguageProvider>
</ThemeProvider>
```

### 7.1 `ThemeProvider` (`src/context/ThemeContext.tsx`)
- Manages `"light"` and `"dark"` themes.
- Initializes state safely from `localStorage.getItem("meal_theme")` or system preference (`prefers-color-scheme`).
- Sets `data-theme` and updates CSS class `dark` on `document.documentElement`.

### 7.2 `LanguageProvider` (`src/context/LanguageContext.tsx`)
- Supports English (`"en"`) and Arabic (`"ar"`).
- Contains full bidirectional dictionary (`translations`).
- Sets `document.documentElement.dir = "rtl"` and `lang = "ar"` when Arabic is active.
- Exposes `t(key)` helper for UI string localization.

### 7.3 `MealAppContext` (`src/context/MealAppContext.tsx`)
- **Central State Hub**:
  - Manages `currentUser`, `currentRole`, `isGlobalLocked`, `students`, `chefs`, and `studentSchedule`.
  - Executes optimistic UI updates for instant interaction feedback while running asynchronous Server Actions.
  - Automatically fetches updated student data upon login.
  - Exposes actions: `toggleStudentLunch`, `toggleGlobalLock`, `toggleStudentPenalty`, `adminOverrideStudentLunch`, `markChefLunchStatus`, `markChefBreakfast`, `markChefDinner`, `addNewStudent`, `addNewChef`, `deleteStudent`, `deleteChef`, `adminResetPassword`.

---

## 8. Multi-Environment Configuration & Variables

### 8.1 `meal-client/.env`
```ini
# Secret used by jose to sign and verify session JWT cookies
JWT_SECRET=<your_strong_jwt_secret_min_32_characters>

# MongoDB Atlas connection string for Direct Server Actions
DB_URL=mongodb+srv://<db_username>:<db_password>@<cluster-host>/weekly-meal?retryWrites=true&w=majority

# Base URL for Express Backend REST services
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 8.2 `meal-server/.env`
```ini
# Port for Express API server
PORT=5000

# MongoDB Atlas credentials and connection string
DB_USER=<db_username>
DB_PASS=<db_password>
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster-host>/weekly-meal?retryWrites=true&w=majority

# JWT signing secret matching meal-client
JWT_SECRET=<your_strong_jwt_secret_min_32_characters>

# Environment mode ('development' or 'production')
NODE_ENV=development
```

---

## 9. Local Development & Deployment Runbook

### 9.1 Local Development Setup

#### Step 1: Install Dependencies
```powershell
# In meal-server
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-server
npm install

# In meal-client
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-client
npm install
```

#### Step 2: Seed the Database
```powershell
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-server
npm run seed
```
*Creates the primary Warden account (`warden@hostel.edu` / `Dorm@1234`) and initializes `SystemConfig` with `isGlobalLocked: false`.*

#### Step 3: Run Both Services
Open two terminal windows:
```powershell
# Terminal 1 — Backend Express Service
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-server
npm run dev
# Running at: http://localhost:5000

# Terminal 2 — Frontend Next.js Client
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-client
npm run dev
# Running at: http://localhost:3000
```

---

### 9.2 Production Build & Verification
Always execute the production build using Webpack:
```powershell
cd c:\Developer\My-projects\Fullstack\weekly-meal\meal-client
npm run lint
npm run build
```
- Expected output: 0 lint errors, all routes statically/dynamically compiled successfully.

---

### 9.3 Cloud Deployment Instructions

1. **Frontend (`meal-client`) on Vercel**:
   - Root Directory: `meal-client`
   - Framework Preset: Next.js
   - Build Command: `next build --webpack`
   - Environment Variables:
     - `JWT_SECRET`: (Production secret string)
     - `DB_URL`: (MongoDB Atlas URI)
     - `NEXT_PUBLIC_API_URL`: `https://your-api-domain.com/api`

2. **Backend (`meal-server`) on Render / Railway / Docker**:
   - Root Directory: `meal-server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Environment Variables:
     - `PORT`: `5000`
     - `MONGODB_URI`: (MongoDB Atlas URI)
     - `JWT_SECRET`: (Matching production secret string)
     - `NODE_ENV`: `production`

---

## 10. Strict Technical Constraints & Known Pitfalls

1. **Webpack Flag Mandatory (`--webpack`)**:
   - Next.js 16 default Turbopack compiler crashes when encountering DaisyUI v5 CSS imports.
   - The `--webpack` flag is pre-configured in `meal-client/package.json` (`next dev --webpack` and `next build --webpack`). **Never remove the `--webpack` flag.**
2. **DaisyUI v5 Import Syntax**:
   - Do NOT use the PostCSS plugin syntax `@plugin "daisyui"`.
   - In `globals.css`, styles must be imported explicitly via:
     ```css
     @import "tailwindcss";
     @import "daisyui/daisyui.css";
     @import "daisyui/themes.css";
     ```
3. **No Google Font Imports**:
   - `next/font/google` builds fail in offline/sandboxed development environments. Standard native system font fallbacks are enforced in `layout.tsx` and `globals.css`.
4. **Directory Case Sensitivity**:
   - The components directory is strictly lowercase: `src/components/`. Never rename it with an uppercase `C`.
5. **No Any Types Allowed**:
   - Both client and server codebases enforce strict TypeScript standards without `any` casts. All server actions, API responses, and database projections are strictly typed.
6. **English Database & API Standards**:
   - All database field names, API parameters, and backend logic must remain in English. Arabic localization is handled exclusively in the UI translation dictionary (`LanguageContext.tsx`).
