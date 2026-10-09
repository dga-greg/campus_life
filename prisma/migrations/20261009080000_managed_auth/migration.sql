-- Sign-in moves to a managed provider (Clerk). We keep only an opaque
-- provider id per user: no email, no password hash, no session table.
DROP TABLE "Session";

ALTER TABLE "User" ADD COLUMN "authId" TEXT;
-- Accounts created by the built-in Phase 1 auth cannot sign in any more;
-- they keep a placeholder so their rows stay valid.
UPDATE "User" SET "authId" = 'legacy:' || "id";
ALTER TABLE "User" ALTER COLUMN "authId" SET NOT NULL;
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");

DROP INDEX "User_email_key";
ALTER TABLE "User" DROP COLUMN "email", DROP COLUMN "passwordHash";
