# Lend Management System - Requirements Specification

| Field    | Value                                      |
| -------- | ------------------------------------------ |
| Version  | 1.1                                        |
| Date     | 2026-08-19                                 |
| Status   | Approved for v1 execution                  |
| Owner    | Mahfuz Zayn                                |
| Repo     | `lend-management-system` (Next.js 16.3.1)  |

> This document is the single source of truth. It will be **executed** to build the project.
> Any scope change must be reflected here first, then in `goals.md`.
> Execution tracking: `goals.md` (step-by-step plan, zero → end) and `progress.md` (one-line log per completed task). See §13.

---

## 1. Project Overview

### 1.1 Purpose
A lightweight web application for a single administrator (a money lender) to track **customers**, money **lent** to them, **repayments** received, and the resulting **outstanding dues** - with the ability to export any customer's full current history as a single PDF.

### 1.2 Problem
Manual (notebook/spreadsheet) lend tracking leads to calculation errors, lost history, and no quick answer to *"how much does this person currently owe?"*

### 1.3 Solution
A minimal, fast dashboard where the admin:

1. Manages customers (create / edit / delete / search).
2. Records transactions - every entry is either **`lend`** (money given out) or **`repayment`** (money received).
3. Sees dues per customer **derived automatically** (never stored manually).
4. Views an overview of totals and recent activity.
5. Downloads one customer's complete current history as **one single PDF**.

### 1.4 Users & Roles
| Role  | Count | Access |
| ----- | ----- | ------ |
| Admin | 1     | Everything: all dashboard pages, all CRUD, PDF export |

There are **no other roles**. No public data access - all data is behind login.

### 1.5 Scope Summary
**In scope:** landing site (Home / About / Contact), login, dashboard (Overview, Customers, Transactions, Due Summaries), per-customer PDF export, admin authentication.

**Out of scope (see §15):** multi-user roles, interest/EMI calculations, reminders (SMS/e-mail), multi-currency, reports beyond the customer PDF, dark mode, charts.

---

## 2. Tech Stack

| Layer            | Technology                                  | Notes |
| ---------------- | ------------------------------------------- | ----- |
| Framework        | **Next.js 16.3** (App Router, TypeScript)   | Already scaffolded in repo |
| UI components    | **shadcn/ui**                               | Installed per-component into `src/components/ui` |
| Styling          | **Tailwind CSS v4**                         | Already configured |
| Notifications    | **Sonner**                                  | All toasts (success / error / info) |
| Animations       | **Framer Motion / Motion** (`motion` package, `motion/react`) | Section reveals, card/text micro-interactions, dashboard motion |
| Carousel         | **Embla Carousel** (powers shadcn `Carousel`) | Landing-page carousel sections |
| Skeletons        | **shadcn `Skeleton`**                       | Every data-loading surface (see FR-10.3) |
| API              | **Next.js Route Handlers** (`src/app/api/*`)| v2 (v1 uses mock data, no API) |
| Database         | **MongoDB via Mongoose**                    | v2 - models in `src/models` |
| Auth             | **bcrypt** (hashing) + **jsonwebtoken** (JWT, httpOnly cookie) + proxy middleware | v2 - bcrypt cost ≥ 10; `@types/jsonwebtoken` as its TS types; approved by owner 2026-10-13 |
| Forms & validation | **zod** (+ react-hook-form in v2)         | Shared schemas usable client- and server-side |
| PDF export       | **React PDF Renderer** (`@react-pdf/renderer`, client-side) | Declarative PDF as React components; single-file download, no server rendering |
| Deployment       | **Vercel** + **MongoDB Atlas**              | v2 |

> 📦 **Package policy:** the table above is the **exhaustive** dependency list (plus what the shadcn CLI installs as component prerequisites). **No other npm packages may be installed.** If a genuine need arises, propose it, get approval, and add it to this table first - only then install.

> ⚠️ **Next.js 16 note:** this Next.js version has breaking changes vs. older conventions. Before writing any code, read the relevant guide in `node_modules/next/dist/docs/` (routing, route handlers, middleware, metadata) and heed deprecation notices.

