# Goals - Step-by-Step Execution Plan (Zero → End)

> ✅ **v2 BUILD COMPLETE — 2026-10-13** (74 goals, 17 phases below) ·
> ✅ **v2 CLOSED FINAL — 2026-10-14** after fix rounds F1-F28 (retrospective
> below). Future work starts new goal lists (features/fixes) per the workflow
> in requirements §13 - never append v3 scope to the build phases. **Where v3
> picks up: see "v3 kickoff" at the bottom of this file.**

Generated from `docs/requirements.md` v1.1 (§13.3). This is the build checklist.

**Working rules**

1. Work strictly top → bottom. Never skip a goal; never start v2 before the v1 gate (G-46).
2. A goal is **done** only when verified - lint clean, build passes, and a visual/functional check where relevant.
3. The moment a goal is verified: tick its checkbox here **and** append one line to `progress.md`.
4. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` - this Next.js 16 has breaking changes (see AGENTS.md).
5. Scope changes go into `docs/requirements.md` first, then propagate here.
6. **No new npm packages** beyond the stack declared in requirements §2 (incl. shadcn CLI-managed component deps). If something extra seems necessary, stop, propose it, get approval, update requirements §2 first - only then install.
7. **Git is pushed manually by the user.** The agent never pushes; at the v1 gate (and later milestones) it asks the user to push.

---

## Phase 1 - Setup

- [x] G-01 Read Next.js 16 docs (`node_modules/next/dist/docs/`): routing, layouts, metadata, route handlers, middleware - note breaking changes vs. prior conventions
- [x] G-02 Init shadcn/ui; add components: button, card, input, label, badge, table, dialog, alert-dialog, dropdown-menu, select, sheet, skeleton, separator, textarea, sonner, form, carousel; install zod, @react-pdf/renderer, motion, embla-carousel-react - nothing else
- [x] G-03 Create `src/lib/config.ts` (app name, currency symbol) + `src/lib/utils.ts` (`cn`, `formatCurrency`, `formatDate`)
- [x] G-04 Minimalistic theme in `globals.css` - zinc neutrals, light mode only, shadcn defaults
- [x] G-05 Domain types in `src/types/` - Customer, Transaction, TransactionType, DueStatus, CustomerWithDue, OverviewStats
- [x] G-06 Motion foundation: `src/lib/motion.ts` shared variants (`fadeUp`, `stagger`, hover) + `Reveal` wrapper component + `prefers-reduced-motion` handling
- [x] G-07 Root layout: metadata + Sonner `<Toaster />` mounted; lint + build pass

## Phase 2 - Landing Site (design bar: modern minimalistic, not generic-AI)

- [x] G-08 `(landing)` route group layout: navbar + footer, mobile Sheet menu, Sign-in CTA
- [x] G-09 Home `/`: hero - oversized editorial headline, animated text + CTA (Motion)
- [x] G-10 Home: 3 feature cards with staggered entrance + how-it-works steps - specific, real copy
- [x] G-11 Home: at least one Carousel section (Embla - features walkthrough / quotes / FAQ) with smooth transitions
- [x] G-12 Scroll-reveal animations across all landing sections (shared `Reveal`), page metadata
- [x] G-13 About `/about`: purpose, audience, principles + metadata
- [x] G-14 Contact `/contact`: info cards + form (name/email/message, mock submit → toast) + metadata
- [x] G-15 Landing responsive + animation check at 360 px → desktop; `prefers-reduced-motion` verified; lint + build pass

## Phase 3 - Auth (mock)

- [x] G-16 Login page UI - card form, demo-credential hint, loading state, error toast, subtle entrance animation
- [x] G-17 Mock auth helper (`src/lib/auth-mock.ts`): login / logout / session flag + `DEMO_CREDENTIAL` from config
- [x] G-18 Guards: `dashboard/layout.tsx` redirects unsigned-in → `/login`; `/login` redirects signed-in → `/dashboard`

## Phase 4 - Dashboard Shell

- [x] G-19 Desktop sidebar: Overview, Customers, Transactions, Due Summaries + active-route highlighting
- [x] G-20 Header: page title + admin avatar dropdown (logout)
- [x] G-21 Mobile: hamburger → Sheet navigation
- [x] G-22 Placeholder pages for all 4 sections; navigation verified end-to-end

## Phase 5 - Mock Data + Domain Logic

- [x] G-23 `src/lib/mock-data.ts`: 8–10 customers (incl. one fully settled, one overpaid/advance, one archived)
- [x] G-24 40+ transactions across customers - varied dates (incl. today/back-dated), amounts, methods, notes
- [x] G-25 Pure calculators (`src/lib/domain.ts`): customer summary, running balance, due status badge, list-with-dues, dues table rows, overview stats, top dues, last activity
- [x] G-26 Spot-verify calculators by hand against 3 mock customers (incl. advance case)

## Phase 6 - Customers Module

- [x] G-27 Customers list: table (avatar initials, phone, lent, received, due badge, last activity, row actions) + **skeleton while loading**
- [x] G-28 Debounced search (name/phone) + pagination (10/page) + empty state
- [x] G-29 Create/Edit Dialog with zod validation (inline errors) + success/error toasts
- [x] G-30 Delete via AlertDialog (states cascade) + toast
- [x] G-31 Customer detail page: profile card + summary cards (lent / received / current due badge) + skeleton loading
- [x] G-32 Detail: full history table with running balance (oldest → newest) + skeleton loading
- [x] G-33 Detail: not-found state; Edit / Delete actions wired; quick "Add Transaction" opens form (customer pre-filled)

## Phase 7 - Transactions Module

- [x] G-34 Transactions list: table (date, customer link, type badge, method, note, amount, row actions) + **skeleton while loading**
- [x] G-35 Filters: customer Select, type Select, date from/to + reset; summary line (count, Σ lend, Σ repayment)
- [x] G-36 Pagination (15/page), newest first, empty state
- [x] G-37 Create/Edit Dialog: searchable customer select, type, amount, date (default today), method, note - zod validated + toasts
- [x] G-38 Edit + delete with AlertDialog confirms + toasts

## Phase 8 - Due Summaries

- [x] G-39 Dues table: name, phone, lent, received, outstanding (badge), last activity, actions - sorted desc + totals footer + **skeleton while loading**
- [x] G-40 Search + "show settled" toggle (default off) + row actions (view customer, download PDF)

## Phase 9 - Overview

- [x] G-41 Four stat cards with **skeleton loading + Motion count-up entrance** (Outstanding red when > 0)
- [x] G-42 Recent Transactions (10) + Top Dues (5, linked) lists with skeleton loading
- [x] G-43 Quick actions: "Add Customer" / "Add Transaction" open their dialogs

## Phase 10 - PDF Export (React PDF renderer)

- [x] G-44 `components/pdf/CustomerHistoryDocument.tsx`: declarative React PDF per requirements §10 - header, customer block, summary row, ledger (signed amounts + running balance), totals, footer/page numbers; downloaded client-side via `usePDF` as one file
- [x] G-45 Wire "Download History PDF" on customer detail + per-row buttons on dues table - loading state, toasts, filename `<name>-history-<YYYY-MM-DD>.pdf`; verify output vs mock data (balances, settled/advance wording, single file)

## Phase 11 - v1 Review 🔒 GATE

- [x] G-46 Full pass: lint + build + walkthrough of every item in requirements §14.1 (incl. design-quality + animation checks)
- [x] G-47 GATE closed 2026-10-13 - user authorized carrying on to v2 phases; own review updates/modifications deferred to the user (memo'd in works.md #Backlog); v1 committed by user (66cc508, b1876d8) - any further push stays manual on their side

## Phase 12 - v2 Data Layer

- [x] G-48 Install mongoose (only new package for v2, per requirements §2); `src/lib/db.ts` connection cache (serverless-safe)
- [x] G-49 Mongoose models: `Admin`, `Customer`, `Transaction` per requirements §5 (fields, enums, Decimal128, indexes, timestamps)
- [x] G-50 Zod schemas in `src/schemas/`: customer, transaction, login - shared client/server
- [x] G-51 Seed script (`npm run seed`): admin from env + `--demo` flag; commit `.env.example`

## Phase 13 - v2 API

- [x] G-52 `src/lib/api.ts`: response envelope + error helpers (401/409/422/500 shapes)
- [x] G-53 `/api/auth/{login,logout,me}`
- [x] G-54 `/api/customers`: list (search + pagination + derived dues), create (duplicate phone → 409)
- [x] G-55 `/api/customers/[id]`: detail (summary + history w/ running balance), PATCH, DELETE cascade
- [x] G-56 `/api/transactions` + `/api/transactions/[id]`: CRUD, filters, pagination
- [x] G-57 `/api/dues` + `/api/overview` aggregations
- [x] G-58 Exercise every endpoint (REST client) incl. 401/422/409 paths

## Phase 14 - v2 Auth

- [x] G-59 `src/lib/auth.ts`: bcrypt verify, JWT sign/verify (httpOnly SameSite cookie), `JWT_SECRET` env
- [x] G-60 `proxy.ts` (Next 16's renamed middleware): guard `/dashboard/:path*` + all `/api/*` except login
- [x] G-61 Login rate limit: ≤ 5 failed attempts / 10 min / IP (in-memory)
- [x] G-62 Real logout + redirect flows verified in browser

## Phase 15 - v2 Migration

- [x] G-63 Swap customers pages from mock data → API (keep skeletons, add error toasts)
- [x] G-64 Swap transactions, dues, overview pages → API
- [x] G-65 Real login flow wired; delete `mock-data.ts` + `auth-mock.ts`
- [x] G-66 PDF verified against live DB data

## Phase 16 - Hardening

- [x] G-67 Validation-parity pass: client messages match server 422 reasons
- [x] G-68 Accessibility pass: labels, focus rings, contrast, badges not color-only, reduced-motion honored
- [x] G-69 Responsive sweep: every page 360 px → desktop
- [x] G-70 README: setup, env vars, seed, deploy + complete `.env.example`
- [x] G-71 Final lint + build + full §14.2 checklist locally

## Phase 17 - Deploy

- [x] G-72 MongoDB Atlas database + user; connection string into Vercel env vars
- [x] G-73 Deploy to Vercel (production), seed prod admin, set all env vars
- [x] G-74 Production smoke test vs §14.2 → mark v2 complete → **ask user to push final state to GitHub**

---

# Post-v2 Retrospective - Fix & Update Rounds (what we did, phase by phase)

The 17 phases above built v1 → v2. Everything after the deploy was delivered
as works.md fix rounds; this section records them as phases so the project's
full history reads in one place (works.md #3, F28). Each round was verified
per the standing rules (lint + tsc + build; runtime E2E from F23 on) and
logged line-by-line in `progress.md`.

## Phase R1 - v1 Design Review Fixes (2026-08-19/20)

User design pass over the static prototype: x-axis padding sweep across
landing/dashboard cards (incl. the tilted hero card), Practice-carousel border
overflow fix, sidebar "Home" + logo→overview routing fix (one active route at
a time), PDF table padding, teal theme + gradient system (later superseded by
F21), hero marquee band, Home testimonials section, logo image with gradient
"L" fallback. Exit: v1 approved → v2 authorized.

## Phase R2 - Real-Data Round F1-F7 (2026-10-13, requirements v1.3)

- **Data model to the master sheet:** Customer gains customerCode (C001…,
  auto-generated, sparse-unique), business name/type, area, customer category,
  alternative phone, customer-since, risk level, recovery status; phone now
  optional + sparse-unique. Transaction gains addedBy, TRX referenceCode
  (non-unique), product category, verification, reference source.
- **CSV import** (`scripts/import-mihad-csv.ts`): 94 customers + 78 sheet
  transactions + per-customer opening-balance rows (§5.6 math) so derived dues
  match the real ledger; additive, --dry-run, guarded; messy-sheet fixes
  (C002/C003 duplicate, TRX002 typo, quote-stripped phones).
- **Exports:** CSV (BOM, RFC-4180, master-sheet columns) + JSON on customers,
  transactions, dues, and the customer detail payload (`lib/export.ts` +
  shared ExportMenu).
- **UX:** searchable server-side customer picker; shadcn Calendar DatePicker;
  "Cash"/"Mobile banking" labels via one `methodLabel()`; responsive sweep.

## Phase R3 - Product Hardening F8-F22 (2026-10-14, requirements v1.4)

- **RBAC + Trash (F8):** Admin roles (admin / super-admin) in the JWT; soft
  delete with cascade (shared timestamp), restore, super-admin purge; trash
  views on customers + transactions; trashed rows reject edits/appends.
- **Analytics (F9, F17):** `/api/overview/charts` + lazy charts - money in/out
  bars with week/month/year toggle, recovery donut, collection progress bar;
  customer detail gains its own insight charts from the same calculators.
- **Finding things (F11, F13):** server-side search over
  code/name/business/phone/alt-phone/area + risk/recovery filters; DatePicker
  with month/year dropdowns + manual DD/MM/YYYY entry.
- **Craft (F10, F12, F14-F16, F18-F20, F22):** listbox-grade picker
  (keyboard + focus discipline), themed 404, scrollable dialogs, named
  greeting, suggested added-by, row action hit areas, detail-page responsive
  fixes, collapsible icon-rail sidebar.
- **Brand (F21):** palette re-theme to the owner's trio (#15088f / #f30608 /
  #150590) as `--brand-*` tokens; every gradient derives from shared stops;
  chart ramp re-validated (CVD + contrast).

## Phase R4 - Runtime Regression Round F23-F25 (2026-10-14, requirements v1.5)

Caught by the owner in production (R3 shipped lint/tsc/build-only):
- **F23:** Add/Edit dialogs silently died - client-side `safeParse` rejected
  the v1.3 schema extras the forms never sent (customer:
  customerCode/customerCategory; transaction: referenceCode/productCategory/
  verificationStatus/referenceSource) with no error slots rendered. Forms now
  default those keys before parsing, mirroring the API.
- **F24:** the transaction dialog's customer list couldn't wheel-scroll - the
  portaled popover sits outside the dialog's scroll lock (react-remove-scroll
  cancels wheel over portaled content). The picker now renders its panel
  in-place inside dialogs (page filter keeps the portal) and the trigger names
  the picked row; Escape closes the picker before the dialog.
- **F25:** customer detail contact block - tel:/mailto: links + one-click copy.
  Verified: full browser E2E (Playwright + system Chrome), 12/12 checks with
  scratch rows purged and DB counts asserted back to baseline.

## Phase R5 - Closeout F26-F28 (2026-10-14, requirements v1.5 - v2 FINAL)

- **F26:** Trash cascade rules end-to-end - delete-customer modal always
  states the real transaction count (fetched when unknown); cascade-deleted
  entries restore only after their customer (API 422 + "owner trashed" marker
  with restore disabled in the trash view) so no live entry can sit under a
  trashed owner.
- **F27:** `src/lib/project.ts` - the one-file business identity (brand,
  logo, contact channels); config/landing/about/contact/marquee/features/
  Logo/PDF all render from it. Clone recipe documented in-file and in
  requirements §9.2/§12.
- **F28:** project finalized as **v2 FINAL** - this retrospective, the
  requirements v1.5 revision, works.md/progress.md closeout, and the handoff
  doc updated for the next chat.

---

# v3 Kickoff - where the next chat starts work

**v3 is a NEW feature cycle** (fresh requirements revision + new goal list per
§13 - not appended above). The owner's first noted item:

1. **Full design upgrade guided by a reference image** - total UI redesign
   (landing + dashboard) inspired by the owner's reference design; layout,
   typography, and motion system rebuilt while the data model and API stay.
   Backlog candidates that may ride along: Recovery Tracking module and
   Record Reference module (CSV schemas already in `docs/data/`), further
   DB-model features (interest/EMI, audit log - requirements §15).

State at handoff: production https://lendbook.morlabs.co, real data live
(95 customers / 184 transactions / 1 trashed), everything verified, tree
clean apart from this round - user pushes manually.
