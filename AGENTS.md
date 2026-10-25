<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Hostel Meal Management System - Agent Guidelines

## 1. Tech Stack & Architecture
- **Frontend (`client/`):** Next.js (App Router), Tailwind CSS, DaisyUI. Supports Light/Dark Theme toggle and Language toggle (Arabic & English with dynamic RTL/LTR document direction).
- **Backend (`server/`):** Express.js (REST API).
- **Database:** MongoDB, with a 1-year data retention/cleanup strategy.
- **Authentication:** Better Auth (handling username/password credentials and roles).
- **Environment Variables:** Separated `.env` files located inside `client/` and `server/` respectively.

## 2. User Roles, Permissions & Business Logic
1. **Student:** 
   - Can log in and view the weekly schedule. Breakfast and dinner are auto-selected/fixed.
   - Can select or modify lunch choices **only on Fridays**. 
   - Cannot modify meals once the admin locks the global selection after Friday, or if individually blocked/punished by the admin.
2. **Admin:** 
   - Can create student/chef accounts, view all weekly lists, and toggle the global meal selection lock/unlock state.
   - Can override, modify, or block a student's meal status at any time (e.g., due to punishment or student request).
3. **Chef / Mess Manager:** 
   - Can view daily attendance lists.
   - Can only submit lunch attendance for students on days that were **pre-selected** by the student.
   - **Absence Warning Logic:** If a student is absent on a selected day, subsequent selected days turn red. Once the student checks in with the chef, the remaining days return to normal.

## 3. Localization & Styling Rules
- **Languages:** English and Arabic support. When Arabic is selected, dynamically enforce `dir="rtl"` and proper UI text alignment.
- **Code Standards:** Keep backend logic, database fields, and variable names strictly in English. UI text must support multi-language translation.

## 4. Development Workflow
- Follow the separate `client/` and `server/` folder structure.
- Ensure all API communications between Next.js and Express handle global locks, attendance validation, and student penalty states correctly.