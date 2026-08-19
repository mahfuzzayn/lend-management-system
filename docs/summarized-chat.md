# Lendbook (Lend Management System) — Session Handoff

> Use this file as the opening prompt for a new chat. It captures everything the
> previous session established: state, conventions, mistakes to avoid, and the
> strict next steps. Repo: `~/Documents/Development/Exercises/z-ai glm projects/lend-management-system`.
> Owner: Mahfuz Zayn. Date of handoff: 2026-08-20.

---

## 1. How this project is run (read first)

- **Source of truth:** `docs/requirements.md` (currently v1.1 with review-fix amendments).
- **Plan:** `docs/goals.md` — 74 atomic goals (G-01…G-74) across 17 phases. Work strictly top-to-bottom.
- **Log:** `docs/progress.md` — append-only, **one line per completed task**:
  `[YYYY-MM-DD] <ID> short description — done`
  Ticking a checkbox in goals.md and appending the progress line happen together.
- **User fix lists:** `docs/works.md` — the user writes numbered review fixes there. Treat every item as a hard requirement; log each as `F# (works.md#n) … — done`.
- Scope changes go into requirements.md FIRST, then propagate to goals.md.
- **Git: the agent NEVER pushes or commits unless asked.** The user pushes manually at gates. `.git` exists, branch `main`, only the create-next-app commit so far — everything else is uncommitted.

## 2. Status snapshot

**v1 (static prototype) is functionally complete.** Phases 1–10 done, Phase 11 (review gate) in round 2:

- G-01…G-46 ✅ (docs, landing, mock auth, shell, mock data + domain logic, customers, transactions, dues, overview, PDF export, automated review pass)
- **G-47 🔒 OPEN — user sign-off gate.** Round 1 fixes F1–F8 (works.md) applied + verified. Round 2 verdict: **"More changes needed" — the user will drop a NEW list into `docs/works.md`.** v2 is blocked until G-47 signs off.
- v2 = Phases 12–17 (G-48…G-74): mongoose, API, real auth, migration, hardening, deploy.

Current build: lint 0/0, 10 routes (`/`, `/about`, `/contact`, `/login`, `/dashboard` → redirect, `/dashboard/overview`, `/dashboard/customers`, `/dashboard/customers/[id]`, `/dashboard/transactions`, `/dashboard/dues`).

## 3. Stack (exact — package policy is exhaustive, see requirements §2)

| Layer | Package | Notes |
|---|---|---|
| Framework | next 16.3.1 (Turbopack), react 19.2.8, TS strict | **NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing Next code** (AGENTS.md mandates this; the AGENTS.md block is auto-written by next dev — leave it alone) |
| UI | shadcn **radix-mira** style (new shadcn: `shadcn`/`@shadcn/react` pkgs, unified `radix-ui` pkg, **hugeicons** NOT lucide) | components vendored in `src/components/ui/*` — we own them and may edit minimally |
| Icons | `@hugeicons/react` `HugeiconsIcon` + `@hugeicons/core-free-icons` | ~13.5k icons; **verify names via `node -e "import('@hugeicons/core-free-icons').then(m=>console.log(Boolean(m.XIcon)))"`** before using — plain `require()` returns {} (ESM-only) |
| Styling | Tailwind v4 (`@import "tailwindcss"` in globals.css, oklch tokens) | canonical v4 classes: `bg-linear-to-*` not `bg-gradient-to-*` |
| Motion | `motion` (import from `motion/react`) | shared variants in `src/lib/motion.ts`; root layout wraps `<MotionConfig reducedMotion="user">` |
| Toasts | `sonner` (Toaster in root layout) | |
| PDF | `@react-pdf/renderer` 4.6.1 | imperative `pdf(<Doc/>).toBlob()`, dynamic import |
| Validation | `zod` (v4) | shared schemas in `src/schemas/index.ts` + `fieldErrors()` helper |
| v2 planned | mongoose (NOT yet installed — allowed per §2), bcrypt+jwt (likely via `jose`? NO — not in §2; if needed propose first) | |
| Forbidden | anything not in requirements §2 | propose → user approves → update §2 → then install |

## 4. Architecture & key files

