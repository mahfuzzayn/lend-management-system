# Lendbook v1 — Demo Video Script

| Field    | Value                                  |
| -------- | -------------------------------------- |
| Goal     | Walk the v1 prototype end-to-end: landing → login → every dashboard feature |
| Runtime  | ~1:55 (hard cap 2:00)                  |
| Format   | Screen recording, 1920×1080, 30 fps    |
| Voice    | Calm, product-real. Numbers spoken exactly as written (৳ = "taka") |

## Shot list

| # | Time    | Scene                                    |
| - | ------- | ---------------------------------------- |
| 1 | 0:00–0:09 | Landing hero                             |
| 2 | 0:09–0:19 | Landing scroll: marquee → features → carousel → testimonials |
| 3 | 0:19–0:26 | Sign in (demo credential)                |
| 4 | 0:26–0:42 | Overview: stat cards + recent + top dues |
| 5 | 0:42–0:58 | Customers: search, validation            |
| 6 | 0:58–1:16 | Customer detail + PDF download           |
| 7 | 1:16–1:34 | Transactions: filters + summary line     |
| 8 | 1:34–1:48 | Dues: ranking + settled toggle           |
| 9 | 1:48–1:55 | Sign out → end card                      |

Cut on scene boundaries; one take per scene is fine.

## Pre-record checklist

- [ ] Fresh server on a **fresh port** (`npx next start -p 3199`) — never a stale `next-server`.
- [ ] Fresh incognito window: logged out, pristine mock store (no leftover edits/deletes).
- [ ] Hide bookmarks bar; clear downloads shelf before scene 6 (PDF).
- [ ] Mouse at deliberate speed — hover states (card lift, row actions) are part of the product.
- [ ] Let every toast sit on screen ~1 s before cutting; they auto-dismiss.

---

## Scene 1 — Landing hero (0:00–0:09)

**On screen:** `/` fully loaded, hero headline + "Sign in" CTA visible. Hold 1 s, then slow hover across the hero copy.

**VO (~9 s):**
> Meet Lendbook — a lending notebook that keeps itself. Customers, money lent, repayments, and the one number that matters: what's due right now.

## Scene 2 — Landing tour (0:09–0:19)

**On screen:** One smooth scroll pass: marquee band → "The essentials" feature cards → "In practice" carousel (nudge it one slide with the arrow) → "Kept, not promised" testimonials → CTA band. Stop at the CTA.

**VO (~10 s):**
> The landing page sets the tone — what it does, how it works, and who it's for. But the real product lives behind this door.

## Scene 3 — Sign in (0:19–0:26)

**On screen:** Click **Sign in** → login page. Click **Fill** (credential loads), hover the demo hint, click **Sign in** — button shows its loading state, then redirect.

**VO (~7 s):**
> One admin, one account. For this demo the credential is pre-filled — sign in.

## Scene 4 — Overview (0:26–0:42)

**On screen:** `/dashboard/overview` loads (let the skeletons flash, then the count-up land). Hover each stat card in order. Scroll to Recent activity, then Top dues; hover the #1 row.

**VO (~15 s):**
> Inside: your whole book at a glance. Nine active customers. ৳262,000 lent, ৳188,000 collected — ৳74,000 still outstanding. Below, the latest ten movements, and your five largest dues, ranked.

## Scene 5 — Customers (0:42–0:58)

**On screen:** Sidebar → **Customers** (skeleton → rows). Type `man` in search — list narrows to **Mannan Furniture Works**. Clear search. Click **Add customer**, click **Create** on the empty form → inline zod errors appear → **Cancel**.

**VO (~15 s):**
> Customers, searchable by name or phone, with live dues and last activity. The form validates as you type — nothing sloppy gets into the book.

## Scene 6 — Customer detail + PDF (0:58–1:16)

**On screen:** Open **Mannan Furniture Works** (top due). Show profile card, three summary tiles, then scroll the ledger — point at the **running balance** column as it climbs to ৳25,000. Click **Download History PDF** → button goes "Preparing…" → success toast → the PDF opens (or downloads-shelf B-roll).

**VO (~17 s):**
> Open your biggest due — Mannan Furniture Works, ৳25,000 out. Profile, totals, and the full ledger with a running balance after every entry. One click: the entire history as a single PDF.

## Scene 7 — Transactions (1:16–1:34)

**On screen:** Sidebar → **Transactions**. Set **Type = Lend**, then **Customer = Mannan Furniture Works** — note the mono summary line (count · lent Σ · repaid Σ) update. Set a **from** date to tighten it. Click **Reset**. Hover a row's edit/delete actions (don't click).

**VO (~16 s):**
> Every movement lives here — filter by customer, type, or date range, with lent and repaid totals for whatever's on screen. Edit and delete are one confirmed click away.

## Scene 8 — Dues (1:34–1:48)

**On screen:** Sidebar → **Due Summaries**. Table ranked by outstanding — Mannan on top at ৳25,000, totals footer visible. Flip **"Show settled & advances"** on → **Nusrat Jahan** (settled) and **Jamal Auto Parts** (−৳2,000 advance) rows appear; hover their badges. Flip off.

**VO (~13 s):**
> Due summaries rank everyone by what they owe. One switch reveals the settled and the over-paid — badges always say what they mean, never just color.

## Scene 9 — Sign out + end card (1:48–1:55)

**On screen:** Header avatar → dropdown → **Sign out** → toast → landing page. Cut to end card (logo + tagline + URL).

**VO (~7 s):**
> Sign out, and the book closes. Lendbook — lend, record, and always know what's due.

---

## End card

```
Lendbook
Lend with a clean record.
[v1 prototype]
```

## Edit notes

- If a take runs long, trim inside scene 2 (scroll faster) and scene 7 (skip the from-date) — never the PDF or count-up moments.
- Keep skeleton→content flashes for overview, customers, and dues; they sell the polish.
- No background music under VO in scenes 4–8 (numbers must land); music OK under 1–3 and 9.
