# Workspace Setup & Infrastructure ToDo

This document tracks the Phase 0 (Workspace & Scaffolding) setup. 
**Rule for this phase:** Absolutely no business logic, domain entities, or product features. The goal is purely to wire up the infrastructure, prove the server boots, the database connects, and the Docker containers talk to each other.

## 1. Root Configuration
- [x] **Create `.gitignore`**
  - *Implementation:* Standard Node.js ignores (`node_modules`, `dist`, `.env`, `coverage`).
- [x] **Create `.env.example`**
  - *Implementation:* Minimal required variables: `NODE_ENV=development`, `PORT=8080`, `DATABASE_URL=postgres://user:pass@localhost:5432/oitesla`, `JWT_SECRET=supersecret`.
- [x] **Create `Makefile`**
  - *Implementation:* Simple orchestration aliases: `make up` (docker compose up), `make down`, `make logs`.

## 2. Server Initialization (Node + TS)
- [x] **Initialize `server/package.json`**
  - *Implementation:* `npm init -y`. 
  - Install dependencies: `express`, `cors`, `helmet`, `dotenv`, `pino`, `pino-http`, `drizzle-orm`, `postgres`, `zod`.
  - Install devDependencies: `typescript`, `@types/node`, `@types/express`, `tsx`, `drizzle-kit`, `vitest`.
- [x] **Create `server/tsconfig.json`**
  - *Implementation:* Strict mode enabled, `target: ES2022`, `moduleResolution: node`, `outDir: ./dist`, `rootDir: ./src`.

## 3. Express App & Middleware (Skeleton)
- [ ] **Create `server/src/app.ts`**
  - *Implementation:* Instantiate Express. Add `helmet()`, `cors()`, `express.json()`, and `pino-http()` middlewares. Export the `app`.
- [ ] **Create `server/src/server.ts`**
  - *Implementation:* Import `app`, `app.listen(PORT)`. Add basic `SIGTERM`/`SIGINT` graceful shutdown hooks that log "Shutting down".
- [ ] **Create Global Error Handler (`server/src/shared/middleware/errorHandler.ts`)**
  - *Implementation:* A basic middleware `(err, req, res, next)` that logs the error and returns a generic `{ error: "Internal Server Error" }` 500 response, avoiding app crashes.

## 4. Health API
- [ ] **Create `server/src/modules/health/health.routes.ts`**
  - *Implementation:* A single `GET /health` endpoint that returns `200 OK` with JSON `{ status: 'ok', timestamp: '<current_iso_time>', uptime: process.uptime() }`. Mount this in `app.ts` at `/api/health`.

## 5. Database & ORM Setup
- [ ] **Create `server/drizzle.config.ts`**
  - *Implementation:* Point `schema` to `./src/db/schema/*`, `out` to `./src/db/migrations`, and `dialect` to `postgresql`.
- [ ] **Create `server/src/db/client.ts`**
  - *Implementation:* Import `postgres` and `drizzle-orm/postgres-js`. Instantiate the connection pool using `DATABASE_URL` and export the `db` instance.
- [ ] **Test Schema (`server/src/db/schema/system.ts`)**
  - *Implementation:* A dummy table (e.g., `system_health` with an `id` and `booted_at` timestamp) just to verify `drizzle-kit generate` and migrations run successfully. (Can be deleted once real domain schemas are added in Phase 1).

## 6. Docker Orchestration (EC2 Production Focus)
- [ ] **Create `server/Dockerfile` (Production Build)**
  - *Implementation:* Multi-stage build using `node:20-alpine`. 
    - **Stage 1 (builder):** Installs all dependencies, runs `tsc` to compile TypeScript to `dist/`.
    - **Stage 2 (runner):** Installs only production dependencies, copies the compiled `dist/` folder, and uses `CMD ["node", "dist/server.js"]` to run the app efficiently.
- [ ] **Create root `docker-compose.yml` (EC2 Target)**
  - *Implementation:* Production-ready configuration:
    1. `db`: `postgres:16-alpine` with a named volume for data persistence and a `pg_isready` healthcheck.
    2. `api`: Builds the multi-stage `server/Dockerfile`, depends on the `db` healthcheck, sets `NODE_ENV=production`, and exposes port `8080`.

## 7. Basic CI/CD Setup
- [ ] **Create a Dummy Test (`server/tests/dummy.test.ts`)**
  - *Implementation:* Set up a basic `vitest` suite with a simple assertion (e.g., `expect(1+1).toBe(2)`) or a mock call to the health route. This verifies the test runner works before domain logic is added.
- [ ] **Create `.github/workflows/ci.yml` (Continuous Integration)**
  - *Implementation:* GitHub Action triggered on PRs and pushes to `main`. Steps: Check out code -> Set up Node 20 -> `npm install` (in `server/`) -> `npm run typecheck` (`tsc --noEmit`) -> `npm run test` (runs the dummy test).
- [ ] **Create `.github/workflows/cd.yml` (Continuous Deployment)**
  - *Implementation:* A separate workflow triggered after CI passes on `main`. Contains placeholder steps to SSH into the EC2 instance (using GitHub Secrets for host/key), run `git pull`, and execute `make up` (or `docker compose up -d --build`).
