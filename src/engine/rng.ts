/**
 * Seeded, serialisable PRNG (mulberry32). The whole generator state is one
 * 32-bit integer stored in the save, so any action can be replayed exactly.
 */
export type RngState = number;

export function seedFromString(text: string): RngState {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Returns a float in [0, 1) and the next generator state. */
export function nextFloat(state: RngState): { value: number; state: RngState } {
  const a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: a >>> 0 };
}

/** Integer in [min, max], inclusive. */
export function nextInt(state: RngState, min: number, max: number): { value: number; state: RngState } {
  const r = nextFloat(state);
  return { value: min + Math.floor(r.value * (max - min + 1)), state: r.state };
}
