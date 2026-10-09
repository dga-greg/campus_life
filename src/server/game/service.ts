import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  applyAction, characterInputSchema, createInitialState, gameStateSchema, GAME_ACTION_TYPES,
  type GameAction, type GameState,
} from "@/engine";
import { db } from "@/server/db";

export type ServiceError = { code: "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "LIMIT" | "REJECTED"; message: string };
export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

export interface LoadedGame {
  characterId: string;
  version: number;
  state: GameState;
}

const MAX_CHARACTERS = 1; // "Multiple character profiles" is planned; one for now.
const fail = (code: ServiceError["code"], message: string) => ({ ok: false as const, error: { code, message } });
const statColumns = (state: GameState) => ({ ...state.stats, cgpaX100: state.academics.cgpaX100 });

/** Creates the character and every dependent row in one transaction. */
export async function createCharacter(userId: string, rawInput: unknown): Promise<ServiceResult<LoadedGame>> {
  const parsed = characterInputSchema.safeParse(rawInput);
  if (!parsed.success) return fail("VALIDATION", parsed.error.issues[0].message);
  const input = parsed.data;
  const characterId = randomUUID();
  const state = createInitialState(input, characterId);

  return db.$transaction(async (tx) => {
    // Serialise per user so two simultaneous submits cannot both pass the limit check.
    await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${userId}::uuid FOR UPDATE`;
    if ((await tx.character.count({ where: { userId } })) >= MAX_CHARACTERS) {
      return fail("LIMIT", "You already have a student at AMU.");
    }
    await tx.character.create({
      data: {
        id: characterId,
        userId,
        displayName: input.displayName,
        hometown: input.hometown,
        programId: input.programId,
        backgroundId: input.backgroundId,
        ambitionId: input.ambitionId,
        traits: input.traits,
        appearance: { create: input.appearance },
        save: { create: { schemaVersion: state.schemaVersion, version: 1, state } },
        stats: { create: statColumns(state) },
        wallet: {
          create: {
            balancePesewas: state.wallet,
            transactions: { create: { amountPesewas: state.wallet, balanceAfterPesewas: state.wallet, reason: "Starting funds" } },
          },
        },
        enrollments: { create: state.academics.enrollments.map((e) => ({ courseId: e.courseId, term: e.term })) },
      },
    });
    return { ok: true as const, value: { characterId, version: 1, state } };
  });
}

/** Loads the caller's own game. There is no way to ask for someone else's. */
export async function loadGame(userId: string): Promise<LoadedGame | null> {
  const character = await db.character.findFirst({ where: { userId }, orderBy: { createdAt: "asc" }, include: { save: true } });
  if (!character?.save) return null;
  return { characterId: character.id, version: character.save.version, state: gameStateSchema.parse(character.save.state) };
}

const actionRequestSchema = z.object({
  characterId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(64),
  action: z.object({ type: z.enum(GAME_ACTION_TYPES) }),
});

export interface ActionResponse extends LoadedGame {
  summary: string;
  replayed: boolean;
}

/**
 * The only write path for a running game. The client names an action; the
 * engine computes every consequence. Guarantees, all inside one transaction:
 *  - ownership: the save is fetched by (characterId AND userId)
 *  - idempotency: a repeated key returns the first result and changes nothing
 *  - concurrency: the write is conditional on the version that was read
 */
export async function performAction(userId: string, raw: unknown): Promise<ServiceResult<ActionResponse>> {
  const parsed = actionRequestSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Malformed action request.");
  const { characterId, expectedVersion, idempotencyKey } = parsed.data;
  const action = parsed.data.action as GameAction;

  return db.$transaction(async (tx) => {
    const character = await tx.character.findFirst({ where: { id: characterId, userId }, include: { save: true } });
    if (!character?.save) return fail("NOT_FOUND", "Game not found.");
    const current = gameStateSchema.parse(character.save.state);

    const earlier = await tx.gameActionLog.findUnique({ where: { characterId_idempotencyKey: { characterId, idempotencyKey } } });
    if (earlier) {
      return { ok: true as const, value: { characterId, version: character.save.version, state: current, summary: earlier.summary, replayed: true } };
    }
    if (character.save.version !== expectedVersion) {
      return fail("CONFLICT", "Your game changed in another tab. Reload to continue.");
    }

    const outcome = applyAction(current, action);
    if (!outcome.ok) return fail("REJECTED", outcome.error.message);
    const { state, ledger, summary } = outcome.value;
    const toVersion = expectedVersion + 1;

    const written = await tx.gameSave.updateMany({
      where: { characterId, version: expectedVersion },
      data: { state, version: toVersion, schemaVersion: state.schemaVersion },
    });
    if (written.count !== 1) throw new ConcurrentWrite();

    const log = await tx.gameActionLog.create({
      data: { characterId, idempotencyKey, type: action.type, fromVersion: expectedVersion, toVersion, summary },
    });
    await tx.playerStatistics.update({ where: { characterId }, data: statColumns(state) });
    await tx.wallet.update({ where: { characterId }, data: { balancePesewas: state.wallet } });
    if (ledger.length) {
      await tx.financialTransaction.createMany({
        data: ledger.map((l) => ({ walletId: characterId, amountPesewas: l.amount, balanceAfterPesewas: l.balanceAfter, reason: l.reason, actionLogId: log.id })),
      });
    }
    return { ok: true as const, value: { characterId, version: toVersion, state, summary, replayed: false } };
  }).catch((e) => {
    // A racing request with the same key or version lost; nothing was applied for it.
    if (e instanceof ConcurrentWrite || (e as { code?: string }).code === "P2002") {
      return fail("CONFLICT", "Your game changed in another tab. Reload to continue.");
    }
    throw e;
  });
}

class ConcurrentWrite extends Error {}

export async function recentTransactions(userId: string, take = 10) {
  return db.financialTransaction.findMany({
    where: { wallet: { character: { userId } } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, amountPesewas: true, balanceAfterPesewas: true, reason: true, createdAt: true },
  });
}
