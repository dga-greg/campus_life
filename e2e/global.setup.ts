import { clerkSetup } from "@clerk/testing/playwright";
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

// Fetches a Clerk testing token so automated sign-ups are not treated as bots.
export default async function globalSetup() {
  await clerkSetup();
}
