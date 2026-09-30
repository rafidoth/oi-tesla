# Dhaka Tesla Pool — Product Requirements Document

> Companion to [`Architecture.md`](./Architecture.md), which owns the technical *how* (schema, API, algorithms, enforcement mechanisms). This document owns the *what* and *why*: user-facing behavior and business rules.

---

## Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. Goals & Non-Goals](#2-goals--non-goals)
  - [2.1 Goals](#21-goals)
  - [2.2 Non-Goals](#22-non-goals)
- [3. Actors & Responsibilities](#3-actors--responsibilities)
  - [3.1 Passenger](#31-passenger)
  - [3.2 Driver](#32-driver)
  - [3.3 Vehicle / Tesla](#33-vehicle--tesla)
  - [3.4 Pool / Ride](#34-pool--ride)
- [4. Core User Stories](#4-core-user-stories)
  - [Passenger](#passenger)
  - [Driver](#driver)
  - [Pool](#pool)
- [5. Domain Model](#5-domain-model)
- [6. Ride Lifecycle](#6-ride-lifecycle)
- [7. Pooling & Matching](#7-pooling--matching)
  - [7.1 Matching Rule](#71-matching-rule)
  - [7.2 Compatibility Examples](#72-compatibility-examples)
  - [7.3 Capacity Rule](#73-capacity-rule)
  - [7.4 Concurrent Pool Joining](#74-concurrent-pool-joining)
- [8. Fare & Payment](#8-fare--payment)
  - [8.1 Fare Principle](#81-fare-principle)
  - [8.2 Individual Fare](#82-individual-fare)
  - [8.3 Money Representation](#83-money-representation)
  - [8.4 Payment](#84-payment)
- [9. Functional Requirements — Passenger](#9-functional-requirements--passenger)
- [10. Functional Requirements — Driver](#10-functional-requirements--driver)
- [11. Authorization & Data Visibility](#11-authorization--data-visibility)
- [12. Geography & Routes](#12-geography--routes)
- [13. Ride History & Audit](#13-ride-history--audit)
- [14. Edge Cases & Failure Handling](#14-edge-cases--failure-handling)
- [15. Non-Functional Requirements](#15-non-functional-requirements)
- [16. System Capabilities](#16-system-capabilities)
- [17. Acceptance Criteria](#17-acceptance-criteria)
- [18. Seed Data & Demo Scenario](#18-seed-data--demo-scenario)
- [19. Out of Scope](#19-out-of-scope)

---

## 1. Product Overview

**Product:** Dhaka Tesla (Three-Wheeler Autorickshaw) Pool
**Type:** Ride-pooling MVP

Dhaka Tesla Pool lets passengers traveling along compatible routes share a vehicle and split the cost. Drivers manage their vehicle's availability, accept ride pools, and progress rides through a defined lifecycle.

The MVP focuses on **ride requests, deterministic pool matching, seat management, individual fares, ride lifecycle management, cancellation, and ride history.** It does not attempt real-world navigation or optimal route planning.

---

## 2. Goals & Non-Goals

### 2.1 Goals

The MVP must allow:

* Passengers to register and request rides, specifying pickup, destination, and required seats.
* Passengers to see an estimated fare before a driver accepts.
* The system to identify compatible ride requests and combine them into a shared vehicle.
* The system to guarantee vehicle capacity is never exceeded, even under simultaneous requests.
* Drivers to accept, decline, and progress rides through their lifecycle.
* Each passenger to receive an independently calculated fare.
* Passengers and drivers to view their own ride history.
* Passengers to cancel rides while cancellation is still permitted.
* The system to retain enough history to reconstruct what happened on any ride.

### 2.2 Non-Goals

The MVP will **not** implement: live GPS tracking, Google Maps or other commercial routing, optimal route optimization, real payment gateways, dynamic/surge pricing, driver navigation, automatic driver dispatch, real-time traffic/weather integration, ratings, promotions, ride scheduling, multi-vehicle optimization, real-time chat, corporate accounts, or refund processing.

---

## 3. Actors & Responsibilities

### 3.1 Passenger

A passenger can sign up/in, request a ride (pickup, destination, seats), view their estimated fare, view their ride status, join a compatible pool, cancel a ride when permitted, and view their own ride history, fare, and payment status.

A passenger **must not** be able to view another passenger's fare, payment details, or booking information. A passenger **may** see co-passengers' first names and destination locations to understand who they are sharing the vehicle with.

### 3.2 Driver

A driver can sign up/in, operate one vehicle, go online/offline, view ride requests compatible with their vehicle, accept a compatible pool, decline a pool before accepting it, view passengers and seats assigned to their vehicle, mark arrival, start a trip, complete a trip, and view their ride history.

A driver may **decline** a pool they haven't accepted yet; once accepted, a driver does not cancel a ride — see [Section 14](#14-edge-cases--failure-handling).

### 3.3 Vehicle / Tesla

Each vehicle has a unique identifier, one driver, a fixed passenger capacity, and an online/offline availability state.

**Example:** Jashim → Bullet → 3 passenger seats

### 3.4 Pool / Ride

A pool represents a group of compatible passenger requests sharing one vehicle. A pool holds one or more passenger ride requests, a maximum number of occupied seats, a lifecycle state, and each member's individual fare. A driver is assigned to a pool once one accepts it — a pool can exist and grow before that happens (see [Section 6](#6-ride-lifecycle)).

---

## 4. Core User Stories

### Passenger

* **US-P01** — Request a ride by specifying pickup, destination, and seats.
* **US-P02** — See an estimated fare before the ride is matched with a driver.
* **US-P03** — Know whether my ride is waiting, matched, in progress, completed, or cancelled.
* **US-P04** — See only my own fare and ride information.
* **US-P05** — Cancel my request while cancellation is still permitted.

### Driver

* **US-D01** — See ride requests compatible with my vehicle.
* **US-D02** — Accept a pool without exceeding my vehicle's capacity.
* **US-D03** — See all passengers assigned to my vehicle.
* **US-D04** — Update the ride status as I progress through the trip.

### Pool

* **US-POOL01** — The system must prevent a pool from exceeding the vehicle's seats, even under simultaneous requests.
* **US-POOL02** — The system should combine compatible requests into the same pool automatically.
* **US-POOL03** — The system must calculate and store each passenger's fare independently.

---

## 5. Domain Model

```text
Passenger                              Driver
    │ creates                             │ operates
    ▼                                     ▼
Ride Request                          Vehicle
    │ matched into                        │ assigned to
    ▼                                     ▼
                    Pool
                     │
        ┌────────────┼────────────┐
   Passenger Ride  Passenger Ride  Passenger Ride
        │
        ▼
      Fare
```

| Concept | Purpose |
| --- | --- |
| Passenger | Person requesting transportation |
| Driver | Person operating the vehicle |
| Vehicle | Vehicle used for transportation |
| Ride Request | What a passenger originally asked for |
| Pool | Group of compatible requests sharing a vehicle |
| Passenger Ride | A request's participation in a particular pool/trip |
| Fare | The individual charge for a passenger's ride |
| Payment | Simulated settlement of a fare |
| Ride History / Event | Record of a meaningful state change |

The distinction between **Ride Request** and **Passenger Ride** is intentional: a request is what the passenger originally asked for; a passenger ride is that request's eventual participation in a specific pool/trip.

---

## 6. Ride Lifecycle

```text
REQUESTED ──► MATCHED ──► DRIVER_ARRIVED ──► STARTED ──► COMPLETED
```

| State | Meaning |
| --- | --- |
| REQUESTED | Passenger has submitted a request. The request may already be grouped with other compatible passengers, waiting for a driver — pooling does not require a driver to be involved yet. |
| MATCHED | A driver has accepted the pool this passenger belongs to. |
| DRIVER_ARRIVED | Driver has arrived at pickup. |
| STARTED | The trip has started. |
| COMPLETED | The passenger reached their destination. |
| CANCELLED | The ride will no longer take place. |

**Cancellation:** A passenger may cancel any time before the driver arrives for pickup (i.e. while `REQUESTED` or `MATCHED`). Their seat becomes available again immediately. If the last remaining passenger in a pool cancels, the pool itself is cancelled.

**Invalid transitions must always be rejected**, for example: `COMPLETED → STARTED`, `COMPLETED → CANCELLED`, `STARTED → MATCHED`, `CANCELLED → STARTED`.

---

## 7. Pooling & Matching

### 7.1 Matching Rule

The MVP uses a deterministic geographic compatibility rule instead of real route calculations. Each pickup/destination belongs to a predefined Dhaka zone (e.g. Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara).

Two requests are compatible when:

1. Their pickup zones match.
2. Their destinations lie along the same supported route.
3. Their combined seat requirements fit within the vehicle's capacity.
4. Neither ride has passed the point where joining a pool is still permitted (see [Section 6](#6-ride-lifecycle)).

**Example:** Nusrat (Banani → Mohakhali, 1 seat) and Rafiq (Banani → Gulshan, 1 seat) are compatible — same pickup zone, and Gulshan sits along the way to Mohakhali.

Requests between zones that are **not** connected by a supported route are rejected — the system will not guess a fare for a route it doesn't recognize.

### 7.2 Compatibility Examples

| Pickup | Destination | Compatible With |
| --- | --- | --- |
| Banani | Mohakhali | Banani → Gulshan |
| Banani | Gulshan | Banani → Mohakhali |
| Banani | Gulshan | Banani → Bashundhara |

Mohakhali and Bashundhara destinations are **not** compatible with each other — a vehicle heading to one does not naturally pass the other.

### 7.3 Capacity Rule

`occupiedSeats ≤ vehicle.capacity`, always. For a 3-seat vehicle, a fourth 1-seat request cannot be added once 3 seats are occupied.

If a compatible pool is already full, the new request is **not discarded** — it starts or joins a different pool that another available driver can accept.

### 7.4 Concurrent Pool Joining

Pool capacity must be enforced atomically. If two passengers attempt to take the final available seat at the same time, the system must not allow both to succeed. This is a **business invariant**, not a frontend validation — final occupied seats must never exceed vehicle capacity, regardless of timing.

---

## 8. Fare & Payment

### 8.1 Fare Principle

Each passenger's fare reflects their own distance traveled, calculated from the shared vehicle's total trip cost. Sharing a ride is inherently cheaper than riding alone: as more compatible passengers join a pool, the same trip cost is divided among more people, so each passenger's share decreases. Passengers do **not** split the total fare equally — the passenger traveling farther pays proportionally more.

Fare inputs (base fare, per-kilometer rate) are configuration values, tunable without code changes.

### 8.2 Individual Fare

Every passenger receives an independently calculated fare, and can see only their own — never a pool-mate's. The sum of every member's fare must always equal the pool's total trip cost, down to the smallest currency unit.

### 8.3 Money Representation

Money is stored and calculated in integer **paisa**, never as decimal or floating-point values, to avoid rounding errors (100 paisa = 1 BDT).

### 8.4 Payment

The MVP supports two payment methods: `CASH` and a simulated `TESLAPAY` (no external gateway required). Payment states: `PENDING`, `PAID`, `FAILED`. Payment tracking begins once a ride is completed, and remains `PENDING` until settled — the passenger confirms TeslaPay, or the driver confirms cash received. *Note: In the MVP, payment records are initialized only when the overall pool completes, deferring settlement for passengers who alight at intermediate locations along the route.*

---

## 9. Functional Requirements — Passenger

* **FR-P01 Registration** — Create an account with name, email, and password.
* **FR-P02 Login** — Authenticate a registered passenger.
* **FR-P03 Request Ride** — Provide pickup, destination, and seats; the system returns an estimated fare.
* **FR-P04 Ride Status** — See the current state of their own ride.
* **FR-P05 Ride History** — View previous rides.
* **FR-P06 Cancellation** — Cancel only while the ride is in a cancellable state.

---

## 10. Functional Requirements — Driver

* **FR-D01 Authentication** — Drivers must authenticate before accessing driver functionality.
* **FR-D02 Online Status** — A driver can switch between `ONLINE`/`OFFLINE`. Only online drivers can receive new assignments; going offline does not cancel a driver's existing active rides.
* **FR-D03 Vehicle** — A driver must have one assigned vehicle (e.g. Jashim → Bullet, capacity 3).
* **FR-D04 Ride Requests** — An online driver can see pools compatible with their vehicle.
* **FR-D05 Accept / Decline** — A driver can accept a compatible pool, or decline one before accepting it.
* **FR-D06 Passenger List** — For their own pool, the driver can see passenger names, pickups, destinations, seats occupied, and ride status.
* **FR-D07 Lifecycle Updates** — The driver can transition an accepted pool through `MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED`.

---

## 11. Authorization & Data Visibility

**Passenger** can access: own profile, own rides, own fares, own payment records, and co-passengers' first names and destination locations within the same pool. Cannot access: another passenger's fare, payment details, ride history, or driver administrative information.

**Driver** can access: own vehicle, pools they've accepted, passengers assigned to those pools, and their own ride history. A driver cannot modify another driver's vehicle or rides.

---

## 12. Geography & Routes

The MVP organizes pickup and destination points into predefined Dhaka zones rather than using live GPS.

Zones are connected by a set of predefined, supported routes. These routes determine which pickup/destination pairs the system will serve, how compatible two requests are ([Section 7](#7-pooling--matching)), and the distance used to calculate fares. Distances are fixed reference values rather than raw straight-line coordinates, since two nearby zones can still require a much longer road trip between them.

Requests between zones with no supported route are rejected rather than estimated.

---

## 13. Ride History & Audit

The system must preserve enough information to reconstruct a ride, including at minimum: request created, ride matched with a driver, driver arrived, ride started, ride completed, ride cancelled, and payment completed — each recording the event, timestamp, actor, and the ride/pool it belongs to.

This must be enough to answer: *who changed the ride's state, what happened, and when?*

---

## 14. Edge Cases & Failure Handling

The MVP must explicitly handle:

* **Full vehicle** — A pool at capacity cannot accept another passenger. The rejected request is not discarded; it starts or joins a separate pool available to another driver.
* **Passenger cancellation** — Cancelling before the trip starts frees the passenger's seat immediately.
* **Driver goes offline** — No new assignments; existing active rides are not automatically cancelled.
* **Driver declines** — Declining an unaccepted pool doesn't cancel it; the pool remains visible to other available drivers.
* **Invalid state transition** — e.g. `COMPLETED → STARTED` must be rejected.
* **Duplicate acceptance** — The same passenger must never be assigned twice to the same pool.
* **Concurrent seat allocation** — Two requests competing for the final seat must be resolved so capacity is never exceeded.
* **Non-compatible destination** — Requests that fail the compatibility rule must never be pooled together.
* **Already-started ride** — A passenger cannot join a pool after it has started.

**Known Unhandled Edge Cases & Future Limitations:**

* **Intermediate drop-off settlement (Unhandled / Current Limitation)** — In a pooled ride serving multiple drop-off locations along a supported route (e.g. Banani → Gulshan → Mohakhali), passengers heading to closer stops physically alight mid-trip before the vehicle reaches the final stop. Under the current MVP lifecycle, payment records are created at the pool level only when the entire trip is marked `COMPLETED` by the driver. As a result, intermediate passengers cannot settle their fares (via TeslaPay or cash) at their physical moment of departure; settlement remains deferred until the driver completes the final pool leg. Individual per-passenger drop-off state transitions and mid-trip settlement are unhandled in the MVP.

---

## 15. Non-Functional Requirements

* **Consistency** — `occupiedSeats ≤ vehicleCapacity` must hold under concurrent requests.
* **Security** — Passwords never stored in plaintext; authentication required for protected operations; authorization enforced server-side; a user must never be able to manipulate another user's ride via modified request parameters.
* **Reliability** — Invalid state transitions and invalid pool assignments are rejected, never silently corrected.
* **Testability** — Fare calculation and matching must be deterministic and independently testable.
* **Observability** — Every lifecycle transition is logged with timestamp, actor, entity, previous state, and new state.

---

## 16. System Capabilities

The exact API and database design are implementation decisions (see `Architecture.md`). At minimum, the system must support:

* Registering and authenticating passengers and drivers
* Passengers requesting rides and seeing an estimated fare
* Passengers viewing, and cancelling (when permitted), their own rides
* Passengers viewing their own ride history
* Drivers going online/offline
* Drivers viewing pools compatible with their vehicle, and accepting or declining them
* Drivers progressing an accepted pool through its lifecycle
* Drivers viewing the passengers and seats assigned to their vehicle
* Retaining enough event history to reconstruct any ride

The system must persist passengers, drivers, vehicles, ride requests, pools, individual passenger fares, payments, and a history of state-changing events, with referential integrity between them.

---

## 17. Acceptance Criteria

The MVP is functional when the following scenario succeeds.

**Initial state:** Jashim, Vehicle: Bullet, Capacity: 3, Status: ONLINE.

1. **Nusrat requests** Banani → Mohakhali, 1 seat. → Ride is `REQUESTED`; fare estimated.
2. **Rafiq requests** Banani → Gulshan, 1 seat. → Compatible; joins Nusrat's pool. Occupied seats = 2, available = 1.
3. **Shirin requests** Banani → a compatible destination, 1 seat. → Joins the pool. Occupied seats = 3, available = 0.
4. **A fourth passenger requests** one seat. → The pool cannot accept them; capacity stays 3/3; their request is not discarded (see [Section 14](#14-edge-cases--failure-handling)).
5. **Jashim accepts the pool.** → Nusrat, Rafiq, and Shirin's rides become `MATCHED`.
6. **Jashim marks arrival.** → All three passengers see `DRIVER_ARRIVED`.
7. **Jashim starts the trip.** → Ride is `STARTED`; the system rejects any attempt to add another passenger.
8. **Jashim completes the trip.** → Ride is `COMPLETED`; each passenger receives their own final fare and a payment to settle.
9. **History** — Each passenger can view their own completed ride; Jashim can view the completed pool and its passengers; the full lifecycle history is retained.

---

## 18. Seed Data & Demo Scenario

The application should ship with meaningful demo data rather than generic placeholders (`user1`, `driver1`).

* **Driver:** Jashim — Vehicle: Bullet, Capacity: 3, Status: ONLINE
* **Passengers:** Nusrat, Rafiq, Shirin, and Tanjim (whose request demonstrates the full-pool rejection in [Section 17](#17-acceptance-criteria) Step 4)

Demo requests: Nusrat (Banani → Mohakhali, 1 seat), Rafiq (Banani → Gulshan, 1 seat), Shirin (Banani → compatible destination, 1 seat), Tanjim (Banani → Mohakhali, 1 seat — rejected from the full pool).

The demo should be reproducible from a clean database and show: 1 passenger → 2 pooled → 3 pooled → vehicle at capacity → 4th passenger's request handled without exceeding capacity.

---

## 19. Out of Scope

Live GPS tracking · turn-by-turn navigation · Google Maps integration · real payment processing · driver ratings · passenger ratings · promotions/coupons · dynamic surge pricing · ride scheduling · multi-vehicle optimization · automatic route optimization · traffic prediction · weather-based pricing · real-time chat · corporate accounts · refund processing · complex dispatch algorithms.

The MVP's job is to get right: a correct pooling domain model, state machine, fare engine, capacity invariant, authorization model, and deterministic matching algorithm.
