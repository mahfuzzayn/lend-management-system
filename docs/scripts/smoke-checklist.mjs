/**
 * Kept from the v2 build (G-71/G-74) for future regression runs.
 * Usage: node docs/scripts/smoke-checklist.mjs <project-dir> <1|2|prod>
 *   1   - guards + rate limit (fresh local server on :3199)
 *   2   - login/CRUD/validation/cascade (restart server first - fresh limiter)
 *   prod- same as 2 plus guards, against BASE_URL=https://your-deployment
 *       NEVER run the rate-limit phase against production (blocks your IP).
 */
/**
 * §14.2 checklist runner.
 * Phase 1 (fresh server): guards + wrong-password + rate limit.
 * Phase 2 (after restart): login, CRUD persistence, validation parity,
 * cascade, aggregates, logout.
 * Phase prod (BASE_URL=https://...): guards + phase-2 body against the
 * deployment. Skips the rate-limit block: the limiter is per-instance on
 * serverless (unreliable there) and would block this machine's IP on the
 * real login for 10 minutes. Rate limiting stays verified locally (G-61/G-71).
 * Usage: node lendbook-final-checklist.mjs <project-dir> <1|2|prod>
 */
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3199";
const projectDir = process.argv[2];
const phase = process.argv[3] ?? "1";

