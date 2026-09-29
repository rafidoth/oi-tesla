# API Design

## Table of Contents

- [11.1 Why REST (and not GraphQL/other)](#111-why-rest-and-not-graphqlother)
- [11.2 Conventions](#112-conventions)
- [11.3 Endpoints](#113-endpoints)

---

### 11.1 Why REST (and not GraphQL/other)

One trusted first-party client with a fixed set of screens; resource-oriented endpoints with lifecycle **actions** (accept/arrive/start/complete/cancel) map to POST sub-resources; HTTP status semantics carry real meaning (`409` seat/capacity conflicts, `422` invalid transitions — PRD Section 14 "reject rather than silently correct"); 5-second polling (D14) works with plain GETs and standard caching; and PRD Section 16's own sketch is REST. GraphQL's client-chosen queries buy nothing with a single client and add resolver/complexity overhead.

### 11.2 Conventions

- Base path `/api`; JSON only; `Authorization: Bearer <JWT>` on everything except `POST /auth/*`, `GET /locations`, `GET /health`.
- Timestamps ISO 8601 UTC; money always integer paisa.
- Consistent error envelope (RFC-7807-flavored):

```json
{ "error": { "code": "POOL_FULL", "message": "Pool has no free seats", "details": { "poolId": "…", "occupiedSeats": 3, "capacity": 3 } } }
```

| Status | Codes |
|---|---|
| 400 | `VALIDATION_ERROR` (Zod) |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` (wrong role / not owner) |
| 404 | `NOT_FOUND` (also used for foreign resources — no existence leaks) |
| 409 | `POOL_FULL`, `VEHICLE_TOO_SMALL`, `DRIVER_HAS_ACTIVE_POOL`, `DUPLICATE_MEMBERSHIP`, `EMAIL_TAKEN` |
| 422 | `INVALID_STATE_TRANSITION`, `ROUTE_NOT_SERVED`, `CANCEL_NOT_PERMITTED` |
| 500 | `INTERNAL` (logged with request id; no stack leaks) |

### 11.3 Endpoints

**Auth**

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` | — | `{name, email, password, role}`; drivers additionally `{vehicle: {name, regNo, capacity}}` |
| `POST /api/auth/login` | — | → `{token, user}` (JWT, 24h) |

**Passenger**

| Method & path | Purpose |
|---|---|
| `GET /api/locations` | Reference locations (+ served pairs) for the request form |
| `POST /api/rides` | `{pickupLocationId, destLocationId, seats, paymentMethod?}` → ride + pool snapshot + estimate; triggers eager matching ([`Architecture.md Section 4.3`](./Architecture.md#43-formation-flow-eager-deterministic--d1-d6)) |
| `GET /api/rides` | Own rides (history + active), newest first |
| `GET /api/rides/:id` | Own ride: derived status, current fare, pool summary (**no other passenger's data**, PRD Section 11) |
| `POST /api/rides/:id/cancel` | Permitted only while derived status is `REQUESTED`/`MATCHED` ([`Architecture.md Section 3.2`](./Architecture.md#32-derived-passenger-ride-status-no-stored-per-ride-state)) |
| `POST /api/rides/:id/pay` | TeslaPay simulation: `PENDING → PAID`, `marked_by` = passenger |

**Driver** (role `DRIVER`)

| Method & path | Purpose |
|---|---|
| `GET /api/driver/me` | Vehicle + online status + active pool |
| `PATCH /api/driver/status` | `{status: ONLINE \| OFFLINE}` (FR-D02) |
| `GET /api/driver/pools?status=OPEN` | Open pools compatible with the driver's vehicle (`capacity ≥ occupied`) — the "available requests" view (FR-D04), each with its member requests (locations, seats — **no fares leaked**) |
| `POST /api/driver/pools/:id/accept` | [`Architecture.md Section 4.4`](./Architecture.md#44-driver-accept-flow); `OPEN → MATCHED` |
| `POST /api/driver/pools/:id/decline` | Records a decline (hidden from this driver, still visible to others) |
| `POST /api/driver/pools/:id/arrive` / `start` / `complete` | Lifecycle (FR-D07); `start` freezes fares; `complete` creates payments |
| `GET /api/driver/pools/:id` | Pool + full roster with per-passenger fares, seats, statuses (FR-D06) |
| `GET /api/driver/pools?status=ALL \| COMPLETED \| CANCELLED` | Own pool history (newest first; returns destination stops, occupied seats, and aggregated total earnings in `totalEarningsPaisa`; defaults to terminal pools for `ALL`) |
| `POST /api/driver/rides/:id/cash-received` | CASH settlement: `PENDING → PAID`, `marked_by` = driver |

**Ops**

| Method & path | Purpose |
|---|---|
| `GET /api/health` | `{status, db}` — used by Docker/Render health checks (DB `SELECT 1`) |
