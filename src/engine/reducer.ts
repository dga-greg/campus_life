import { BACKGROUNDS } from "./content/character";
import type { Pesewas } from "./money";
import { gameStateSchema, type GameState } from "./state";
import { applyEffect, type Result, type StatKey } from "./stats";

/**
 * The single entry point for changing a game. Clients send an intent
 * ("accept admission"); they never send numbers. Everything that results —
 * stats, money, time — is decided here.
 */
export type GameAction = { type: "ACCEPT_ADMISSION" };
export const GAME_ACTION_TYPES = ["ACCEPT_ADMISSION"] as const;

export interface LedgerEntry {
  amount: Pesewas;
  reason: string;
  balanceAfter: Pesewas;
}

export interface ActionOutcome {
  state: GameState;
  ledger: LedgerEntry[];
  statDeltas: Partial<Record<StatKey, number>>;
  summary: string;
}

export type ActionError = { code: "INVALID_ACTION" | "NOT_ALLOWED_NOW" | "INSUFFICIENT_FUNDS" | "INVALID_EFFECT"; message: string };

export function applyAction(state: GameState, action: GameAction): Result<ActionOutcome, ActionError> {
  switch (action.type) {
    case "ACCEPT_ADMISSION": {
      if (state.clock.phase !== "admission") {
        return { ok: false, error: { code: "NOT_ALLOWED_NOW", message: "You have already accepted your admission." } };
      }
      const background = BACKGROUNDS.find((b) => b.id === state.character.backgroundId)!;
      const paid = applyEffect(state.stats, state.wallet, {
        money: -background.firstSemesterFees,
        reason: "Semester 1 hostel and registration fees",
      });
      if (!paid.ok) return { ok: false, error: { code: paid.error.code, message: paid.error.message } };
      const next = gameStateSchema.parse({
        ...state,
        stats: paid.value.stats,
        wallet: paid.value.wallet,
        clock: { ...state.clock, week: 1, phase: "teaching" },
        flags: [...state.flags, "admission_accepted"],
      });
      return {
        ok: true,
        value: {
          state: next,
          ledger: [{ amount: paid.value.moneyDelta, reason: "Semester 1 hostel and registration fees", balanceAfter: paid.value.wallet }],
          statDeltas: paid.value.statDeltas,
          summary: "You accepted your place at AMU and paid your first-semester fees. Week 1 begins.",
        },
      };
    }
    default:
      return { ok: false, error: { code: "INVALID_ACTION", message: "Unknown action" } };
  }
}
