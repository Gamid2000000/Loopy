import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 960 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`landing is usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Начать бесплатно" }).first()).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (viewport.width <= 768) { await page.getByRole("button", { name: "Открыть меню" }).click(); await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toBeVisible(); }
  });
}

test("guest calls to action point to auth routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Начать бесплатно" }).first()).toHaveAttribute("href", "/register");
  await expect(page.getByRole("link", { name: "Войти" }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByText("Форум скоро")).toBeVisible();
});