---

## 3. Release Plan

### 3.1 v1 - Static Prototype (current phase)
**Goal:** verify **design and features** with the user before any backend work.

- All pages built with real UI (shadcn, minimalistic theme) - with **Motion animations** and **skeleton loading states** included, so design polish is judged in v1, not bolted on later.
- Data comes from a typed **mock dataset** (`src/lib/mock-data.ts`) - ~8–10 customers, ~40+ transactions with varied dates/amounts, including at least one fully-settled customer and one overpaid (advance) customer.
- **Mock auth:** login accepts a fixed demo credential (shown on the login page) and sets a client-side flag; dashboard guard checks that flag. No real security.
- PDF export works against mock data.
- `npm run build` and `npm run lint` must pass.

**Exit criteria:** the user reviews every page and approves design + feature behavior (see §14.1).

### 3.2 v2 - Dynamic & Production
**Goal:** real persistence, real auth, deployed.

- Mongoose models + MongoDB Atlas connection.
- All CRUD via Next.js Route Handlers.
- Real login (bcrypt + JWT httpOnly cookie + route middleware).
- Seed script for the initial admin (and optional demo data).
- Zod validation on every mutation.
- Environment configuration, production build, deployed to Vercel.

**Exit criteria:** §14.2 checklist passes on the deployed URL.

---

## 4. Application Structure & Routes

### 4.1 Sitemap

| Route                        | Group     | Access            | Description |
| ---------------------------- | --------- | ----------------- | ----------- |
| `/`                          | Landing   | Public            | Home - hero, features, CTA |
| `/about`                     | Landing   | Public            | About the system |
| `/contact`                   | Landing   | Public            | Contact info + form (mock submit) |
| `/login`                     | Auth      | Public (redirects if logged in) | Admin login |
| `/dashboard`                 | Dashboard | Admin only        | Redirects to `/dashboard/overview` |
| `/dashboard/overview`        | Dashboard | Admin only        | Overview - stats, recent activity, top dues (sidebar "Home") |
| `/dashboard/customers`       | Dashboard | Admin only        | Customer list + create/edit/delete |
| `/dashboard/customers/[id]`  | Dashboard | Admin only        | Customer detail - profile, history, balance, PDF |
| `/dashboard/transactions`    | Dashboard | Admin only        | All transactions + filters + CRUD |
| `/dashboard/dues`            | Dashboard | Admin only        | Due summaries per customer |

### 4.2 Directory Structure (target)

```
src/
├── app/
│   ├── (landing)/                 # Home, About, Contact - shared navbar/footer layout
│   │   ├── page.tsx               # /
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── login/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx             # Sidebar shell + auth guard
│   │   ├── page.tsx               # Overview
│   │   ├── customers/page.tsx
│   │   ├── customers/[id]/page.tsx
│   │   ├── transactions/page.tsx
│   │   └── dues/page.tsx
│   └── api/                       # v2 only
│       ├── auth/{login,logout,me}/route.ts
│       ├── customers/{,[id]}/route.ts
│       ├── transactions/{,[id]}/route.ts
│       ├── dues/route.ts
│       └── overview/route.ts
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── landing/                   # Hero, Features, Carousel sections, ContactForm...
│   ├── dashboard/                 # Sidebar, StatCard, CustomerTable, TransactionTable...
│   ├── pdf/                       # CustomerHistoryDocument (React PDF renderer)
│   └── shared/                    # EmptyState, ConfirmDialog, PageHeader, Reveal (motion)...
├── lib/
│   ├── utils.ts                   # cn(), formatters (currency, date)
│   ├── config.ts                  # App name, currency symbol - single source of truth
│   ├── mock-data.ts               # v1 dataset (deleted in v2)
│   ├── db.ts                      # v2 - Mongoose connection cache
│   ├── auth.ts                    # v2 - JWT sign/verify, session helpers
│   └── motion.ts                  # Shared Motion variants (fadeUp, stagger, ...)
├── models/                        # v2 - Customer.ts, Transaction.ts, Admin.ts
├── schemas/                       # zod schemas (customer, transaction, login)
└── types/                         # Shared domain types
```

