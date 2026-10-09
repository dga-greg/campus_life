import { isValidPesewas, type Pesewas } from "./money";

export const STAT_KEYS = [
  "academicPreparation",
  "energy",
  "wellbeing",
  "socialConnection",
  "campusReputation",
  "careerReadiness",
  "leadership",
  "businessExperience",
] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const STAT_LABELS: Record<StatKey, string> = {
  academicPreparation: "Academic preparation",
  energy: "Energy",
  wellbeing: "Wellbeing",
  socialConnection: "Social connection",
  campusReputation: "Campus reputation",
  careerReadiness: "Career readiness",
  leadership: "Leadership",
  businessExperience: "Business experience",
};

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export function clampStat(value: number): number {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)));
}

/** A validated bundle of consequences. The only way stats or money change. */
export interface Effect {
  stats?: Partial<Record<StatKey, number>>;
  money?: Pesewas;
  /** Ledger label, required whenever money is non-zero. */
  reason?: string;
}

export interface AppliedEffect {
  stats: Stats;
  wallet: Pesewas;
  /** What actually changed after clamping — shown to the player as feedback. */
  statDeltas: Partial<Record<StatKey, number>>;
  moneyDelta: Pesewas;
}

export type EffectError =
  | { code: "INVALID_EFFECT"; message: string }
  | { code: "INSUFFICIENT_FUNDS"; message: string; shortfall: Pesewas };

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function applyEffect(stats: Stats, wallet: Pesewas, effect: Effect): Result<AppliedEffect, EffectError> {
  const next: Stats = { ...stats };
  const statDeltas: Partial<Record<StatKey, number>> = {};

  for (const [key, delta] of Object.entries(effect.stats ?? {})) {
    if (!(STAT_KEYS as readonly string[]).includes(key)) {
      return { ok: false, error: { code: "INVALID_EFFECT", message: `Unknown stat "${key}"` } };
    }
    if (typeof delta !== "number" || !Number.isInteger(delta) || Math.abs(delta) > STAT_MAX) {
      return { ok: false, error: { code: "INVALID_EFFECT", message: `Bad delta for "${key}"` } };
    }
    const k = key as StatKey;
    const after = clampStat(next[k] + delta);
    if (after !== next[k]) statDeltas[k] = after - next[k];
    next[k] = after;
  }

  const money = effect.money ?? 0;
  if (!isValidPesewas(money)) {
    return { ok: false, error: { code: "INVALID_EFFECT", message: "Money must be whole pesewas" } };
  }
  if (money !== 0 && !effect.reason) {
    return { ok: false, error: { code: "INVALID_EFFECT", message: "Money changes need a reason" } };
  }
  const walletAfter = wallet + money;
  if (walletAfter < 0) {
    return {
      ok: false,
      error: { code: "INSUFFICIENT_FUNDS", message: "Not enough money for this", shortfall: -walletAfter },
    };
  }
  return { ok: true, value: { stats: next, wallet: walletAfter, statDeltas, moneyDelta: money } };
}
