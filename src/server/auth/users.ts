import { db } from "@/server/db";

/**
 * Maps a provider account to our own user row, creating it on first sight.
 * Everything in the game references this local id, so the provider can be
 * replaced without touching game data.
 */
export async function localUserIdFor(authId: string): Promise<string> {
  if (!authId || authId.length > 200) throw new Error("Invalid auth id");
  const user = await db.user.upsert({ where: { authId }, update: {}, create: { authId }, select: { id: true } });
  return user.id;
}
