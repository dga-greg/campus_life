# Architecture

## The one rule

The browser sends **intents**, never numbers. A request says "accept admission"; it cannot say "set my wallet to X". Every consequence is computed by the simulation engine on the server and written in one database transaction.

```
Browser (React)  ──intent──▶  Server Action  ──▶  Game service  ──▶  Engine (pure TS)
   presentation                auth + rate limit    transaction,        rules, maths,
                                                    ownership,          content, RNG
                                                    idempotency,
                                                    concurrency
                                                        │
                                                        ▼
                                                   PostgreSQL
```

## Layers

| Layer | Location | Depends on | Responsibility |
|---|---|---|---|
| Simulation engine | `src/engine` | zod only | State shape, stats, money, GPA, seeded RNG, action reducer, reference content. No React, Next, Prisma or Node APIs, so a React Native client can import it unchanged. |
| Narrative engine | `src/engine/narrative` (Phase 2) | engine | Event eligibility, selection, choice resolution, history. Data-driven; events are Zod-validated content. |
| Persistence | `src/server/game`, `prisma/` | engine, Prisma | Loads and saves snapshots, ledger, audit log; enforces ownership, idempotency and optimistic concurrency. |
| Auth | `src/server/auth` | Prisma | Accounts, hashed opaque sessions, rate limiting. `accounts.ts` is the seam for a managed provider. |
| Presentation | `src/app`, `src/components` | engine (types, formatting, content) | Screens, forms, avatar art. Reads state; never computes outcomes. |

## State model

- **Authoritative state** is one validated `GameState` snapshot per character (`GameSave.state`, JSON) with `schemaVersion` (for save migrations) and `version` (optimistic-concurrency token).
- **Projections** — `Wallet`, `FinancialTransaction`, `PlayerStatistics`, `Enrollment` — are written in the same transaction so they can be queried, audited and (later) ranked without parsing JSON.
- **Audit** — `GameActionLog` is append-only, one row per applied action, unique on `(characterId, idempotencyKey)`.

## How one action is processed (`performAction`)

1. Validate the request envelope with Zod; unknown action types and extra fields are dropped or rejected.
2. Fetch the save by `characterId AND userId` — another player's id simply is not found.
3. If the idempotency key was seen before, return the earlier result and change nothing.
4. Reject if `expectedVersion` is stale.
5. `applyAction(state, action)` in the engine → new state, ledger entries, summary.
6. Conditional update `WHERE version = expectedVersion`; write log, projections and ledger. Commit.

A database `CHECK` keeps wallet balances non-negative even if a bug got past the engine.

## Determinism

`rng.ts` is mulberry32; the generator state is a single integer stored in the save. Given a save and an action list, the result is reproducible — the basis for friend challenges and server-verified leaderboards later.

## Directory structure

```
prisma/
  schema.prisma          Phase 1 models
  migrations/            SQL migrations
  seed.ts                mirrors engine reference content into the DB
src/
  engine/                framework-independent simulation core
    content/             programmes, courses, backgrounds, appearance options
    __tests__/
    academics.ts money.ts rng.ts stats.ts state.ts reducer.ts index.ts
  server/
    auth/                accounts.ts, session.ts (cookies), rate-limit.ts
    game/service.ts      createCharacter, loadGame, performAction
    __tests__/           integration tests against a real Postgres
    db.ts
  app/                   routes: / register login create admission dashboard
    actions.ts           all Server Actions
  components/            Avatar, AuthForm, CharacterCreator, AcceptAdmission
e2e/                     Playwright flows (360 px and desktop)
docs/
```

## Dependencies

| Package | Why |
|---|---|
| next 16, react 19, typescript | App Router, Server Actions |
| tailwindcss 4 | Design tokens and utilities |
| zod 4 | One validation library for forms, content and saves |
| prisma 7 + @prisma/adapter-pg + pg | PostgreSQL access and migrations |
| bcryptjs | Password hashing (pure JS, no native build) |
| server-only | Build-time guard against shipping server code to the browser |
| vitest, @playwright/test, tsx, dotenv | Tests and scripts |

## Deviations from the brief's recommended stack, and why

| Brief | Now | Reason / when it changes |
|---|---|---|
| Managed authentication | Own email + password with hashed sessions | No provider account exists to configure. Isolated in `server/auth/accounts.ts`; swap when a provider is chosen. |
| shadcn/ui | Hand-written Tailwind utilities | Phase 1 needs five primitives; add shadcn when dialogs, sheets and tabs arrive (Phase 2). |
| Framer Motion | CSS animation honouring reduced-motion | Nothing yet needs orchestration; add with the story/decision UI. |
| Zustand, React Hook Form | Not installed | No client state beyond one form so far. Add when the planner needs them. |
| Redis | In-memory rate limiter behind one function | Correct for one instance only. Must move to Redis before multi-instance deployment (Phase 7). |
| Prisma "latest" | Pinned 7.10.0 | npm's `latest` tag currently points at an 8.0 release candidate. |
| Web fonts | System font stack | Avoids a build-time network dependency; revisit with the art direction. |

Next.js 16 ships with Cache Components enabled, so every page that reads the session is partially prerendered and streams its dynamic part behind `app/loading.tsx`.