(Exact file layout may adapt to Next.js 16 conventions found in `node_modules/next/dist/docs/` - structure above is the intent, not a straitjacket.)

---

## 5. Data Modeling (v2 - Mongoose)

### 5.1 Design Decisions

- **Append-only ledger:** balances are *always derived* by aggregating transactions - never stored on the customer. No editing history in place destroys trust in dues.
- **Two transaction types only:** `lend` (money given to customer) and `repayment` (money received).
- **Outstanding due** per customer = `Σ lend − Σ repayment`.
  - `> 0` → shown as **due** (red badge).
  - `= 0` → shown as **settled** (green badge).
  - `< 0` → shown as **advance** (blue badge) - overpayment is allowed and recorded.
- **Amounts:** stored as Mongoose `Decimal128`, validated `> 0`. All display goes through one shared currency formatter (§9.2).

### 5.2 `Customer`

| Field       | Type                 | Required | Notes |
| ----------- | -------------------- | -------- | ----- |
| `name`      | String               | ✅       | Trimmed, 2–80 chars |
| `phone`     | String               | ✅       | **Unique**, 6–20 chars, digits/`+`/`-`/space |
| `email`     | String               | ❌       | Valid e-mail if present |
| `address`   | String               | ❌       | ≤ 240 chars |
| `notes`     | String               | ❌       | ≤ 500 chars |
| `status`    | `'active' \| 'archived'` | ❌ (default `'active'`) | Archived customers hidden from lists, history kept |
| `createdAt` / `updatedAt` | timestamps | auto | |

Indexes: `{ phone: 1 }` (unique), `{ name: 'text' }`.

### 5.3 `Transaction`

| Field         | Type                          | Required | Notes |
| ------------- | ----------------------------- | -------- | ----- |
| `customerId`  | ObjectId → `Customer`         | ✅       | Cascade-deleted with customer |
| `type`        | `'lend' \| 'repayment'`       | ✅       | Enum |
| `amount`      | Decimal128                    | ✅       | `> 0`, ≤ 99,999,999 |
| `date`        | Date                          | ✅       | Defaults to now; back-datable |
| `method`      | `'cash' \| 'bank' \| 'mobile-banking' \| 'other'` | ❌ (default `'cash'`) | |
| `note`        | String                        | ❌       | ≤ 240 chars |
| `createdBy`   | ObjectId → `Admin`            | ✅       | Audit |
| `createdAt` / `updatedAt` | timestamps | auto | |

Indexes: `{ customerId: 1, date: -1 }`, `{ date: -1 }`, `{ type: 1 }`.

### 5.4 `Admin`

| Field         | Type     | Required | Notes |
| ------------- | -------- | -------- | ----- |
| `name`        | String   | ✅       | |
| `email`       | String   | ✅       | Unique, lowercase |
| `passwordHash`| String   | ✅       | bcrypt (cost ≥ 10) - plain password never stored |
| `createdAt` / `updatedAt` | timestamps | auto | |

Single seeded admin; no self-registration endpoint exists.

### 5.5 Derived Aggregations

| Metric | Computation |
| ------ | ----------- |
| Customer due | Aggregation on `transactions` by `customerId`: `Σ(type='lend') − Σ(type='repayment')` |
| Overview totals | Across all customers: `totalLent`, `totalCollected`, `totalOutstanding` |
| Last activity | Max `date` per customer |
| Running balance | Ordered by `date asc, createdAt asc` cumulative sum for the customer-detail table and PDF |

---

## 6. API Endpoints (v2)

All handlers under `src/app/api`. All responses use one envelope:

```jsonc
// success                                  // error
{ "success": true, "data": ... }            { "success": false, "message": "Human-readable reason" }
```

