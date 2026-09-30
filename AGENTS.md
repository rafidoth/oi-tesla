# OiTesla | Agent Instructions

## To-Do Execution Mode
When I explicitly ask you to "work on todos" or "do the next task":
* **Check Status:** Read `ToDo.md`. If the file is empty or all tasks are marked `[x]`, ignore these steps and reply normally.
* **Execute One Step:** Find the *first* unchecked `[ ]` task. Follow its implementation notes exactly without over-engineering.
* **Update & Stop:** Once completed and verified, update `ToDo.md` to mark the task as `[x]`. Stop and report what you did. Do not proceed to the next task until asked.

## Documentation & Decision Sync Rule
* **Ask Before / When Decisions Change:** Whenever any architectural, technical, domain, or design decision deviates from or modifies what is established in the documentation, you MUST explicitly ask the user for confirmation first.
* **Prompt to Update Documentation:** Always ask the user if the relevant documentation (`docs/*.md`) should be updated to reflect the new decision before or alongside code modifications, keeping the documentation synchronized with the implementation.

## Domain Terminology Rules
* **Route, NOT Corridor:** Always use **Route** (or **Supported Route** / **Route Path**). Never use the word "corridor" in documentation, UI copy, comments, or code.
* **Location, NOT Zone:** Always use **Location** instead of "Zone" when referring to stops, pickup points, and destinations.

## Frontend Design Instructions
- Make designs aesthetically pleasing and minimal for usecase. 
- Provide 3–4 key HTML designs for the user to select from.
- Write small, reusable, single-purpose components; avoid duplication by extracting shared logic into hooks/utilities; refactor for clarity before considering the code done.
- Keep presentation and logic separated 

## Knowledge Base (Documentation Index)
Navigate and consult the following documents in `docs/` before making architectural, schema, API, or implementation choices:

| Document | Primary Focus & Contents | When to Consult |
|---|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | **Product Requirements Document**: User personas, core features, passenger/driver ride-pooling flows, business rules, MVP boundary, and non-goals. | Consult for product logic, requirement clarifications, user flows, and MVP scope. |
| [`docs/Architecture.md`](./docs/Architecture.md) | **System Architecture**: System context, route matching engine, pool & ride state machines, concurrency control (atomic guarded update + CHECK), fare engine, testing strategy, Docker setup, and PRD clarifications. | Consult for system design, lifecycle transitions, concurrency invariants, and algorithms. |
| [`docs/ADR.md`](./docs/ADR.md) | **Architectural Decision Records**: Quick reference of key architectural decisions (D1–D15) including eager pooling, single source of truth (`pools.status`), capacity locking, route model, and polling strategy. | Consult when verifying fundamental design choices, rationale, and invariants. |
| [`docs/Codebase.md`](./docs/Codebase.md) | **Codebase Structure & Conventions**: Single source of truth for project layout, strict unidirectional layer rules (`Routes → Controller → Service → Repository → db/client`), module slicing, dependency injection, and naming conventions. | Consult before adding/modifying files, organizing directories, or defining module structure. |
| [`docs/Data.md`](./docs/Data.md) | **Domain Model & Database Schema**: Entity relationship diagrams, schema definitions, system invariants (capacity, single active pool, ride request vs membership split), and database constraints. | Consult when modifying the database schema, Drizzle tables, queries, or relation mappings. |
| [`docs/API.md`](./docs/API.md) | **REST API Design**: REST conventions, JSON request/response formats, standard RFC-7807 error envelopes, HTTP status codes, and endpoint specifications (Auth, Rides, Pools, Drivers, Vehicles). | Consult when designing, updating, or implementing backend routes and frontend API clients. |
| [`docs/Tech-stack.md`](./docs/Tech-stack.md) | **Tech Stack & Justifications**: Detailed justifications for Next.js App Router, Express + Node.js + TypeScript, PostgreSQL 16, Drizzle ORM, Zod, Vitest, Pino, and integer paisa money model. | Consult when evaluating library choices, packages, tooling, and framework features. |
| [`docs/UI_DESIGN.md`](./docs/UI_DESIGN.md) | **UI Design System**: Visual design tokens, color palette (marigold primary `#FF8A1E`, teal in-motion `#0EA5A0`), typography (Space Grotesk & Manrope), responsive mobile layouts, and component styling. | Consult when building or styling frontend components, screens, and design elements. |

# Code Style
## No Comments
- Code should be self-explanatory. Comments should be avoided as much as possible.
- Only add comments if absolutely required (e.g., explaining a non-obvious workaround or complex algorithm that cannot be simplified)
- If code needs a comment to be understood, refactor it first

## Functions, Variables, Classes
- Write clear, descriptive variable and function names
- Functions Length should be as small as possible doing single responsibility (ideally 5 lines)
- Structure code so its intent is obvious
- If a function length needs to be more than 5 lines, refactor it first. 
- If its not possible to keep single responsibility under 5 lines cap, then its okay, no force needed.
