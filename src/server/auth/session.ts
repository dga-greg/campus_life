import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, userIdForToken } from "./accounts";

const COOKIE = "cla_session";

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function currentUserId(): Promise<string | null> {
  return userIdForToken((await cookies()).get(COOKIE)?.value);
}

export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) redirect("/login");
  return id;
}

export async function clearSession() {
  const store = await cookies();
  await endSession(store.get(COOKIE)?.value);
  store.delete(COOKIE);
}
