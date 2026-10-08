import { test, expect } from "@playwright/test";

test("large demo fits the map, focuses readable cards and describes distant cousins in every language", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");
  await page.locator("#startDemo").click();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(99);
  await page.locator('[data-action="fit"]').click();
  const outside = await page
    .locator("#graph .node .card")
    .evaluateAll((cards) => {
      const viewport = document.querySelector("#graph").getBoundingClientRect();
      return cards.filter((card) => {
        const r = card.getBoundingClientRect();
        return (
          r.left < viewport.left ||
          r.top < viewport.top ||
          r.right > viewport.right ||
          r.bottom > viewport.bottom
        );
      }).length;
    });
  expect(outside).toBe(0);
  const zoom = parseInt(await page.locator("#zoomLabel").textContent());
  expect(zoom).toBeLessThan(15);
  await page.locator('[data-action="zoom-in"]').click();
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThan(zoom);
  await page.screenshot({
    path: "test-results/large-family-overview.png",
    fullPage: true,
  });
  await page.locator('#favoriteRail [data-fast-person="p5"]').click();
  await expect(page.locator("#inspector h2")).toHaveText("Jesse Ward");
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThanOrEqual(80);
  await page.locator('#personList [data-person="nathan"]').click();
  await expect(page.locator("#inspector h2")).toHaveText("Nathan Doe");
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThanOrEqual(80);
  for (const [language, labels] of [
    [
      "en",
      [
        "First cousin",
        "Second cousin",
        "Third cousin",
        "Fourth cousin",
        "Fifth cousin",
      ],
    ],
    [
      "uk",
      [
        "Двоюрідна сестра",
        "Троюрідна сестра",
        "Чотириюрідна сестра",
        "П’ятиюрідна сестра",
        "Шестиюрідний брат",
      ],
    ],
    [
      "ru",
      [
        "Двоюродная сестра",
        "Троюродная сестра",
        "Четвероюродная сестра",
        "Пятиюродная сестра",
        "Шестиюродный брат",
      ],
    ],
  ]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.locator('#viewActions [data-action="compare"]').click();
    await page.locator("#kinFrom").selectOption("p5");
    for (const [index, id] of [
      "grace",
      "lucy",
      "olivia",
      "emily",
      "nathan",
    ].entries()) {
      await page.locator("#kinTo").selectOption(id);
      await expect(page.locator("#kinResult h3")).toHaveText(labels[index]);
    }
    await page.locator("[data-close]").first().click();
  }
  expect(errors).toEqual([]);
});

test("phone opens natural profiles and a long cousin ancestry path from the large demo", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").tap();
  await page.locator('.graph-biography[data-biography="p5"]').tap();
  await expect(page.locator(".biography-header h2")).toHaveText("Jesse Ward");
  await expect(page.locator(".biography")).toContainText("PA7314062");
  await expect(page.locator(".biography")).not.toContainText("Fictional");
  await page.locator("[data-close]").first().tap();
  await page.locator('#viewActions [data-action="compare"]').tap();
  await page.locator("#kinFrom").selectOption("p5");
  await page.locator("#kinTo").selectOption("nathan");
  await expect(page.locator("#kinResult h3")).toHaveText("Fifth cousin");
  await page.locator("[data-show-kin-path]").tap();
  await expect(page.locator("#modal")).not.toBeVisible();
  expect(
    await page.locator('#graph .edge path[stroke-width="8"]').count(),
  ).toBe(12);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/large-family-phone-path.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await context.close();
});
