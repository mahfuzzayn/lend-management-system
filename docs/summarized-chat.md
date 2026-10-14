# Lendbook (Lend Management System) — Session Handoff

> Use this file as the opening prompt for a new chat. It captures state,
> conventions, mistakes to avoid, and next steps. Repo:
> `~/Documents/Development/Exercises/z-ai glm projects/lend-management-system`.
> Owner: Mahfuz Zayn. Handoff date: 2026-10-14.
> **Production: https://lendbook.morlabs.co (v2 + real data live).**

---

## 1. How this project is run (read first)

- **Source of truth:** `docs/requirements.md` (v1.3 - status: v1+v2 delivered,
  fix round F1-F7 delivered 2026-10-13).
- **Plan:** `docs/goals.md` - the 74-goal build checklist, **COMPLETE**. Do NOT
  append new scope to its phases; future features/fixes get their own goal
  lists per requirements §13.
- **Log:** `docs/progress.md` - append-only, one line per completed task:
  `[YYYY-MM-DD] <ID> short description — done`.
- **User fix lists:** `docs/works.md` - the user writes numbered review fixes
  under `# Fixes`; treat each as a hard requirement and log as `Fn (works.md#n)
  … — done`; move finished items to `# Completed`.
- **# Backlog memo** (works.md): user-driven future work - DB-model features,
  UI de-genericizing pass, feature improvements. Each goes requirements →
  goals first.
- **Scope changes** go into requirements.md FIRST, then propagate.
- **Git: the agent NEVER commits or pushes unless asked.** The user pushes
  manually. (The whole v1.3 round was uncommitted at handoff - user was asked
  to push.)
- **No new npm packages** beyond requirements §2. Approved additions so far:
  mongoose, bcrypt, jsonwebtoken (+ @types). The v1.3 round needed none.

## 2. Status snapshot

**v2 shipped; fix rounds F1-F7 and F8-F22 delivered; REAL DATA IS LIVE.**

- Production: https://lendbook.morlabs.co on Vercel + MongoDB Atlas
  (`lendbook-bms`). The v1.3 + v1.4 UI needs a user push + Vercel deploy to
  show; the DATA is already in the shared DB (local .env and prod point at
  the same Atlas cluster).
- **v1.4 round (F8-F22, 2026-10-14, requirements v1.4):** RBAC roles
  (admin / super-admin) + soft-delete Trash (restore, super-admin purge);
  overview charts (lazy, granularity toggle, recovery donut, collection bar)
  + per-customer insight charts; server-side search filters (area/alt-phone/
  risk/recovery); DatePicker with month+year dropdowns + manual DD/MM/YYYY;
  listbox-grade customer picker; themed 404; scrollable dialogs; named
  greeting; suggested added-by; **brand re-theme to #15088f / #f30608 /
  #150590** with every gradient derived from `--brand-*` tokens; collapsible
  icon-rail sidebar. Verified by lint 0/0 + tsc + build (22 routes) only -
  runtime smoke was skipped at the user's request.
- **DB contents (verified 2026-10-14): 95 customers · 184 transactions.**
  - 94 customers C001-C094 imported from the Mihad Traders master sheet
    (`docs/data/*.csv`) via `npm run import-csv`, incl. per-customer opening
    balance rows dated 2026-01-01 (see requirements §5.6 for the math).
  - 1 real manual entry: "Masud Ahmod Murad" (2026-10-12, no customerCode).
  - **Demo dataset REMOVED from the DB** (10 fake customers + 44 txns, deleted
    2026-10-14 by exact-name + codeless match). The dataset itself is
    preserved in `scripts/demo-data.ts`; `npm run seed -- --demo` reloads it -
    DESTRUCTIVE (wipes customers/transactions), never run without asking.
- Import facts worth remembering: sheet "Current Due" column was inconsistent
  (ignored payments on 22 rows) - derived ledger math won (§5.6); duplicated
  C002 row was really C003; `TRXOO2` was a typo for TRX002; referenceCodes are
  NOT unique (the sheet reuses TRX026/046/068); ~30 customers have no phone
  (phone is optional + sparse-unique now).
