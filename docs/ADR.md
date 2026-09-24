# Key Architectural Decisions

From the design review that produced this document. Each is enforced somewhere concrete (schema, service, or middleware) — nothing here is aspiration.

| # | Decision | Choice & rationale |
|---|---|---|
| D1 | When does a pool exist? | **Eagerly.** Every ride request joins or creates an `OPEN` pool at creation time (`PRD` Step 2 shows Nusrat → Pool A before any driver acts). Seats are tracked from birth against a nominal capacity (env `NOMINAL_POOL_CAPACITY`, default 3). |
| D2 | What does MATCHED mean? | **Driver accepted.** Passenger rides show `REQUESTED` while their pool is `OPEN`, and flip to `MATCHED` together when a driver accepts the pool. This reconciles PRD Step 1 (`REQUESTED`), Step 2 (membership), and FR-D07 (driver walks `MATCHED → … → COMPLETED`). Vehicle capacity is re-checked at accept. |
| D3 | Who may join, when? | Membership changes are allowed while the pool is `OPEN` **or** `MATCHED` (seats permitting) and are hard-locked at `STARTED` — the literal reading of PRD Section 14 "cannot join after the pool has started". This is also how passengers joining at different times is handled: their `requested_at`/`pooled_at` and `ride_events` timestamps record the stagger. |
| D4 | Where does status live? | **`pools.status` is the single source of truth.** `passenger_rides` carry only per-ride flags (`cancelled_at`, `completed_at`). A passenger's displayed status is derived ([`Architecture.md Section 3`](./Architecture.md#3-lifecycle--state-machines)). One driver action = one row update; no fan-out sync bugs. |
| D5 | Capacity mechanism | **Guarded counter + CHECK backstop** ([`Architecture.md Section 5`](./Architecture.md#5-capacity--concurrency)): a conditional atomic `UPDATE` on a denormalized `pools.occupied_seats`, plus a `CHECK` constraint making overbooking physically impossible. |
| D6 | Full pool | The 4th compatible passenger **self-pools into a new `OPEN` pool** (Pool B) that any online vehicle with capacity could accept. Their request is never destroyed. |
| D7 | Fare model | **Vehicle-trip total, split by leg distance** ([`Architecture.md Section 6`](./Architecture.md#6-fare-engine--payments)). Supersedes the PRD Section 8.1 per-passenger formula — documented in [`Architecture.md Section 13`](./Architecture.md#13-prd-deviations--clarifications). |
| D8 | Distances & overlap | **Corridor model** ([`Architecture.md Section 4`](./Architecture.md#4-matching--pool-formation)): ordered zone chains with per-segment distances. "Banani→Gulshan overlaps Banani→Mohakhali" is stored data, not code. |
| D9 | Boarding | Pool-level lifecycle; per-passenger boarding moments are event timestamps, not states (PRD non-goals: no GPS/turn-by-turn). |
| D10 | Cancellation | Passenger may cancel only before `DRIVER_ARRIVED`; the seat is freed immediately; the **last** member's cancel soft-cancels the pool (row retained for audit, hidden from listings). Drivers can **decline** `OPEN` pools only — no driver-cancel-after-accept in the MVP. Every transition records its actor. |
| D11 | Mid-chain pickups | Excluded. Pickup must be the pool's shared pickup zone; boarding at an intermediate corridor stop is future work. |
| D12 | Accounts | One `users` table with a `PASSENGER`/`DRIVER` role; drivers own a vehicle via `vehicles.driver_id`. PRD's "Drivers/Passengers" entities map to the role + vehicle ownership, not separate account tables. |
| D13 | Type sharing | TypeScript on both sides; DTO types duplicated per app against one API contract ([`API.md`](./API.md)), drift caught by integration tests. No workspace tooling — the existing `client/` scaffold stays untouched. |
| D14 | Live status | 5-second polling (React Query `refetchInterval`) on active screens. No SSE/WebSockets — they fight free-tier spin-downs and the PRD never requires push. |
| D15 | Payments | A `PENDING` payment row is created per active ride at `COMPLETED`; TeslaPay = passenger click → instant `PAID` (simulated); CASH = driver marks received → `PAID`. Payments are settlement bookkeeping, never a lifecycle gate. |
