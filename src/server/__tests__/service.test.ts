import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { APPEARANCE, cedis, type CharacterInput } from "@/engine";
import { localUserIdFor } from "@/server/auth/users";
import { rateLimit, resetRateLimits } from "@/server/auth/rate-limit";
import { db } from "@/server/db";
import { createCharacter, loadGame, performAction, recentTransactions } from "@/server/game/service";
import { seedReferenceData } from "../../../prisma/seed";

const input: CharacterInput = {
  displayName: "Kofi Mensah", hometown: "Tamale", programId: "economics", backgroundId: "entrepreneurial",
  ambitionId: "own-business", traits: ["Ambitious", "Witty"],
  appearance: { skinTone: APPEARANCE.skinTone[2], hairstyle: "fade", hairColor: APPEARANCE.hairColor[0], outfit: "smock", outfitColor: APPEARANCE.outfitColor[0], accessory: "glasses" },
};
const newUser = async () => ({ userId: await localUserIdFor(`user_${randomUUID()}`) });
const accept = (characterId: string, expectedVersion: number, idempotencyKey: string = randomUUID()) => ({
  characterId, expectedVersion, idempotencyKey, action: { type: "ACCEPT_ADMISSION" },
});

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes("campus_test")) throw new Error("Refusing to run outside the test database");
  await seedReferenceData();
});
beforeEach(async () => { await db.user.deleteMany(); resetRateLimits(); });
afterAll(() => db.$disconnect());

describe("users", () => {
  it("maps a provider id to one stable local user, even when first requests race", async () => {
    const ok = await Promise.all(Array.from({ length: 8 }, () => localUserIdFor("user_abc")));
    expect(new Set([...ok, await localUserIdFor("user_abc")]).size).toBe(1);
    expect(await db.user.count()).toBe(1);
    expect(await localUserIdFor("user_other")).not.toBe(ok[0]);
    await expect(localUserIdFor("")).rejects.toThrow();
  });
  it("rate limiter blocks after the limit and recovers after the window", () => {
    for (let i = 0; i < 5; i++) expect(rateLimit("k", 5, 1000, 0).allowed).toBe(true);
    expect(rateLimit("k", 5, 1000, 500).allowed).toBe(false);
    expect(rateLimit("k", 5, 1000, 1001).allowed).toBe(true);
  });
});

describe("character creation", () => {
  it("creates every dependent row and round-trips through save/load", async () => {
    const u = await newUser();
    const created = await createCharacter(u.userId, input);
    if (!created.ok) throw new Error(created.error.message);
    const loaded = await loadGame(u.userId);
    expect(loaded).toEqual(created.value);
    const id = created.value.characterId;
    expect((await db.wallet.findUniqueOrThrow({ where: { characterId: id } })).balancePesewas).toBe(cedis(2600));
    expect(await db.enrollment.count({ where: { characterId: id } })).toBe(5);
    expect((await db.playerStatistics.findUniqueOrThrow({ where: { characterId: id } })).businessExperience).toBe(19);
    expect((await db.characterAppearance.findUniqueOrThrow({ where: { characterId: id } })).hairstyle).toBe("fade");
  });
  it("rejects invalid input and ignores client-supplied stats or money", async () => {
    const u = await newUser();
    expect((await createCharacter(u.userId, { ...input, programId: "alchemy" })).ok).toBe(false);
    const r = await createCharacter(u.userId, { ...input, wallet: 1e9, stats: { energy: 100 } });
    expect(r.ok && r.value.state.wallet).toBe(cedis(2600));
  });
  it("allows one character even when two requests race", async () => {
    const u = await newUser();
    const results = await Promise.all([createCharacter(u.userId, input), createCharacter(u.userId, input)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.character.count({ where: { userId: u.userId } })).toBe(1);
  });
});

describe("performAction", () => {
  const setup = async () => {
    const u = await newUser();
    const c = await createCharacter(u.userId, input);
    if (!c.ok) throw new Error();
    return { userId: u.userId, ...c.value };
  };

  it("applies the action, bumps the version and writes ledger + audit rows", async () => {
    const g = await setup();
    const r = await performAction(g.userId, accept(g.characterId, 1));
    if (!r.ok) throw new Error(r.error.message);
    expect(r.value.version).toBe(2);
    expect(r.value.state.wallet).toBe(cedis(1200));
    expect((await loadGame(g.userId))!.state).toEqual(r.value.state);
    const tx = await recentTransactions(g.userId);
    expect(tx.map((t) => t.amountPesewas).sort((a, b) => a - b)).toEqual([-cedis(1400), cedis(2600)]);
    expect((await db.wallet.findUniqueOrThrow({ where: { characterId: g.characterId } })).balancePesewas).toBe(cedis(1200));
    expect(await db.gameActionLog.count({ where: { characterId: g.characterId } })).toBe(1);
  });
  it("is idempotent: replaying a key charges nothing extra", async () => {
    const g = await setup();
    const req = accept(g.characterId, 1);
    const first = await performAction(g.userId, req);
    const second = await performAction(g.userId, req);
    expect(first.ok && second.ok && second.value.replayed).toBe(true);
    expect(second.ok && second.value.version).toBe(2);
    expect(await db.financialTransaction.count({ where: { walletId: g.characterId } })).toBe(2);
  });
  it("applies a double-click exactly once", async () => {
    const g = await setup();
    const results = await Promise.all([performAction(g.userId, accept(g.characterId, 1)), performAction(g.userId, accept(g.characterId, 1))]);
    expect(results.filter((r) => r.ok && !r.value.replayed)).toHaveLength(1);
    expect(await db.financialTransaction.count({ where: { walletId: g.characterId } })).toBe(2);
    expect((await loadGame(g.userId))!.version).toBe(2);
  });
  it("rejects a stale version", async () => {
    const g = await setup();
    await performAction(g.userId, accept(g.characterId, 1));
    const stale = await performAction(g.userId, accept(g.characterId, 1));
    expect(!stale.ok && stale.error.code).toBe("CONFLICT");
  });
  it("refuses to act on another player's game", async () => {
    const g = await setup();
    const intruder = await newUser();
    const r = await performAction(intruder.userId, accept(g.characterId, 1));
    expect(!r.ok && r.error.code).toBe("NOT_FOUND");
    expect((await loadGame(g.userId))!.version).toBe(1);
    expect(await loadGame(intruder.userId)).toBeNull();
    expect(await recentTransactions(intruder.userId)).toEqual([]);
  });
  it("rejects malformed requests and client-invented actions or payloads", async () => {
    const g = await setup();
    expect((await performAction(g.userId, { ...accept(g.characterId, 1), action: { type: "SET_WALLET", amount: 1e9 } })).ok).toBe(false);
    expect((await performAction(g.userId, { characterId: "nope" })).ok).toBe(false);
    const r = await performAction(g.userId, { ...accept(g.characterId, 1), action: { type: "ACCEPT_ADMISSION", wallet: 1e9 } });
    expect(r.ok && r.value.state.wallet).toBe(cedis(1200));
  });
  it("the database itself refuses a negative balance", async () => {
    const g = await setup();
    await expect(db.wallet.update({ where: { characterId: g.characterId }, data: { balancePesewas: -1 } })).rejects.toThrow();
  });
});
