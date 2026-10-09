# Database schema

Conventions: UUID primary keys for player data; readable string ids for authored content (`computer-science`, `csc-111`) so content files and rows line up. Money is integer pesewas. Every player-owned table reaches `User` through `Character`, and every query in the service layer filters on `userId`.

## Implemented (migration `init`)

| Model | Purpose | Key constraints |
|---|---|---|
| User | Account | `email` unique |
| Session | Login session | `tokenHash` unique (SHA-256 of cookie); cascade on user delete |
| University, AcademicProgram, Course | Reference content, seeded from `src/engine/content` | `Course.code` unique |
| ProgramCourse | Curriculum: programme × course × year × semester | composite PK |
| CoursePrerequisite | Course → prerequisite | composite PK (rows arrive with Year 1 Sem 2 content) |
| Character | A student | index `userId` |
| CharacterAppearance | Avatar layers | 1:1 with Character |
| GameSave | Authoritative snapshot | `version` for optimistic concurrency, `schemaVersion` for migrations |
| PlayerStatistics | Queryable copy of the eight stats + CGPA | 1:1 |
| Wallet | Balance | `CHECK (balancePesewas >= 0)` |
| FinancialTransaction | Ledger with running balance | index `(walletId, createdAt)`; links to the action that caused it |
| Enrollment | Course registrations | unique `(characterId, courseId, term)` |
| GameActionLog | Append-only audit and idempotency | unique `(characterId, idempotencyKey)` |

```
User 1─* Session
User 1─* Character 1─1 CharacterAppearance
                   1─1 GameSave
                   1─1 PlayerStatistics
                   1─1 Wallet 1─* FinancialTransaction *─1 GameActionLog
                   1─* Enrollment *─1 Course
                   1─* GameActionLog
University 1─* AcademicProgram 1─* ProgramCourse *─1 Course *─* Course (CoursePrerequisite)
```

## Proposed for later phases (not yet migrated)

| Phase | Models | Notes |
|---|---|---|
| 2 | AcademicTerm, Assessment, AssessmentResult, Activity, ActivityHistory, StoryEvent, StoryChoice, StoryConsequence, PlayerEventHistory | Story content is authored in TypeScript/JSON and validated by Zod; the tables index it for eligibility queries and analytics. `PlayerEventHistory` unique on `(characterId, eventId, occurrence)` to enforce cooldowns. |
| 3 | NPC, NPCRelationship, RelationshipMemory, Quest, QuestProgress | Relationship is a row of several dimensions (trust, rivalry, mentorship…) plus memory flags — not one score. |
| 4 | Business, BusinessTransaction | Business ledger separate from the personal wallet; transfers between them are paired transactions. |
| 5 | (content only) | Full four-year curricula and prerequisites populate existing tables. |
| 6 | Achievement, PlayerAchievement, Challenge, LeaderboardEntry, PlayerProfile | Leaderboard scores are recomputed server-side by replaying the action log from the challenge seed. `PlayerProfile` holds opt-in public display settings only. |
| 7 | — | Account deletion and data export operate on the cascade from `User`. |

`GameSave` remains a single current snapshot per character; history lives in `GameActionLog`.
