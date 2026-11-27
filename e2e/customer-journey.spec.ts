import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

test("tenant registers, creates a goal, and sandbox money counts only once confirmed", async ({
  page,
}) => {
  const email = `e2e-${randomUUID()}@example.test`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Tenant");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-9");
  await page.getByLabel("I accept the Terms and Conditions.").check();
  await page.getByLabel("I have read the Privacy Notice.").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Tenants cannot see admin.
  const adminResponse = await page.goto("/admin");
  expect(adminResponse?.status()).toBe(404);

  await page.goto("/dashboard/savings/new");
  await page.getByLabel("Rent target (₦)").fill("1200000");
  const target = new Date();
  target.setFullYear(target.getFullYear() + 1);
  await page.getByLabel("Target date").fill(target.toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByText("Draft")).toBeVisible();

  await page.getByLabel("I accept the Rent Savings Agreement.").check();
  await page.getByRole("button", { name: "Activate goal" }).click();
  await expect(page.getByText("Goal activated.")).toBeVisible();

  await page.getByRole("button", { name: "Create sandbox deposit" }).click();
  await expect(page.getByText("Pending", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Confirmed").first()).toBeVisible();

  // Pending money is not savings.
  await page.goto("/dashboard");
  await expect(page.getByText("Confirmed savings").locator("..")).toContainText("₦0");

  await page.goBack();
  await page.getByRole("button", { name: /Simulate partner confirmation/ }).click();
  await page.goto("/dashboard");
  await expect(page.getByText("Confirmed savings").locator("..")).toContainText("₦50,000");
});
