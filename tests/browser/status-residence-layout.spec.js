import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
});

test("person cards show full dates and distinct life and minor badges in every language and SVG export", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const language of ["en", "uk", "ru"]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    const john = page.locator('.node[data-node="p1"]');
    await expect(john.locator('[data-person-status="deceased"]')).toHaveCount(
      1,
    );
    await expect(
      page.locator('.node[data-node="p5"] [data-person-status="living"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('.node[data-node="p13"] [data-person-status="minor"]'),
    ).toHaveCount(1);
    const dates = await john
      .locator(".person-card-date text")
      .allTextContents();
    expect(dates).toEqual(
      language === "en"
        ? ["03/04/1932", "11/03/2011"]
        : ["04.03.1932", "03.11.2011"],
    );
    const bounds = await john.evaluate((el) => {
      const card = el.querySelector(".card").getBBox();
      return [
        ...el.querySelectorAll(".person-card-date,[data-person-status]"),
      ].map((item) => {
        const b = item.getBBox();
        return (
          b.x >= 0 &&
          b.y >= 0 &&
          b.x + b.width <= card.width &&
          b.y + b.height <= card.height
        );
      });
    });
    expect(bounds.every(Boolean)).toBe(true);
  }
  const svg = await page.evaluate(async () => {
    const src = document.querySelector('script[type="module"]').src;
    const { renderFilteredGraph } = await import(
      new URL("graph/render.js", src).href
    );
    return renderFilteredGraph({}, true);
  });
  expect(svg).toContain("04.03.1932");
  expect(svg).toContain('data-person-status="minor"');
  expect(svg).not.toContain('class="graph-favorite"');
  expect(errors).toEqual([]);
});

test("residence editor validates periods, saves country details and retains biological and adoptive parents", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p6"]').click();
  const parents = page.locator("#inspector .kin-group").first();
  for (const name of ["Jamie Roe", "Jordan Roe", "Quinn Vale"])
    await expect(parents).toContainText(name);
  await expect(parents).toContainText("Adoptive parent");
  await expect(parents).toContainText("Mother");
  await page.locator('#inspector [data-edit-person="p6"]').click();
  const section = page
    .locator(".profile-editor-section")
    .filter({ has: page.locator('[data-add-record="residences"]') });
  if ((await section.getAttribute("open")) === null)
    await section.locator("summary").first().click();
  await section.locator('[data-add-record="residences"]').click();
  const record = section.locator(".profile-record").last();
  await record.locator('[name="residences-country"]').fill("Testland");
  await record.locator('[name="residences-city"]').fill("Test City");
  await record.locator('[name="residences-from"]').fill("2021-01-01");
  await record.locator('[name="residences-to"]').fill("2020-01-01");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await record.locator('[name="residences-to"]').fill("2022-01-01");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('#personList [data-biography="p6"]').click();
  await expect(page.locator(".biography")).toContainText("Testland");
  await expect(page.locator(".biography")).toContainText("Test City");
  await expect(page.locator(".biography")).toContainText("Quinn Vale");
});

test("desktop, tablet and narrow phone layouts keep navigation, search, graph and dialogs within the viewport", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [
    1920, 1440, 1280, 1100, 1024, 820, 768, 740, 430, 390, 320,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .locator('[data-action="close-panel"]')
      .evaluateAll((els) => els.forEach((el) => el.click()));
    const shell = await page.locator("#appShell").boundingBox();
    expect(shell.width).toBe(width);
    expect(shell.height).toBe(900);
    const search = await page.locator(".global-search-bar").boundingBox();
    const workspace = await page.locator(".workspace").boundingBox();
    expect(workspace.y).toBeCloseTo(search.y + search.height, 0);
    expect(workspace.y + workspace.height).toBeCloseTo(900, 0);
    const graph = await page.locator("#graph").boundingBox();
    expect(graph.width).toBeGreaterThan(100);
    expect(graph.height).toBeGreaterThan(150);
    if (width > 760) {
      const heading = await page.locator(".canvas-top").boundingBox();
      expect(heading.y + heading.height).toBeLessThanOrEqual(graph.y + 1);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow).toBe(false);
    if (width === 820) {
      await page.locator('#personList [data-person="p6"]').click();
      await page.locator('.node[data-node="p6"] .card').click();
      const panel = await page.locator("#inspector").boundingBox();
      expect(panel.y).toBeGreaterThanOrEqual(search.y + search.height);
      await page.locator('#inspector [data-action="close-panel"]').click();
    }
    if (width === 320) {
      await page.locator('#viewActions [data-action="add-person"]').click();
      const dialog = await page.locator("#modal").boundingBox();
      expect(dialog.x).toBeGreaterThanOrEqual(0);
      expect(dialog.x + dialog.width).toBeLessThanOrEqual(width);
      await page.screenshot({ path: "test-results/status-layout-phone.png" });
      await page.locator("[data-close]").first().click();
    }
  }
  expect(errors).toEqual([]);
});

test("translated counters and filters stay inside every workspace view on tablets and phones", async ({
  page,
}) => {
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["en", "uk", "ru"]) {
      await page.locator(".topbar [data-language]").selectOption(language);
      for (const view of [
        "tree",
        "events",
        "calendar",
        "documents",
        "gaps",
        "property",
      ]) {
        await page
          .locator(`[data-view="${view}"]`)
          .evaluate((el) => el.click());
        const overflow = await page
          .locator(".main")
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        expect(overflow, `${width}px ${language} ${view}`).toBe(false);
        if (view === "documents" && width <= 390) {
          const filter = await page.locator("#docTypeFilter").boundingBox();
          expect(filter.width).toBeGreaterThan(200);
        }
      }
    }
  }
});

test("completed autosave and restored-draft labels follow every language change", async ({
  page,
}) => {
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  for (const [language, label] of [
    ["uk", "Чернетку збережено"],
    ["ru", "Черновик сохранён"],
    ["en", "Draft saved"],
  ]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    await expect(page.locator("#saveState")).toContainText(label);
  }
  await page.reload();
  await page.locator("#startContinue").click();
  await expect(page.locator("#saveState")).toContainText("Draft on device");
  await page.locator(".topbar [data-language]").selectOption("uk");
  await expect(page.locator("#saveState")).toContainText(
    "Чернетка на пристрої",
  );
});
