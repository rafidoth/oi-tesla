# Domain Model & Database Schema

## Table of Contents

- [5. Domain Model & Invariants](#5-domain-model--invariants)
  - [5.1 Entity relationships](#51-entity-relationships)
  - [5.2 System invariants (each enforced in the database, not just the service)](#52-system-invariants-each-enforced-in-the-database-not-just-the-service)
- [6. Database Schema](#6-database-schema)
  - [users](#users)
  - [vehicles](#vehicles)
  - [locations — PRD Section 12 reference data](#locations--prd-section-12-reference-data)
  - [routes — the overlap model](#routes--the-overlap-model)
  - [route_stops — ordered chain of locations](#route_stops--ordered-chain-of-locations)
  - [route_segments — the editable source of distances](#route_segments--the-editable-source-of-distances)
  - [ride_requests — the original ask (immutable after creation)](#ride_requests--the-original-ask-immutable-after-creation)
  - [pools — the sharing unit and the lifecycle owner](#pools--the-sharing-unit-and-the-lifecycle-owner)
  - [passenger_rides — a request's membership in a pool](#passenger_rides--a-requests-membership-in-a-pool)
  - [payments — settlement bookkeeping (PRD Section 8.4)](#payments--settlement-bookkeeping-prd-section-84)
  - [ride_events — append-only audit (PRD Section 13)](#ride_events--append-only-audit-prd-section-13)

---

## 5. Domain Model & Invariants

### 5.1 Entity relationships

```text
users (PASSENGER|DRIVER) 1 ──── 1 vehicles                 (driver operates one vehicle)
users 1 ──── N ride_requests                               (passenger creates requests)
ride_requests 1 ──── 1 passenger_rides                     (PRD Section 17: the ask vs the membership)
pools 1 ──── N passenger_rides                             (pool membership)
passenger_rides 1 ──── 1 payments                          (settlement)
pools / passenger_rides / ride_requests 1 ──── N ride_events (append-only audit)
locations ──── route_stops ──── routes ──── route_segments   (route/overlap reference data)
```

The **RideRequest vs PassengerRide** split (PRD Section 5) is preserved: `ride_requests` stores the original ask (pickup, destination, seats, payment method, solo estimate) and is immutable after creation; `passenger_rides` stores the request's participation in a specific pool (seats, live fare, cancel/complete flags).

### 5.2 System invariants (each enforced in the database, not just the service)

| Invariant | Enforcement |
|---|---|
| `occupied_seats ≤ capacity` at all times, under any concurrency | Guarded atomic UPDATE + `CHECK` constraint ([`Architecture.md Section 5`](./Architecture.md#5-capacity--concurrency)) |
| No invalid lifecycle transition ever persists | Single transition function in the service ([`Architecture.md Section 3`](./Architecture.md#3-lifecycle--state-machines)); terminal states have no outgoing edges |
| A passenger is never duplicated in one pool | Partial unique index `(pool_id, passenger_id) WHERE cancelled_at IS NULL` |
| A driver has at most one active pool | Partial unique index `pools(driver_id) WHERE status IN ('MATCHED','DRIVER_ARRIVED','STARTED')` |
| Only `ONLINE` drivers receive assignments | Accept endpoint checks vehicle status; offline drivers can't accept |
| New members cannot join after `STARTED` | Membership changes gated on pool status in the same transaction as the guarded UPDATE |
| Every fare/pool state change is attributable | Append-only `ride_events` with actor, from/to states, timestamp |
| Sum of member fares == pool total, exactly, in paisa | Largest-remainder integer rounding ([`Architecture.md Section 6`](./Architecture.md#6-fare-engine--payments)) |

---

## 6. Database Schema

All transactional tables use `UUID` PKs (`gen_random_uuid()`); reference tables (locations/routes) use small identity ints. All timestamps are `TIMESTAMPTZ` (UTC). All money is `BIGINT` paisa.

### users

| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE (lowercased) |
| password_hash | TEXT | NOT NULL (`scrypt` format string) |
| role | TEXT | NOT NULL, CHECK `role IN ('PASSENGER','DRIVER')` |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### vehicles

| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| driver_id | UUID | NOT NULL, UNIQUE, FK → users (one vehicle per driver, PRD Section 17) |
| name | TEXT | NOT NULL (e.g. "Bullet") |
| reg_no | TEXT | NOT NULL, UNIQUE |
| capacity | INT | NOT NULL, CHECK `capacity BETWEEN 1 AND 6` (fixed per PRD Section 3.3) |
| status | TEXT | NOT NULL, DEFAULT 'OFFLINE', CHECK `status IN ('ONLINE','OFFLINE')` |
| created_at / updated_at | TIMESTAMPTZ | |

### locations — PRD Section 12 reference data

> **Terminology Note:** Use **location** as the official domain term for pick-up, drop-off, and stop points (avoid "zone").

| column | type | constraints |
|---|---|---|
| id | INT | PK (identity) |
| name | TEXT | NOT NULL, UNIQUE (Banani, Gulshan, …) |
| lat / lng | NUMERIC(9,6) | NOT NULL (representative coords, kept for display/future use) |

### routes — the overlap model

> **Terminology Note:** Use **route** as the official domain term for transit chains and the overlap model (avoid "corridor").

| column | type | constraints |
|---|---|---|
| id | INT | PK |
| code | TEXT | NOT NULL, UNIQUE (e.g. `banani-south`) |
| name | TEXT | NOT NULL |

### route_stops — ordered chain of locations

| column | type | constraints |
|---|---|---|
| route_id | INT | FK → routes |
| location_id | INT | FK → locations |
| position | INT | NOT NULL, CHECK `position >= 1` |

PK `(route_id, position)`; UNIQUE `(route_id, location_id)`. Routes are **directed** (a southbound chain serves southbound pairs; the reverse direction is seeded as its own route).

### route_segments — the editable source of distances

| column | type | constraints |
|---|---|---|
| route_id | INT | FK → routes |
| from_location_id / to_location_id | INT | FK → locations (consecutive stops: `to.position = from.position + 1`) |
| distance_m | INT | NOT NULL, CHECK `distance_m > 0` (integer meters) |

PK `(route_id, from_location_id, to_location_id)`.

**Seed integrity rule:** a location pair's distance must be identical on every route containing it (Banani→Gulshan is 2000 m on `banani-south`, `banani-east`, and `uttara-spine`). The seed script asserts this and a unit test re-checks it — this makes each member's *leg distance route-invariant*, so fares never depend on which route a matching query happened to use.

### ride_requests — the original ask (immutable after creation)

| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| passenger_id | UUID | NOT NULL, FK → users |
| pickup_location_id / dest_location_id | INT | NOT NULL, FK → locations, CHECK `pickup_location_id <> dest_location_id` |
| seats | INT | NOT NULL, CHECK `seats BETWEEN 1 AND 4` |
| payment_method | TEXT | NOT NULL, DEFAULT 'CASH', CHECK `IN ('CASH','TESLAPAY')` |
| estimate_fare_paisa | BIGINT | NOT NULL (solo estimate, frozen at creation) |
| created_at | TIMESTAMPTZ | NOT NULL |

Index: `(passenger_id, created_at DESC)` — ride history.

A request pair must lie on at least one route (`dest.position > pickup.position`); otherwise the API rejects with `ROUTE_NOT_SERVED` — the service only operates served routes ([`Architecture.md Section 4`](./Architecture.md#4-matching--pool-formation)).

### pools — the sharing unit and the lifecycle owner

| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| pickup_location_id | INT | NOT NULL, FK → locations |
| status | TEXT | NOT NULL, DEFAULT 'OPEN', CHECK `IN ('OPEN','MATCHED','DRIVER_ARRIVED','STARTED','COMPLETED','CANCELLED')` |
| driver_id | UUID | NULL, FK → users (set at accept) |
| vehicle_id | UUID | NULL, FK → vehicles (set at accept) |
| capacity | INT | NOT NULL, CHECK `capacity BETWEEN 1 AND 6` — nominal (env) at creation, replaced by the vehicle's real capacity at accept |
| occupied_seats | INT | NOT NULL, DEFAULT 0, **CHECK `occupied_seats BETWEEN 0 AND capacity`** |
| created_at / updated_at | TIMESTAMPTZ | |

Indexes:
- `(status, pickup_location_id)` — matching & driver listings
- `UNIQUE (driver_id) WHERE status IN ('MATCHED','DRIVER_ARRIVED','STARTED')` — one active pool per driver
- `(created_at)` — deterministic ordering for matching (earliest pool first)

### passenger_rides — a request's membership in a pool

| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| ride_request_id | UUID | NOT NULL, **UNIQUE**, FK → ride_requests (1:1, PRD Section 17) |
| passenger_id | UUID | NOT NULL, FK → users |
| pool_id | UUID | NOT NULL, FK → pools |
| seats | INT | NOT NULL, CHECK `seats BETWEEN 1 AND 4` (copied from the request) |
| fare_paisa | BIGINT | NULL until pooled; recomputed on membership change; **frozen at STARTED** |
| cancelled_at | TIMESTAMPTZ | NULL |
| cancel_reason | TEXT | NULL |
| completed_at | TIMESTAMPTZ | NULL (set at pool completion) |
| created_at / updated_at | TIMESTAMPTZ | |

Indexes:
- `UNIQUE (pool_id, passenger_id) WHERE cancelled_at IS NULL` — duplicate-acceptance guard (PRD Section 14)
- `(passenger_id, created_at DESC)` — passenger history
- `(pool_id)` — roster

### payments — settlement bookkeeping (PRD Section 8.4)

| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| passenger_ride_id | UUID | NOT NULL, **UNIQUE**, FK → passenger_rides |
| method | TEXT | NOT NULL, CHECK `IN ('CASH','TESLAPAY')` |
| amount_paisa | BIGINT | NOT NULL, CHECK `amount_paisa > 0` |
| status | TEXT | NOT NULL, DEFAULT 'PENDING', CHECK `IN ('PENDING','PAID','FAILED')` |
| paid_at | TIMESTAMPTZ | NULL |
| marked_by | UUID | NULL, FK → users (who flipped it: passenger for TeslaPay, driver for cash) |
| created_at / updated_at | TIMESTAMPTZ | |

Created at `COMPLETED` for every active (non-cancelled) member (D15).

### ride_events — append-only audit (PRD Section 13)

| column | type | constraints |
|---|---|---|
| id | BIGSERIAL | PK (total order) |
| event | TEXT | NOT NULL (see below) |
| actor_type | TEXT | NOT NULL, CHECK `IN ('PASSENGER','DRIVER','SYSTEM')` |
| actor_id | UUID | NULL, FK → users |
| pool_id / passenger_ride_id / ride_request_id | UUID | NULL, FKs |
| from_state / to_state | TEXT | NULL |
| payload | JSONB | NULL (reason, fares, vehicle, etc.) |
| occurred_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

Event types: `REQUEST_CREATED`, `POOL_CREATED`, `RIDE_MATCHED` (joined a pool), `DRIVER_ACCEPTED`, `DRIVER_DECLINED`, `DRIVER_ARRIVED`, `RIDE_STARTED`, `RIDE_COMPLETED`, `RIDE_CANCELLED`, `SEAT_RELEASED`, `POOL_CANCELLED`, `FARE_RECALCULATED`, `PAYMENT_PENDING`, `PAYMENT_COMPLETED`.

Indexes: `(pool_id, id)`, `(passenger_ride_id, id)`, `(ride_request_id, id)`, `(occurred_at)`.

Rows are never updated or deleted — the table answers "who changed what, when, from which state" (PRD Section 13) and reconstructs any ride's story.
