# Lendbook (Lend Management System) — Session Handoff

> Use this file as the opening prompt for a new chat. It captures state,
> conventions, mistakes to avoid, and next steps. Repo:
> `~/Documents/Development/Exercises/z-ai glm projects/lend-management-system`.
> Owner: Mahfuz Zayn. Handoff date: 2026-10-14.
> **v2 FINAL. Production: https://lendbook.morlabs.co (real data live).**

---

## 1. How this project is run (read first)

- **Source of truth:** `docs/requirements.md` (v1.5 - status: **v2 FINAL**,
  fix rounds F1-F28 delivered 2026-10-14).
- **Plan:** `docs/goals.md` - the 74-goal v1→v2 build (COMPLETE), the
  post-v2 retrospective (phases R1-R5), and the **"v3 Kickoff"** section
  pointing where the next cycle starts. v3 scope = a fresh goal list per
  requirements §13 - never appended to the v2 phases.
- **Log:** `docs/progress.md` - append-only, one line per completed task:
  `[YYYY-MM-DD] <ID> short description — done`.
- **User fix lists:** `docs/works.md` - the user writes numbered review fixes
  under `# Fixes`; treat each as a hard requirement and log as `Fn (works.md#n)
  … — done`; move finished items to `# Completed`. `# Backlog (v3)` holds the
  next-cycle candidates (design upgrade first).
- **Git: the agent NEVER commits or pushes unless asked.** The user pushes
  manually. The F23-F28 round was uncommitted at this handoff - the user was
  asked to push + let Vercel deploy.
- **No new npm packages** beyond requirements §2. Approved so far: mongoose,
  bcrypt, jsonwebtoken (+ @types), recharts (via vendored shadcn Chart).

## 2. Status snapshot

**v2 CLOSED FINAL 2026-10-14 (requirements v1.5, fix rounds F1-F28).**

- Production: https://lendbook.morlabs.co on Vercel + MongoDB Atlas
  (`lendbook-bms`); local .env and prod point at the same cluster.
- **F23-F25 (2026-10-14):** dead Add/Edit forms fixed (forms default the
  v1.3 schema extras before client-side parse - the silent no-op was zod
  failing on keys the forms never sent, with no error slots rendered);
  CustomerPicker renders its panel IN-PLACE inside dialogs (portaled popovers
  can't wheel-scroll under the dialog's react-remove-scroll lock) and names
  the picked row on the trigger; customer detail contact block
  (tel:/mailto: links + copy buttons). Verified by full browser E2E.
- **F26-F28 (2026-10-14, v2 closeout):** trash cascade rules end-to-end
  (restore-order rule §5.7: cascade-deleted entries restore only after their
  customer - API 422 + "owner trashed" marker + disabled restore; delete
  modal always states the real cascade count), `src/lib/project.ts` one-file
  brand clone point (config/contact/about/features/marquee/Logo/PDF render
  from it; NEXT_PUBLIC_APP_NAME dropped), docs finalized (retrospective +
  v3 kickoff in goals.md).
- **DB contents (2026-10-14 evening): 95 customers · 186 transactions, ALL
  live (trash empty).** The owner restored the previously-trashed "Murad
  Ahmod" (C095) with its cascade and added repayments during the session.
  Demo dataset stays available via `scripts/demo-data.ts` - `npm run seed --
  --demo` is DESTRUCTIVE, never run without asking.
- **Next chat type: v3 features.** The opener the owner noted: **full design
  upgrade guided by a reference image** - total UI + dashboard redesign
  (layout/typography/motion system), data model + API unchanged. Then
  Backlog: Recovery Tracking module, Record Reference module (CSV schemas in
  docs/data), DB-model features (§15).

## 3. Stack (exact - package policy is exhaustive, see requirements §2)

