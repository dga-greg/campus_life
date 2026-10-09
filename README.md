# Campus Life Africa

*Four Years. Thousands of Choices. One Campus Story.*

A university life simulator set at the fictional Akwaaba Metropolitan University (AMU), Ghana.

**Status: Phase 1 of 7.** You can register, build a student, receive an admission letter, accept it and land on a dashboard with saved stats, wallet and courses. The weekly planner and story events are the next milestone. See [docs/MILESTONES.md](docs/MILESTONES.md).

## Run locally

Requires Node 22, PostgreSQL 16 and Clerk keys (free: https://dashboard.clerk.com, or `npx clerk@latest init --accountless` for temporary dev keys).

```bash
cp .env.example .env          # set DATABASE_URL and Clerk keys
npm install
npm run db:migrate
npm run db:seed
npm run dev                   # http://localhost:3000
```

## Checks

```bash
npm run check                 # lint + typecheck + unit and integration tests
npm run test:e2e              # Playwright; builds and starts the app itself; needs Clerk *development* keys
```

Integration tests read `DATABASE_URL` from `.env.test`, refuse to run unless the database name contains `campus_test`, and delete all users between tests.

## Docs

- [Architecture, structure, dependencies](docs/ARCHITECTURE.md)
- [Database schema](docs/SCHEMA.md)
- [Vertical-slice plan](docs/VERTICAL_SLICE.md)
- [Milestones and acceptance status](docs/MILESTONES.md)

All art is original SVG placeholder work in `src/components/Avatar.tsx`, keyed by appearance id so it can be replaced layer by layer.
