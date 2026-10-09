import { expect, test } from "@playwright/test";

const shots = process.env.SHOTS_DIR;

test("a new player registers, creates a student, accepts admission and resumes later", async ({ page, context }, info) => {
  const snap = async (name: string) => { if (shots) await page.screenshot({ path: `${shots}/${info.project.name}-${name}.png`, fullPage: true }); };
  const noSideScroll = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const email = `player-${Date.now()}-${info.project.name}@example.test`;

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/); // protected route

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One campus story");
  await noSideScroll(); await snap("1-landing");
  await page.getByRole("link", { name: "Start first year" }).click();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("short");
  await page.getByLabel("Password").fill("a long enough password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/create$/);

  // Step 1: look
  await page.getByText("Braids", { exact: true }).click();
  await page.getByText("Glasses", { exact: true }).click();
  await noSideScroll(); await snap("2-look");
  await page.getByRole("button", { name: "Next" }).click();

  // Step 2: identity — validation blocks an empty name
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /characters|trait/i })).toBeVisible();
  await page.getByLabel("Display name").fill("Ama Owusu");
  await page.getByLabel("Hometown").selectOption("Kumasi");
  await page.getByText("Curious", { exact: true }).click();
  await snap("3-identity");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByText("Computer Science", { exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByText("Scholarship Student", { exact: true }).click();
  await noSideScroll(); await snap("4-background");
  await page.getByRole("button", { name: "Apply to AMU" }).click();

  await expect(page).toHaveURL(/\/admission$/);
  await expect(page.getByRole("heading", { name: "Dear Ama Owusu," })).toBeVisible();
  await expect(page.getByText("GH₵550.00")).toBeVisible();
  await noSideScroll(); await snap("5-admission");
  await page.getByRole("button", { name: "Accept and pay fees" }).dblclick();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Year 1 · Semester 1 · Week 1")).toBeVisible();
  await expect(page.getByRole("region", { name: "Wallet" })).toContainText("GH₵550.00");
  await expect(page.getByText("Semester 1 hostel and registration fees")).toHaveCount(1); // double click charged once
  await expect(page.getByRole("progressbar", { name: "Academic preparation" })).toHaveAttribute("aria-valuenow", "54");
  await noSideScroll(); await snap("6-dashboard");

  // The admission page cannot be replayed, and a second character cannot be made.
  await page.goto("/admission"); await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/create"); await expect(page).toHaveURL(/\/dashboard$/);

  // Log out, then resume from a clean browser state.
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard"); await expect(page).toHaveURL(/\/login$/);
  await context.clearCookies();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong password here");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator("#main").getByRole("alert")).toContainText("incorrect");
  await page.getByLabel("Password").fill("a long enough password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Ama Owusu" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Wallet" })).toContainText("GH₵550.00");
});