const env = {};
for (const line of readFileSync(`${projectDir}/.env`, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

let passed = 0;
let failed = 0;
const check = (name, cond, detail = "") => {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` :: ${detail}` : ""}`);
  }
};

async function req(method, path, { body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers["cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json, res };
}

for (let i = 0; ; i++) {
  try {
    await fetch(`${BASE}/api/overview`);
    break;
  } catch {
    if (i > 60) {
      console.log("FAIL server never came up");
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

if (phase === "prod") {
  // Guards against the deployment (same expectations as local).
  check("dashboard redirects signed out", (await req("GET", "/dashboard/overview")).status === 307);
  for (const p of ["/api/customers", "/api/transactions", "/api/dues", "/api/overview", "/api/auth/me", "/api/auth/logout"]) {
    check(`401 ${p} unauthenticated`, (await req("GET", p)).status === 401);
  }
}

if (phase === "1") {
  // Guards
  check("dashboard redirects signed out", (await req("GET", "/dashboard/overview")).status === 307);
  for (const p of ["/api/customers", "/api/transactions", "/api/dues", "/api/overview", "/api/auth/me", "/api/auth/logout"]) {
    check(`401 ${p} unauthenticated`, (await req("GET", p)).status === 401);
  }

  // Wrong password + rate limit (§14.2): failures 1-5 → 401, 6th → 429.
  // NOTE: every bad-credential POST counts, including probes - keep the login-
  // exemption probe AFTER this block (any non-401 status proves reachability).
  for (let i = 1; i <= 5; i++) {
    const r = await req("POST", "/api/auth/login", { body: { email: env.ADMIN_EMAIL, password: `wrong-pass-${i}` } });
    check(`wrong password ${i} → 401`, r.status === 401, `status=${r.status}`);
  }
  check("6th attempt → 429 rate limit", (await req("POST", "/api/auth/login", { body: { email: env.ADMIN_EMAIL, password: "wrong-pass-6" } })).status === 429);
  check("correct password blocked while limited", (await req("POST", "/api/auth/login", { body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } })).status === 429);
  check("login route reachable while limited (429, not the 401 guard)", (await req("POST", "/api/auth/login", { body: { email: "x@y.co", password: "longenough1" } })).status === 429);
} else if (phase === "2" || phase === "prod") {
  // Local-calendar today (matches the form's max attribute logic).
  const TODAY = new Date().toLocaleDateString("en-CA");

  // Login (fresh limiter window after restart)
  const login = await req("POST", "/api/auth/login", { body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } });
  check("login against seeded admin", login.status === 200, JSON.stringify(login.json));
  const cookie = login.res.headers.getSetCookie().find((c) => c.startsWith("lendbook-session="))?.split(";")[0];

  // Baseline: the DB holds live user data, so assert DELTAS, not seed absolutes.
  const ov0 = (await req("GET", "/api/overview", { cookie })).json?.data;
  check("baseline overview readable", typeof ov0?.totalCustomers === "number" && typeof ov0?.totalOutstanding === "number");

  // Validation parity paths (§14.2 readable errors)
  const badPhone = await req("POST", "/api/customers", { cookie, body: { name: "Long Phone Co", phone: "+880 1700-0000000000009" } });
  check("phone > 20 chars → 422 with readable reason", badPhone.status === 422 && badPhone.json?.message === "Keep the phone number under 20 characters.", JSON.stringify(badPhone.json));
  const future = await req("POST", "/api/transactions", { cookie, body: { customerId: "507f1f77bcf86cd799439011", type: "lend", amount: 100, date: "2999-01-01", method: "cash", note: "" } });
  check("future date → 422 with readable reason", future.status === 422 && future.json?.message === "Pick today or an earlier date.", JSON.stringify(future.json));
  check("zero amount → 422", (await req("POST", "/api/transactions", { cookie, body: { customerId: "507f1f77bcf86cd799439011", type: "lend", amount: 0, date: TODAY, method: "cash", note: "" } })).status === 422);
  check("unknown customer → 422", (await req("POST", "/api/transactions", { cookie, body: { customerId: "507f1f77bcf86cd799439011", type: "lend", amount: 100, date: TODAY, method: "cash", note: "" } })).status === 422);
  const dup = await req("POST", "/api/customers", { cookie, body: { name: "Dup Phone", phone: "+880 1712-458900" } });
  check("duplicate phone → 409", dup.status === 409 && dup.json?.message === "That phone number already belongs to another customer.", JSON.stringify(dup.json));

  // CRUD persists (§14.2)
  const created = await req("POST", "/api/customers", { cookie, body: { name: "Checklist Scratch", phone: "+880 1700-999888" } });
  const scratchId = created.json?.data?.id;
  check("create persists", created.status === 201 && Boolean(scratchId));
  const t1 = await req("POST", "/api/transactions", { cookie, body: { customerId: scratchId, type: "lend", amount: 7000, date: TODAY, method: "cash", note: "checklist" } });
  check("transaction persists (local today accepted)", t1.status === 201 && t1.json?.data?.amount === 7000, JSON.stringify(t1.json));
  const ov1 = (await req("GET", "/api/overview", { cookie })).json?.data;
  check("overview reflects new data (+1 customer, +7k lent/outstanding)",
    ov1?.totalCustomers === ov0.totalCustomers + 1 && ov1?.totalLent === ov0.totalLent + 7000 && ov1?.totalOutstanding === ov0.totalOutstanding + 7000,
    JSON.stringify({ before: ov0 && { c: ov0.totalCustomers, l: ov0.totalLent, o: ov0.totalOutstanding }, after: ov1 && { c: ov1.totalCustomers, l: ov1.totalLent, o: ov1.totalOutstanding } }));
  const dues1 = (await req("GET", "/api/dues", { cookie })).json?.data;
  check("dues reflects scratch row", dues1?.some((c) => c.id === scratchId && c.due === 7000));

  // Cascade delete (§14.2)
  const del = await req("DELETE", `/api/customers/${scratchId}`, { cookie });
  check("delete reports cascaded transactions", del.status === 200 && del.json?.data?.transactionsDeleted === 1, JSON.stringify(del.json));
  check("cascade leaves no orphan transactions", (await req("GET", `/api/transactions?customerId=${scratchId}`, { cookie })).json?.data?.total === 0);
  const ov2 = (await req("GET", "/api/overview", { cookie })).json?.data;
  check("overview back to baseline", ov2?.totalCustomers === ov0.totalCustomers && ov2?.totalLent === ov0.totalLent && ov2?.totalOutstanding === ov0.totalOutstanding);

  // PDF data endpoint (client-side renderer consumes exactly this payload)
  const list = (await req("GET", "/api/customers?search=Karim", { cookie })).json?.data?.items ?? [];
  const detail = (await req("GET", `/api/customers/${list[0]?.id}`, { cookie })).json?.data;
  const ledger = detail?.transactions ?? [];
  check("PDF payload complete (customer+summary+ledger)", Boolean(detail?.customer && typeof detail?.summary?.due === "number" && ledger.length > 0 && ledger.at(-1)?.balance === detail.summary.due));

  // Logout
  check("logout 200 + clears cookie", (await req("POST", "/api/auth/logout", { cookie })).status === 200);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
