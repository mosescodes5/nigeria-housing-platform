import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

test("landlord can onboard and create a draft, but cannot reach admin or customer tools", async ({ page }) => {
  const email = `e2e-landlord-${randomUUID()}@example.test`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Landlord");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-9");
  await page.getByLabel("I am a").selectOption("LANDLORD");
  await page.getByLabel("I accept the Terms and Conditions.").check();
  await page.getByLabel("I have read the Privacy Notice.").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  expect((await page.goto("/admin"))?.status()).toBe(404);
  expect((await page.goto("/dashboard/savings/new"))?.status()).toBe(404);

  await page.goto("/portal/onboarding");
  await page.getByLabel("Business or trading name").fill("E2E Homes");
  await page.getByLabel("Business or contact address").fill("12 Broad Street, Lagos");
  await page.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByText(/pending review/i).first()).toBeVisible();

  await page.goto("/portal/listings/new");
  await page.getByLabel("Listing title").fill("E2E test apartment");
  await page.getByLabel("Description").fill("A test apartment used by the automated end-to-end suite.");
  await page.getByLabel("City").fill("Lagos");
  await page.getByLabel("Annual rent (₦)").fill("2500000");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText("Draft")).toBeVisible();

  // Submitting without the required document is refused.
  await page.getByRole("button", { name: "Submit for moderation" }).click();
  await expect(page.getByRole("alert")).toContainText(/proof of ownership|agreement/i);
});