| Layer | Package / Fact | Notes |
|---|---|---|
| Framework | next 16.3.1 (Turbopack), react 19.2.8, TS strict | **Read `node_modules/next/dist/docs/` before any Next-specific code** (AGENTS.md mandate; the block is auto-written by next dev - leave it alone) |
| Next 16 facts | `proxy.ts` = renamed middleware, **Node.js runtime by DEFAULT** (setting `runtime` in it THROWS) | Route handlers: global `RouteContext<'/x/[id]'>` helper, `await ctx.params`, async `cookies()`, GET dynamic by default, route.ts may export ONLY HTTP methods + config |
| UI | shadcn radix-mira (vendored `src/components/ui`, we own them), Tailwind v4 | canonical v4 classes: `bg-linear-to-*`, `wrap-break-word` (not break-words) |
| Radix version gotcha | `radix-ui` 1.6.7 + `@base-ui/react` 1.7 both present | **radix uses classic `asChild`; Base UI uses `render`** - check which primitive you're composing |
| Icons | `@hugeicons/react` + `@hugeicons/core-free-icons` | verify names via `node -e "import('@hugeicons/core-free-icons').then(m=>console.log(Boolean(m.XIcon)))"` |
| Motion / toasts / PDF / validation | `motion` (`motion/react`), `sonner`, `@react-pdf/renderer` 4.6.1, `zod` v4 | PDF: Helvetica can't render ৳ → "BDT" prefix inside PDFs; brand hexes for PDF: #15088f / #150590 / #eeeefb |
| Database | mongoose 9.11.1 | `src/lib/db.ts` cached connection; models in `src/models` |
| Auth | bcrypt 6.0.0 + jsonwebtoken 9.0.3 (+ @types) | JWT in httpOnly cookie; proxy guards /dashboard/* + /api/* |
| Runtime | Node 22.23 local; `"type": "module"`; `allowImportingTsExtensions` | scripts/ run via node-native TS (Node >= 22.18); no dotenv - scripts parse .env themselves |
| Deploy | Vercel + Atlas (`lendbook-bms`) | env on Vercel: MONGODB_URI, JWT_SECRET |

## 4. Architecture & key files

```
src/
├── proxy.ts                        # auth guard: /dashboard/* redirect, /api/* 401 (login exempt);
│                                   # sliding refresh re-issues cookie past half the 24h TTL
├── app/
│   ├── (landing)/{layout,page,about,contact}
│   ├── login/page.tsx              # server-side: valid session → redirect /dashboard
│   ├── dashboard/…                 # server wrappers → client Views (overview|customers|
│   │                               # customers/[id]|transactions|dues); shell.tsx owns sidebar
│   │                               # collapse; page.tsx wrappers pass role / adminName in
│   └── api/
│       ├── auth/{login,logout,me}/route.ts    # zod + bcrypt + rate-limit + JWT cookie
│       ├── customers/{,[id]},{[id]/restore}/route.ts   # search(filters), CRUD, soft-delete
│       │                                            # cascade, purge (super-admin), restore
│       ├── transactions/{,[id]},{[id]/restore}/route.ts # filters+summary, CRUD, trash; rows
│       │                                               # carry customerDeleted (F26)
│       └── dues, overview, overview/charts      # domain calculators + chart series
├── components/
│   ├── ui/                         # vendored shadcn (calendar, popover, chart…)
│   ├── auth/login-form.tsx
│   ├── dashboard/{shell,header,overview-view} + charts/ (flow-chart, mix-donut,
│   │                               collection-bar, chart-bits, fills)
│   ├── customers|transactions|dues # Views + dialogs (delete dialogs state the cascade)
│   ├── pdf/customer-history-document + download helper   # branded (project.ts + hexes)
│   └── shared/
│       ├── container, reveal, due-badge, logo (all render lib/project.ts)
│       ├── customer-picker.tsx     # DUAL-MODE (F24): portaled popover on pages,
│       │                           # in-place panel inside dialogs (scroll-lock);
│       │                           # trigger names the picked row
│       ├── date-picker.tsx         # month+year dropdowns + manual DD/MM/YYYY (F13)
│       └── export-menu.tsx         # CSV/JSON dropdown; caller gathers rows
├── hooks/{use-signed-in,use-debounced,use-mobile}.ts
├── lib/
│   ├── api.ts / api-error.ts / api-client.ts   # envelope, withApi, typed client
│   ├── auth.ts / rate-limit.ts / db.ts / trash.ts (liveFilter/trashFilter)
│   ├── domain.ts                   # ALL money math + chart series (client + server)
│   ├── serialize.ts                # docs → domain types (withCustomerName adds
│   │                               # name/code/customerDeleted)
│   ├── export.ts                   # CSV (BOM, RFC-4180) + JSON; master-sheet columns
│   ├── project.ts                  # F27: THE one-file business identity (brand,
│   │                               # logo, contact) - clone point for new owners
│   ├── config.ts                   # APP_* derived from project.ts + CURRENCY_SYMBOL
│   └── motion.ts / utils.ts        # utils adds methodLabel + enum labels
├── models/{Admin,Customer,Transaction}.ts     # §5.2/§5.3/§5.4; sparse-unique phone + code
├── schemas/index.ts                # shared zod; "" = absent for optionals - CALLERS
│                                   # DEFAULT OMITTED KEYS before safeParse (F23!)
└── types/index.ts                  # + customerDeleted on TransactionWithCustomer
scripts/{seed,demo-data,import-mihad-csv}.ts
docs/data/*.csv                    # the real master-sheet export
docs/scripts/smoke-checklist.mjs   # §14.2 runner: phases 1|2|prod (BASE_URL override)
```

**Domain invariants:** append-only ledger; due = Σlend − Σrepayment (never
stored); soft delete to the Trash (§5.7) with cascade + restore-order rule
(cascade entries restore ONLY with their customer); purge + hard cascade is
super-admin-only; overview covers ACTIVE LIVE customers; all money math
through `lib/domain.ts`. Customer codes C### auto-generate (never reusing a
trashed code); referenceCodes are free text.

**Theme (v1.4):** brand trio ONLY in `globals.css` `:root`
(`--brand-primary #15088f`, `--brand-secondary #f30608`, `--brand-accent
#150590`); gradients derive from shared `--grad-from/via/to`; charts use the
validated `--chart-1..6` ramp + #f30608/#059669 in-out pair. **Business
identity (name/logo/contact) lives in `lib/project.ts`** - rebrand = edit
that file + logo + trio.

**View conventions:** fetch in per-View `useEffect` with `cancelled` flag;
skeletons on FIRST load only; mutations in dialogs with `onSaved → reload`;
409 maps to inline field errors; ApiClientError messages toast verbatim.

## 5. Mistakes made — avoid repeating

1. **Background servers:** NEVER `next start … &` inside compound bash
   commands. Use harness background tasks + TaskStop; a stale `.next/dev`
   lock makes `next dev --port X` exit - check `ss -ltnp` and the PID it
   names; never kill the user's processes.
2. **zod v4 keys are required by default** - `z.string().or(z.literal(""))`
   accepts "" but NOT undefined. Any client-side safeParse of a partial form
   object MUST default the omitted optional keys first (F23's silent no-op;
   the API already did this - forms now mirror it).
3. **Portaled content inside dialogs can't wheel-scroll:** react-remove-scroll
   (Radix Dialog's lock) cancels wheel events whose target sits outside the
   DialogContent subtree - portals to body are outside. Fix = render
   dropdowns IN-PLACE inside dialogs (customer-picker F24, AddedByField F20).
   Radix Select/date dropdowns inside dialogs still have this quirk (not yet
   reported as a problem).
4. **Escape layering in dialogs:** radix's dialog listens for Escape with
   CAPTURE on document, before React dispatches capture handlers - only a
   window-level capture listener (preventDefault + stopPropagation) can close
   an in-place panel without closing the dialog (customer-picker F24).
5. **`react-hooks/set-state-in-effect`:** no synchronous setState in effect
   bodies; flip loading flags in EVENT handlers, clear in async callbacks;
   prop-synced drafts use the adjust-during-render pattern (DatePicker F13).
6. **route.ts exports:** only HTTP methods + config (Next validates).
7. **Mongoose projections vs serializers:** fetch full docs or match every
   field the serializer touches.
8. **Timezone "today" (user is UTC+6):** `toLocaleDateString("en-CA")`, never
   bare `toISOString().slice(0,10)`.
9. **Live data in the DB:** E2E tests use scratch rows (ZZ prefix) + assert
   DB counts back to baseline; clean even after crashed runs; the user ALSO
   edits data live mid-session - re-check baselines, never assume.
10. **node_modules bit-rot / stray bytes:** restore from lockfile; hexdump the
    exact line when Read looks fine but the parser disagrees.
11. **The user edits files too** - always re-Read before Edit; they sweep
    em-dashes/quotes to ASCII (they also test-drove the F27 clone file by
    renaming the brand mid-review and reverting).
12. **Verify icon names; Tailwind v4 `bg-linear-to-*`; `params`/`searchParams`
    are Promises; PageProps/LayoutProps/RouteContext are global helpers.**
13. **React PDF:** style arrays reject `false`; never concatenate width
    strings; Image has no `alt` prop (eslint-disable jsx-a11y/alt-text there).
14. **Don't leave dead code when editing quickly** - review diffs before
    building.
15. **Composition props differ by library:** this repo's radix (1.6.7) uses
    `asChild`; Base UI (@base-ui/react) uses `render`.
16. **Transaction dates are ISO datetimes in API payloads** - slice(0,10)
    before feeding YYYY-MM-DD inputs/schemas.
17. **Mongoose index specs:** never declare `unique: true` on the path AND a
    conflicting `schema.index` for the same key.
18. **E2E harness (works well, reuse):** playwright-core + system Chrome in
    /tmp/lb-e2e (NOT a project dep), page.fetch for API calls riding the
    logged-in cookie jar, stream PASS/FAIL per check, db-audit scripts parse
    .env themselves and never print values.

## 6. Writing style (match it)

- **App code:** TS strict, double quotes + semicolons, 2-space. Sparse WHY
  comments (JSDoc on exported helpers). Kebab-case files, PascalCase exports.
  Reuse `cn()`, `Container`, `Reveal/Stagger/StaggerItem`, `DueBadge`, `Logo`,
  `DatePicker`, `CustomerPicker`, `ExportMenu`, `formatCurrency/formatDate/
  getInitials/methodLabel`, mono-label classes.
- **API voice:** readable sentences matching zod messages exactly - "That
  phone number already belongs to another customer.", "Their customer is
  still in the trash - restore the customer first."
- **UI voice:** editorial-minimal, specific and product-real (৳ amounts, real
  names), never lorem. Micro-labels `font-mono text-[0.625rem] uppercase
  tracking-[…]`; numbers `font-mono tabular-nums`; rows ~`text-xs`.
- **Docs:** terse tables, checklists, one-line-per-task progress entries.

## 7. Rules & guardrails (strict)

1. Read `node_modules/next/dist/docs/` before any Next-specific code (AGENTS.md).
2. No new npm packages beyond requirements §2 - propose first.
3. Never push/commit unless asked; milestones end with asking the user to push.
4. Verify every goal: lint 0/0 + `npx tsc --noEmit` + `npm run build`; browser
   E2E for anything interactive (harness pattern in §5.18); API regressions
   via `node docs/scripts/smoke-checklist.mjs <dir> 1` (never phase 1/2
   against production).
5. Scope/fix changes: requirements/works.md first, then code, then docs ticks.
6. Respect the user's on-disk edits; surface conflicts, don't revert.
7. Money math only through `lib/domain.ts` (client and server).
8. Reduced motion everywhere; accessibility floor (labels, aria-current,
   badges carry text, focus rings).
9. `npm run seed -- --demo` and any bulk delete against the DB: ask first.
   The DB is REAL business data.

## 8. Next steps — this chat is for v3 (design upgrade first)

1. Read the docs: `docs/requirements.md` (v1.5 - §15 v3 outlook),
   `docs/goals.md` (retrospective + **"v3 Kickoff"**), tail of
   `docs/progress.md`, `docs/works.md` (`# Backlog (v3)`), this file.
2. **v3 opener (owner-noted):** full design upgrade guided by the owner's
   reference image - total UI + dashboard redesign. Ask the owner for the
   reference image(s) first; scope goes into requirements.md (§9 rewrite)
   BEFORE any code; fresh goal list per §13. Data model + API stay.
3. Backlog candidates after: Recovery Tracking module + Record Reference
   module (CSV schemas in docs/data), DB-model features (§15).
4. Standing cadence: lint+tsc+build+E2E each goal; one progress line per
   verified task; keep requirements/goals/progress in lockstep.
5. The F23-F28 round awaits the user's push + Vercel deploy; then re-run the
   prod smoke: `BASE_URL=https://lendbook.morlabs.co node
   docs/scripts/smoke-checklist.mjs <dir> prod` (phase "prod" only).
