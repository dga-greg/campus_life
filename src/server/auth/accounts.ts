import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/server/db";

/**
 * Account and session logic, free of any web framework. Sessions are opaque
 * random tokens; only their SHA-256 is stored, so a database leak does not
 * leak usable sessions. This module is the seam for a managed auth provider.
 */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string().min(10, "Use at least 10 characters").max(72, "Use at most 72 characters"),
});

export type AuthResult = { ok: true; userId: string; token: string; expiresAt: Date } | { ok: false; message: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
// Compared against when the email is unknown, so timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  return { token, expiresAt };
}

export async function register(raw: unknown): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await db.user.create({ data: { email, passwordHash } });
    return { ok: true, userId: user.id, ...(await startSession(user.id)) };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { ok: false, message: "That email already has an account. Try logging in." };
    }
    throw e;
  }
}

export async function login(raw: unknown): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(raw);
  const fail = { ok: false as const, message: "Email or password is incorrect." };
  if (!parsed.success) return fail;
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const matches = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches) return fail;
  return { ok: true, userId: user.id, ...(await startSession(user.id)) };
}

export async function userIdForToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.userId;
}

export async function endSession(token: string | undefined): Promise<void> {
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}
