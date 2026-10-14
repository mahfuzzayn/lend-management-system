# Lend Management System - Requirements Specification

| Field    | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Version  | 1.5                                                         |
| Date     | 2026-10-14                                                  |
| Status   | **v2 FINAL** - production: https://lendbook.morlabs.co (fix rounds F1-F28 delivered; v3 is a new feature cycle, §15) |
| Owner    | Mahfuz Zayn                                                 |
| Repo     | `lend-management-system` (Next.js 16.3.1)                   |

> v1.3 (works.md fix round F1-F7): master-sheet data model (customer codes,
> business fields, risk/recovery, added-by), CSV/JSON exports, PDF redesign,
> responsive sweep, shadcn Calendar date picker, searchable customer picker.

> v1.4 (works.md fix round F8-F16): RBAC roles (Admin / Super Admin) with a
> soft-delete Trash (restore + super-admin purge), overview charts, richer
> search filters, date-picker month/year dropdowns + manual entry, 404 page.
> v1.4 (works.md fix round F17-F22): chart granularity toggle + per-customer
> charts + collection bar, scrollable dialogs, named greeting, suggested
> added-by, brand-token palette (#15088f / #f30608 / #150590) driving every
> gradient, collapsible sidebar.

> v1.5 (works.md fix round F23-F25): dead Add/Edit forms fixed (forms now
> default the v1.3 schema extras before client-side parse), customer picker
> renders in-place inside dialogs (wheel-scrollable) and names the picked row,
> customer-detail contact block (tel:/mailto: links + copy buttons).
> v1.5 (works.md fix round F26-F28): Trash cascade rules enforced end-to-end
> (delete modal always shows the real transaction count, cascade-deleted
> entries restore only after their customer), `lib/project.ts` one-file brand
> clone point, project closed out as v2 FINAL.

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
| Role        | Count     | Access |
| ----------- | --------- | ------ |
| Admin       | ≥ 1       | Everything except permanent deletes: all dashboard pages, create/edit, PDF/CSV export, soft delete (Trash), restore from Trash |
| Super Admin | ≥ 1       | Everything an Admin can do **plus** permanent delete (purge) of trashed customers/transactions |

Both roles sign in the same way; the role is a field on the `Admin` document
(§5.4) carried inside the session JWT. No public data access - all data is
behind login. There is no self-registration; admins are seeded from env or
created via the seed script / directly in the DB by the owner.

### 1.5 Scope Summary
**In scope:** landing site (Home / About / Contact), login, dashboard (Overview + charts, Customers, Transactions, Due Summaries), per-customer PDF export, admin authentication, RBAC roles with soft-delete Trash, CSV/JSON export, 404 page.

**Out of scope (see §15):** interest/EMI calculations, reminders (SMS/e-mail), multi-currency, reports beyond the customer PDF, dark mode.

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
| Charts           | **shadcn `Chart`** (wraps the pre-approved `recharts`) | Overview charts only (v1.4), lazy-loaded client-side |
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
| `customerCode` | String            | ❌       | Master-sheet ID (`C001`…); **unique + sparse**; auto-generated on create when omitted (next free `C###`) |
| `phone`     | String               | ❌       | **Unique + sparse** (many real customers have no phone), 6–20 chars, digits/`+`/`-`/space when present |
| `businessName` | String            | ❌       | ≤ 120 chars (master sheet "Business Name") |
| `alternativePhone` | String        | ❌       | ≤ 20 chars, same charset (master sheet "Alternative Phone") |
| `email`     | String               | ❌       | Valid e-mail if present |
| `address`   | String               | ❌       | ≤ 240 chars |
| `area`      | String               | ❌       | ≤ 120 chars (master sheet "Area" sometimes carries full sentences) |
| `businessType` | `'workshop' \| 'contractor' \| 'retail-shop' \| 'company' \| 'individual'` | ❌ | master sheet "Business Type" |
| `customerCategory` | String        | ❌       | ≤ 40 chars (master sheet "Customer Category") |
| `customerSince` | Date             | ❌       | Master sheet "Customer Since" |
| `riskLevel` | `'low' \| 'medium' \| 'high' \| 'critical'` | ❌ | Due-summary "Risk Level" |
| `recoveryStatus` | `'not-contacted' \| 'contacted' \| 'promise-made' \| 'partial-payment' \| 'completed' \| 'refused' \| 'disputed' \| 'legal-action'` | ❌ | Due-summary "Recovery Status" |
| `notes`     | String               | ❌       | ≤ 500 chars |
| `status`    | `'active' \| 'archived'` | ❌ (default `'active'`) | Archived customers hidden from lists, history kept |
| `deletedAt` | Date                | ❌       | Soft-delete marker (§5.7): set = the customer is in the Trash |
| `deletedBy` | ObjectId → `Admin`  | ❌       | Who soft-deleted it (audit) |
| `createdAt` / `updatedAt` | timestamps | auto | |

Indexes: `{ phone: 1 }` (unique, sparse), `{ customerCode: 1 }` (unique, sparse), `{ name: 'text' }`.

### 5.3 `Transaction`

| Field         | Type                          | Required | Notes |
| ------------- | ----------------------------- | -------- | ----- |
| `customerId`  | ObjectId → `Customer`         | ✅       | Cascade-deleted with customer |
| `type`        | `'lend' \| 'repayment'`       | ✅       | Enum; master-sheet `Credit` → `lend`, `Payment` → `repayment` |
| `amount`      | Decimal128                    | ✅       | `> 0`, ≤ 99,999,999 |
| `date`        | Date                          | ✅       | Defaults to now; back-datable |
| `method`      | `'cash' \| 'bank' \| 'mobile-banking' \| 'other'` | ❌ (default `'cash'`) | Master-sheet `bKash` → `mobile-banking` |
| `note`        | String                        | ❌       | ≤ 240 chars (master-sheet "Description") |
| `addedBy`     | String                        | ❌       | ≤ 60 chars - who recorded it, business-level (defaults to the session admin's name) |
| `referenceCode` | String                      | ❌       | ≤ 20 chars - master-sheet `TRX###` reference; **not** unique (source sheet reuses IDs) |
| `productCategory` | String                    | ❌       | ≤ 60 chars |
| `verificationStatus` | String                | ❌       | ≤ 40 chars |
| `referenceSource` | String                    | ❌       | ≤ 120 chars (physical book / video reference) |
| `createdBy`   | ObjectId → `Admin`            | ✅       | Audit (always the logged-in admin) |
| `deletedAt`   | Date                          | ❌       | Soft-delete marker (§5.7): set = the entry is in the Trash |
| `deletedBy`   | ObjectId → `Admin`            | ❌       | Who soft-deleted it (audit) |
| `createdAt` / `updatedAt` | timestamps | auto | |

Indexes: `{ customerId: 1, date: -1 }`, `{ date: -1 }`, `{ type: 1 }`.

### 5.4 `Admin`

| Field         | Type     | Required | Notes |
| ------------- | -------- | -------- | ----- |
| `name`        | String   | ✅       | |
| `email`       | String   | ✅       | Unique, lowercase |
| `passwordHash`| String   | ✅       | bcrypt (cost ≥ 10) - plain password never stored |
| `role`        | `'admin' \| 'super-admin'` | ❌ (default `'admin'`) | RBAC (§1.4); session JWT carries it. Pre-v1.4 admins/tokens (the legacy owner) resolve to `'super-admin'` so the upgrade never strips the owner's purge access; admins created from v1.4 on always carry an explicit role |
| `createdAt` / `updatedAt` | timestamps | auto | |

No self-registration endpoint exists. The seed script upserts the env admin
with `ADMIN_ROLE` (default `super-admin`) and can create further admins
(`npm run seed -- --create-admin "Name" email password [--role admin]`).

### 5.5 Derived Aggregations

| Metric | Computation |
| ------ | ----------- |
| Customer due | Aggregation on `transactions` by `customerId`: `Σ(type='lend') − Σ(type='repayment')` |
| Overview totals | Across all customers: `totalLent`, `totalCollected`, `totalOutstanding` |
| Last activity | Max `date` per customer |
| Running balance | Ordered by `date asc, createdAt asc` cumulative sum for the customer-detail table and PDF |

All derived math covers **live documents only** - anything sitting in the
Trash (`deletedAt` set, §5.7) is invisible to dues, overview totals, lists,
exports, and the PDF, exactly as if it were already gone.

### 5.5b Overview chart series (v1.4)

| Series | Computation |
| ------ | ----------- |
| Flow in/out | `Σ lend` (out) and `Σ repayment` (in) bucketed by `granularity` - week (last 12 ISO weeks), month (last 12 calendar months, the default), or year (all years) |
| Recovery mix | Active customers grouped by `recoveryStatus` (unset counted as "not set") |
| Collection progress | `Σ collected ÷ Σ lent` as one filled bar with the Lent out / Repayment / Due amounts beside it (replaces the v1.4-draft rate line chart, works.md F17) |

Chart data is served by its own endpoint (`GET /api/overview/charts?granularity=week|month|year`)
so the overview page can render instantly and stream charts in afterwards
(FR-4.5). The customer detail page computes the same series client-side from
its ledger payload through the same pure calculators.

### 5.6 Master-sheet import (docs/data, v1.3)

The real ledger arrives as the "Mihad Traders" spreadsheet export (6 CSVs).
Imported by `scripts/import-mihad-csv.ts` (`npm run import-csv`):

- **Customers.csv + Due Summary.csv → Customer.** Join on customer ID. The
  duplicated `C002` row (Saiful Islam) is really `C003` (Due Summary's key).
  Empty `C095` rows are skipped. `N/A` / blank values become absent fields.
  Risk Level + Recovery Status land on the customer from Due Summary.
  "Current Status" (empty everywhere) is **not** modeled - `status`
  active/archived keeps its existing meaning.
- **Transactions.csv → Transaction.** Payment/Credit → repayment/lend;
  Cash/bKash → cash/mobile-banking; `TRXOO2` typo fixed to `TRX002`; empty
  rows skipped; duplicated TRX IDs are kept (reference codes are not unique).
  Phones are quote-stripped (`'01711…'`, `"""017…"""` → digits).
- **Opening balances.** The sheet carries *lifetime* credit/payment totals
  while Transactions.csv only covers Jul-Sep 2026, so each customer also gets
  synthetic opening rows dated 2026-01-01: one `lend` of
  `max(totalCredit, Σ imported payments)` and one `repayment` of
  `max(0, totalPayment − Σ imported payments)`. Derived dues therefore match
  the real ledger math even where the sheet's own "Current Due" column was
  inconsistent (it ignored payments on several rows).
- **Record Reference / Recovery Tracking CSVs** are empty schemas - skipped;
  they become real modules later (§15). **Settings.csv** only informs the
  enums above.
- The import is **additive and idempotent-guarded** (aborts if any `C0##`
  code already exists) - it never wipes existing rows.
- One-time index migration: the `phone_1` unique index becomes **sparse**
  (multiple customers without phones are legal now).

### 5.7 Soft delete - the Trash (v1.4)

Safety net against mistaken deletes: removing data is two-stage.

- **Soft delete (Admin and Super Admin):** `DELETE` sets `deletedAt`/`deletedBy`
  instead of removing the document. The row leaves every live list, total, and
  export immediately. Soft-deleting a customer also soft-deletes their live
  transactions (one shared timestamp) so the whole ledger moves to the Trash
  together.
- **Trash view:** `GET …?trash=true` returns only soft-deleted rows. The
  Customers and Transactions tables expose it as a "Show trash" toggle.
- **Restore (Admin and Super Admin):** `POST /api/<entity>/[id]/restore`
  clears `deletedAt`/`deletedBy`. Restoring a customer also restores exactly
  the transactions that were cascade-deleted with it (matched by the shared
  `deletedAt`). **Restore order (v1.5, works.md F26):** an entry that left the
  ledger with a trashed customer restores only AFTER that customer - the
  transaction restore endpoint answers `422` ("restore the customer first")
  while the owner sits in the Trash, and the trash view marks those rows
  ("owner trashed") with the restore action disabled, so no live entry can
  ever sit under a trashed customer in dues or totals. The delete-customer
  dialog always states the real transaction count it will cascade (fetched
  when the caller doesn't know it).
- **Purge (Super Admin only):** `DELETE …?purge=true` removes the document
  permanently (customer purge cascades a hard delete of all its transactions).
  Admins attempting it get `403`.
- **Rules:** trashed rows cannot be edited or appended to (422 with a
  "restore first" message); codes stay unique while their owner sits in the
  Trash (auto-generated `C###` never reuses a trashed code); archived/trashed
  are independent - Trash wins for visibility.

---

## 6. API Endpoints (v2)

All handlers under `src/app/api`. All responses use one envelope:

```jsonc
// success                                  // error
{ "success": true, "data": ... }            { "success": false, "message": "Human-readable reason" }
```

Auth: cookie session (JWT, httpOnly). Unauthenticated → `401`. Invalid input → `422` with message. Action not allowed for the session's role → `403`. Unknown server error → `500`.

### 6.1 Auth

| Method | Path              | Description |
| ------ | ----------------- | ----------- |
| POST   | `/api/auth/login` | Body `{ email, password }` → sets httpOnly JWT cookie (carries the admin's `role`) |
| POST   | `/api/auth/logout`| Clears session cookie |
| GET    | `/api/auth/me`   | Current admin (incl. `role`) or `401` |

### 6.2 Customers

| Method | Path                   | Description |
| ------ | ---------------------- | ----------- |
| GET    | `/api/customers`       | List. Query: `search` (name/phone/**alternativePhone**/customerCode/businessName/**area**, partial, case-insensitive), `riskLevel`, `recoveryStatus`, `status`, `trash` (`true` = only soft-deleted rows, §5.7), `page` (default 1), `limit` (default 10). Each row includes derived `due` + `lastTransactionDate` |
| POST   | `/api/customers`       | Create. Duplicate phone or customerCode → `409`. `customerCode` auto-generated (next free `C###`, never reusing a trashed code) when omitted |
| GET    | `/api/customers/[id]`  | Detail + summary (`totalLent`, `totalReceived`, `due`) + full live transaction history with running balance |
| PATCH  | `/api/customers/[id]`  | Partial update. Phone collision → `409`. Trashed customer → `422` (restore first) |
| DELETE | `/api/customers/[id]`  | Soft delete (§5.7): customer + their live transactions move to the Trash. Explicit confirm dialog client-side |
| DELETE | `/api/customers/[id]?purge=true` | **Super Admin only** (else `403`): permanent delete + hard cascade of all their transactions |
| POST   | `/api/customers/[id]/restore` | Restore from the Trash (customer + its cascade-deleted transactions) |

### 6.3 Transactions

| Method | Path                       | Description |
| ------ | -------------------------- | ----------- |
| GET    | `/api/transactions`        | List. Query: `customerId`, `type`, `from`, `to` (date range), `trash` (`true` = only soft-deleted), `page`, `limit`. Sorted `date desc` |
| POST   | `/api/transactions`        | Create. `customerId` must exist (`422` otherwise); a trashed customer is rejected with `422` |
| PATCH  | `/api/transactions/[id]`   | Partial update. Trashed entry → `422` (restore first) |
| DELETE | `/api/transactions/[id]`   | Soft delete (§5.7) - the entry moves to the Trash (with confirm) |
| DELETE | `/api/transactions/[id]?purge=true` | **Super Admin only** (else `403`): permanent delete |
| POST   | `/api/transactions/[id]/restore` | Restore from the Trash |

### 6.4 Aggregates

| Method | Path             | Description |
| ------ | ---------------- | ----------- |
| GET    | `/api/dues`      | Per-customer due rows (`lent`, `received`, `due`, `lastTransactionDate`). Query: `search` (code/name/business/phone/**area/alternativePhone**), `riskLevel`, `recoveryStatus`, `onlyWithDue` (default true). Live customers only |
| GET    | `/api/overview`  | `{ totalCustomers, totalLent, totalCollected, totalOutstanding, recentTransactions[10], topDues[5] }` - live documents only |
| GET    | `/api/overview/charts` | Chart series per §5.5b: query `granularity` = `week` \| `month` (default) \| `year`; returns `{ flow, recovery }` |

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
2. **Sidebar collapse (v1.4, works.md F22):** a footer toggle collapses the desktop sidebar to an icon-only rail (and back); the rail links carry `title`/`aria-label`, and the width + content padding animate together for one smooth motion. Mobile keeps the Sheet navigation.
3. Mobile: hamburger → Sheet navigation.
4. Header: page title, admin avatar dropdown (profile info + role, logout).
5. All dashboard data/actions require an authenticated session (guard in `dashboard/layout.tsx` + middleware in v2).

### FR-4 Overview (`/dashboard`)
1. Four stat cards: **Total Customers**, **Total Lent**, **Total Collected**, **Outstanding Due** (with currency formatting; outstanding uses red when > 0).
2. **Recent Transactions** list (latest 10) - date, customer, type badge, amount, note.
3. **Top Dues** list (5 highest outstanding) with link to each customer.
4. Quick actions: "Add Customer", "Add Transaction".
5. **Charts row (v1.4):** three charts per §5.5b - (a) money **in vs out** bars with a **week / month / year granularity toggle**, (b) **recovery-status mix** donut (tooltip always stacks above the center label), (c) **collection progress** filled bar comparing Lent out / Repayment / Due. Lazy-loaded: the page renders immediately with skeletons, chart data arrives from `/api/overview/charts` and the chart bundle code-splits behind `next/dynamic`. Palette per §9.2; fully responsive (stacks on mobile).
6. The greeting addresses the signed-in admin by name ("Good evening, Mahfuz Zayn.").

### FR-5 Customer Management (`/dashboard/customers`)
1. Table: customer code + name (with avatar initials), phone, total lent, total received, current due (badge: due / settled / advance), last activity, row actions (view / edit / delete).
2. **Search** by code, name, business name, phone, alternative phone or area (debounced ~300 ms, server-side, query-driven - results update as you type with no UI jank); **filter selects** for risk level and recovery status; pagination (10/page).
3. **Create / edit** in a Dialog: name, phone, alternative phone, business name, area, business type, risk level, recovery status, e-mail, address, customer since, notes - zod-validated inline. The customer code shows read-only (assigned on create).
4. **Delete** via AlertDialog with explicit confirmation - moves the customer and their transactions to the **Trash** (restorable, §5.7). A "Show trash" toggle lists trashed rows with **Restore** and (Super Admin only) **Delete permanently**.
5. Empty state with "Add your first customer" CTA.
6. **Export** the full filtered scope as CSV or JSON (FR-9b).

### FR-6 Customer Detail (`/dashboard/customers/[id]`)
1. Profile card (code, name, business name, phones, e-mail, address, area, business type, risk/recovery, notes, created date) + Edit / Delete actions.
2. **Contact block (v1.5, works.md F25):** phones and e-mail render as a
   visibly actionable list - each row is a `tel:` / `mailto:` link (calling /
   mail app hand-off) with an icon chip and a one-click copy button (clipboard
   + toast + tick feedback). "No contact on file" placeholder when empty.
3. Summary cards: Total Lent, Total Received, **Current Due** (badge).
4. Full transaction history table - date, type badge, method, note, added by, amount, **running balance** - sorted oldest → newest.
5. **Download history** as PDF (FR-9), or as CSV/JSON of the same customer payload (FR-9b).
6. Quick "Add Transaction" for this customer (Dialog, pre-filled customer).
7. **Insight charts (v1.4, works.md F17):** the customer's money in/out bars (with the week/month/year toggle), a payment-method mix donut, and the collection progress bar - computed client-side from the ledger payload through the shared calculators, lazy-loaded with skeletons.
8. Unknown id → friendly "Customer not found" state.
9. Fully responsive - the primary daily surface on phones.

### FR-7 Transaction Management (`/dashboard/transactions`)
1. Table: date, customer (code + name, link), type badge (lend = red/out, repayment = green/in), method (label-cased), note, added by, amount, row actions (edit / delete).
2. Filters: customer (**searchable picker** - code/name/phone), type (Select), date range (from/to, both the shared **DatePicker**). Reset button.
3. Pagination (15/page), sorted newest first.
4. **Create / edit** Dialog: customer (**searchable picker** - mouse, touch and keyboard: arrows + Enter), type, amount, date (default today, **shadcn Calendar** in a popover, never future), method (label-cased options), note, **added by** (text field with suggested names - the fixed staff list plus free entry, works.md F20) - zod-validated. Long dialogs scroll vertically inside the viewport - never overflow off-screen (works.md F18).
5. **Delete** with AlertDialog confirmation - moves the entry to the **Trash**; a "Show trash" toggle lists trashed entries with **Restore** and (Super Admin only) **Delete permanently** (§5.7).
6. Summary line for the current filter result: count + Σ lend + Σ repayment.
7. **Export** the full filtered scope as CSV or JSON (FR-9b).

### FR-8 Due Summaries (`/dashboard/dues`)
1. Table per customer: code + name, phone, lent, received, **outstanding** (badge), last activity, actions (view, PDF).
2. Sorted by outstanding desc. Totals footer row.
3. Search (code/name/business/phone/area, debounced server-side) + filter selects for risk level and recovery status + "show settled customers" toggle (default off).
4. One-click "Download PDF" per row (same FR-9 document).
5. **Export** the visible scope as CSV or JSON (FR-9b).

### FR-9 Customer History PDF (single file)
1. One button → **one PDF** downloaded (filename `<customer-name>-history-<YYYY-MM-DD>.pdf`). Content per §10 - Lendbook logo + teal brand palette, all §5.2/§5.3 columns.
2. Generates client-side (React PDF Renderer) from the customer-detail payload.
3. Loading state on the button + success toast; error toast on failure.

### FR-9b Data Export (CSV / JSON, v1.3)
1. Customers, Transactions and Due Summaries each offer **Export CSV** and **Export JSON** over the full filtered scope (all pages, not just the visible one); the customer detail page exports its own payload.
2. CSV columns follow the master-sheet data model (§5.2/§5.3) - codes, business fields, risk/recovery, added-by - so the files round-trip back into the user's spreadsheet.
3. One shared client-side exporter (`lib/export.ts`): UTF-8 BOM (৳ renders in Excel), RFC-4180 quoting, `formatCurrency`-consistent raw numbers (unformatted, spreadsheet-friendly).
4. Generated client-side; no server endpoint.

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

### FR-13 Shared DatePicker behavior (v1.4)
1. The calendar popover offers **month and year dropdowns** (no endless month-paging) and a **manual date input** accepting `DD/MM/YYYY` (also `YYYY-MM-DD`), so a far-back date is a few keystrokes away. Used wherever a date is picked (transaction date, transaction filters, customer since).

### FR-14 Not Found page (v1.4)
1. A themed `app/not-found.tsx` catches every unmatched URL: oversized editorial "404", one line of product-real copy, a **Return home** button. Matches the landing design system (§9) and works at 360 px.

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
- **Business identity (v1.5, works.md F27):** everything the UI shows as "the
  company" - brand name, tagline, description, logo path, contact channels -
  lives in ONE static file, `src/lib/project.ts` (`PROJECT`). `lib/config.ts`
  derives `APP_NAME`/`APP_TAGLINE`/`APP_DESCRIPTION` from it, and the landing
  pages, Logo component, dashboard chrome, and the PDF render from those. The
  clone recipe for a new owner: edit `lib/project.ts`, drop their logo at
  `brand.logo.src`, set the `--brand-*` trio in `globals.css`. Nothing else
  hardcodes the identity.
- **Palette (v1.4, works.md F21):** defined once in `globals.css` as the **brand trio** - `--brand-primary` `#15088f` (deep indigo), `--brand-secondary` `#f30608` (signal red), `--brand-accent` `#150590` - from which `--primary`, `--destructive`, and the tinted neutrals derive. Re-theming = editing those three (+ the tint hue), nothing else. Semantic only: red = due/lend-out, green = settled/repayment-in, blue = advance.
- **Gradients:** every gradient (primary buttons, active sidebar chip, marquee, CTA band, login brand panel, testimonial avatars, logo block, hero/404 accents, the card whisper tint) references the shared `--grad-from/--grad-via/--grad-to` stops, which `color-mix` from the brand trio - so gradients always follow the palette.
- **Radius:** `0` (sharp/editorial - radix-mira default).
- **Currency:** single constant in `lib/config.ts` - symbol **`৳` (BDT)** by default, trivially changeable; thousands separators via one shared `formatCurrency()`.
- **Dates:** one shared `formatDate()` (e.g. `19 Aug 2026`).
- **Charts (v1.4):** categorical ramp `--chart-1…6` indigo-anchored and validated (CVD + contrast) with the semantic in/out pair (red `#f30608` = lend out, emerald `#059669` = repaid in); grids/axes/text are quiet neutrals; legends always carry text (NFR-4).

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

Layout (single cohesive document, A4 portrait), in the **Lendbook brand**: logo
image (`/public/images/logo.png`) in the header, teal accent rules and summary
values, semantic red/green/blue kept for due/repayment/advance:

1. **Header** - logo + app name + "Customer Lending History"; generated-on date.
2. **Customer block** - code, name, business name, phones, e-mail, address/area
   (if present), risk/recovery labels, customer-since date.
3. **Summary row** - Total Lent · Total Received · **Current Outstanding** (bold, with "settled"/"advance" wording when applicable).
4. **Ledger table** - columns: `#`, Date, Type, Method, Note, Added By (when
   present), Amount (signed: lend `−`, repayment `+`), **Running Balance**.
   Oldest → newest. Totals row at the bottom.
5. **Footer** - page numbers; "Generated by Lendbook".

Generated client-side with **React PDF Renderer** (`@react-pdf/renderer`): the document is a declarative React component (`components/pdf/CustomerHistoryDocument.tsx` - Document/Page/Text/View primitives), triggered via its hooks (e.g. `usePDF`) and downloaded as a single Blob from the customer-detail payload; no server endpoint.

---

## 11. Security Specification (v2)

1. Passwords: bcrypt, cost ≥ 10; login compares hashes; never logged.
2. Session: JWT (HS256, `JWT_SECRET` from env) in an httpOnly, SameSite=Lax, Secure (production) cookie; short TTL with sliding refresh on activity.
3. `proxy.ts` guards `/dashboard/:path*` → redirect `/login?from=` (Next.js 16 renamed middleware to Proxy - file is `proxy.ts` at `src/` level); every `/api` handler (except `POST /api/auth/login`) verifies the session.
4. All mutating endpoints validate bodies with zod before touching the DB.
5. Login rate-limit: ≤ 5 failed attempts / 10 min / IP (in-memory; document limits in README).
6. Cascade deletes happen only through the confirmed endpoint path (no bulk endpoints exist).
7. **Role enforcement is server-side (v1.4):** purge endpoints verify the session's role is `super-admin` and return `403` otherwise - the UI hiding the button is courtesy, not the gate. Soft delete/restore are open to any admin.
8. MongoDB connection string and secrets live only in env vars; `.env*` git-ignored except `.env.example`.

---

## 12. Environment & Configuration

| Variable | Scope | Example / Notes |
| -------- | ----- | --------------- |
| `MONGODB_URI` | server | Atlas connection string |
| `JWT_SECRET` | server | ≥ 32 random chars |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed script | First admin; also the v1 demo credential |
| `ADMIN_ROLE` | seed script | `admin` or `super-admin` (default) for the seeded admin (v1.4) |

Brand identity (name, tagline, logo, contact channels) is **not** env-driven:
it lives in the static `src/lib/project.ts` (v1.5 clone point, §9.2);
`src/lib/config.ts` derives the display constants from it and holds the
currency symbol. `.env.example` committed and documented in README.

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

> **v3 outlook (v2 closed 2026-10-14):** the next cycle is feature work, not
> fixes - the owner's first noted item is a **full design upgrade guided by a
> reference image** (total UI + dashboard redesign; requirements §9.1's
> "editorial distinctiveness" pushed further), plus the Backlog candidates
> below. v3 scope starts as a fresh requirements revision + a NEW goal list
> per §13 - never appended to the v2 build phases.

- **Full UI redesign** inspired by the owner's reference image (v3 kickoff candidate) - landing + dashboard visual overhaul, layout/typography/motion system, keeping the current data model and API
- Additional roles beyond Admin / Super Admin (staff, multi-tenant, read-only viewers)
- Interest, EMI schedules, reminders (SMS/e-mail/WhatsApp)
- Contact-form message storage or e-mail delivery
- Charts/analytics beyond the overview charts; Excel (non-CSV) export
- Dark mode, i18n, multi-currency
- Receipt printing, customer-facing portal
- Full audit log (who changed what beyond the delete markers)
- Recovery Tracking module + Record Reference module (CSV schemas already in docs/data, §5.6)

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
