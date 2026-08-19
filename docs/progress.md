# Progress Log

Append-only. **One single line per completed small task**, added the moment it is verified.
Ticking a checkbox in `goals.md` and appending a line here happen together.

Format:

```
[YYYY-MM-DD] G-XX Short task description - done
```

---

[2026-08-19] R-00 Write docs/requirements.md v1.0 (full spec) - done
[2026-08-19] G-00 Generate goals.md (72 goals, 17 phases) + progress.md from requirements §13 - done
[2026-08-19] R-01 Revise requirements to v1.1 - React PDF renderer, Motion animations, Embla carousel, skeleton mandate, design-quality bar, package policy, manual git push - done
[2026-08-19] G-00 Regenerate goals.md (74 goals, 17 phases) from v1.1; files relocated to /docs - done
[2026-08-19] G-01 Read Next.js 16 docs - key breaking changes: middleware renamed to proxy.ts, params/searchParams are Promises, global PageProps/LayoutProps/RouteContext helpers - done
[2026-08-19] G-02 shadcn already initialized by user (radix-mira style, stone base, hugeicons, all components); installed zod + @react-pdf/renderer + motion; fixed vendored spinner TS error, use-mobile + carousel lint errors - done
[2026-08-19] G-03 Create src/lib/config.ts (Lendbook branding, ৳ currency, demo credential) + utils formatters (lakh-grouping currency, date, initials) - done
[2026-08-19] G-04 Theme: monochrome near-black primary on stone neutrals, radius 0 kept (radix-mira), selection style added - done
[2026-08-19] G-05 Domain types in src/types (Customer, Transaction, CustomerWithDue, CustomerDetail, OverviewStats, Paginated, Admin) - done
[2026-08-19] G-06 Motion foundation: lib/motion.ts variants (fadeUp/fadeUpLg/scaleIn/stagger) + shared Reveal/Stagger/StaggerItem wrappers - done
[2026-08-19] G-07 Root layout: Inter font, title template metadata, MotionConfig reducedMotion=user, Sonner Toaster; lint + build pass - done
[2026-08-19] G-08 (landing) route group layout - sticky navbar (wordmark, links, Sign-in, mobile Sheet) + footer; old default root page removed - done
[2026-08-19] G-09 Hero - oversized editorial headline with marker accent, staggered mount animation, real mini-ledger artifact card (formatCurrency/formatDate live) + floating settled card - done
[2026-08-19] G-10 Features - 3 hover-lift cards (Customers/Ledger/Dues, hugeicons) + numbered how-it-works rows, staggered, real ৳ copy - done
[2026-08-19] G-11 Embla carousel - "A working week, ledgered" narrative slides (lend → repayment → settled → PDF) with chips + mono meta - done
[2026-08-19] G-12 Scroll reveals via shared Reveal/Stagger across all landing sections; per-page metadata + OG on Home - done
[2026-08-19] G-13 About page - mission, who-it's-for (3 audiences), 3 numbered principles - done
[2026-08-19] G-14 Contact page - info channels + mock form (validation → toast, 700ms fake submit) - done
[2026-08-19] G-15 Verification - lint clean, build passes (/, /about, /contact static), prod server smoke test 200s + content checks; reduced-motion handled via root MotionConfig - done
[2026-08-19] G-16 Login page - split-screen (black brand panel w/ ledger-grid backdrop + form panel), staggered form entrance, show/hide password, inline validation + error/success toasts, demo-credential hint w/ Fill button - done
[2026-08-19] G-17 Mock auth (lib/auth-mock.ts) - 600ms mockLogin vs DEMO_CREDENTIAL, mockLogout, useMockSession via useSyncExternalStore (checking/authed/guest) - done
[2026-08-19] G-18 Guards - dashboard/layout.tsx client guard (splash while checking, redirect to /login?from=…); /login replaces signed-in users to /dashboard; placeholder /dashboard page for verification - done
[2026-08-19] G-19 Sidebar (components/dashboard/sidebar.tsx) - fixed w-60, wordmark header, 4 nav items w/ hugeicons, black active chip + aria-current, v1 footer note - done
[2026-08-19] G-20 Header - sticky h-14 w/ route-derived title (navTitleFor), admin dropdown (avatar, email label, destructive Sign-out → mockLogout + toast + replace /login) - done
[2026-08-19] G-21 Mobile nav - hamburger → left Sheet with same NAV_ITEMS + active states, auto-close on navigate - done
[2026-08-19] G-22 Placeholder pages for customers/transactions/dues + existing overview; lint clean, build passes w/ all 4 dashboard routes static - done
[2026-08-19] G-23 Mock dataset - 10 customers incl. settled (c-03), advance (c-04), archived (c-08), new-today (c-09); realistic BD names/phones/notes - done
[2026-08-19] G-24 41 transactions (t-001…t-041) - back-dated 2025-11 → today 2026-08-19, all 4 methods, signed-amount notes; expected dues documented in file header - done
[2026-08-19] G-25 lib/domain.ts pure calculators - dueStatusOf, customerSummary, withRunningBalance, lastTransactionDate, customersWithDue, transactionsWithCustomer, overviewStats (active-only totals, net outstanding) - done
[2026-08-19] G-26 Verified via node --experimental-strip-types assertion script: 27/27 checks - all 10 per-customer dues, badges (due/settled/advance), running balances (incl. −2000 advance), last activity, overview (9 active · 262k lent · 188k collected · 74k outstanding), topDues order; hand-note corrected (was incl. archived 35k); lint+build clean - done
[2026-08-19] G-27 Foundations: mock-store.ts (useSyncExternalStore pub/sub, live CRUD incl. cascade delete + reset), schemas/index.ts (shared zod: customer/transaction + fieldErrors), use-debounced hook, shared DueBadge (text+color) - done
[2026-08-19] G-27/28 Customers list - toolbar (debounced search + count + Add), table w/ avatar initials, mono amounts, DueBadge, last activity, row actions; 600ms simulated latency → 6-row skeleton; pagination 10/page derived from search (no reset effect); empty states (no results / no customers) - done
[2026-08-19] G-29/30 Dialogs - CustomerFormDialog (create/edit, zod inline errors, remount-on-open pattern), DeleteCustomerDialog (AlertDialog stating cascade + count, pending state, toast); TransactionFormDialog built shared (fixedCustomer lock for detail quick-add, segmented type, ৳ amount, date max today, method select) - done
[2026-08-19] G-31/32/33 Customer detail (/dashboard/customers/[id], awaited params) - profile card (archived badge, dl fields), 3 summary tiles, full ledger w/ running balance + totals footer, skeleton + not-found state, Edit/Delete wired (delete navigates back), quick Add Transaction locked to customer - done
[2026-08-19] P6 extras: fixed 3 set-state-in-effect lint errors (forms → inner remounting components; page reset → derived state), removed unused import; lint + build clean; note: zod schemas moved early from G-50 (login schema still owed there) - done
[2026-08-19] G-34/36 Transactions list - newest-first table (date, customer link, type badge, method, note, signed mono amounts, edit/delete row actions), 8-row skeleton on simulated latency, pagination 15/page filter-scoped, empty states (none vs no-match w/ Reset) - done
[2026-08-19] G-35 Filters - customer Select, type Select, from/to date inputs (cross-constrained min/max), Reset when active; mono summary line: entries · lent Σ · repaid Σ over filtered scope - done
[2026-08-19] G-37 TransactionFormDialog customer picker upgraded to Base UI Combobox (type-to-search, itemToStringLabel maps id→name, empty state) - fixed TS: label prop not on Item - done
[2026-08-19] G-38 DeleteTransactionDialog (AlertDialog w/ amount·customer·date recap, pending state, recalculated toast); edit reuses shared form dialog; lint + build clean - done
[2026-08-19] G-39 Dues view - active customers sorted by outstanding desc, table (avatar+name, phone, lent, received, DueBadge, last activity), totals footer over visible scope (lent/received/outstanding), 6-row skeleton on simulated latency - done
[2026-08-19] G-40 Dues toolbar - debounced search, "Show settled & advances" Switch (default off → due>0 only), standing count; row actions: view customer + PDF button (stub toast until Phase 10 wires G-45); empty states incl. "everyone's square"; lint + build clean - done
[2026-08-19] G-41 Overview stat cards - Total customers / lent / collected / outstanding, CountUp component (useMotionValue + animate, useReducedMotion short-circuit), outstanding red when >0, skeleton cards while loading - done
[2026-08-19] G-42 Overview lists - Recent activity (10, linked rows w/ type badge + signed amount, skeleton, empty state) + Top dues (5, ranked 01-05 w/ initials + red amounts, View all links) - done
[2026-08-19] G-43 Quick actions - greeting header (time-based, mono date) + Add customer / Add transaction buttons opening the shared dialogs; lint + build clean - done
[2026-08-19] G-44 CustomerHistoryDocument (React PDF) - A4: brand header + heavy rule, customer block, 3-cell summary (due red / advance blue / settled green wording), striped ledger (signed amounts, running balance), totals row, fixed footer w/ Page X of Y; built-in Helvetica ⇒ "BDT" prefix inside PDF (৳ not WinAnsi-encodable); fixed errant quote typo + false-in-style-array TS errors; download via one-shot pdf().toBlob() (imperative twin of usePDF - better fit for a download button), renderer dynamically imported - done
[2026-08-19] G-45 Wired - customer detail "Download PDF" (pending state "Preparing…") + dues per-row buttons (ledger computed via verified domain helpers); helper: blob→anchor download, slug filename <name>-history-<YYYY-MM-DD>.pdf, loading/success/error toasts; lint + build clean; visual PDF spot-check left for v1 review (G-46) - done
[2026-08-19] G-46 Automated pass - lint 0/0, build 9 routes, all routes HTTP 200 on fresh port, landing/login SSR content verified; full §14.1 browser checklist handed to user for the visual half - done
[2026-08-19] G-47 GATE: user verdict = CHANGES NEEDED (list pending) - v1 not signed off; v2 blocked until fixes + re-review - open
[2026-08-19] F1 (works.md#1) Card x-padding - card.tsx base py->p (all cards padded); 7 flush table/ledger cards switched to gap-0 p-0 incl. hero ledger + tilted settled card - done
[2026-08-19] F2 (works.md#2) Carousel clipping - viewport breathing (pt/pb-1, pl-5/-ml-5), arrows moved to static control row INSIDE Carousel context (was hanging outside overflow-hidden viewport), section teal-tint gradient - done
[2026-08-19] F3 (works.md#3) Routes - overview now /dashboard/overview (no prefix-collision double-active), /dashboard redirects, sidebar Home item + brand-logo link block -> overview, login redirects updated - done
[2026-08-19] F4 (works.md#4) PDF table x-padding - paddingHorizontal 8 on tableHeader/tableRow/totalsRow - done
[2026-08-19] F5 (works.md#5) Theme - teal-green token set (primary/ring/accent/sidebar), gradient system in globals.css (default-variant buttons via data-attr, card whisper tint), gradients on CTA band + login brand panel + sidebar active chip; bg-linear-* canonical classes - done
[2026-08-19] F6 (works.md#6) Marquee after hero - CSS keyframe band (36s loop, duplicated row, reduced-motion pause), teal gradient - done
[2026-08-19] F7 (works.md#7) Testimonials section - 3 quote cards, block-quote marks, gradient initials, staggered reveal - done
[2026-08-19] F8 (works.md#8) Logo - shared Logo component (/public/images/logo.png via next/image, onError->gradient "L" fallback), swapped into navbar x2, footer, login x2, sidebar, dashboard mobile sheet; optimizer 200 verified - done
[2026-08-19] F-VERIFY all 8 fixes - lint 0/0, build 10 routes incl. /dashboard/overview, all routes 200 on fresh port, logo srcset + /images/logo.png 200 - done
