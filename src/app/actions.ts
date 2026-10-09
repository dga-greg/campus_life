"use server";

import { redirect } from "next/navigation";
import { rateLimit } from "@/server/auth/rate-limit";
import { currentUserId } from "@/server/auth/session";
import { createCharacter, performAction } from "@/server/game/service";

export interface FormState {
  error?: string;
}

export async function createCharacterAction(input: unknown): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const result = await createCharacter(userId, input);
  if (!result.ok && result.error.code !== "LIMIT") return { error: result.error.message };
  redirect("/admission");
}

export async function gameAction(request: unknown): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  if (!rateLimit(`action:${userId}`, 120, 60_000).allowed) return { error: "Slow down a moment, then try again." };
  const result = await performAction(userId, request);
  if (!result.ok) return { error: result.error.message };
  redirect("/dashboard");
}
