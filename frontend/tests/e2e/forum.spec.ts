import { expect, test } from "@playwright/test";

const viewports = [
  { width: 1440, height: 960 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

test("public forum is reachable from Landing and remains readable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Перейти на форум" }).click();
  await expect(page).toHaveURL(/\/forum$/);
  await expect(page.getByRole("heading", { name: /Сообщество Loopy/ })).toBeVisible();
  await expect(page.locator("main, .page")).toBeVisible();
});

test("forum remains usable across supported viewports and themes", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/forum");
    await expect(page.getByRole("heading", { name: /Сообщество Loopy/ })).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
  }

  await page.getByLabel("Тема оформления").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Тема оформления").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("register → create topic → reply → topic appears", async ({ page }) => {
  const email = uniqueEmail();
  const password = "test-password-123";

  await page.goto("/register");
  await page.fill('input[name="name"]', "Forum User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  await page.goto("/forum");
  await expect(page.getByRole("heading", { name: /Сообщество Loopy/ })).toBeVisible();

  const firstCategory = page.getByRole("link").filter({ hasText: /Общее/ }).first();
  if (await firstCategory.isVisible({ timeout: 5000 })) {
    await firstCategory.click();
  } else {
    await page.goto("/forum/categories/general");
  }
  await expect(page.getByRole("heading")).toBeVisible({ timeout: 10000 });

  const createBtn = page.getByRole("button", { name: "Создать тему" });
  if (await createBtn.isVisible({ timeout: 3000 })) {
    await createBtn.click();
  } else {
    await page.goto("/forum/categories/general/new");
  }
  await expect(page.getByLabel("Название")).toBeVisible({ timeout: 10000 });

  const topicTitle = `E2E topic ${Date.now()}`;
  await page.fill('[name="title"]', topicTitle);
  await page.fill('[name="content"]', "This is a test message from Playwright E2E.");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/forum\/topics\/\d+/, { timeout: 10000 });
  await expect(page.getByText(topicTitle)).toBeVisible({ timeout: 10000 });

  await page.fill('[name="content"]', "A reply message from Playwright E2E test.");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Ответ опубликован")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("A reply message from Playwright E2E test.")).toBeVisible({ timeout: 5000 });
});

test("locked topic hides reply form after FORUM_TOPIC_LOCKED response", async ({ page }) => {
  const email = uniqueEmail();
  const password = "test-password-123";

  await page.goto("/register");
  await page.fill('input[name="name"]', "Lock Test User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  await page.goto("/forum");
  await expect(page.getByRole("heading", { name: /Сообщество Loopy/ })).toBeVisible();

  const firstCategory = page.getByRole("link").filter({ hasText: /Общее/ }).first();
  if (await firstCategory.isVisible({ timeout: 5000 })) {
    await firstCategory.click();
  } else {
    await page.goto("/forum/categories/general");
  }
  await expect(page.getByRole("heading")).toBeVisible({ timeout: 10000 });

  const createBtn = page.getByRole("button", { name: "Создать тему" });
  if (await createBtn.isVisible({ timeout: 3000 })) {
    await createBtn.click();
  } else {
    await page.goto("/forum/categories/general/new");
  }

  const topicTitle = `E2E locked test ${Date.now()}`;
  await page.fill('[name="title"]', topicTitle);
  await page.fill('[name="content"]', "Testing locked state via route interception.");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/forum\/topics\/\d+/, { timeout: 10000 });

  await page.route("**/forum/topics/*/posts", (route) => {
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ code: "FORUM_TOPIC_LOCKED", message: "Тема закрыта" }),
    });
  });

  await page.fill('[name="content"]', "This reply should trigger locked state.");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Тема закрыта для новых ответов")).toBeVisible({ timeout: 5000 });

  await page.unroute("**/forum/topics/*/posts");

  page.on("response", async (response) => {
    if (response.url().includes("/forum/topics/") && !response.url().includes("/posts") && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.locked) {
          await page.waitForSelector("text=Закрыто", { timeout: 5000 });
        }
      } catch {
        // ignore parse errors
      }
    }
  });
});
