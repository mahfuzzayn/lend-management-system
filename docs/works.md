# Fixes
1. I want easy design upgrade. All types of button, tables, link buttons, input fields, basically every section that has sharp edges we need to make them more comfortable ui, calm.

_(empty - project closed as v2 FINAL 2026-10-14 after rounds F1-F28; v3 opens a fresh cycle - see # Backlog and goals.md "v3 Kickoff")_

<!-- Brand palette for this round (works.md #14):
     Primary: #15088f, Secondary: #f30608, Accent: #150590 -->

# Backlog (v3 — picked up next)

When one is picked up it goes through `requirements.md` → a fresh goal list first
(per requirements §13 / goals.md "v3 Kickoff").

1. **Full design upgrade from a reference image** — the owner's noted v3 opener: total UI
   redesign (landing + dashboard) inspired by a reference design; layout, typography, and
   motion system rebuilt while the data model + API stay.
2. **DB models — new features/fields** (user to specify; candidate pool lives in requirements §15:
   interest/EMI, audit log, receipts, reminders…).
3. **Recovery Tracking module + Record Reference module** — CSV schemas already sit in docs/data.
4. **Feature improvements** — general feature polish/upgrades; list to be defined by the user.

# Completed

## Round F26-F28 — v2 closeout (2026-10-14)

1. **F26 (works.md#1)** Trash cascade edge cases —
   - The delete-customer dialog now ALWAYS states the real number of transactions that will
     follow the customer into the trash (fetches the count when the caller doesn't know it),
     plus the rule in words ("the transactions come back only with the customer").
   - Cascade-deleted entries can no longer be restored while their customer is trashed:
     the API answers 422 "Their customer is still in the trash - restore the customer first."
     (§5.7 restore-order rule), and the trash view marks those rows **"owner trashed"** with
     the restore button disabled - so no live entry can ever sit under a trashed owner in
     dues/totals (the "trashed customer showing with active data" path is closed).
   - Customer restore still brings back exactly the cascade (verified: 2/2), purge still
     hard-cascades. Verified E2E on a scratch lifecycle; real data untouched.
2. **F27 (works.md#2)** `src/lib/project.ts` — the one-file business identity: brand name,
   tagline, description, logo (path + alt + fallback initial), contact channels
   (e-mail/response/location). `lib/config.ts` derives `APP_*` from it; the contact page
   (channels + mailto link), about page, features copy, marquee label, Logo component, and
   the PDF logo all render from it. Clone recipe (edit file → drop logo → set `--brand-*`
   trio) documented in-file and in requirements §9.2/§12; `NEXT_PUBLIC_APP_NAME` removed as
   unused. (The owner test-drove it by renaming the brand mid-review and reverting.)
3. **F28 (works.md#3)** Project finalized as **v2 FINAL** — requirements v1.5 (restore-order
   rule §5.7, contact block FR-6.2, project-config §9.2/§12, v3 outlook §15); goals.md gained
   the detailed post-v2 retrospective (phases R1-R5 covering the v1 review fixes, F1-F7
   real-data round, F8-F22 hardening, F23-F25 runtime regressions, F26-F28 closeout) and a
   **"v3 Kickoff"** section pointing where the next chat starts (full design upgrade from
   the owner's reference image + dashboard redesign); works.md/progress.md closed;
   summarized-chat.md rewritten as the v3 handoff.
4. **F-VERIFY** lint 0/0 + tsc clean + build green; two browser E2E suites 24/24 with the DB
   asserted back to baseline after every run (95 customers / 186 transactions, trash empty).

## Round F23-F25 (2026-10-14)

1. **F23 (works.md#1)** Dead Add/Edit forms — the client-side `safeParse` failed on v1.3 schema
   keys the dialogs never sent (customers: `customerCode`, `customerCategory`; transactions:
   `referenceCode`, `productCategory`, `verificationStatus`, `referenceSource`) with no error
   slots rendered, so every submit silently no-opped (no toast, no network call). Forms now
   default those keys to `""` before parsing, mirroring the API's edge pattern (§5.2/§5.3).
   Verified E2E: add + edit customer and transaction all persist, toast, and close.
2. **F24 (works.md#2)** Customer picker in dialogs — the portaled popover sat outside the
   dialog's scroll lock (react-remove-scroll cancels wheel events over portaled content, which
   is why scrollbar-drag worked but wheel didn't). The picker now detects it is inside a
   `[data-slot="dialog-content"]` and renders its panel **in-place** (no portal, F15/F20
   pattern) so wheel/touch scrolling works; the page filter keeps the portaled popover.
   The trigger now names the picked row (`C023 · Goura Babu`) instead of the generic
   "Selected customer", so a click visibly selects. Escape closes the picker first, then the
   dialog (window-capture guard - radix's dialog escape listener runs before React's).
3. **F25 (works.md#3)** Customer detail Contact block — phones render as `tel:` links
   (calling-app hand-off) and e-mail as `mailto:`, each row with an icon chip and a one-click
   copy button (clipboard + success toast + tick feedback). Replaces the plain-text phone line
   and the e-mail `<dl>` row; "No contact on file" when empty.
4. **F-VERIFY** lint 0/0 + tsc clean + build green; full browser E2E (Playwright + system
   Chrome) 12/12: scratch-row create/edit/purge round-trips with DB counts asserted back to
   baseline (95 total / 94 live customers, 184 transactions).

## Round F8-F22 (2026-10-14)

1. **F8 (works.md#1)** RBAC + Trash — Admin model gains `role` (`admin` | `super-admin`,
   default `admin`), carried in the session JWT (proxy sliding refresh preserves it;
   pre-v1.4 admins/tokens resolve to super-admin so the owner never loses purge).
   DELETE on customers/transactions is now a soft delete (`deletedAt`/`deletedBy`,
   customer cascade shares one timestamp); `?purge=true` (super-admin only, 403 otherwise)
   hard-deletes incl. the transaction cascade; `POST /[id]/restore` brings a row (and the
   cascade-deleted ledger) back. Lists get `?trash=true`; every live query, due, overview
   total, and export excludes trashed docs; codes stay unique while trashed. Trashed rows
   reject edits/appends ("restore first"). Seed: `ADMIN_ROLE` env (default super-admin) +
   `npm run seed -- --create-admin "Name" email password [--role=admin]`.
2. **F9 (works.md#2)** Overview charts — `/api/overview/charts` + three lazy
   (`next/dynamic`, ssr:false, skeleton-first) charts: money in/out bars (semantic red/emerald
   pair), recovery-status donut with legend + counts, collection progress bar. Recharts via
   the vendored shadcn Chart (pre-approved dependency). Responsive grid.
3. **F10 (works.md#3)** Landing "Sign in" → "Dashboard"/"Open dashboard" when a session is
   live (`useSignedIn` client check; pages stay static); navbar buttons bumped to size lg.
4. **F11 (works.md#4)** Customers + Dues search is debounced server-side query search over
   code/name/business/phone/**alt-phone/area**, plus Risk level + Recovery status filter
   selects (enum-validated server-side, 422 on junk); clear-filters affordance.
5. **F12 (works.md#5)** All table action buttons share `rowActionClass` (size-7 hit area,
   visible hover ring/bg; destructive hover tint on delete/purge).
6. **F13 (works.md#6)** Shared DatePicker rebuilt: shadcn Calendar with **month + year
   dropdowns** (captionLayout=dropdown, 1990→max bounds) + a **manual DD/MM/YYYY input**
   (accepts YYYY-MM-DD too, validates round-trip, Enter commits) + Today shortcut.
   Transactions page from/to filters now use it (raw date inputs gone).
7. **F14 (works.md#7)** Customer detail responsive: ledger card gets `min-w-0` so the table
   scrolls inside its own overflow container instead of pushing the page wide; Lent /
   Received / Due tiles stack one-per-row on phones (`grid-cols-1 sm:grid-cols-3`).
8. **F15 (works.md#8)** CustomerPicker rebuilt as a proper listbox: natural `autoFocus`
   (no focus fights with the modal Dialog), ArrowUp/Down + Enter + Home/End keyboard
   picking with `aria-activedescendant`, mouse/touch rows that don't steal focus
   (`onMouseDown` preventDefault), and one true scroll container
   (`max-h-64 overflow-y-auto overscroll-contain`).
9. **F16 (works.md#9)** Themed `app/not-found.tsx` — oversized gradient 404, product-real
   copy, Return home + Go to dashboard, header/footer chrome, works at 360px.
10. **F17 (works.md#10)** Charts round 2 — flow chart gains a **week / month / year toggle**
    (`flowSeries` buckets; `granularity` query param), donut tooltip now stacks above the
    center label (z-fixed), the rate line chart was **replaced by a collection progress
    bar** (collected% fill + Lent/Repaid/Due chips), and the customer detail page gets its
    own lazy insight charts (flow + toggle, payment-method donut, collection bar) computed
    client-side through the same pure calculators.
11. **F18 (works.md#11)** DialogContent scrolls vertically inside the viewport
    (`max-h-[calc(100svh-2rem)] overflow-y-auto`) - long Add/Edit forms never overflow off-screen.
12. **F19 (works.md#12)** Overview greeting addresses the signed-in admin by name
    ("Good evening, Mahfuz Zayn.").
13. **F20 (works.md#13)** "Added by" is a free-text field with a fixed suggestion dropdown
    (Mahfuz Zayn, Murshad Milad, Mihad Ahmod) - pick or type anything.
14. **F21 (works.md#14)** Palette re-theme + tokenization — brand trio
    `--brand-primary #15088f` / `--brand-secondary #f30608` / `--brand-accent #150590`
    in `:root`; `--primary`, `--destructive`, ring, accent and the indigo-tinted neutrals
    derive from it; shared `--grad-from/via/to` stops (color-mix) drive every gradient
    (buttons, cards, sidebar chip, marquee, CTA band, login panel, avatars, logo, 404);
    chart ramp re-anchored indigo (`--chart-1..6`) and the in/out pair moved to the brand
    red - all re-validated with the dataviz six-checks script (both PASS). PDF brand hexes
    follow the trio.
15. **F22 (works.md#15)** Desktop sidebar collapse — footer toggle (`SidebarLeft01Icon`,
    rotates on state) folds the sidebar to an icon-only rail; width + content padding
    animate together (300ms ease-out), rail links keep title/aria-label, mobile Sheet nav
    untouched. `DashboardShell` (client) owns the state; layout delegates to it.
16. **F-VERIFY** lint 0/0, `tsc --noEmit` clean, `npm run build` green (22 routes + ƒ Proxy,
    incl. `/api/customers/[id]/restore`, `/api/transactions/[id]/restore`,
    `/api/overview/charts`, `/_not-found`). HTTP/browser smoke intentionally skipped at
    the user's request ("don't do smoke test all are working") - no runtime API checks
    were run this round.

## Round F1-F7 (2026-10-13)

1. **F1 (2026-10-13)** Read + understood all docs/data CSVs; updated DB models to the
   master-sheet data model (customer codes `C001`…, business name/type/area/category,
   alt phone, customer since, risk level, recovery status; transaction added-by, TRX
   reference, product category, verification, reference source; phone now optional +
   sparse-unique). Imported all data via `npm run import-csv` (94 customers, 78 sheet
   transactions, opening-balance rows per requirements §5.6). Skipped the empty
   Record Reference / Recovery Tracking / Settings CSVs for now.
2. **F2 (2026-10-13)** CSV + JSON export by user preference on Customers, Transactions
   and Due Summaries - full filtered scope, master-sheet column names
   (`lib/export.ts` + shared ExportMenu).
3. **F3 (2026-10-13)** Customer detail: CSV/JSON export of the customer payload; PDF
   redesigned with the Lendbook logo + teal palette + master-sheet columns
   (code, business, area, risk/recovery, added-by); page made responsive-first.
4. **F4 (2026-10-13)** Responsive sweep across dashboard + landing + login
   (filter/toolbars full-width on mobile, stat tiles and summary tiles shrink
   safely, wrap-break-word on long values, progressive table columns).
5. **F5 (2026-10-13)** Method labels display "Cash" / "Mobile banking" everywhere
   (tables, overview, PDF, selects) via one `methodLabel()` helper.
6. **F6 (2026-10-13)** Customer picker rebuilt as a searchable server-side popover
   (code / name / business / phone) - works past the first 100 customers; used in the
   transaction form AND the transactions page filter.
7. **F7 (2026-10-13)** Date selection uses the shadcn Calendar in a popover
   (shared `DatePicker`), with a Today shortcut and future dates disabled.

# Earlier rounds (v1 review fixes — completed 2026-08-19/20)

1. Many cards in landing, dashboard pages has no x axis padding, detect, add and fix it.
    1. Also hero section right section tilted card too.
2. In Practice section slider not showing properly its top bottom border of cards also right side and left side section of whole section possibly overflowing hidden so borders aren't visible fix it.
3. Add a Home route button in dashboard sidebar links, Add link /dashboard/overview to Brand Logo Name with Image whole section, Make sure overview is /dashboard/overview not /dashboard, as this makes two routes active link at a time.
4. PDF's Table section same needs x-axis padding added and updated.
5. Then comes important part, the theme on global.css would be teal green type, also please make sure to add gradients in buttons, sections, cards to make it more engaging.
6. Add a MARQUEE after HERO Section.
7. Add a Testimonials Section in Home Page.
8. Update the "L" Text logo to use /public/images/logo.png or fallback to "L"
