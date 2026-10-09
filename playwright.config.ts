import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:3100", launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } },
  webServer: { command: "npm run build && npx next start -p 3100", url: "http://127.0.0.1:3100", reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: "mobile-360", use: { viewport: { width: 360, height: 740 }, hasTouch: true } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