Auth: cookie session (JWT, httpOnly). Unauthenticated → `401`. Invalid input → `422` with message. Unknown server error → `500`.

### 6.1 Auth

| Method | Path              | Description |
| ------ | ----------------- | ----------- |
| POST   | `/api/auth/login` | Body `{ email, password }` → sets httpOnly JWT cookie |
| POST   | `/api/auth/logout`| Clears session cookie |
| GET    | `/api/auth/me`   | Current admin or `401` |

### 6.2 Customers

| Method | Path                   | Description |
| ------ | ---------------------- | ----------- |
| GET    | `/api/customers`       | List. Query: `search` (name/phone, partial, case-insensitive), `status`, `page` (default 1), `limit` (default 10). Each row includes derived `due` + `lastTransactionDate` |
| POST   | `/api/customers`       | Create. Duplicate phone → `409` |
| GET    | `/api/customers/[id]`  | Detail + summary (`totalLent`, `totalReceived`, `due`) + full transaction history with running balance |
| PATCH  | `/api/customers/[id]`  | Partial update. Phone collision → `409` |
| DELETE | `/api/customers/[id]`  | Delete customer **and cascade-delete their transactions**. Only via explicit confirm dialog |

### 6.3 Transactions

| Method | Path                       | Description |
| ------ | -------------------------- | ----------- |
| GET    | `/api/transactions`        | List. Query: `customerId`, `type`, `from`, `to` (date range), `page`, `limit`. Sorted `date desc` |
| POST   | `/api/transactions`        | Create. `customerId` must exist (`422` otherwise) |
| PATCH  | `/api/transactions/[id]`   | Partial update |
| DELETE | `/api/transactions/[id]`   | Delete (with confirm) |

### 6.4 Aggregates

| Method | Path             | Description |
| ------ | ---------------- | ----------- |
| GET    | `/api/dues`      | Per-customer due rows (`lent`, `received`, `due`, `lastTransactionDate`). Query: `search`, `onlyWithDue` (default true) |
| GET    | `/api/overview`  | `{ totalCustomers, totalLent, totalCollected, totalOutstanding, recentTransactions[10], topDues[5] }` |

> PDF needs **no endpoint** - it is generated client-side from `GET /api/customers/[id]` data (§10).

---

## 7. Functional Requirements

### FR-1 Landing Site (public)
1. **Home `/`** - hero (headline + one-line value prop + "Sign in" CTA), 3 feature cards (Customer management, Transaction ledger, Due summaries), a short how-it-works (3 steps), footer.
2. **About `/about`** - what the system is, who it's for, key principles (simple, private, accurate).
3. **Contact `/contact`** - contact info cards + form (name, email, message). v1: submit shows a success toast only (no delivery). v2: same behavior; persistence is out of scope (§15).
4. Shared landing navbar (Home / About / Contact + Sign in button) and footer; mobile menu via Sheet.
5. SEO metadata (title + description) per page; landing pages are statically rendered.
6. **Marquee band** after the hero - scrolling capabilities strip (pure CSS, paused for reduced motion).
7. **Testimonials section** on Home - quote cards with attribution (staggered reveal).
8. **Brand mark** - `/public/images/logo.png` via a shared `Logo` component, falling back to the gradient "L" block if the image is missing.

### FR-2 Authentication (admin only)
1. `/login` - e-mail + password form, loading state on submit, error toast on failure.
2. v1: mock - fixed demo credential (displayed as a hint on the page); success sets a client flag and redirects to `/dashboard`.
3. v2: real - bcrypt verify → JWT httpOnly cookie; `middleware` protects `/dashboard/*` (redirect → `/login?from=…`); `/login` redirects authenticated users to `/dashboard`.
4. Logout via admin dropdown in dashboard header → clears session → redirect to `/login`.
5. Login attempts are rate-limited (simple in-memory limiter per IP, v2).

