import { clerkMiddleware } from "@clerk/nextjs/server";

// Attaches the verified session to each request. Pages and Server Actions
// still check it themselves (see server/auth/session.ts) — this is not the gate.
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
