import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { localUserIdFor } from "./users";

/** The signed-in player's local user id, verified by Clerk on every request. */
export async function currentUserId(): Promise<string | null> {
  await connection(); // sessions are per request; never prerender past this point
  const { userId } = await auth();
  return userId ? localUserIdFor(userId) : null;
}

export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) redirect("/login");
  return id;
}
