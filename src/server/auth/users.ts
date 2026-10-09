import { db } from "@/server/db";

/**
 * Maps a provider account to our own user row, creating it on first sight.
 * Everything in the game references this local id, so the provider can be
 * replaced without touching game data.
 */
export async function localUserIdFor(authId: string): Promise<string> {
  if (!authId || authId.length > 200) throw new Error("Invalid auth id");
  const existing = await db.user.findUnique({ where: { authId }, select: { id: true } });
  if (existing) return existing.id;
  // First sign-in. Several requests can arrive at once (page + prefetch), so
  // insert with ON CONFLICT DO NOTHING rather than upsert, which can collide.
  await db.user.createMany({ data: [{ authId }], skipDuplicates: true });
  return (await db.user.findUniqueOrThrow({ where: { authId }, select: { id: true } })).id;
}
