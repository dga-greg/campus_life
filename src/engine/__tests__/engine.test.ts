import { describe, expect, it } from "vitest";
import {
  AMU_GRADING, APPEARANCE, BACKGROUNDS, BASE_STATS, COURSES, PROGRAMS, STAT_KEYS,
  applyAction, applyEffect, cedis, classify, createInitialState, formatCedis, gpaX100,
  gradeForScore, isOnProbation, nextFloat, nextInt, seedFromString, type CharacterInput, type Stats,
} from "..";

const input = (over: Partial<CharacterInput> = {}): CharacterInput => ({
  displayName: "Ama Owusu",
  hometown: "Kumasi",
  programId: "computer-science",
  backgroundId: "scholarship",
  ambitionId: "top-of-class",
  traits: ["Curious"],
  appearance: { skinTone: APPEARANCE.skinTone[0], hairstyle: "braids", hairColor: APPEARANCE.hairColor[0], outfit: "polo", outfitColor: APPEARANCE.outfitColor[1], accessory: "none" },
  ...over,
});

describe("rng", () => {
  it("is deterministic for a seed and stays in range", () => {
    const run = (seed: number) => { let s = seed; const out = []; for (let i = 0; i < 50; i++) { const r = nextFloat(s); s = r.state; out.push(r.value); } return out; };
    expect(run(42)).toEqual(run(42));
    expect(run(42)).not.toEqual(run(43));
    expect(run(7).every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it("nextInt covers the inclusive range", () => {
    let s = seedFromString("x"); const seen = new Set<number>();
    for (let i = 0; i < 500; i++) { const r = nextInt(s, 1, 6); s = r.state; seen.add(r.value); }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("money", () => {
  it("formats pesewas without float drift", () => {
    expect(formatCedis(cedis(1234.5))).toBe("GH₵1,234.50");
    expect(formatCedis(5)).toBe("GH₵0.05");
    expect(formatCedis(-250)).toBe("-GH₵2.50");
    expect(cedis(0.1) + cedis(0.2)).toBe(30);
  });
});

describe("applyEffect", () => {
  const stats = { ...BASE_STATS } as Stats;
  it("clamps to 0–100 and reports the real change", () => {
    const r = applyEffect(stats, 0, { stats: { energy: 60, businessExperience: -50 } });
    expect(r.ok && r.value.stats.energy).toBe(100);
    expect(r.ok && r.value.stats.businessExperience).toBe(0);
    expect(r.ok && r.value.statDeltas).toEqual({ energy: 25, businessExperience: -5 });
  });
  it("does not mutate its input", () => {
    applyEffect(stats, 0, { stats: { energy: -10 } });
    expect(stats.energy).toBe(BASE_STATS.energy);
  });
  it("refuses overdrafts, fractional money, unknown stats and unlabelled money", () => {
    const over = applyEffect(stats, 100, { money: -150, reason: "x" });
    expect(over.ok).toBe(false);
    if (!over.ok && over.error.code === "INSUFFICIENT_FUNDS") expect(over.error.shortfall).toBe(50);
    expect(applyEffect(stats, 100, { money: 1.5, reason: "x" }).ok).toBe(false);
    expect(applyEffect(stats, 100, { money: 10 }).ok).toBe(false);
    expect(applyEffect(stats, 100, { stats: { luck: 5 } as never }).ok).toBe(false);
    expect(applyEffect(stats, 100, { stats: { energy: 0.5 } }).ok).toBe(false);
  });
});

describe("academics", () => {
  it("maps scores to bands at the boundaries", () => {
    expect(gradeForScore(80).letter).toBe("A");
    expect(gradeForScore(79.9).letter).toBe("B+");
    expect(gradeForScore(50).letter).toBe("D");
    expect(gradeForScore(49.9).letter).toBe("F");
    expect(() => gradeForScore(101)).toThrow();
  });
  it("computes credit-weighted GPA", () => {
    expect(gpaX100([])).toBeNull();
    expect(gpaX100([{ credits: 3, pointsX10: 40 }, { credits: 3, pointsX10: 30 }])).toBe(350);
    // (3*4.0 + 2*2.5 + 3*0) / 8 = 2.125 -> 2.13
    expect(gpaX100([{ credits: 3, pointsX10: 40 }, { credits: 2, pointsX10: 25 }, { credits: 3, pointsX10: 0 }])).toBe(213);
    // 3-credit A outweighs 1-credit F: 12/4 = 3.00
    expect(gpaX100([{ credits: 3, pointsX10: 40 }, { credits: 1, pointsX10: 0 }])).toBe(300);
    expect(() => gpaX100([{ credits: 0, pointsX10: 40 }])).toThrow();
  });
  it("classifies and flags probation", () => {
    expect(classify(360)).toBe("First Class Honours");
    expect(classify(359)).toBe("Second Class Honours (Upper Division)");
    expect(classify(99)).toBe("Not eligible to graduate");
    expect(isOnProbation(149)).toBe(true);
    expect(isOnProbation(150)).toBe(false);
    expect(AMU_GRADING.bands.map((b) => b.minScore)).toEqual([...AMU_GRADING.bands.map((b) => b.minScore)].sort((a, b) => b - a));
  });
});

describe("content integrity", () => {
  it("every programme references real courses, 14 credits in Y1S1", () => {
    expect(PROGRAMS).toHaveLength(9);
    for (const p of PROGRAMS) {
      expect(p.y1s1.every((id) => COURSES[id])).toBe(true);
      expect(p.y1s1.reduce((n, id) => n + COURSES[id].credits, 0)).toBe(14);
    }
  });
  it("backgrounds share one stat budget and can all afford their fees", () => {
    for (const b of BACKGROUNDS) {
      const mods = Object.values(b.statMods);
      expect(mods.filter((m) => m > 0).reduce((a, m) => a + m, 0)).toBe(20);
      expect(mods.filter((m) => m < 0).reduce((a, m) => a + m, 0)).toBe(-8);
      expect(b.startingWallet).toBeGreaterThan(b.firstSemesterFees);
    }
  });
});

describe("createInitialState", () => {
  it("is deterministic and applies the background", () => {
    const a = createInitialState(input(), "seed-1");
    expect(a).toEqual(createInitialState(input(), "seed-1"));
    expect(a.stats.academicPreparation).toBe(54);
    expect(a.wallet).toBe(cedis(900));
    expect(a.clock).toEqual({ year: 1, semester: 1, week: 0, phase: "admission" });
    expect(a.academics.enrollments).toHaveLength(5);
    for (const k of STAT_KEYS) expect(a.stats[k]).toBeGreaterThanOrEqual(0);
  });
  it("hometown and traits never change stats or money", () => {
    const a = createInitialState(input(), "s");
    const b = createInitialState(input({ hometown: "Tamale", traits: ["Witty", "Loyal"] }), "s");
    expect(b.stats).toEqual(a.stats);
    expect(b.wallet).toBe(a.wallet);
  });
  it("rejects bad input, including smuggled stats", () => {
    expect(() => createInitialState(input({ displayName: "<script>" }), "s")).toThrow();
    expect(() => createInitialState(input({ programId: "wizardry" }), "s")).toThrow();
    expect(() => createInitialState(input({ traits: ["Curious", "Curious"] }), "s")).toThrow();
    const sneaky = createInitialState({ ...input(), wallet: 99999999, stats: { energy: 100 } }, "s");
    expect(sneaky.wallet).toBe(cedis(900));
  });
});

describe("applyAction", () => {
  it("accepting admission charges fees once and starts week 1", () => {
    const start = createInitialState(input(), "s");
    const r = applyAction(start, { type: "ACCEPT_ADMISSION" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.state.wallet).toBe(cedis(550));
    expect(r.value.ledger).toEqual([{ amount: -cedis(350), reason: expect.any(String), balanceAfter: cedis(550) }]);
    expect(r.value.state.clock).toMatchObject({ week: 1, phase: "teaching" });
    expect(start.wallet).toBe(cedis(900));
    const again = applyAction(r.value.state, { type: "ACCEPT_ADMISSION" });
    expect(again.ok).toBe(false);
  });
  it("rejects unknown actions", () => {
    const r = applyAction(createInitialState(input(), "s"), { type: "GIVE_ME_MONEY" } as never);
    expect(r.ok).toBe(false);
  });
});
