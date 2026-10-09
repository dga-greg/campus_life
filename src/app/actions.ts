"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { login, register } from "@/server/auth/accounts";
import { rateLimit } from "@/server/auth/rate-limit";
import { clearSession, currentUserId, setSessionCookie } from "@/server/auth/session";
import { createCharacter, performAction } from "@/server/game/service";

export interface FormState {
  error?: string;
  /** Echoed back so a failed attempt does not wipe what the player typed. */
  email?: string;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

async function authenticate(kind: "register" | "login", formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const ip = await clientKey();
  const byIp = rateLimit(`${kind}:ip:${ip}`, 20, 10 * 60_000);
  const byEmail = rateLimit(`${kind}:email:${email.trim().toLowerCase()}`, 8, 10 * 60_000);
  if (!byIp.allowed || !byEmail.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil(Math.max(byIp.retryAfterSec, byEmail.retryAfterSec) / 60)} minutes.` };
  }
  const credentials = { email, password: String(formData.get("password") ?? "") };
  const result = kind === "register" ? await register(credentials) : await login(credentials);
  if (!result.ok) return { error: result.message, email };
  await setSessionCookie(result.token, result.expiresAt);
  redirect("/dashboard");
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return authenticate("register", formData);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return authenticate("login", formData);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
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
