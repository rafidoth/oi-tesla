# Dhaka Tesla Pool — Architecture

> Companion to [`PRD.md`](./PRD.md). Every requirement referenced as `PRD Section x` points there.
> The README links here for the mandated stack/design justifications.

---

## Table of Contents

- [1. Purpose & Scope](#1-purpose--scope)
- [2. System Context](#2-system-context)
- [3. Lifecycle & State Machines](#3-lifecycle--state-machines)
  - [3.1 Pool state machine (source of truth, D4)](#31-pool-state-machine-source-of-truth-d4)
  - [3.2 Derived passenger ride status (no stored per-ride state)](#32-derived-passenger-ride-status-no-stored-per-ride-state)
  - [3.3 Enforcement](#33-enforcement)
- [4. Matching & Pool Formation](#4-matching--pool-formation)
  - [4.1 The route model (D8)](#41-the-route-model-d8)
  - [4.2 Pairwise compatibility](#42-pairwise-compatibility)
  - [4.3 Formation flow (eager, deterministic — D1, D6)](#43-formation-flow-eager-deterministic--d1-d6)
  - [4.4 Driver accept flow](#44-driver-accept-flow)
- [5. Capacity & Concurrency](#5-capacity--concurrency)
  - [5.1 The guarded counter (D5)](#51-the-guarded-counter-d5)
  - [5.2 Race scenarios mapped (PRD Section 14)](#52-race-scenarios-mapped-prd-section-14)
- [6. Fare Engine & Payments](#6-fare-engine--payments)
  - [6.1 Formula (D7)](#61-formula-d7)
  - [6.2 Lifecycle of a fare](#62-lifecycle-of-a-fare)
  - [6.3 Rounding — largest remainder](#63-rounding--largest-remainder)
  - [6.4 Worked example — Banani Rush Hour (PRD Section 18)](#64-worked-example--banani-rush-hour-prd-section-18)
- [7. Security & Authorization](#7-security--authorization)
  - [7.1 Authentication](#71-authentication)
  - [7.2 Authorization (server-side only — PRD Section 11)](#72-authorization-server-side-only--prd-section-11)
  - [7.3 Hardening](#73-hardening)
- [8. Observability](#8-observability)
- [9. Frontend Architecture](#9-frontend-architecture)
  - [9.1 Route map](#91-route-map)
  - [9.2 Data & state](#92-data--state)
  - [9.3 Components](#93-components)
- [10. Testing Strategy](#10-testing-strategy)
- [11. Docker & Local Development](#11-docker--local-development)
- [12. Deployment](#12-deployment)
- [13. PRD Deviations & Clarifications](#13-prd-deviations--clarifications)
- [14. Acceptance Walkthrough (PRD Section 18 mapped)](#14-acceptance-walkthrough-prd-section-18-mapped)

---

## 1. Purpose & Scope

This document defines the system architecture for the Dhaka Tesla Pool MVP:

- System context and component responsibilities
- Technology stack and justification of every pick
- Database schema (tables, constraints, indexes, relationships)
- Ride/pool lifecycle state machines and their enforcement
- Deterministic matching and pool formation (route model)
- Capacity enforcement under concurrency
- Fare engine and payment simulation
- REST API design, auth, validation, error handling
- Security, observability, testing, Docker, and deployment

Non-goals from `PRD Section 20` (GPS, routing APIs, real payments, ratings, surge pricing) are architectural non-goals here too. Where this document **supersedes or clarifies** the PRD, it is called out inline and summarized in [Section 13](#13-prd-deviations--clarifications).

---

## 2. System Context

```text
                        ┌──────────────────────────┐
                        │  Passenger / Driver       │
                        │  Browser                  │
                        └────────────┬─────────────┘
                                     │ HTTPS · JSON · JWT Bearer
                                     ▼
                ┌───────────────────────────────────────┐
                │  Next.js client (App Router)          │
                │  Vercel / Docker                      │
                │  · auth screens, ride forms           │
                │  · passenger ride tracking (5s poll)  │
                │  · driver console (roster, lifecycle) │
                └────────────┬──────────────────────────┘
                             │ HTTPS · Authorization: Bearer <JWT>
                             ▼
                ┌───────────────────────────────────────┐
                │  Express API (TypeScript)             │
                │  Render / Docker                      │
                │  · auth, rides, pools, driver,        │
                │    payments, locations, routes        │
                │  · matching · fare engine ·           │
                │    state machine · capacity guard     │
                │  · Zod validation · RBAC · audit log  │
                └────────────┬──────────────────────────┘
                             │ Drizzle ORM (typed client)
                             ▼
                ┌───────────────────────────────────────┐
                │  PostgreSQL 16                        │
                │  Neon / Docker                        │
                │  · relational integrity               │
                │  · guarded counter + CHECK backstop   │
                │  · append-only ride_events audit      │
                └───────────────────────────────────────┘
```

Three deployables (client, API, database), all free-tier hostable, all reproducible locally via one `docker compose up`.

---

## 3. Lifecycle & State Machines

### 3.1 Pool state machine (source of truth, D4)

Driver actions walk the pool; system/passenger actions close it.

```text
        driver accept               driver: arrive            driver: start           driver: complete
OPEN ────────────────────► MATCHED ─────────────────► DRIVER_ARRIVED ─────────────► STARTED ─────────────► COMPLETED
  │                            │                                                 (fares freeze)        (payments created)
  │ last active member cancels │ last active member cancels
  └──────────────┬─────────────┘
                 ▼
            CANCELLED      (terminal — row retained for audit, hidden from listings)
```

| From | Action | Actor | To | Guard |
|---|---|---|---|---|
| OPEN | accept | driver | MATCHED | driver `ONLINE`; no other active pool; `vehicle.capacity ≥ occupied_seats` |
| MATCHED | arrive | driver | DRIVER_ARRIVED | — |
| DRIVER_ARRIVED | start | driver | STARTED | **fares freeze here** |
| STARTED | complete | driver | COMPLETED | creates `PENDING` payments |
| OPEN / MATCHED | last active member cancels | passenger | CANCELLED | seat freed, pool soft-dissolved |

**Everything else is invalid and rejected with `422 INVALID_STATE_TRANSITION`** — including every PRD Section 6 example (`COMPLETED→STARTED`, `COMPLETED→CANCELLED`, `STARTED→MATCHED`, `CANCELLED→STARTED`): terminal states (`COMPLETED`, `CANCELLED`) have no outgoing edges, and the edges that exist only move forward.

Membership changes (join / cancel) are legal while `OPEN` or `MATCHED` only — the same transaction that performs them re-checks pool status (D3, D11).

### 3.2 Derived passenger ride status (no stored per-ride state)

| Pool status | Active member sees | Cancelled member sees |
|---|---|---|
| OPEN | `REQUESTED` | `CANCELLED` |
| MATCHED | `MATCHED` | `CANCELLED` |
| DRIVER_ARRIVED | `DRIVER_ARRIVED` | `CANCELLED` |
| STARTED | `STARTED` | `CANCELLED` |
| COMPLETED | `COMPLETED` | `CANCELLED` |
| CANCELLED | — | `CANCELLED` |

This reproduces PRD Section 6 exactly: passengers sit in `REQUESTED` while their eagerly-formed pool awaits a driver, and reach `MATCHED` the moment a driver accepts — while individual cancellation remains per-passenger at any pre-`DRIVER_ARRIVED` point.

### 3.3 Enforcement

- One `transitionPool(poolId, action, actor)` function owns every legal edge; routes call it, nothing else mutates `pools.status`.
- The transition, the guarded seat update, fare recomputation, and the `ride_events` writes all happen **inside one transaction** ([Section 5](#5-capacity--concurrency)).
- Invalid edges throw `InvalidTransitionError` → `422` with the current and attempted states in the payload.

---

## 4. Matching & Pool Formation

### 4.1 The route model (D8)

Compatibility is **data**, seeded and inspectable:

| Route | Chain (ordered stops) | Segments |
|---|---|---|
| `banani-south` (C1) | Banani → Gulshan → Mohakhali | B→G 2000 m, G→M 3000 m |
| `banani-east` (C2) | Banani → Gulshan → Bashundhara | B→G 2000 m, G→Ba 3100 m |
| `uttara-spine` (C3) | Uttara → Banani → Gulshan | U→B 7000 m, B→G 2000 m |
| `mirpur-central` (C4) | Mirpur → Farmgate → Dhanmondi | Mi→F 5000 m, F→D 3000 m |
| `mohakhali-north` (C5) | Mohakhali → Gulshan → Banani | M→G 3000 m, G→B 2000 m |

"Banani→Gulshan **overlaps** Banani→Mohakhali" is now a stored fact: the B→G segment is a prefix of the B→M route on C1 — the vehicle literally passes Gulshan en route, and Gulshan passengers alight mid-chain. That geographic overlap *is* the pooling justification, and it reproduces PRD Section 7.2's matrix exactly: Gulshan↔Mohakhali compatible (C1), Gulshan↔Bashundhara compatible (C2), Mohakhali↔Bashundhara **not** compatible (no shared route) — and the PRD never claims they are.

A location pair is **served** iff some route contains both locations with the destination strictly downstream of the pickup. Requests on unserved pairs are rejected (`ROUTE_NOT_SERVED`) — the service does not guess distances (see [Section 13](#13-prd-deviations--clarifications) on why straight-line Section 12 coords are not used).

### 4.2 Pairwise compatibility

Request R is compatible with existing member M iff:

1. same **pickup location** (D11 — no mid-chain pickups), and
2. ∃ a route containing the pickup with **both** destinations strictly downstream.

A pool accepts R iff R is compatible with **every** active member. This "all-pairs" rule blocks the transitivity leak: `{Gulshan, Mohakhali}` on C1 cannot admit a Bashundhara request even though a bare Gulshan request would be compatible with either.

### 4.3 Formation flow (eager, deterministic — D1, D6)

```text
POST /api/rides
  │
  ├─ validate: locations exist, pickup ≠ dest, pair served by ≥1 route, seats 1..4
  ├─ compute solo estimate (fare engine, Section 6) → ride_requests row
  │
  ├─ MATCHING (service, pure & unit-tested):
  │    candidates = pools
  │      WHERE status IN ('OPEN','MATCHED')          -- joinable window (D3)
  │        AND pickup_location_id = R.pickup_location_id
  │        AND occupied_seats + R.seats <= capacity
  │      ORDER BY created_at ASC, id ASC              -- deterministic: earliest first
  │    for each candidate (small N, in-memory check):
  │      keep iff ∃ route containing pickup + R.dest + all active member dests
  │
  ├─ first keeper → JOIN:  guarded UPDATE + member INSERT + fare recompute (Section 5, Section 6)
  └─ no keeper    → CREATE pool: status OPEN, capacity = NOMINAL_POOL_CAPACITY (3),
                    first member inserted, fare = solo fare for now
```

Every request lands in a pool at creation time; compatibility and order are fully deterministic (PRD Section 7.1, Section 15). The 4th passenger in the acceptance scenario finds Pool A full, skips it (guard fails), and opens Pool B (D6) — visible to any other online vehicle, none existing in the seed, so they simply wait with a clean "waiting for a driver" state.

### 4.4 Driver accept flow

```text
POST /api/driver/pools/:id/accept
  │ driver ONLINE?  has no active pool (partial unique index)?
  │ vehicle.capacity ≥ pool.occupied_seats?
  │    → pool: driver_id, vehicle_id, capacity = vehicle.capacity, status OPEN→MATCHED
  │    → events: DRIVER_ACCEPTED (pool) + RIDE_MATCHED (each active member)
```

If the driver's vehicle is smaller than the pool's occupancy, accept fails with `409 VEHICLE_TOO_SMALL` — the invariant never bends.

---

## 5. Capacity & Concurrency

The headline invariant (PRD Section 7.4, US-POOL01): **`occupied_seats ≤ capacity`, always, under any number of concurrent joins.**

### 5.1 The guarded counter (D5)

Membership changes run in one transaction built around a **conditional atomic update**:

```sql
-- JOIN (n seats):
UPDATE pools
   SET occupied_seats = occupied_seats + :n, updated_at = now()
 WHERE id = :poolId
   AND status IN ('OPEN', 'MATCHED')           -- join window (D3)
   AND occupied_seats + :n <= capacity;        -- the guard

-- if rowcount = 0 → ROLLBACK → 409 POOL_FULL (or 422 if the status check failed)
-- if rowcount = 1 → INSERT passenger_rides … → recompute fares → write events → COMMIT
```

Why this is airtight:

- The guard and the increment are **one atomic statement** — two transactions racing for the final seat both execute the UPDATE, Postgres row-locks the pool row, the second one's `WHERE` fails, it affects 0 rows, and it rolls back. Exactly one wins; `occupied_seats` can never exceed `capacity`.
- The `CHECK (occupied_seats BETWEEN 0 AND capacity)` constraint is a **physical backstop**: even a future bug that bypasses the guard cannot persist an overbooked pool — the transaction aborts.
- Seat release on cancel is the guarded mirror image (`occupied_seats = occupied_seats - :n WHERE occupied_seats - :n >= 0`), in the same transaction as `cancelled_at`, fare recompute, `SEAT_RELEASED`, and (if the pool is now empty) the `OPEN/MATCHED → CANCELLED` transition.

### 5.2 Race scenarios mapped (PRD Section 14)

| Edge case | Outcome under this design |
|---|---|
| Two passengers race for the final seat | Serialised by the guarded UPDATE; loser gets `409 POOL_FULL`; final occupancy ≤ capacity — **integration-tested with real parallel requests** ([Section 10](#10-testing-strategy)) |
| Duplicate acceptance (same passenger twice in a pool) | Partial unique index `(pool_id, passenger_id) WHERE cancelled_at IS NULL`; second INSERT aborts its transaction |
| Join attempted after `STARTED` | Status predicate inside the guarded UPDATE fails → `422` |
| Cancel + concurrent join for the released seat | Cancel commits first (seat freed) → join's guard passes, or join ran first (pool full) → cancel still fine; either serialization is correct |
| Driver offline | Accept requires `ONLINE`; an offline driver's existing active rides continue untouched (PRD Section 14) |
| Driver accepts two pools at once | Partial unique active-pool index aborts the second accept |
| Vehicle smaller than pool | `409 VEHICLE_TOO_SMALL` at accept; pool stays `OPEN` |

---

## 6. Fare Engine & Payments

### 6.1 Formula (D7)

All math in **integer paisa** and **integer meters** — no floats (PRD Section 8.3).

```text
leg(member)        = route distance pickup_location → member dest_location, in meters   (route-invariant, Section 4.1)
tripDistance(pool) = max(leg(member) for active members)      (the farthest stop — how far the vehicle drives)
poolTotal          = FARE_BASE_PAISA + FARE_PER_KM_PAISA × tripDistance / 1000
                                                                (meters → km; the seed's 100 m granularity
                                                                 keeps every product integral)
share(member)      = poolTotal × leg(member) / Σ legs          (integer arithmetic — Section 6.3)
```

Configuration (env, PRD Section 8.1 "configuration, not hard-coded"): `FARE_BASE_PAISA=5000` (50 BDT), `FARE_PER_KM_PAISA=2000` (20 BDT/km), `NOMINAL_POOL_CAPACITY=3`.

Sharing **is** the discount: the vehicle-trip total is what one solo rider would pay to the farthest stop, and everyone splitting it pays less as the pool fills. There is no separate `poolDiscount` term — see [Section 13](#13-prd-deviations--clarifications).

### 6.2 Lifecycle of a fare

| Moment | What happens |
|---|---|
| Request created | **Solo estimate** = `base + perKm × own leg`, stored on `ride_requests.estimate_fare_paisa`, shown before acceptance (US-P02) |
| Pool membership changes (join/cancel, while OPEN/MATCHED) | Shares **recomputed for all active members** of that pool; `FARE_RECALCULATED` event |
| Pool enters `STARTED` | Fares **frozen** on `passenger_rides.fare_paisa` — the number the passenger pays |
| Pool `COMPLETED` | `PENDING` payment created per active member at the frozen amount (D15) |

### 6.3 Rounding — largest remainder

`share = floor(poolTotal × leg / Σlegs)` per member; the leftover paisa (0..members−1) are assigned to the largest fractional remainders, ties broken by earliest `passenger_rides.created_at`. **The shares always sum to exactly `poolTotal`.** Pure integer arithmetic, unit-tested against adversarial splits.

### 6.4 Worked example — Banani Rush Hour (PRD Section 18)

Config: `FARE_BASE_PAISA=5000`, `FARE_PER_KM_PAISA=2000`; C1 legs: B→G 2000 m (2.0 km), B→M 5000 m (5.0 km).

| Step | Pool A state | Fares (paisa) |
|---|---|---|
| Nusrat requests B→M, 1 seat | OPEN, 1/3 | Solo: 5000 + 2000×5 = **15000** |
| Rafiq requests B→G, 1 seat → joins | OPEN, 2/3 | total 15000; legs 5000/2000 (Σ7000) → Nusrat **10714**, Rafiq **4286** (one remainder paisa to Rafiq) |
| Shirin requests B→G, 1 seat → joins | OPEN, 3/3 | legs 5000/2000/2000 (Σ9000) → Nusrat **8334** (tie-break), Rafiq **3333**, Shirin **3333** |
| 4th passenger requests B→M | Pool A guard fails (3+1>3) → **Pool B** created (OPEN, 1/3, solo 15000) | Pool A untouched at 3/3 |
| Jashim accepts Pool A | MATCHED (Bullet 3 ≥ 3) | — |
| arrive → start | DRIVER_ARRIVED → STARTED | **Frozen: 8334 / 3333 / 3333** |
| complete | COMPLETED | Payments `PENDING`: Nusrat 8334 (TESLAPAY), Rafiq 3333, Shirin 3333 (CASH) |
| settlement | Nusrat clicks pay → `PAID`; Jashim marks cash received ×2 → `PAID` | All `PAID`, each with `marked_by` |

Each passenger sees **only their own** fare (PRD Section 11) — the roster with fares is driver-only data.

---

## 7. Security & Authorization

### 7.1 Authentication

- Passwords hashed with **scrypt** (`node:crypto`, memory-hard, per-user 16-byte salt, stored as `scrypt$N$r$p$salt$hash`) — zero native dependencies in the container, no plaintext ever (PRD Section 15).
- **JWT HS256**, `JWT_SECRET` from env, 24h expiry, claims `{sub, role, name}`. Client holds the token in memory with a `sessionStorage` fallback for page-refresh tolerance — never `localStorage` (PRD Section 11). Known MVP tradeoffs, documented: no refresh token, no server-side revocation (statelessness is what makes free-tier spin-downs painless); expiry forces re-login daily.

### 7.2 Authorization (server-side only — PRD Section 11)

Two layers, both enforced in the service, never the client:

1. **Role gate** (middleware): `/api/driver/*` requires `role=DRIVER`; `/api/rides` requires `PASSENGER`.
2. **Ownership gate** (service): every passenger-scoped query is filtered by `passenger_id = req.user.sub`; drivers may only touch pools where `pool.driver_id = req.user.sub` (post-accept) or accept `OPEN` pools while online. Foreign resources return `404` (no existence leaks), unauthorized mutations return `403`.

Data-visibility rules are structural: the passenger ride payload contains no other passenger's fare or identity; only the driver roster endpoint returns co-passenger details.

### 7.3 Hardening

`helmet` (headers), CORS allowlist (`CLIENT_ORIGIN`, no credentials — bearer tokens), `express-rate-limit` (stricter bucket on `/auth/*`), Zod on every input (body/params/query), Drizzle parameterization everywhere (no string-built SQL except the fixed guarded UPDATE with bound params), errors never leak stack traces, request IDs for correlation. Modified request parameters can't touch another user's ride because every mutation re-derives ownership from the token (PRD Section 15 security).

---

## 8. Observability

- **Structured logs** (pino/pino-http): one line per request (method, path, status, latency, request id) plus one info line per lifecycle transition: `timestamp, actor, entity, previous state, new state` — exactly PRD Section 15's requirement.
- **`ride_events`** is the durable side of the same story (append-only, actor + from/to + payload) — logs are for operations, the table is for audit and reconstruction (PRD Section 13).
- **Health check** `GET /api/health` verifies the DB round-trip; used by compose and Render.
- Sensitive fields (password hashes, tokens) are redacted by the logger.

---

## 9. Frontend Architecture

`client/` — standalone Next.js App Router + TypeScript (existing scaffold; npm).

> Note: `client/AGENTS.md` flags that the bundled Next.js version has breaking API changes. Implementation must verify App Router conventions against `node_modules/next/dist/docs/` before writing code; this document deliberately describes structure, not version-specific APIs.

### 9.1 Route map

```text
app/
  page.tsx                    landing → redirects by role
  (auth)/login, (auth)/register
  (passenger)/dashboard       my rides + new request form (locations from GET /api/locations,
                              live estimate preview)
  (passenger)/rides/[id]      ride tracking: derived status badge, own fare,
                              cancel (while permitted), TeslaPay pay button
  (driver)/dashboard          online/offline toggle, open pool feed (decline/accept)
  (driver)/pools/[id]         roster + seat meter, arrive/start/complete,
                              mark cash received
```

### 9.2 Data & state

- **React Query** for all server state; active screens poll with `refetchInterval: 5000` (D14) — passengers see `DRIVER_ARRIVED → STARTED → COMPLETED` land within seconds (PRD Step 5).
- Auth token in a small module-level store (in-memory + sessionStorage), injected as a fetch-wrapper header; a `401` interceptor clears it and routes to login.
- **Every async screen has explicit loading (skeletons), error (banner + retry), and empty states** ("no open pools right now", "no rides yet — book your first trip") — the manager's rubric calls these out, so they are part of the design, not polish.

### 9.3 Components

Small presentational components over a thin feature layer: `StatusBadge` (derived ride status), `SeatMeter` (occupied/capacity — the capacity invariant made visible), `LocationSelect` (served pairs only), `FareEstimate`, `RideCard`, `PoolCard`, `RosterTable` (driver-only fares). Business rules (when cancel is legal, which lifecycle button is next) come from the server's derived status — the client never re-implements the state machine.

---

## 10. Testing Strategy

| Layer | Tool | What it proves |
|---|---|---|
| Unit | Vitest | **Fare engine**: exact splits, largest-remainder ties, sum == total; **matching**: pairwise rule, transitivity leak blocked, earliest-pool determinism, unserved pairs; **state machine**: exhaustive legal/illegal edges incl. all PRD Section 6 examples; **seed integrity**: route distance consistency |
| Integration | Vitest + Supertest against a throwaway Docker Postgres | Auth flows; **the full Banani Rush Hour acceptance scenario (PRD Section 18) as one test** — 3 joins, 4th rejected, lifecycle walk, frozen fares, payments; **capacity race**: N parallel join/accept requests for the final seat → exactly one 2xx, rest `409`, final `occupied_seats ≤ capacity`; cancel → seat refill; duplicate membership; authorization (passenger B cannot read/cancel passenger A's ride → 404/403) |
| Contract | Same integration suite | The duplicated client DTO types stay honest (responses match the shapes the client types declare) |

Determinism (PRD Section 15): fare and matching outputs are pure functions of (request, config, route data) — no clocks, no randomness.

---

## 11. Docker & Local Development

`docker compose up` (manager mandate) brings up the whole system:

```yaml
services:
  db:        # postgres:16-alpine, volume, healthcheck: pg_isready
  migrate:   # server image, runs: npx drizzle-kit migrate && npm run db:seed
             # depends_on: db healthy; restart: "no"; exits when done
  api:       # server image, PORT 3001
             # depends_on: db healthy + migrate completed_successfully
             # healthcheck: GET /api/health
  web:       # client image, PORT 3000, NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

- **`.env.example`** at root (committed): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=24h`, `CLIENT_ORIGIN`, `FARE_BASE_PAISA=5000`, `FARE_PER_KM_PAISA=2000`, `NOMINAL_POOL_CAPACITY=3`.
- **Migrations** are files in `server/src/db/migrations` — generated by `drizzle-kit generate` and applied by the `migrate` service (`drizzle-kit migrate`) before the API starts; the compose dependency chain makes a cold `up` fully reproducible.
- **Seed** (`npm run db:seed` / `src/db/seed.ts`): 8 locations with Section 12 coordinates; routes C1–C5 with consistent segment distances; **Jashim** (driver, vehicle **Bullet**, capacity 3, ONLINE), passengers **Nusrat, Rafiq, Shirin** (+ **Tanjim** for the 4th-passenger rejection), demo password documented in the README. Seed is idempotent.
- **`make demo`**: replays PRD Section 18 (Step 1–8) against the running stack via the API, printing pool occupancy and fares at each step — the acceptance scenario reproducible from a clean database (PRD Section 19).
- `make up / make test / make seed / make demo`.

---

## 12. Deployment

**Target (all free tier, no cost — manager mandate):**

| Component | Host | Notes |
|---|---|---|
| Web | **Vercel** (free) | `client/`, `NEXT_PUBLIC_API_BASE_URL` → Render URL |
| API | **Render** free web service | Docker env; health check `/api/health`; free instances **spin down after inactivity → ~1 min cold start, documented** |
| DB | **Neon** (free Postgres) | Use Neon's pooled connection string for the API |
| Migrations/seed | One-off Render job (or CI step) running `npx drizzle-kit migrate && npm run db:seed` against Neon | Runs on deploy |

`docker compose up` remains the canonical reproducible deployment for any reviewer (the manager's explicit fallback if free hosting is unavailable — it is available, so we ship both). CORS `CLIENT_ORIGIN` is the Vercel domain; `JWT_SECRET` set in each host's dashboard; no secrets in the repo.

---

## 13. PRD Deviations & Clarifications

Every place this architecture departs from — or pins down — the PRD, made explicit for review:

| # | Topic | PRD says | This design | Why |
|---|---|---|---|---|
| 1 | Fare formula (Section 8.1–8.2) | Per-passenger `base + distance×rate − poolDiscount` | **Superseded**: vehicle-trip total (`base + perKm × pickup→farthest-dest`) split ∝ each member's leg; sharing itself is the discount | Product decision from the design review. Still satisfies Section 8.2's letter and spirit — fares are individual and **not** an equal split; each passenger's share scales with their own leg; every value stays config-driven; the model is deterministic and unit-tested |
| 2 | Distance source (Section 12) | Straight-line *or* predefined zone distances | **Seeded route segment distances**; Section 12 coordinates kept on `locations` for display | Straight-line Banani→Gulshan is ~0.18 km → a 3.60 BDT distance charge; the PRD itself permits predefined distances, and the route model stores the overlap relationships the matching needs anyway |
| 3 | MATCHED semantics (Section 6 vs Step 1/2 vs FR-D07) | Ambiguous | `MATCHED` = driver accepted the pool; pooling itself is eager and leaves rides in `REQUESTED` | The only reading that reconciles all three PRD anchors (Section 7.2, D1–D2) |
| 4 | Pool states (Section 3.4, Section 6) | Pool contains "one assigned driver" | Pools gain an `OPEN` (awaiting-driver) state | Required by eager formation — PRD Step 2 shows a driverless pool |
| 5 | Driver cancellation (Section 3.2 "cancel/reject when permitted") | Unspecified | Decline `OPEN` pools only; no cancel-after-accept | Smallest well-defined rule; post-accept driver cancellation harms committed passengers — future work |
| 6 | Cancellation rules (Section 6 "defined later") | Open | Cancel only before `DRIVER_ARRIVED`; seat freed; last member out soft-cancels the pool; actor always recorded | Pinned in the design review (D10); keeps Section 13 audit complete |
| 7 | Served routes | — | Requests on location pairs with no route are rejected `ROUTE_NOT_SERVED` | Deterministic fares require known distances; the seed covers all demo-relevant pairs; auto-generated routes are future work |
| 8 | Real-time status | "passengers see status" | 5s polling, no push | PRD never requires push; free-tier hosting punishes persistent connections |
| 9 | Payments (Section 8.4) | States PENDING/PAID/FAILED | Payment rows created at `COMPLETED` only | Long-lived PENDING rows for cancelled rides would need cleanup; payments never gate the lifecycle |

---

## 14. Acceptance Walkthrough (PRD Section 18 mapped)

| PRD step | API sequence | Effect |
|---|---|---|
| 1. Nusrat requests B→M ×1 | `POST /api/rides` | Ride `REQUESTED`, estimate **15000 paisa**; Pool A created (OPEN 1/3) |
| 2. Rafiq requests B→G ×1 | `POST /api/rides` | Matcher: same pickup, C1 covers both dests, 2 ≤ 3 → joins Pool A (OPEN 2/3); fares recomputed (10714 / 4286) |
| 3. Shirin requests B→G ×1 | `POST /api/rides` | Joins Pool A (OPEN 3/3); fares 8334 / 3333 / 3333 |
| 4. Tanjim requests B→M ×1 | `POST /api/rides` | Pool A guard fails (3+1>3) → **Pool B** (OPEN 1/3); Pool A stays 3/3 — `409` never destroys the request |
| 5. Jashim accepts + arrives | `POST …/pools/A/accept`, `…/arrive` | Pool A `MATCHED` (Bullet 3 ≥ 3) → all three rides show `MATCHED`, then `DRIVER_ARRIVED` (5s poll) |
| 6. Start | `POST …/pools/A/start` | `STARTED`; fares frozen; any join attempt now → `422` |
| 7. Complete | `POST …/pools/A/complete` | `COMPLETED`; payments PENDING at frozen amounts; TeslaPay click + cash marks → PAID |
| 8. History | `GET /api/rides` (each passenger), `GET /api/driver/pools` (Jashim) | Own-data-only views; `ride_events` retains the full actor/states trail |

Reproducible from clean DB: `docker compose up` → `make demo`.
