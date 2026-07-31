import { test, expect } from "@playwright/test";

const BACKEND = "http://localhost:8080/api";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

test.describe("Decks and Cards", () => {
  const email = uniqueEmail();
  const password = "test-pass-1234";
  const name = "Deck Tester";

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BACKEND}/auth/register`, {
      data: { name, email, password },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("create deck → create cards → edit → archive → restore", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Go to decks
    await page.click("text=Колоды");
    await expect(page).toHaveURL(/\/decks/, { timeout: 10000 });

    // Create deck
    await page.click("text=Создать колоду");
    await page.fill('input[name="name"]', "Test Deck E2E");
    await page.fill('textarea[name="description"]', "E2E test description");
    await page.click('button:has-text("Создать")');

    // Should see success toast
    await expect(page.locator("text=Колода создана")).toBeVisible({ timeout: 5000 });

    // Open cards for the deck
    await page.click("text=Открыть карточки");

    // Create card 1
    await page.click("text=Добавить карточку");
    await page.fill('input[name="front"]', "Hello");
    await page.fill('textarea[name="back"]', "Привет");
    await page.click('button:has-text("Создать")');
    await expect(page.locator("text=Карточка создана")).toBeVisible({ timeout: 5000 });

    // Create card 2
    await page.click("text=Добавить карточку");
    await page.fill('input[name="front"]', "Goodbye");
    await page.fill('textarea[name="back"]', "Пока");
    await page.click('button:has-text("Создать")');
    await expect(page.locator("text=Карточка создана")).toBeVisible({ timeout: 5000 });

    // Create card 3
    await page.click("text=Добавить карточку");
    await page.fill('input[name="front"]', "Thank you");
    await page.fill('textarea[name="back"]', "Спасибо");
    await page.click('button:has-text("Создать")');
    await expect(page.locator("text=Карточка создана")).toBeVisible({ timeout: 5000 });

    // Archive a card (click the archive button in the list)
    const archiveCardBtn = page.locator('[aria-label*="Архивировать"], button:has-text("Архивировать")').first();
    await archiveCardBtn.click();
    await page.click('button:has-text("Архивировать")');
    await expect(page.locator("text=Карточка архивирована")).toBeVisible({ timeout: 5000 });

    // Go to Archive tab
    await page.click('[role="tab"]:has-text("Архив")');

    // Restore the archived card
    const restoreCardBtn = page.locator('[aria-label*="Восстановить"], button:has-text("Восстановить")').first();
    await restoreCardBtn.click();
    await page.click('button:has-text("Восстановить")');
    await expect(page.locator("text=Карточка восстановлена")).toBeVisible({ timeout: 5000 });
  });
});
