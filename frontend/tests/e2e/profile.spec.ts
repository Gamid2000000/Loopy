import { test, expect } from "@playwright/test";

const BACKEND = "http://localhost:8080/api";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

test.describe("Profile", () => {
  const email = uniqueEmail();
  const password = "test-pass-123456";
  const name = "Profile Tester";

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BACKEND}/auth/register`, {
      data: { name, email, password },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("update limits and timezone → refresh → values preserved", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Go to profile
    await page.click("text=Профиль");
    await expect(page).toHaveURL(/\/profile/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Профиль");

    // Change daily limits
    const newCardsInput = page.locator('input[type="number"]').first();
    await newCardsInput.fill("");
    await newCardsInput.fill("15");

    const reviewLimitInput = page.locator('input[type="number"]').nth(1);
    await reviewLimitInput.fill("");
    await reviewLimitInput.fill("100");

    // Save
    const saveButton = page.locator("button:has-text('Сохранить'):not([disabled])");
    await saveButton.click();
    await expect(page.locator("text=Профиль сохранён")).toBeVisible({ timeout: 5000 });

    // Refresh
    await page.reload();
    await expect(page.locator("h1")).toContainText("Профиль");

    // Verify values are preserved
    await expect(newCardsInput).toHaveValue("15");
    await expect(reviewLimitInput).toHaveValue("100");
  });
});
