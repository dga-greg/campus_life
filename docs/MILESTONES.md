# Milestone checklist

Legend: [x] built and verified · [~] partly done · [ ] not started

## Phase 1 — Foundation
- [x] Project structure (Next.js 16, TypeScript, Tailwind 4, Prisma 7, Vitest, Playwright, CI workflow)
- [x] Database schema, migration, seed (Phase 1 models; later models specified in SCHEMA.md)
- [x] Authentication: register, log in, log out, hashed sessions, rate limiting
- [x] Design system: colour and type tokens, buttons, cards, fields, focus and reduced-motion handling
- [x] Landing page
- [x] Character creator: appearance, name, hometown, ambition, traits, programme, background
- [x] Admission letter and first server-authoritative action (accept admission, pay fees)
- [x] Main dashboard: stats, wallet, ledger, courses, clock
- [x] Initial game state from the engine
- [~] Managed authentication — own implementation in place; provider not chosen
- [~] CI — workflow written, not yet run on GitHub (no remote)
- [ ] Deployment to a host

Verified by: 30 unit/integration tests, 2 end-to-end runs (360 px, 1280 px), lint, typecheck, production build.

## Phase 2 — Playable first semester
- [ ] Weekly planner and action slots
- [ ] Assessments, exams, semester GPA, results slip
- [ ] Narrative engine + 20 events
- [ ] Weekly living costs and part-time work
- [ ] First NPCs with memory
- [ ] Campus map (5 locations)
- [ ] Save-version migration harness

## Phase 3 — Campus life expansion
- [ ] Full relationship system · clubs · hostel mechanics · remaining locations · leadership

## Phase 4 — Economy and entrepreneurship
- [ ] Jobs · business creation and operations · demand model · business achievements

## Phase 5 — Four-year simulation
- [ ] Eight semesters · full curricula and prerequisites · resits and probation · graduation outcomes · 100+ events

## Phase 6 — Social features
- [ ] Share cards · friend challenges · opt-in leaderboards · weekly scenarios · achievements

## Phase 7 — Production readiness
- [ ] Security review · accessibility audit · performance · Redis rate limiting · analytics · error monitoring · account deletion and export · deployment docs

## Acceptance criteria (brief §21)
| # | Criterion | Status |
|---|---|---|
| 1 | Create an account and character | Done |
| 2 | Start university | Done (admission accepted, Week 1) |
| 3 | Navigate the campus | Not started |
| 4 | Plan activities | Not started |
| 5 | Story decisions | Not started |
| 6 | Validated consequences | Mechanism done and tested; one action so far |
| 7 | Academic results calculated correctly | GPA maths done and tested; no assessments yet |
| 8 | Accurate balances | Done for existing actions |
| 9 | NPC memory | Not started |
| 10 | Eight semesters | Not started |
| 11 | Student business | Not started |
| 12 | Data-driven graduation | Not started |
| 13 | Save and resume | Done |
| 14 | Desktop and mobile | Done for existing screens |
| 15 | Server-authorised actions | Done |
| 16 | Automated tests pass | Done |
| 17 | Documented deployment | Local setup documented; hosting not done |
