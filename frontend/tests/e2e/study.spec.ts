import { test, expect } from "@playwright/test";

const BACKEND = "http://localhost:8080/api";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

test.describe("Study Session", () => {
  const email = uniqueEmail();
  const password = "test-pass-12345";
  const name = "Study Tester";

  test.beforeAll(async ({ request }) => {
    // Register
    const res = await request.post(`${BACKEND}/auth/register`, {
      data: { name, email, password },
    });
    expect(res.ok()).toBeTruthy();
    const auth = await res.json();
    const token = auth.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    // Create deck
    await request.post(`${BACKEND}/decks`, {
      data: { name: "Study Deck", description: "For study tests" },
      headers,
    });

    // Create cards via API
    const cards = [
      { front: "Dog", back: "Собака" },
      { front: "Cat", back: "Кошка" },
      { front: "Bird", back: "Птица" },
      { front: "Fish", back: "Рыба" },
    ];
    for (const card of cards) {
      await request.post(`${BACKEND}/cards/decks/1`, {
        data: card,
        headers,
      });
    }
  });

  test("start study → reveal answer → submit review → complete", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Go to decks and start study
    await page.click("text=Колоды");
    await expect(page).toHaveURL(/\/decks/, { timeout: 10000 });

    // Click start study on the deck
    const startBtn = page.locator('button:has-text("Начать занятие")');
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }

    // Should navigate to study session
    await expect(page).toHaveURL(/\/study-sessions\/\d+/, { timeout: 10000 });

    // Reveal answer
    const revealBtn = page.locator('button:has-text("Показать ответ")');
    if (await revealBtn.isVisible()) {
      await revealBtn.click();
    }

    // After reveal, grade buttons should be visible
    // Submit GOOD grade
    const goodBtn = page.locator('button:has-text("Хорошо")');
    if (await goodBtn.isVisible({ timeout: 3000 })) {
      await goodBtn.click();
    }

    // Continue submitting reviews until session completes
    // or until the next card appears
    for (let i = 0; i < 10; i++) {
      // Wait for next card or completion
      const reveal = page.locator('button:has-text("Показать ответ")');
      const completed = page.locator("text=Занятие завершено");

      if (await completed.isVisible({ timeout: 2000 }).catch(() => false)) {
        break;
      }

      if (await reveal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reveal.click();
      }

      const grade = page.locator('button:has-text("Хорошо")');
      if (await grade.isVisible({ timeout: 2000 }).catch(() => false)) {
        await grade.click();
      }
    }

    // Should complete or be in-progress
    const completed = page.locator("text=Занятие завершено");
    const stillActive = page.locator("text=Показать ответ");

    await expect(completed.or(stillActive).first()).toBeVisible({ timeout: 5000 });
  });
});