### FR-3 Dashboard Shell
1. Sidebar (desktop): Overview, Customers, Transactions, Due Summaries - active-route highlighting.
2. Mobile: hamburger → Sheet navigation.
3. Header: page title, admin avatar dropdown (profile info, logout).
4. All dashboard data/actions require an authenticated session (guard in `dashboard/layout.tsx` + middleware in v2).

### FR-4 Overview (`/dashboard`)
1. Four stat cards: **Total Customers**, **Total Lent**, **Total Collected**, **Outstanding Due** (with currency formatting; outstanding uses red when > 0).
2. **Recent Transactions** list (latest 10) - date, customer, type badge, amount, note.
3. **Top Dues** list (5 highest outstanding) with link to each customer.
4. Quick actions: "Add Customer", "Add Transaction".

### FR-5 Customer Management (`/dashboard/customers`)
1. Table: name (with avatar initials), phone, total lent, total received, current due (badge: due / settled / advance), last activity, row actions (view / edit / delete).
2. **Search** by name or phone (debounced); pagination (10/page).
3. **Create / edit** in a Dialog: name, phone, email, address, notes - zod-validated inline.
4. **Delete** via AlertDialog with explicit confirmation, stating that all transactions will be permanently removed.
5. Empty state with "Add your first customer" CTA.

### FR-6 Customer Detail (`/dashboard/customers/[id]`)
1. Profile card (name, phone, email, address, notes, created date) + Edit / Delete actions.
2. Summary cards: Total Lent, Total Received, **Current Due** (badge).
3. Full transaction history table - date, type badge, method, note, amount, **running balance** - sorted oldest → newest.
4. **"Download History PDF"** button (FR-9).
5. Quick "Add Transaction" for this customer (Dialog, pre-filled customer).
6. Unknown id → friendly "Customer not found" state.

### FR-7 Transaction Management (`/dashboard/transactions`)
1. Table: date, customer (link), type badge (lend = red/out, repayment = green/in), method, note, amount, row actions (edit / delete).
2. Filters: customer (Select), type (Select), date range (from/to). Reset button.
3. Pagination (15/page), sorted newest first.
4. **Create / edit** Dialog: customer (searchable select), type, amount, date (default today), method, note - zod-validated.
5. **Delete** with AlertDialog confirmation.
6. Summary line for the current filter result: count + Σ lend + Σ repayment.

### FR-8 Due Summaries (`/dashboard/dues`)
1. Table per customer: name, phone, lent, received, **outstanding** (badge), last activity, actions (view, PDF).
2. Sorted by outstanding desc. Totals footer row.
3. Search + "show settled customers" toggle (default off).
4. One-click "Download PDF" per row (same FR-9 document).

### FR-9 Customer History PDF (single file)
1. One button → **one PDF** downloaded (filename `<customer-name>-history-<YYYY-MM-DD>.pdf`). Content per §10.
2. Generates client-side (jsPDF + autotable) from the customer-detail payload.
3. Loading state on the button + success toast; error toast on failure.

### FR-10 Feedback & States (global)
1. Every mutation (create/edit/delete/login/logout/PDF) → **Sonner** toast (success or error).
2. Destructive actions always confirmed (AlertDialog).
3. Loading: **skeleton states on every data-loading surface** - dashboard overview cards, every table (customers, transactions, dues), customer detail (profile + summary + history), and any filtered result - plus spinners/disabled state on buttons during submit.
4. Empty states everywhere (no customers / no transactions / no results).
5. Currency and date formatting via shared utils - never ad-hoc.

### FR-11 Responsive & Browser
1. Fully usable at 360 px width → desktop; tables scroll horizontally on mobile.
2. Works in latest Chrome, Edge, Firefox, Safari.

### FR-12 Animations & Micro-interactions (Motion / Framer Motion)
1. **Landing:** scroll-triggered section reveals (fade/rise on enter), staggered card entrances, animated hero text and CTAs, carousel sections (Embla) with smooth transitions.
2. **Dashboard:** stat-card entrance animations (including animated count-up numbers on Overview), subtle card hover elevation, list-row entrance staggering; no jarring full-page transitions.
3. **Shared motion language:** one set of variants/timings in `lib/motion.ts` (e.g. `fadeUp`, `stagger`) reused everywhere - not ad-hoc per page.
4. All animation respects `prefers-reduced-motion` (reduced to simple fades or none).
5. Animation is a polish layer: content and actions must be fully usable if it never runs.