```
src/
├── app/
│   ├── layout.tsx                  # Inter + Geist Mono, metadata template, MotionConfig, Toaster
│   ├── (landing)/{layout,page,about,contact}   # navbar/footer shell; Home = Hero→Marquee→Features→Carousel→Testimonials→CtaBand
│   ├── login/page.tsx              # split-screen (gradient teal brand panel + LoginForm w/ demo hint + Fill)
│   └── dashboard/
│       ├── layout.tsx              # "use client" mock-auth guard (splash → redirect /login?from=…) + Sidebar + Header + main
│       ├── page.tsx                # redirect("/dashboard/overview")
│       └── overview|customers|customers/[id]|transactions|dues/page.tsx   # server wrappers + metadata → client Views
├── components/
│   ├── ui/                         # vendored shadcn (button/card/table/dialog/…/carousel/combobox)
│   ├── landing/                    # hero, marquee, features, carousel-section, testimonials, cta-band, navbar, footer, section-heading, contact-form
│   ├── dashboard/                  # sidebar (NAV_ITEMS, isActivePath, navTitleFor), header, overview-view (CountUp)
│   ├── customers/                  # customers-view, customer-detail-view, customer-form-dialog, delete-customer-dialog
│   ├── transactions/               # transactions-view, transaction-form-dialog (searchable Base-UI Combobox + fixedCustomer lock), delete-transaction-dialog
│   ├── dues/dues-view.tsx
│   ├── pdf/                        # customer-history-document.tsx + download-customer-history-pdf.tsx
│   └── shared/                     # container, reveal (Reveal/Stagger/StaggerItem), due-badge, logo
├── lib/
│   ├── config.ts                   # APP_NAME "Lendbook", APP_TAGLINE, CURRENCY_SYMBOL "৳", DEMO_CREDENTIAL (admin@lendbook.app / admin1234), MOCK_SESSION_KEY
│   ├── utils.ts                    # cn, formatCurrency (lakh grouping en-IN, signed/decimals), formatDate ("19 Aug 2026"), getInitials
│   ├── domain.ts                   # PURE calculators: dueStatusOf, customerSummary, withRunningBalance, lastTransactionDate, customersWithDue, transactionsWithCustomer, overviewStats — v2 reuses verbatim
│   ├── mock-data.ts                # 10 customers (c-01…c-10; settled c-03, advance c-04, archived c-08) + 41 txns (t-001…t-041)
│   ├── mock-store.ts               # "use client" pub/sub store (useSyncExternalStore) + CRUD + cascade delete + resetMockStore — deleted in v2
│   ├── auth-mock.ts                # mockLogin(600ms)/mockLogout/useMockSession — deleted in v2
│   └── motion.ts                   # EASE_OUT, DURATION, fadeUp/fadeUpLg/fadeIn/scaleIn/staggerParent/staggerItem
├── schemas/index.ts                # customerSchema, transactionSchema, fieldErrors (loginSchema still owed in G-50)
├── hooks/                          # use-debounced, use-mobile (useSyncExternalStore)
└── types/index.ts                  # Customer, Transaction, CustomerWithDue, TransactionWithBalance/Customer, CustomerDetail, OverviewStats, Paginated, Admin
public/images/logo.png              # brand mark (used by shared/Logo with gradient-"L" fallback)
```

**Domain invariants:** append-only ledger; due = Σlend − Σrepayment (>0 due · 0 settled · <0 advance, never stored); deleting a customer cascades transactions; overview totals cover ACTIVE customers only (net signed outstanding).

**Mock data cheat-sheet (for verification):** active customers 9 · lent ৳262,000 · collected ৳188,000 · outstanding ৳74,000. Per-customer dues: c-01 4,500 · c-02 10,000 · c-03 0 settled · c-04 −2,000 advance · c-05 5,000 · c-06 25,000 (top due) · c-07 4,500 · c-08 0 archived · c-09 22,000 (lent today) · c-10 5,000.

**Theme (review fix F5):** teal-green `--primary: oklch(0.51 0.096 175)`, cool neutrals, radius 0, light-only. Gradient system in globals.css: default-variant buttons via `[data-slot="button"][data-variant="default"]` selectors (hover brightens), card whisper tint `[data-slot="card"]`, marquee keyframes + `.animate-marquee` (reduced-motion pause), plus explicit gradients on sidebar active chip, CTA band, login brand panel, marquee.

