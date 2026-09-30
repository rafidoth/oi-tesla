# OiTesla

Shared ride-pooling platform for electric auto-rickshaws in Dhaka

[Video Link](https://drive.google.com/drive/folders/1Cx5rL3A4G0xo8seoMIqwuvdmPSxEB0GR?usp=sharing)

## What I Built

The core challenge was getting the domain model right — pooling, fares, capacity, and payments all interact, and any one of them done wrong breaks the rest.

The pooling engine groups compatible ride requests eagerly, before a driver accepts, so passengers see a shared fare from the start. Capacity is enforced with a single guarded atomic `UPDATE` and a database `CHECK` constraint — two concurrent requests racing for the final seat cannot both win, at the database level, not the application level. Fares are split by each passenger's leg distance and recalculated every time a passenger joins or cancels, then frozen permanently the moment the trip starts. The entire pool — not individual rides — moves through a strict state machine (`OPEN → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED`), with every transition recorded in an append-only audit log. Payments are settlement bookkeeping only; they never gate vehicle progression.




- [Problem Statement](#problem-statement)
- [Architecture & Deployment](#architecture--deployment)
- [Feature List](#feature-list)
  - [1. Account and Profile Management](#1-account-and-profile-management)
  - [2. Ride Booking and Upfront Fare Estimates](#2-ride-booking-and-upfront-fare-estimates)
  - [3. Supported Routes and Geographic Matching](#3-supported-routes-and-geographic-matching)
  - [4. Deterministic Ride-Pooling Engine](#4-deterministic-ride-pooling-engine)
  - [5. Seat Allocation and Overbooking Prevention](#5-seat-allocation-and-overbooking-prevention)
  - [6. Trip Lifecycle and Real-Time Tracking](#6-trip-lifecycle-and-real-time-tracking)
  - [7. Distance-Proportional Fare Calculation](#7-distance-proportional-fare-calculation)
  - [8. Driver Console and Trip Operations](#8-driver-console-and-trip-operations)
  - [9. Cancellations](#9-cancellations)
  - [10. Payment Settlement](#10-payment-settlement)
  - [11. Ride History and Audit Log](#11-ride-history-and-audit-log)
  - [12. Privacy and Data Separation](#12-privacy-and-data-separation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Seed Data & Demo Accounts](#seed-data--demo-accounts)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Documentation Index](#documentation-index)
- [Key Decisions & Trade-Offs](#key-decisions--trade-offs)
- [Known Limitations](#known-limitations)
- [Next Improvements](#next-improvements)
- [AI Usage](#ai-usage)

---

## Problem Statement

During Dhaka’s peak hours, passengers traveling along overlapping routes often book separate rides even when a vehicle has unused seats. For example, a passenger traveling from Banani to Mohakhali and another traveling from Banani to Gulshan may both need the same vehicle for part of their journeys, but there is no simple mechanism to match them while respecting route overlap, available seats, pickup order, and individual fares.

This creates three concrete problems: passengers pay unnecessarily high fares for solo trips, drivers leave seats unused, and multiple vehicles make similar journeys through congested roads.

---



## Architecture & Deployment

![System Architecture](assets/architecture.png)

The application runs as two independent deployments: the frontend on Vercel and the backend on AWS.

The client is a Next.js app served by Vercel. The browser fetches the UI directly from Vercel's edge network. When the user performs any action that needs data — requesting a ride, checking status, paying a fare — the client sends an API request to the backend.

The backend runs on a single EC2 instance. Three Docker containers run inside it: the Node.js API server, a PostgreSQL database, and Nginx. The database container has no public exposure; it communicates with the API server over Docker's internal network only. An Elastic IP is attached to the EC2 instance so the backend has a stable public address that survives restarts.

Nginx is the only entry point from the internet. It terminates HTTPS on port 443 and proxies requests to the API server. The API server reads from and writes to the database, then the response travels back through Nginx to Vercel and on to the browser.

---



## Feature List

### 1. Account and Profile Management

The system maintains two distinct user roles with dedicated interfaces and permissions:

* **Passenger Registration and Login:** Passengers register with a name, email address, and password. Once logged in, passengers can request rides, monitor active trips, view payment statuses, and review their personal ride history.
* **Driver and Vehicle Registration:** Drivers register an account while registering their vehicle. Vehicle details require an operational name (such as *"Bullet"*), a registration plate number, and a passenger seating capacity (between 1 and 6 seats; standard default is 3).
* **Credential Security:** The application stores passwords as cryptographic hashes using the scrypt algorithm with per-user salt. Plaintext passwords never reach storage.
* **Session Management:** Authenticated sessions issue JSON Web Tokens (JWT) valid for 24 hours. The web client stores tokens in session memory to preserve active sessions across page refreshes while restricting persistence to browser close.

### 2. Ride Booking and Upfront Fare Estimates

![Ride Booking and Upfront Fare Estimates](assets/feature-ride-booking-upfront-fare.gif)

Passengers request rides through an interactive booking form that prices trips prior to driver dispatch:

* **Location Selection:** Passengers choose pickup and drop-off points from a supported directory of Dhaka locations (including Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, and Bashundhara).
* **Seat Reservation:** Passengers specify the exact number of seats required for their party (from 1 to 4 seats).
* **Upfront Solo Fare Preview:** The system calculates and displays a preliminary solo fare estimate before the passenger submits the request.
* **Payment Preference:** Passengers select their intended payment method (`Cash` or `TeslaPay`) when booking.
* **Route Validation:** The system accepts bookings only between locations connected by established transit routes. Requests between disconnected zones receive an immediate rejection rather than an unverified estimate.

### 3. Supported Routes and Geographic Matching

The platform matches riders along fixed directional routes with predetermined segment distances:

* **Fixed Route Chains:** Travel paths are structured as ordered location chains (for example, *Banani → Gulshan → Mohakhali* or *Mirpur → Farmgate → Dhanmondi*).
* **Integer Segment Distances:** Road distances between consecutive stops are stored in integer meters. Identical road segments (such as Banani to Gulshan) share identical distance measurements across every route that includes them.
* **Directional Segments:** Routes are strictly one-way. A vehicle traveling southbound serves only downstream destinations; travel in the opposite direction requires the designated reverse route.
* **Prohibited Intermediate Pickups:** All passengers sharing a pool must board at the same initial pickup point. Picking up additional riders mid-trip is prohibited.

### 4. Deterministic Ride-Pooling Engine

![Deterministic Ride-Pooling Engine](assets/feature-ride-poo-matching.gif)

When a passenger books a trip, the system immediately pairs them with a compatible pool or opens a new pool:

* **Eager Formation:** The platform places every booking into a pool the moment the passenger requests it, grouping compatible passengers before a driver accepts.
* **Compatibility Criteria:** Two or more passenger requests share a pool only when:
  1. They start at the exact same pickup location.
  2. All passenger destinations lie downstream along the same active route.
  3. The combined seat count does not exceed vehicle capacity.
  4. The pool has not yet departed.
* **All-Pairs Verification:** A new passenger joins a pool only if their destination is compatible with every rider already in that vehicle. This prevents routing conflicts where one passenger's drop-off point deviates from the vehicle's line of travel.
* **Earliest Pool Priority:** If multiple open pools match a request, the passenger joins the pool created earliest.
* **Capacity Overflow Handling:** If an existing pool reaches full capacity, the platform does not drop incoming requests. It places the new request into a separate open pool for another driver to accept.

### 5. Seat Allocation and Overbooking Prevention

![Seat Allocation and Overbooking Prevention](assets/feature-new-pool-when-capacity-exceeds.gif)

Vehicle capacity operates under strict concurrency controls to guarantee seats are never oversold:

* **Atomic Seat Counting:** Passenger additions execute as atomic database updates. The update increments the seat tally only if the pool remains in an open state and the new total fits within vehicle capacity.
* **Race Condition Resolution:** If two passengers attempt to reserve the final remaining seat simultaneously, the database locks the record, approves the first transaction, and rejects the second with an out-of-seats notice.
* **Physical Seat Backstop:** Database check constraints reject any transaction that would push occupied seats past vehicle capacity, eliminating overbooking.

### 6. Trip Lifecycle and Real-Time Tracking

![Trip Lifecycle and Real-Time Tracking](assets/feature-lifecycle.mp4)

Every shared trip progresses through five consecutive stages:

```text
REQUESTED / OPEN ──► MATCHED ──► DRIVER_ARRIVED ──► STARTED ──► COMPLETED
```

* **Trip States:**
  * `REQUESTED` / `OPEN`: The passenger submitted a request. The system formed or joined a pool awaiting driver assignment.
  * `MATCHED`: An online driver accepted the pool.
  * `DRIVER_ARRIVED`: The driver arrived at the designated pickup stop.
  * `STARTED`: The driver began the trip with all riders on board. At this transition, passenger fares freeze permanently, and no additional riders may join.
  * `COMPLETED`: The driver reached all passenger destinations, closing the pool and generating payment records.
* **Enforced State Flow:** Transitions move forward in sequence. Reversing a state (such as moving from `COMPLETED` back to `STARTED`) or skipping steps triggers a server error.
* **Live Passenger Status Updates:** The passenger screen checks the server every five seconds to reflect driver arrival, journey progress, and trip completion without requiring manual page reloads.

### 7. Distance-Proportional Fare Calculation

Each passenger pays their share of the total vehicle trip cost, calculated in proportion to the distance they personally travel. Fares drop as more passengers join — the same vehicle cost divided among more people.

**Total Trip Cost**

The vehicle's fare is a fixed base charge plus a variable distance cost based on the farthest stop the vehicle must reach:

```
Total Fare = Base Fare + (Per-Km Rate × Farthest Destination Distance)
```

Configuration defaults: Base Fare = 50 BDT, Per-Km Rate = 20 BDT/km (both tunable without code changes).

**Passenger Share**

Each passenger pays a fraction of the total fare equal to their leg distance divided by the sum of all passenger leg distances:

```
Passenger Share = Total Fare × (Passenger's Distance ÷ Sum of All Passenger Distances)
```

**Worked Example**

Three passengers share a vehicle from a common pickup. Rafi travels 2 km, Nusrat travels 4 km, and Shirin travels 4 km. Sum of all legs = 10 km.

| Passenger | Distance | Share Calculation | Fare |
|---|---|---|---|
| Rafi | 2 km | Total Fare × (2 ÷ 10) | 20% |
| Nusrat | 4 km | Total Fare × (4 ÷ 10) | 40% |
| Shirin | 4 km | Total Fare × (4 ÷ 10) | 40% |

Every passenger pays less than they would riding alone. The sum of all shares always equals the total vehicle fare, down to the exact paisa.

**Rounding**

Fares are stored and calculated in integer **paisa** (100 paisa = 1 BDT) — never as decimals or floats. Fractional remainders are distributed using the largest-remainder method, so shares always sum exactly to the total.

**Fare Lock**

All fares freeze when the driver starts the trip (`STARTED`). No subsequent cancellation or passenger change can alter the locked amount.

---

**A Note on the Model's Trade-off**

This proportional model works well in practice, but it has a known structural trade-off in overlapping routes. Consider the scenario below — Rafi boards at A (destination B, 2 km), Nusrat boards at A (destination C, 4 km), and Shirin boards at B (destination D, 4 km from B):

![Proportional fare model — overlapping routes](assets/fare-proportional-model.png)

Under the proportional model the sum of legs is 10 km, so Rafi pays 2/10, Nusrat 4/10, Shirin 4/10. The problem: Rafi and Nusrat's denominator includes Shirin's 4 km leg, which they never physically travel. They indirectly subsidise a segment they never use.

The alternative — a **segment-based model** — prices each route segment independently and splits its cost only among passengers physically present on that segment:

![Segment-based fare model](assets/fare-segment-model.png)

```
Segment A→B (2 km): shared by Rafi + Nusrat   → each pays half the segment cost
Segment B→C (2 km): shared by all three        → each pays one-third
Segment C→D (2 km): Shirin alone               → pays the full segment cost
```

Under this model each passenger pays only for the distance they physically occupy the vehicle. It is strictly fairer for overlapping routes, but it requires per-segment fare computation and is reserved as a future enhancement (see [Next Improvements](#next-improvements)).

### 8. Driver Console and Trip Operations

Drivers manage vehicle status and active trips through a dedicated console:

* **Availability Toggle:** Drivers toggle their status between `ONLINE` and `OFFLINE`. Only online drivers receive ride alerts and pool proposals. Going offline does not interrupt an ongoing trip.
* **Available Pool Feed:** Online drivers view pending pools that match their vehicle's capacity, showing pickup points, drop-off stops, and seat counts. Passenger fares remain hidden on this screen.
* **Pool Acceptance:** Drivers claim an open pool with a single tap. The system assigns the driver and vehicle to the pool, switches the pool to `MATCHED`, and notifies riders. Drivers can hold only one active pool at a time.
* **Pool Decline:** Drivers can decline an unaccepted pool. The pool disappears from their view but remains open for other drivers.
* **Passenger Manifest:** Once a driver accepts a pool, the console displays the full roster: passenger names, drop-off stops, seats occupied, and individual fares.
* **Lifecycle Controls:** Step-by-step buttons let the driver report arrival at pickup, start the trip, and confirm trip completion.

### 9. Cancellations

The platform defines strict rules for passenger and pool cancellations:

* **Passenger-Initiated Cancellation:** A passenger can cancel a trip at any time while the status remains `REQUESTED` or `MATCHED`.
* **Immediate Seat Release:** Cancelling immediately releases the passenger's reserved seats back to the pool, allowing other travelers to take them, and rebalances remaining members' fares.
* **Automatic Pool Closure:** If every passenger in a pool cancels before pickup, the system soft-cancels the pool and removes it from driver listings.
* **Late Cancellation Lock:** Once the driver marks arrival (`DRIVER_ARRIVED`) or starts the trip (`STARTED`), passengers can no longer cancel.
* **Driver Cancellations Excluded:** Drivers cannot cancel a pool once they have accepted it; they can only decline pools before acceptance.

### 10. Payment Settlement

The application supports post-trip settlement through two payment options:

* **Automatic Payment Generation:** When a driver completes a trip, the system creates a `PENDING` payment record for each active passenger matching their locked fare.
* **TeslaPay (Digital Settlement):** Passengers who select TeslaPay tap a "Pay Now" button on their ride screen. The application records the transaction as `PAID` with the passenger's user ID and timestamp.
* **Cash Settlement:** Passengers who choose cash pay the driver directly upon arrival. The driver confirms payment via a "Mark Cash Received" button on their console, which marks the record as `PAID`.
* **Settlement Separation:** Payments serve as settlement accounting; unpaid balances do not halt vehicle progression or block pool completion.
* **Intermediate Drop-Off Edge Case (Unhandled in MVP):** In multi-stop pooled rides, passengers with intermediate drop-off locations physically alight mid-trip before the vehicle reaches the final stop. Currently, payment settlement is initiated at the pool level only when the entire trip reaches `COMPLETED` at the terminal destination. Intermediate drop-offs and per-passenger mid-trip settlement are unhandled in the MVP.

### 11. Ride History and Audit Log

The system preserves past trip records for users and maintains an audit log:

* **Passenger Ride History:** Passengers can review all previous trips, including pickup and drop-off locations, dates, seat counts, final fares paid, and payment statuses.
* **Driver Trip Logs and Earnings:** Drivers can review completed pools, passengers served, total seats occupied, and aggregate earnings calculated across completed trips.
* **Append-Only Audit Trail:** State modifications write to an immutable audit log (`ride_events`). Each entry records:
  * Event category (such as request created, driver matched, arrived, started, completed, cancelled, or seat released)
  * Actor role and user ID (`PASSENGER`, `DRIVER`, or `SYSTEM`)
  * Associated pool and ride IDs
  * Starting state and target state
  * Event timestamp and metadata snapshot
  
  Audit records cannot be edited or deleted, allowing reconstruction of any trip.

### 12. Privacy and Data Separation

The application enforces data boundaries between passengers and drivers:

* **Passenger Fare Privacy:** A passenger can view only their own fare, route details, and payment state. The platform never exposes what other riders in the vehicle paid.
* **Restricted Manifest Access:** Passenger names and seat allocations are visible only to the driver assigned to that specific pool.
* **Server-Side Authorization:** Every database read and write verifies the caller's identity and user role against session credentials. Request parameters cannot be manipulated to access or alter another user's ride.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | Next 16, React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui | Tailwind 4, shadcn 4 |
| State Management | Zustand + TanStack React Query | Zustand 5, RQ 5 |
| HTTP Client | Axios | 1.20 |
| Backend | Node.js + Express + TypeScript | Node 20+, Express 4 |
| Database | PostgreSQL | 18 (Alpine) |
| ORM | Drizzle ORM + Drizzle Kit | 0.45 |
| Auth | JWT (HS256) via `jose` | 6.x |
| Validation | Zod | 3.24 |
| Logging | pino + pino-http | 9.x / 10.x |
| Testing | Vitest | 5.x |
| Containerization | Docker Compose | multi-stage build |
| Money | Integer paisa (`BIGINT`) | — |

> See [`docs/Tech-stack.md`](docs/Tech-stack.md) for detailed justifications behind each choice.

---

## Project Structure

```
OiTesla/
├── client/                          # Next.js App Router frontend
│   ├── app/
│   │   ├── (auth)/                  # Login / register pages
│   │   ├── (driver)/                # Driver console pages
│   │   └── (passenger)/             # Passenger ride pages
│   ├── features/                    # Feature slices (auth, rides, driver, locations)
│   │   └── <feature>/               # api/ hooks/ store/ components/ per slice
│   ├── components/                  # Shared UI (shadcn + custom)
│   ├── api/                         # Axios instance + React Query client
│   ├── hooks/                       # Shared hooks
│   ├── store/                       # Global Zustand stores
│   └── lib/                         # Utility functions
│
├── server/
│   ├── src/
│   │   ├── config/                  # Zod-parsed env vars + app constants
│   │   ├── db/
│   │   │   ├── schema/              # Drizzle table definitions (one per entity)
│   │   │   ├── migrations/          # Auto-generated via drizzle-kit
│   │   │   ├── client.ts            # Drizzle client singleton
│   │   │   └── seed.ts              # Demo data (Jashim, Nusrat, Rafiq, Shirin, Tanjim)
│   │   ├── modules/                 # Feature-sliced vertical domains
│   │   │   ├── auth/                # Register + login + JWT
│   │   │   ├── users/               # Profile (GET /users/me)
│   │   │   ├── locations/           # Public location directory
│   │   │   ├── rides/               # Ride requests + passenger lifecycle
│   │   │   ├── pools/               # Matching, seat guard, state machine, fares
│   │   │   ├── driver/              # Status toggle, pool accept/decline/lifecycle
│   │   │   ├── events/              # Append-only audit log (ride_events)
│   │   │   └── health/              # Health check endpoint
│   │   ├── shared/                  # Cross-cutting (middleware, errors, utils, wrappers)
│   │   ├── app.ts                   # Express assembly
│   │   └── server.ts                # HTTP entrypoint
│   ├── tests/                       # Unit tests organised by domain
│   ├── docker-compose.yml           # db + migrate/seed + api
│   ├── Dockerfile                   # Multi-stage (builder → runner)
│   └── drizzle.config.ts
│
└── docs/                            # Architecture, PRD, API, data model, ADRs, design
```

> See [`docs/Codebase.md`](docs/Codebase.md) for layer rules, naming conventions, and module wiring patterns.

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| **Node.js** | 20+ | Runtime for both server and client |
| **npm** | 10+ | Ships with Node 20 |
| **Docker** + **Docker Compose** | 24+ / v2 | Containerized PostgreSQL and server |
| **PostgreSQL** | 16+ | Only if running the database outside Docker |

---

## Environment Variables

Both the backend server and frontend client require environment files before starting.

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Configuration variables:

```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=oitesla

# Server Configuration
NODE_ENV=development
PORT=8080
JWT_SECRET=your-secure-jwt-secret-at-least-32-chars
DATABASE_URL=postgres://postgres:postgres@localhost:5432/oitesla
```

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL superuser username |
| `POSTGRES_PASSWORD` | PostgreSQL user password |
| `POSTGRES_DB` | Application database name |
| `NODE_ENV` | Runtime environment (`development` or `production`) |
| `PORT` | HTTP port for the Express API server (default: `8080`) |
| `JWT_SECRET` | Secret key used to sign and verify HS256 JWT tokens |
| `DATABASE_URL` | PostgreSQL connection URI used by Drizzle ORM |

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

Configuration variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base API endpoint accessed by the browser application |

---

## Local Setup

### 1. Server and Database (Docker Compose)

Docker Compose starts PostgreSQL 18, executes database migrations, seeds reference data and demo accounts, and boots the Express API.

**Prerequisites:** Docker, Docker Compose, and GNU Make (you can skip it, in that case run docker compose commands from Makefile).

From the `server/` directory:

```bash
cd server

# Verify your environment file exists
cp .env.example .env

# Build and start services in the background
make up
```

`make up` runs three services sequentially:
1. `oitesla-db`: PostgreSQL 18 with persistent volume storage on port `5432`.
2. `oitesla-migrate`: Applies Drizzle migrations and runs the database seed script.
3. `oitesla-api`: Express API server listening on `http://localhost:8080`.

**Management Commands:**

```bash
make logs     # Tail API and database container logs
make down     # Stop and remove active containers
make restart  # Rebuild and restart all services
```

### 2. Frontend Client (Next.js)

From the `client/` directory:

```bash
cd client

# Verify your environment file exists
cp .env.example .env

# Install project dependencies
npm install

# Start the Next.js development server
npm run dev
```

For production builds:

```bash
npm run build
npm run start
```

Access the frontend application at [http://localhost:3000](http://localhost:3000).

---

## Seed Data & Demo Accounts

The database seed (`server/src/db/seed.ts`) executes automatically during `make up`. You can also trigger it manually from `server/` with `npm run db:seed`.

The seed populates:
* **8 Dhaka Locations:** Banani, Gulshan, Mohakhali, Uttara, Bashundhara, Mirpur, Farmgate, and Dhanmondi with representative GPS coordinates.
* **5 Supported Routes:** Predefined transit routes with validated, consistent segment distances.
* **Demo Vehicle:** Vehicle "Bullet" (license: `DHK-TESLA-001`, capacity: 3 seats, status: `ONLINE`) assigned to driver Jashim Uddin.
* **5 Demo User Accounts:** Seeded with scrypt-hashed passwords for end-to-end testing of pooling workflows.

### Example Credentials

All demo accounts share the password: `Password123!`

| Name | Role | Email 
|---|---|---|
| **Jashim Uddin** | Driver | `jashim@example.com` 
| **Nusrat Jahan** | Passenger | `nusrat@example.com` 
| **Rafiqul Islam** | Passenger | `rafiq@example.com` 
| **Shirin Akter** | Passenger | `shirin@example.com` 
| **Tanjim Ahmed** | Passenger | `tanjim@example.com`

---

## Database Schema


```mermaid
erDiagram
    USERS ||--o{ RIDE_REQUESTS : "creates"
    USERS ||--o| VEHICLES : "operates"
    USERS ||--o{ PASSENGER_RIDES : "rides in"
    USERS ||--o{ POOLS : "drives"

    RIDE_REQUESTS ||--|| PASSENGER_RIDES : "fulfilled by"

    POOLS ||--|{ PASSENGER_RIDES : "contains"
    POOLS }o--|| VEHICLES : "assigned to"

    PASSENGER_RIDES ||--|| PAYMENTS : "settles"

    LOCATIONS ||--o{ ROUTE_STOPS : "appears in"
    ROUTES ||--|{ ROUTE_STOPS : "ordered by"
    ROUTES ||--|{ ROUTE_SEGMENTS : "measured by"

    LOCATIONS ||--o{ RIDE_REQUESTS : "pickup"
    LOCATIONS ||--o{ RIDE_REQUESTS : "destination"
    LOCATIONS ||--o{ POOLS : "pickup"

    POOLS ||--o{ RIDE_EVENTS : "audited by"
    PASSENGER_RIDES ||--o{ RIDE_EVENTS : "audited by"
    RIDE_REQUESTS ||--o{ RIDE_EVENTS : "audited by"

    USERS {
        uuid id PK
        text name "NOT NULL"
        text email UK "NOT NULL, lowercased"
        text password_hash "NOT NULL, scrypt"
        text role "PASSENGER | DRIVER"
        timestamptz created_at "DEFAULT now()"
        timestamptz updated_at "DEFAULT now()"
    }

    VEHICLES {
        uuid id PK
        uuid driver_id FK,UK "NOT NULL, 1 per driver"
        text name "NOT NULL"
        text reg_no UK "NOT NULL"
        int capacity "1..6"
        text status "ONLINE | OFFLINE"
        timestamptz created_at
        timestamptz updated_at
    }

    LOCATIONS {
        int id PK "identity"
        text name UK "NOT NULL"
        numeric lat "9,6"
        numeric lng "9,6"
    }

    ROUTES {
        int id PK
        text code UK "NOT NULL"
        text name "NOT NULL"
    }

    ROUTE_STOPS {
        int route_id FK,PK
        int location_id FK
        int position PK ">= 1"
    }

    ROUTE_SEGMENTS {
        int route_id FK,PK
        int from_location_id FK,PK
        int to_location_id FK,PK
        int distance_m "NOT NULL, > 0, meters"
    }

    RIDE_REQUESTS {
        uuid id PK
        uuid passenger_id FK "NOT NULL"
        int pickup_location_id FK "NOT NULL"
        int dest_location_id FK "NOT NULL, != pickup"
        int seats "1..4"
        text payment_method "CASH | TESLAPAY"
        bigint estimate_fare_paisa "NOT NULL, frozen"
        timestamptz created_at "NOT NULL"
    }

    POOLS {
        uuid id PK
        int pickup_location_id FK "NOT NULL"
        text status "OPEN | MATCHED | DRIVER_ARRIVED | STARTED | COMPLETED | CANCELLED"
        uuid driver_id FK "NULL until accept"
        uuid vehicle_id FK "NULL until accept"
        int capacity "1..6"
        int occupied_seats "0..capacity"
        timestamptz created_at
        timestamptz updated_at
    }

    PASSENGER_RIDES {
        uuid id PK
        uuid ride_request_id FK,UK "NOT NULL, 1-to-1"
        uuid passenger_id FK "NOT NULL"
        uuid pool_id FK "NOT NULL"
        int seats "1..4"
        bigint fare_paisa "NULL until pooled, frozen at STARTED"
        timestamptz cancelled_at "NULL"
        text cancel_reason "NULL"
        timestamptz completed_at "NULL"
        timestamptz created_at
        timestamptz updated_at
    }

    PAYMENTS {
        uuid id PK
        uuid passenger_ride_id FK,UK "NOT NULL, 1-to-1"
        text method "CASH | TESLAPAY"
        bigint amount_paisa "NOT NULL, > 0"
        text status "PENDING | PAID | FAILED"
        timestamptz paid_at "NULL"
        uuid marked_by FK "NULL"
        timestamptz created_at
        timestamptz updated_at
    }

    RIDE_EVENTS {
        bigserial id PK "total order"
        text event "NOT NULL"
        text actor_type "PASSENGER | DRIVER | SYSTEM"
        uuid actor_id FK "NULL"
        uuid pool_id FK "NULL"
        uuid passenger_ride_id FK "NULL"
        uuid ride_request_id FK "NULL"
        text from_state "NULL"
        text to_state "NULL"
        jsonb payload "NULL"
        timestamptz occurred_at "DEFAULT now()"
    }
```

---

## API Overview

All endpoints are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <JWT>`. See [`docs/API.md`](docs/API.md) for request/response schemas, error codes, and detailed conventions.

**Auth**

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register a passenger or driver account (drivers include vehicle details) |
| `POST` | `/api/auth/login` | — | Authenticate and receive a JWT (valid 24 hours) |

**Passenger**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/locations` | — | List all supported locations and served route pairs |
| `POST` | `/api/rides` | Passenger | Request a ride with pickup, destination, seats, and payment method; triggers eager pool matching |
| `GET` | `/api/rides` | Passenger | List own rides (active and history), newest first |
| `GET` | `/api/rides/:id` | Passenger | Get own ride details: derived status, current fare, and pool summary |
| `POST` | `/api/rides/:id/cancel` | Passenger | Cancel a ride (permitted only while status is `REQUESTED` or `MATCHED`) |
| `POST` | `/api/rides/:id/pay` | Passenger | Settle fare via TeslaPay (`PENDING → PAID`) |

**Driver**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/driver/me` | Driver | Get own vehicle, online status, and active pool |
| `PATCH` | `/api/driver/status` | Driver | Toggle availability (`ONLINE` / `OFFLINE`) |
| `GET` | `/api/driver/pools?status=OPEN` | Driver | List open pools compatible with the driver's vehicle capacity |
| `POST` | `/api/driver/pools/:id/accept` | Driver | Accept an open pool (`OPEN → MATCHED`) |
| `POST` | `/api/driver/pools/:id/decline` | Driver | Decline a pool (hidden from this driver, visible to others) |
| `POST` | `/api/driver/pools/:id/arrive` | Driver | Mark arrival at pickup (`MATCHED → DRIVER_ARRIVED`) |
| `POST` | `/api/driver/pools/:id/start` | Driver | Start the trip and freeze all fares (`DRIVER_ARRIVED → STARTED`) |
| `POST` | `/api/driver/pools/:id/complete` | Driver | Complete the trip and generate payment records (`STARTED → COMPLETED`) |
| `GET` | `/api/driver/pools/:id` | Driver | Get pool details with full passenger roster, fares, and statuses |
| `GET` | `/api/driver/pools?status=ALL` | Driver | List own pool history with destinations, seats, and total earnings |
| `POST` | `/api/driver/rides/:id/cash-received` | Driver | Confirm cash payment from a passenger (`PENDING → PAID`) |

**Ops**

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check returning service and database status |

---

## Documentation Index

- [`docs/PRD.md`](docs/PRD.md) — Product requirements, user personas, and core business rules
- [`docs/Architecture.md`](docs/Architecture.md) — System architecture, lifecycle state machines, and concurrency controls
- [`docs/ADR.md`](docs/ADR.md) — Architectural decision records (D1–D17)
- [`docs/Data.md`](docs/Data.md) — Database schema, entity relationships, and constraints
- [`docs/API.md`](docs/API.md) — REST API specifications and status codes
- [`docs/Tech-stack.md`](docs/Tech-stack.md) — Technology stack justifications
- [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md) — Design tokens, color palette, and layout guidelines

---

## Key Decisions & Trade-Offs

* **Eager Pooling (ADR D1, D2):** The system groups compatible ride requests immediately upon creation into an `OPEN` pool. Drivers accept pre-formed pools rather than individual requests. This gives passengers early visibility into group fares, but leaves pools unassigned until an online driver accepts.
* **Guarded Atomic Counters (ADR D5):** Vehicle capacity is enforced using a conditional `UPDATE` on `pools.occupied_seats` with a database `CHECK` constraint. This eliminates transaction deadlocks without row locks, but rejects concurrent requests exceeding capacity with a `409 Conflict`.
* **Distance-Proportional Fare Split (ADR D7):** The vehicle-trip cost derives from the farthest destination (`base + perKm × maxLeg`) and splits across passengers relative to their leg distance. Fares drop as passengers join, then lock permanently when the trip enters `STARTED`.
* **Short Polling over WebSockets (ADR D14):** Active screens refresh every 5 seconds using React Query. This avoids persistent connection overhead on spin-down hosting environments (Render and Vercel), but introduces up to 5 seconds of latency for lifecycle updates.
* **Pool-Level Lifecycle (ADR D9, D15, D17):** The entire pool transitions together through `OPEN → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED`. This keeps the state machine deterministic and minimal, but delays individual payment generation until the vehicle reaches its final stop.

---

## Known Limitations

* **Deferred Intermediate Settlement:** Passengers alighting at intermediate stops along a route cannot settle fares upon exit. The system generates payment records only after the driver completes the final pool destination.
* **Shared Pickup Only:** All co-passengers must depart from the same initial pickup location. Intermediate boarding along an active route is unsupported.
* **Static Route Coverage:** The matching engine supports only predefined routes with seeded segment distances. Requests between unmapped location pairs are rejected.
* **Simulated Payments:** TeslaPay records settlements directly to the database without third-party payment gateways or card processors.
* **Manual Lifecycle Progression:** Drivers progress trips through console buttons; the system does not track live vehicle GPS or turn-by-turn navigation.

---

## Next Improvements

* **Per-Passenger Drop-Off:** Add intermediate drop-off actions to the driver console so passengers can settle fares immediately upon leaving the vehicle.
* **Intermediate Pickups:** Allow passengers to board an in-progress pool at intermediate route stops when spare seats exist.
* **Push Notifications (SSE/WebSockets):** Replace polling on active ride screens with real-time server-sent events.
* **Payment Gateway Integration:** Connect mobile financial services (bKash, Nagad) to replace simulated TeslaPay transactions.
* **Automated Route Ingestion:** Generate routes and compute distances automatically via OpenStreetMap rather than static database seeds.

---

## AI Usage

**Tools used:** Antigravity and Opencode (agentic coding assistants), ChatGPT and Claude (browser-based chat for design discussions).

**One idea accepted from AI**

The AI suggested the current proportional fare model: split the total vehicle cost among passengers by their leg distances. It's the obvious way to start with distance-based sharing, and it works fine when everyone is going to the same place. I accepted it and built it. I have a different idea, segment-based pricing, where the cost of each route segment is split only among the passengers actually riding that segment. It's documented in Section 7 and queued in Next Improvements.

**One idea I changed**

The AI made the driver's available pool list accept-only, with no way to decline. Its reasoning was that drivers can just take what they want and ignore the rest, which keeps things simple. But the list fills up with pools a driver will never take, and since there's no way to say so, the same ones come back on every refresh. So I added explicit declining. Once a driver declines a pool, it never shows up in their feed again. The pool itself isn't cancelled and other drivers still see it.