---

## 8. Non-Functional Requirements

| # | Category | Requirement |
| - | -------- | ----------- |
| NFR-1 | Performance | Landing pages static; dashboard initial content < 2 s on average connection; lists paginated; search debounced (~300 ms) |
| NFR-2 | Security | Passwords bcrypt-hashed (never plaintext, never returned by API); JWT in httpOnly/SameSite cookie; all `/api/*` (except login) and `/dashboard/*` protected; all input zod-validated server-side; Mongoose prevents NoSQL-injection operator injection; no secrets in client bundle |
| NFR-3 | Usability | Minimalistic theme (§9); ≤ 3 clicks from login to any core action; destructive actions confirmed; consistent wording |
| NFR-4 | Accessibility | Semantic HTML; labeled inputs; visible focus states; color contrast ≥ WCAG AA (due/settled badges not color-only - always carry text) |
| NFR-5 | Reliability | Client-side and server-side validation agree (shared zod schemas); API errors surface as readable toasts; DB connection retried/cached per serverless function |
| NFR-6 | Maintainability | TypeScript strict; one source of truth for currency/app config (`lib/config.ts`); components colocated by feature; `npm run lint` + `npm run build` clean at every milestone |
| NFR-7 | SEO | Unique title/description on landing routes; Open Graph basics on Home |
| NFR-8 | Deployability | v2 runs on Vercel with env vars only (no code changes); `README` documents setup, env, seed, deploy |

---

## 9. Design System (minimalistic)

### 9.1 Principles
**Modern minimalistic - deliberately not a "generic AI template."** The bar: sections a designer would sign off on, not default scaffolding.

- Neutral zinc palette, generous whitespace, thin borders; shadows no heavier than shadcn defaults; one accent color for primary actions.
- **Editorial composition:** strong type scale contrast (oversized headings, tight tracking), asymmetric section layouts where it helps, numbered/step-grouped content, refined micro-copy - not rows of identical filler cards.
- **Motion as craft:** every landing section and dashboard module has an intentional entrance/hover behavior (FR-12); carousels where content benefits from browsing (features, testimonials-style quotes, FAQ-style steps).
- Real, specific copy (product-name, amounts, scenarios) instead of lorem-ipsum-shaped placeholders.
- Dense-but-calm dashboard tables with excellent alignment and scannable badges.
- **Light mode only** for v1/v2.

### 9.2 Foundations
- **Font:** Inter (Next.js default) - system fallback.
- **Palette:** cool neutral base + **teal-green primary** (`oklch(0.51 0.096 175)`); semantic only: red = due/lend-out, green = settled/repayment-in, blue = advance.
- **Gradients:** primary buttons, active sidebar chips, marquee, CTA band, and the login brand panel use teal gradients; cards carry a whisper-fade teal tint (gradient system in `globals.css`).
- **Radius:** `0` (sharp/editorial - radix-mira default).
- **Currency:** single constant in `lib/config.ts` - symbol **`৳` (BDT)** by default, trivially changeable; thousands separators via one shared `formatCurrency()`.
- **Dates:** one shared `formatDate()` (e.g. `19 Aug 2026`).

### 9.3 Component Mapping (shadcn)
| Area | Components |
| ---- | ---------- |
| Landing | Button, Card, Badge, Sheet (mobile nav), Input/Textarea (contact), **Carousel** (feature/quote sections), **Skeleton** |
| Auth | Card, Input, Label, Button, Sonner |
| Dashboard shell | Sidebar pattern (custom + Button/Tooltip), Sheet (mobile), Dropdown Menu (admin), Separator, Skeleton |
| Tables | Table, Badge, Input (search), Select, Dialog, AlertDialog, **Skeleton (loading)**, EmptyState (custom) |
| Forms | Form (react-hook-form) + Input/Select/Textarea/Calendar-or-date-input |
| Feedback | Sonner (all toasts) |
| Motion (all areas) | Shared `Reveal` wrapper + variants from `lib/motion.ts` (see FR-12) |

