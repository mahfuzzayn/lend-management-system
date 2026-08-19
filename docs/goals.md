# Goals - Step-by-Step Execution Plan (Zero → End)

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
- [ ] G-47 **USER SIGN-OFF** on design + features → then **ask the user to push to GitHub manually** - no v2 work before sign-off

## Phase 12 - v2 Data Layer

- [ ] G-48 Install mongoose (only new package for v2, per requirements §2); `src/lib/db.ts` connection cache (serverless-safe)
- [ ] G-49 Mongoose models: `Admin`, `Customer`, `Transaction` per requirements §5 (fields, enums, Decimal128, indexes, timestamps)
- [ ] G-50 Zod schemas in `src/schemas/`: customer, transaction, login - shared client/server
- [ ] G-51 Seed script (`npm run seed`): admin from env + `--demo` flag; commit `.env.example`

## Phase 13 - v2 API

- [ ] G-52 `src/lib/api.ts`: response envelope + error helpers (401/409/422/500 shapes)
- [ ] G-53 `/api/auth/{login,logout,me}`
- [ ] G-54 `/api/customers`: list (search + pagination + derived dues), create (duplicate phone → 409)
- [ ] G-55 `/api/customers/[id]`: detail (summary + history w/ running balance), PATCH, DELETE cascade
- [ ] G-56 `/api/transactions` + `/api/transactions/[id]`: CRUD, filters, pagination
- [ ] G-57 `/api/dues` + `/api/overview` aggregations
- [ ] G-58 Exercise every endpoint (REST client) incl. 401/422/409 paths

## Phase 14 - v2 Auth

- [ ] G-59 `src/lib/auth.ts`: bcrypt verify, JWT sign/verify (httpOnly SameSite cookie), `JWT_SECRET` env
- [ ] G-60 `proxy.ts` (Next 16's renamed middleware): guard `/dashboard/:path*` + all `/api/*` except login
- [ ] G-61 Login rate limit: ≤ 5 failed attempts / 10 min / IP (in-memory)
- [ ] G-62 Real logout + redirect flows verified in browser

## Phase 15 - v2 Migration

- [ ] G-63 Swap customers pages from mock data → API (keep skeletons, add error toasts)
- [ ] G-64 Swap transactions, dues, overview pages → API
- [ ] G-65 Real login flow wired; delete `mock-data.ts` + `auth-mock.ts`
- [ ] G-66 PDF verified against live DB data

## Phase 16 - Hardening

- [ ] G-67 Validation-parity pass: client messages match server 422 reasons
- [ ] G-68 Accessibility pass: labels, focus rings, contrast, badges not color-only, reduced-motion honored
- [ ] G-69 Responsive sweep: every page 360 px → desktop
- [ ] G-70 README: setup, env vars, seed, deploy + complete `.env.example`
- [ ] G-71 Final lint + build + full §14.2 checklist locally

## Phase 17 - Deploy

- [ ] G-72 MongoDB Atlas database + user; connection string into Vercel env vars
- [ ] G-73 Deploy to Vercel (production), seed prod admin, set all env vars
- [ ] G-74 Production smoke test vs §14.2 → mark v2 complete → **ask user to push final state to GitHub**
