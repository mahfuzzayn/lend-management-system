# Lendbook - Lend Management System

A lightweight web app for a single administrator (a money lender) to track
customers, money lent, repayments, and the resulting outstanding dues - with
one-click export of any customer's full history as a single PDF.

**Core ideas**

- **Append-only ledger** - balances are *always derived* (`Σ lend − Σ
  repayment`), never stored; deleting a customer cascades their transactions.
- **Single admin** - no roles, no self-registration, no public data access.
- **One PDF** - a customer's complete current history as one client-generated file.

Full specification: [`docs/requirements.md`](docs/requirements.md) ·
execution plan: [`docs/goals.md`](docs/goals.md) · work log:
[`docs/progress.md`](docs/progress.md).

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3 (App Router, TypeScript strict, Turbopack) |
| UI | shadcn/ui (radix-mira style, vendored in `src/components/ui`) + Tailwind CSS v4 |
| Animations | Motion (`motion/react`) - respects `prefers-reduced-motion` |
| Database | MongoDB (Atlas) via Mongoose 9 |
| Auth | bcrypt (cost 12) + JWT (jsonwebtoken, HS256) in an httpOnly SameSite=Lax cookie, guarded by `src/proxy.ts` |
| Validation | zod schemas shared between the forms and the API (`src/schemas`) |
| PDF | `@react-pdf/renderer`, generated client-side |

## Getting started

Requirements: **Node.js ≥ 22.18** (the seed script runs TypeScript natively)
and npm.

```bash
npm install
cp .env.example .env    # then fill in the values (see below)
npm run seed            # creates the first admin from ADMIN_* env vars
                        # add --demo to also load 10 sample customers + 41 transactions
npm run dev             # http://localhost:3000
```

Sign in at `/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you seeded.

### Environment variables

| Variable | Scope | Notes |
| --- | --- | --- |
| `MONGODB_URI` | server | Atlas connection string (include the database name) |
| `JWT_SECRET` | server | ≥ 32 random chars - `openssl rand -base64 48` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed | consumed by `npm run seed` |
| `ADMIN_ROLE` | seed | `super-admin` (default) or `admin` for the seeded admin (RBAC) |
| `NEXT_PUBLIC_APP_NAME` | client | display name ("Lendbook") |

`.env` is git-ignored; `.env.example` documents every variable.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server (Turbopack) |
| `npm run build` / `npm start` | production build / serve |
| `npm run lint` | ESLint (0 errors / 0 warnings expected) |
| `npm run seed` | upsert the admin; `--demo` also (re)loads the sample ledger |
| `npm run seed -- --create-admin "Name" email password [--role=admin\|super-admin]` | add (or update) another admin without touching any data |
| `npm run import-csv` | import the real master-sheet CSVs from `docs/data` (customers, dues, transactions); `--dry-run` prints the plan without writing. **Additive** - aborts if the customer codes already exist, never wipes data |

### Security notes

- Sessions: 24 h JWT cookie, httpOnly + SameSite=Lax, Secure in production,
  with a sliding refresh (re-issued past half its TTL while active).
- Login rate limit: **≤ 5 failed attempts per 10 minutes per IP**, in-memory.
  On serverless this is per-instance - it blunts brute force, not a hard
  guarantee; a shared store would need an extra dependency.
- All mutating endpoints validate with the shared zod schemas before touching
  the database; Mongoose models add a second validation layer.
- Passwords are bcrypt-hashed (cost 12) and never returned by the API.
- **RBAC (roles):** every admin signs in the same way; the role rides in the
  session JWT. Admins can soft-delete (Trash) and restore; only super admins
  can purge (`?purge=true` endpoints enforce it server-side with 403).
  Deleting is always two-stage - nothing leaves the Trash by accident.
  Admins created before roles existed (the original owner) resolve to
  super-admin automatically.

## Deploying (Vercel + Atlas)

1. Create a MongoDB Atlas cluster + database user; allow access from Vercel's
   egress (or `0.0.0.0/0` for simplicity), copy the connection string.
2. Import this repo into Vercel; set the env vars above in the project
   settings (`JWT_SECRET` must be a fresh production value).
3. Deploy, then seed the production admin once from any machine with the
   production env:
   `MONGODB_URI=... ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed`
4. Smoke-test the deployed URL: login, dashboard sections, CRUD, PDF export.

## Project layout

```
src/
├── app/            (landing) group, /login, /dashboard/*, api/* route handlers
├── components/     ui (vendored shadcn), landing, dashboard, customers,
│                   transactions, dues, pdf, shared
├── lib/            api-client, auth, db, domain (pure calculators), config,
│                   motion, rate-limit, serialize, utils
├── models/         Mongoose: Admin, Customer, Transaction
├── schemas/        shared zod schemas (client + server)
└── proxy.ts        auth guard for /dashboard/* and /api/*
scripts/            seed.ts (+ demo-data.ts for --demo), import-mihad-csv.ts
docs/               requirements.md, goals.md, progress.md, works.md (+ data/ CSVs)
```