---

## 10. PDF Specification (per customer, single file)

**Filename:** `<customer-name>-history-<YYYY-MM-DD>.pdf`

Layout (single cohesive document, A4 portrait):

1. **Header** - App name + "Customer Lending History"; generated-on date.
2. **Customer block** - name, phone, email/address (if present), customer-since date.
3. **Summary row** - Total Lent · Total Received · **Current Outstanding** (bold, with "settled"/"advance" wording when applicable).
4. **Ledger table** - columns: `#`, Date, Type, Method, Note, Amount (signed: lend `−`, repayment `+`), **Running Balance**. Oldest → newest. Totals row at the bottom.
5. **Footer** - page numbers; "Generated by Lend Management System".

Generated client-side with **React PDF Renderer** (`@react-pdf/renderer`): the document is a declarative React component (`components/pdf/CustomerHistoryDocument.tsx` - Document/Page/Text/View primitives), triggered via its hooks (e.g. `usePDF`) and downloaded as a single Blob from the customer-detail payload; no server endpoint.

---

## 11. Security Specification (v2)

1. Passwords: bcrypt, cost ≥ 10; login compares hashes; never logged.
2. Session: JWT (HS256, `JWT_SECRET` from env) in an httpOnly, SameSite=Lax, Secure (production) cookie; short TTL with sliding refresh on activity.
3. `proxy.ts` guards `/dashboard/:path*` → redirect `/login?from=` (Next.js 16 renamed middleware to Proxy - file is `proxy.ts` at `src/` level); every `/api` handler (except `POST /api/auth/login`) verifies the session.
4. All mutating endpoints validate bodies with zod before touching the DB.
5. Login rate-limit: ≤ 5 failed attempts / 10 min / IP (in-memory; document limits in README).
6. Cascade deletes happen only through the confirmed endpoint path (no bulk endpoints exist).
7. MongoDB connection string and secrets live only in env vars; `.env*` git-ignored except `.env.example`.

---

## 12. Environment & Configuration

| Variable | Scope | Example / Notes |
| -------- | ----- | --------------- |
| `MONGODB_URI` | server | Atlas connection string |
| `JWT_SECRET` | server | ≥ 32 random chars |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed script | First admin; also the v1 demo credential |
| `NEXT_PUBLIC_APP_NAME` | client | "Lend Management System" |

`src/lib/config.ts` holds non-secret client constants: app name, currency symbol. `.env.example` committed and documented in README.

**Seed:** `npm run seed` (or `scripts/seed.ts`) - creates the admin from env; `--demo` flag optionally inserts sample customers/transactions.

---

## 13. Execution Workflow & Tracking

This requirements doc is **executed**, not just read. Three files drive the process:

| File | Purpose |
| ---- | ------- |
| `docs/requirements.md` | Source of truth (this file) |
| `docs/goals.md` | The step-by-step execution plan, **zero → end**. Generated from this doc. Ordered phases with atomic checkbox goals; each goal small enough to verify immediately |
| `docs/progress.md` | Append-only log. **One single line per completed small task**, appended the moment it's verified |

**Standing rules:** no npm packages outside the stack in §2 (package policy there); **git pushes are manual by the user** - after the v1 gate (and any later milestone) the agent asks, the user pushes.

### 13.1 goals.md conventions
- Phases mirror the build order (see §13.3) with checkboxes: `- [ ] G-01 Setup shadcn…`.
- A goal is done only when verified (lint + build + visual/API check where relevant).

### 13.2 progress.md conventions
One line per completed task, newest at the bottom:

```
[2026-08-19] G-01 Init shadcn + add button/card/input components - done
[2026-08-19] G-02 Landing Home page hero + features - done
```