- **After the user pushes + Vercel deploys:** the owner must log out + back
  in once? NOT required - pre-role admins/tokens resolve to super-admin by
  design (§5.4). Optional: set ADMIN_ROLE in Vercel env for future seeds;
  add staff via `npm run seed -- --create-admin "Name" email pass --role=admin`.
- **Next chat type: features / updates / fixes** - user-driven; expect
  works.md `# Fixes` rounds and/or Backlog pickup (recovery tracking module is
  the obvious next feature - its CSV schema already sits in docs/data).

## 3. Stack (exact - package policy is exhaustive, see requirements §2)

| Layer | Package / Fact | Notes |
|---|---|---|
| Framework | next 16.3.1 (Turbopack), react 19.2.8, TS strict | **Read `node_modules/next/dist/docs/` before any Next-specific code** (AGENTS.md mandate; the block is auto-written by next dev - leave it alone) |
| Next 16 facts | `proxy.ts` = renamed middleware, **Node.js runtime by DEFAULT** (setting `runtime` in it THROWS) | Route handlers: global `RouteContext<'/x/[id]'>` helper, `await ctx.params`, async `cookies()`, GET dynamic by default, route.ts may export ONLY HTTP methods + config |
| UI | shadcn radix-mira (vendored `src/components/ui`, we own them), Tailwind v4 | canonical v4 classes: `bg-linear-to-*`, `wrap-break-word` (not break-words) |
| Radix version gotcha | `radix-ui` 1.6.7 + `@base-ui/react` 1.7 both present | **radix uses classic `asChild`; Base UI uses `render`** - check which primitive you're composing |
| Icons | `@hugeicons/react` + `@hugeicons/core-free-icons` | verify names via `node -e "import('@hugeicons/core-free-icons').then(m=>console.log(Boolean(m.XIcon)))"` |
| Motion / toasts / PDF / validation | `motion` (`motion/react`), `sonner`, `@react-pdf/renderer` 4.6.1, `zod` v4 | PDF: Helvetica can't render ৳ → "BDT" prefix inside PDFs; brand teal hexes for PDF: #017863 / #005c4a / #e8f6f3 |
| Database | mongoose 9.11.1 | `src/lib/db.ts` cached connection; models in `src/models` |
| Auth | bcrypt 6.0.0 + jsonwebtoken 9.0.3 (+ @types) | JWT in httpOnly cookie; proxy guards /dashboard/* + /api/* |
| Runtime | Node 22.23 local; `"type": "module"`; `allowImportingTsExtensions` | scripts/ run via node-native TS (Node >= 22.18); no dotenv - scripts parse .env themselves |
| Deploy | Vercel + Atlas (`lendbook-bms`) | env on Vercel: MONGODB_URI, JWT_SECRET, NEXT_PUBLIC_APP_NAME |

## 4. Architecture & key files

```
src/
├── proxy.ts                        # auth guard: /dashboard/* redirect, /api/* 401 (login exempt);
│                                   # sliding refresh re-issues cookie past half the 24h TTL
├── app/
│   ├── (landing)/{layout,page,about,contact}
│   ├── login/page.tsx              # server-side: valid session → redirect /dashboard
│   ├── dashboard/…                 # server wrappers → client Views (overview|customers|
│   │                               # customers/[id]|transactions|dues)
│   └── api/
│       ├── auth/{login,logout,me}/route.ts    # zod + bcrypt + rate-limit + JWT cookie
│       ├── customers/{,[id]}/route.ts         # search(code/name/business/phone), create
│       │                                       # (auto-gen next C### code), PATCH, DELETE cascade
│       ├── transactions/{,[id]}/route.ts      # filters, summary, CRUD; addedBy defaults to
│       │                                       # session admin name
│       └── dues, overview                      # via domain calculators
├── components/
│   ├── ui/                         # vendored shadcn (incl. calendar, popover)
│   ├── auth/login-form.tsx
│   ├── dashboard/{sidebar,header,overview-view}
│   ├── customers|transactions|dues # Views + dialogs
│   ├── pdf/customer-history-document + download helper   # Lendbook-branded (logo + teal)
│   └── shared/
│       ├── container, reveal, due-badge, logo
│       ├── customer-picker.tsx     # searchable popover over server search (code/name/
│       │                           # business/phone) - used in tx form AND tx filter
│       ├── date-picker.tsx         # shadcn Calendar in a Popover (+ Today shortcut)
│       └── export-menu.tsx         # CSV/JSON dropdown; caller gathers rows
├── lib/
│   ├── api.ts / api-error.ts / api-client.ts   # envelope, withApi (11000 branches
│   │                                           # code-vs-phone message), typed client
│   ├── auth.ts / rate-limit.ts / db.ts
│   ├── domain.ts                   # ALL money math lives here (client + server)
│   ├── serialize.ts                # docs → domain types (new fields carried through)
│   ├── export.ts                   # CSV (BOM, RFC-4180) + JSON; master-sheet columns
│   ├── config.ts / motion.ts / utils.ts         # utils adds methodLabel + enum labels
├── models/{Admin,Customer,Transaction}.ts     # §5.2/§5.3 v1.3 fields; sparse-unique
│                                               # phone + customerCode indexes
├── schemas/index.ts                # shared zod (optional fields are "" → absent at edges)
└── types/index.ts                  # + BusinessType, RiskLevel, RecoveryStatus…
scripts/{seed,demo-data,import-mihad-csv}.ts    # import: additive, --dry-run, guarded;
                                                # seed: ADMIN_ROLE + --create-admin "N" e p --role=
docs/data/*.csv                    # the real master-sheet export (source of truth for import)
docs/scripts/smoke-checklist.mjs   # §14.2 runner: phases 1|2|prod (BASE_URL override)
```

**v1.4 architecture delta (F8-F22):**
```
src/
├── lib/trash.ts                   # liveFilter/trashFilter base queries (§5.7)
├── app/api/
│   ├── customers/[id]/restore/route.ts      # POST - undo soft delete (+cascade)
│   ├── transactions/[id]/restore/route.ts
│   └── overview/charts/route.ts   # GET ?granularity=week|month|year → {flow,recovery}
├── components/
│   ├── dashboard/
│   │   ├── shell.tsx              # client shell owning sidebar collapse (F22)
│   │   └── charts/                # flow-chart, mix-donut, collection-bar,
│   │                              # chart-bits (legend/toggle/axis), fills (key→color)
│   └── shared/date-picker.tsx     # dropdown month/year + manual DD/MM/YYYY (F13)
└── hooks/use-signed-in.ts         # landing CTA auth swap (F10)
```
Dashboard pages are async server wrappers that read `sessionFromCookies()`
and pass `role` (customers/transactions/detail) or `adminName` (overview)
into the client Views.

**Domain invariants:** append-only ledger; due = Σlend − Σrepayment (never
stored); DELETE = soft delete to the Trash (§5.7) - purge + transaction
cascade is super-admin-only; overview covers ACTIVE, LIVE (non-trashed)
customers; all money math through `lib/domain.ts` (incl. the chart series
`flowSeries`/`recoveryMix`/`methodMix`). Customer codes C### auto-generate on
create (next free, never reusing a trashed code); referenceCodes (TRX###) are
free text, not unique.

**Theme (v1.4):** the brand trio lives ONLY in `globals.css` `:root`
(`--brand-primary #15088f`, `--brand-secondary #f30608`, `--brand-accent
#150590`) + the tint hue in the neutral tokens; `--primary`/`--destructive`/
`--ring`/accents derive from it, every gradient references the shared
`--grad-from/via/to` (color-mix) stops, and charts use the validated
`--chart-1..6` indigo ramp + the #f30608/#059669 in-out pair. Re-theme =
edit the trio, nothing else.

**View conventions:** fetch in per-View `useEffect` with `cancelled` flag;
skeletons on FIRST load only; mutations in dialogs with `onSaved → reload`;
409 maps to inline field errors (phone or code by message wording);
ApiClientError messages toast verbatim.

## 5. Mistakes made — avoid repeating

1. **Background servers:** NEVER `next start … &` inside compound bash
   commands. Use the harness's background tasks + TaskStop; find holders with
   `ss -ltnp | grep <port>`; never kill the user's port-3000 process.
2. **`react-hooks/set-state-in-effect`:** no synchronous setState in effect
   bodies. For "loading while fetching", flip the flag in EVENT handlers and
   only clear it in the async callbacks (pattern in customer-picker.tsx).
3. **route.ts exports:** Next validates them - only HTTP methods + config.
4. **Mongoose projections vs serializers:** a narrow projection breaks
   `toTransactionDomain`. Fetch full docs or match every field it touches.
5. **Deps identity:** `rows ?? []` inside useMemo deps → warning; wrap the
   fallback in its own useMemo.
6. **Timezone "today" (user is UTC+6):** local today via
   `toLocaleDateString("en-CA")`; schema allows +1 UTC day. Never bare
   `toISOString().slice(0,10)` for "today".
7. **zod object keys are required by default** - API POSTs default omitted
   optional fields before parsing (`{ email: "", … , ...body }`).
8. **Rate limiter is per-process:** test ordering matters; restart between
   phases; NEVER run the rate-limit phase against production.
9. **Live data in the DB:** assert DELTAS from a baseline read; create AND
   clean scratch rows (check for leftovers by name after API test rounds).
10. **node_modules bit-rot:** corrupted UTF-8 in @react-pdf/textkit broke
    builds; restore from lockfile + scan, versions unchanged.
11. **A stray byte can masquerade as a parser bug** - hexdump the exact line
    when Read looks fine but the parser disagrees.
12. **The user edits files too** - always re-Read before Edit; copy old_string
    from disk. They sweep em-dashes/quotes to ASCII.
13. **Verify icon names; Tailwind v4 `bg-linear-to-*`; `params`/`searchParams`
    are Promises; PageProps/LayoutProps/RouteContext are global helpers.**
14. **React PDF:** style arrays reject `false`; never concatenate width
    strings; `pdf()` wrappers need `as React.ReactElement<DocumentProps>`;
    Image has no `alt` prop (eslint-disable jsx-a11y/alt-text there).
15. **Don't leave dead code when editing quickly** - review diffs before
    building.
16. **Composition props differ by library:** this repo's radix (1.6.7) uses
    `asChild`; Base UI (@base-ui/react, the vendored combobox) uses `render`.
    Mixing them silently breaks triggers.
17. **Transaction dates are ISO datetimes in API payloads** - slice(0,10)
    before feeding any YYYY-MM-DD input/schema, or zod's ISO_DATE_RE rejects
    (this silently broke transaction editing once).
18. **Mongoose index specs:** never declare `unique: true` on the path AND an
    explicit `schema.index({key:1}, …)` for the same key - conflicting specs
    make createIndexes throw. One spec per key (see Customer sparse uniques).
19. **Importing messy sheets:** cap every text at its model limit in the
    script (one 85-char "area" cell failed a whole insertMany); the area cap
    is 120 because sheet "Area" cells sometimes carry full sentences.
20. **TS narrowing doesn't survive into closures:** `state.data` narrowed
    after early returns still errors inside a handler - bind
    `const detail = state.data` first.
21. **Nested overlays beat z-index fights:** an absolutely-positioned label
    painted after a recharts canvas sits ABOVE the tooltip - give the label
    z-0 and the chart container z-10 (plus tooltip `wrapperStyle zIndex`) so
    the tooltip wins (F17).
22. **Suggestion lists inside dialogs render in-place** (no portal, options
    use `onMouseDown preventDefault` to keep input focus) - portals + modal
    focus/scroll layers are where pickers historically broke (F15/F20).
23. **Prop-synced UI state in render, not effects:** mirror a committed value
    into local draft state via the adjust-during-render pattern
    (`if (prev !== value) set…`); a sync setState in an effect trips
    `react-hooks/set-state-in-effect` (DatePicker F13).
24. **Keep canonical-class hints out of vendored `ui/` files** - apply
    `rounded-xs`-style suggestions only in first-party components; sed sweeps
    that touch `components/ui/` get reverted.

## 6. Writing style (match it)

- **App code:** TS strict, double quotes + semicolons, 2-space. Sparse WHY
  comments (JSDoc on exported helpers). Kebab-case files, PascalCase exports.
  Reuse `cn()`, `Container`, `Reveal/Stagger/StaggerItem`, `DueBadge`, `Logo`,
  `DatePicker`, `CustomerPicker`, `ExportMenu`, `formatCurrency/formatDate/
  getInitials/methodLabel`, mono-label classes.
- **API voice:** errors are readable sentences matching the zod messages
  exactly - "That phone number already belongs to another customer.", "That
  customer code already exists.", "Pick today or an earlier date."
- **UI voice:** editorial-minimal, specific and product-real (৳ amounts, real
  names), never lorem. Micro-labels `font-mono text-[0.625rem] uppercase
  tracking-[…]`; numbers `font-mono tabular-nums`; rows ~`text-xs`; cards
  hover-lift `-translate-y-1`.
- **Docs:** terse tables, checklists, one-line-per-task progress entries.
- **Tests:** node .mjs/CT scripts reading .env directly (never print values);
  pass project dir as argv, BASE_URL env for prod runs.

## 7. Rules & guardrails (strict)

1. Read `node_modules/next/dist/docs/` before any Next-specific code (AGENTS.md).
2. No new npm packages beyond requirements §2 - propose first.
3. Never push/commit unless asked; milestones end with asking the user to push.
4. Verify every goal: lint 0/0 + `npx tsc --noEmit` + `npm run build`; phase-end
   smoke on a FRESH port (3199); API regressions via
   `node docs/scripts/smoke-checklist.mjs <dir> 1` (then restart, `2`).
5. Scope/fix changes: requirements/works.md first, then code, then docs ticks.
6. Respect the user's on-disk edits; surface conflicts, don't revert.
7. Money math only through `lib/domain.ts` (client and server).
8. Reduced motion everywhere (`MotionConfig reducedMotion="user"`, marquee
   pause, CountUp short-circuit).
9. Accessibility floor: labeled inputs, `aria-current`, badges carry text,
   focus rings on every interactive element.
10. `npm run seed -- --demo` and any bulk delete against the DB: ask first.
    The DB is REAL business data now.

## 8. Next steps — this chat is for features / updates / fixes

1. Read the docs: `docs/requirements.md` (v1.3), `docs/goals.md` (COMPLETE
   banner), tail of `docs/progress.md`, `docs/works.md`, this file.
2. **The user had not yet pushed the v1.3 round at handoff** - if production
   lacks the new UI (customer codes, exports, pickers), remind them to push
   and let Vercel deploy; then re-run the prod smoke:
   `BASE_URL=https://lendbook.morlabs.co node docs/scripts/smoke-checklist.mjs <dir> prod`
   (phase "prod" only; never phase 1/2 against production).
3. **Fix rounds:** the user drops numbered items into works.md `# Fixes` →
   log each as `Fn (works.md#n)`, implement in house style, verify
   (lint/tsc/build + fresh-port smoke), tick + log, re-present.
4. **New features / Backlog pickup:** scope goes into requirements.md FIRST
   (§2 stack additions included), then a fresh goal list, then code. Likely
   candidates: Recovery Tracking module (schema already in docs/data),
   Record Reference module, interest/EMI, soft-delete, audit log
   (requirements §15 + works.md # Backlog).
5. Standing cadence: lint+tsc+build each goal; one progress line per verified
   task; keep requirements/goals/progress in lockstep.
