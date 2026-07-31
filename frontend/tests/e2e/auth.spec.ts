import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

test.describe("Auth", () => {
  const email = uniqueEmail();
  const password = "test-password-123";
  const name = "E2E User";

  test("register → dashboard → logout → login", async ({ page }) => {
    // Register
    await page.goto("/register");
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Главная");

    // Logout
    await page.click("text=Выйти");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Login
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should be back at dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Главная");
  });

  test("protected routes redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown routes show 404 page", async ({ page }) => {
    await page.goto("/nonexistent-page-123");
    await expect(page.locator("h1")).toContainText("Страница не найдена");
  });
});
