import { test, expect } from "@playwright/test";

test("home page renders the hero headline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your Next Home Starts Here.");
});

test("health endpoint responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toMatchObject({ status: "ok" });
});

test("property search filters sample listings", async ({ page }) => {
  await page.goto("/properties?q=lekki");
  await expect(page.getByText("1 property found")).toBeVisible();
});

test("anonymous visitors cannot reach the dashboard or admin", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});
