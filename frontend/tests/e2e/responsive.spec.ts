import { expect, test } from "@playwright/test";

const backend = "http://localhost:8080/api";
const viewports = [
  { width: 1440, height: 960 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

const email = `responsive-${Date.now()}@test.com`;
const password = "responsive-pass-1234";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Responsive smoke", () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${backend}/auth/register`, {
      data: { name: "Responsive Tester", email, password },
    });
    expect(response.ok()).toBeTruthy();
  });

  for (const viewport of viewports) {
    test(`dashboard fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await expect(page.locator("main h1")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
      if (viewport.width < 1024) await expect(page.getByRole("button", { name: "Открыть меню" })).toBeVisible();
    });
  }

  test("mobile drawer closes on route selection and Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const menu = page.getByRole("button", { name: "Открыть меню" });
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await page.getByRole("link", { name: "Колоды" }).click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page).toHaveURL(/\/decks/);
  });
});