### 13.3 Phase order (zero → end)
1. **Setup** - tooling, shadcn init, theme, config/utils, layouts.
2. **Landing site** - Home, About, Contact, navbar/footer, SEO.
3. **Auth (mock)** - login page + client guard.
4. **Dashboard shell** - sidebar, header, mobile nav.
5. **Mock data + domain logic** - typed dataset, balance/summary calculators (pure functions reused verbatim in v2).
6. **Customers module** - list, form, detail page.
7. **Transactions module** - list, filters, form.
8. **Dues module** - summary table.
9. **Overview module** - stats + recent + top dues.
10. **PDF export** - lib + wiring into detail & dues.
11. **v1 review** - user verifies design & features → sign-off → **ask the user to push to GitHub manually**.
12. **v2 data layer** - Mongoose models, db connection, zod schemas, seed.
13. **v2 API** - route handlers per §6 (+ error envelope).
14. **v2 auth** - bcrypt, JWT, middleware, logout, rate limit.
15. **v2 migration** - replace mock calls with API; loading/error states.
16. **Hardening** - validation pass, a11y pass, README, `.env.example`.
17. **Deploy** - Atlas + Vercel + smoke test on production URL.

---

## 14. Acceptance Criteria

### 14.1 v1 (static) - user sign-off checklist
- [ ] Landing Home / About / Contact render with navbar + footer, responsive, metadata set.
- [ ] Mock login works; dashboard unreachable without it; logout works.
- [ ] Dashboard sidebar navigation across all 4 sections with active states.
- [ ] Customers: search, pagination, create/edit/delete (with confirms) all function on mock data.
- [ ] Customer detail: profile, summary cards, full history with correct running balance.
- [ ] Transactions: create/edit/delete, filters (customer/type/date), pagination.
- [ ] Dues: per-customer totals correct vs mock data; badges (due/settled/advance) correct; totals row.
- [ ] Overview stat cards + recent + top dues reflect mock data.
- [ ] PDF: single file downloads with header, summary, ledger, running balance, footer.
- [ ] Toasts on every mutation; skeletons while loading; empty states present.
- [ ] Design quality: modern minimalistic, editorial sections, specific copy, carousel(s) - does **not** read as a generic AI template.
- [ ] Animations: section reveals, staggered cards, hero motion, overview count-up; `prefers-reduced-motion` respected.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] User pushes v1 to GitHub (manual, on request).

### 14.2 v2 (dynamic) - production checklist
- [ ] Login against seeded admin; wrong password rejected; rate limit triggers after 5 tries.
- [ ] `/dashboard/*` redirects to login when signed out; all `/api/*` (except login) return 401 when unauthenticated.
- [ ] All CRUD persists in MongoDB; dues/overview match actual DB contents.
- [ ] Validation: bad phone/duplicate phone/zero amount/unknown customer all rejected with readable errors.
- [ ] Customer delete cascades transactions (verified in DB).
- [ ] PDF works against live data.
- [ ] Production deployed on Vercel + Atlas; env vars set; smoke test passes; README complete.

---

## 15. Out of Scope / Future Enhancements

- Additional roles (staff, multi-tenant, read-only viewers)
- Interest, EMI schedules, reminders (SMS/e-mail/WhatsApp)
- Contact-form message storage or e-mail delivery
- Charts/analytics beyond overview cards; CSV/Excel export
- Dark mode, i18n, multi-currency
- Receipt printing, customer-facing portal
- Full audit log / soft-delete trash with restore

---

## 16. Glossary

| Term | Meaning |
| ---- | ------- |
| **Lend** | Money given by the admin to a customer (increases what they owe) |
| **Repayment** | Money received from a customer (decreases what they owe) |
| **Due / Outstanding** | `Σ lend − Σ repayment` for a customer |
| **Advance** | Negative due - customer has repaid more than borrowed |
| **Settled** | Due of exactly zero |
| **Running balance** | Cumulative due after each transaction, chronological |