**Routes guardrails:** overview is `/dashboard/overview` (NOT `/dashboard`) so nav prefix-matching can't double-highlight; `/dashboard` redirects; sidebar "Home" links to landing `/` and `isActivePath` special-cases `"/"` to exact match.

**PDF:** built-in Helvetica cannot render ৳ → amounts use `BDT` prefix inside PDFs (UI keeps ৳). Filename `<slug-name>-history-<YYYY-MM-DD>.pdf`.

## 5. Mistakes made — avoid repeating

1. **Stale server = false 404s.** A lingering `next-server` on port 3000 (the user's own!) once made new routes 404. Always smoke-test on a **fresh port** (e.g. `npx next start -p 3199`), kill only the PID listening on YOUR port (`lsof -ti:<port>`), and **never kill the user's port-3000 process** — they run it themselves and have rejected broad `pkill next` before.
2. **`react-hooks/set-state-in-effect` (React Compiler-era rules) blocks:** no synchronous setState in effect bodies. Patterns that pass: `useSyncExternalStore` (auth session, use-mobile); derived state (search-scoped pagination: `page = {search, index}`, `currentPage = page.search === key ? … : 1`); **remount-on-open forms** (inner form component inside `DialogContent` + `key`, state seeded by `useState` initializers — no reset effect). Vendored carousel needed one targeted `eslint-disable-next-line … -- vendored shadcn code` for its initial-sync effect.
3. **React PDF style arrays reject `false`** (`cond && {…}`) — use `cond ? {…} : undefined`. Also never concatenate width strings (`"4.5%"+"12%"` is garbage) — compute one literal (`"71%"`).
4. **`pdf()` typing:** wrapper components' element type ≠ `DocumentProps` — cast `as React.ReactElement<DocumentProps>` (type-only import).
5. **A stray byte can masquerade as a parser bug.** An errant `"` inside one JSX line produced "Unterminated string constant" pointing at a *different, valid* line. When Read output looks fine but the parser disagrees, **hexdump the exact bytes** (`sed -n 'Np' file | xxd`).
6. **The user edits files too.** They sweep em-dashes `—` to ASCII `-`, tweak classes (`!px-10`, sidebar icons/routes), and normalize quotes — so **always re-Read a file before Edit** if the system notes it changed on disk; copy old_string from disk, not memory. They also convert some copy to ASCII dashes — match their local style when touching those lines.
7. **Verify icon names before use** (see §3 node one-liner). Guesses like `UserGroupIcon` failed; verified ones used everywhere: Menu01, Cancel01, ArrowRight01/Left01/Down01, Edit01, Delete01, Add01, UserAdd01, UserAccount, Search01, Download04, Pdf01, Mail02, Time04, Location02, Shield01, LockKey, Store01, Coins01, Chart02, Analytics, Home01, LeftToRightListBullet, LeftToRightBlockQuote, ReceiptDollar, Logout01, View/ViewOff, Sent, Loading03.
8. **jsPDF was replaced by React PDF renderer mid-project** (user requirement) — requirements were updated first. Keep that discipline: any stack/scope change → requirements.md → goals.md → code.
9. **Tailwind v4:** use `bg-linear-to-*`; `bg-gradient-to-*` triggers IDE warnings.
10. **`params`/`searchParams` are Promises in Next 16** (`const { id } = await params`), and `PageProps<'/route'>` / `LayoutProps` / `RouteContext<'/x/[id]'>` are global helpers. **Middleware is renamed `proxy.ts`** (v2 auth must use it — already reflected in goals G-60).
11. Don't leave dead code or stray characters when editing quickly (double `;;`, leftover ternaries) — review diffs before building.
12. Repetitive identical edits across many files: `sed -i` with an exact pattern is fine and faster than 7 Edit calls — but verify with grep afterwards.

## 6. Writing style (match it)

- **App code:** TypeScript strict, double quotes + semicolons, 2-space indent. Sparse comments that explain WHY (JSDoc on exported helpers). Kebab-case filenames, PascalCase component exports. Reuse `cn()`, `Container`, `Reveal/Stagger/StaggerItem`, `DueBadge`, `Logo`, `formatCurrency/formatDate/getInitials`, mono-label classes — never ad-hoc duplicates.
- **UI voice:** editorial-minimal, specific and product-real (৳ amounts, real names/scenarios), never lorem. Micro-labels in `font-mono text-[0.625rem] uppercase tracking-[…] text-muted-foreground`. Numbers in `font-mono tabular-nums`. Table rows ~`text-xs`. Sections: `SectionHeading` (rule + mono kicker + oversized title). Cards hover-lift `-translate-y-1`. Empty states and skeletons everywhere data loads (600ms simulated latency in v1 Views).
- **Docs:** terse tables, checklists, one-line-per-task progress entries.
- **Money:** `formatCurrency` (৳ + en-IN lakh grouping). Dates: `formatDate` → "19 Aug 2026".

## 7. Rules & guardrails (strict)

1. Read `node_modules/next/dist/docs/` before any Next-specific code; heed deprecations (AGENTS.md).
2. **No new npm packages** beyond requirements §2 (mongoose is pre-approved for v2). Anything else: stop, propose, get approval, update §2, then install.
3. **Never push/commit** unless asked; at gates ask the user to push manually.
4. Work goals top-to-bottom; never start v2 before G-47 sign-off.
5. Verify every goal: `npm run lint` (0/0) + `npm run build` before ticking; phase-end smoke on a fresh port.
6. Scope/fix changes: requirements/works.md first, then code, then docs ticks + progress lines.
7. The user reviews design personally and edits files directly — respect their on-disk changes, don't revert them; surface conflicts instead.
8. Keep amount math only through `lib/domain.ts` calculators (they're assertion-verified); never hand-compute dues in components.
9. Respect reduced motion everywhere (`MotionConfig reducedMotion="user"` + `.animate-marquee` pause + CountUp short-circuit).
10. Accessibility floor: labeled inputs, `aria-current` on active nav, badges carry text (never color-only), focus rings via shadcn defaults.

## 8. Next steps — follow strictly

**A. Immediately (finish v1 gate):**
1. Read the four docs: `docs/requirements.md`, `docs/goals.md`, tail of `docs/progress.md`, `docs/works.md` (plus this file — done).
2. If `docs/works.md` contains the round-2 fix list: log each item as `Fn (works.md#n)` in progress.md, implement (style per §6), then verify (lint 0/0 + build + fresh-port smoke), tick/logging, and re-present the §14.1 checklist. If works.md still shows the old F1–F8 list, ask the user to drop the new list.
3. Repeat review rounds until the user signs off G-47.
4. On sign-off: **ask the user to push to GitHub manually** (they push; suggest a commit if they want one written — only on request).

**B. Then v2 (phases 12–17 of goals.md, G-48…G-74), in order:**
- G-48 install mongoose + `src/lib/db.ts` connection cache (serverless-safe).
- G-49 models `Admin`/`Customer`/`Transaction` per requirements §5 (Decimal128 amounts, enums, indexes, timestamps, cascade delete).
- G-50 add `loginSchema` to `src/schemas` (customer/transaction already exist there).
- G-51 seed script (`npm run seed`, admin from env + `--demo`) + `.env.example`.
- G-52–G-58 API route handlers per requirements §6 with the `{ success, data } | { success:false, message }` envelope; exercise via REST incl. 401/409/422 paths.
- G-59–G-62 real auth: bcrypt, JWT httpOnly cookie, **`proxy.ts`** guards `/dashboard/:path*` + `/api/*` (except login), login rate-limit ≤5/10min/IP, verified logout.
- G-63–G-66 swap Views from mock-store to API (keep skeletons; error toasts); delete `mock-store.ts` + `auth-mock.ts`; PDF against live data.
- G-67–G-71 hardening: validation parity, a11y pass, responsive sweep, README + `.env.example`, full §14.2 locally.
- G-72–G-74 deploy: MongoDB Atlas → Vercel env → seed prod admin → production smoke vs §14.2 → ask user to push final state.

**C. Standing cadence:** lint+build each goal; fresh-port smoke each phase; keep requirements/goals/progress in lockstep; one progress line per verified task.
