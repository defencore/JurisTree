import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
});
async function openFilters(page) {
  await page.locator(".person-filter-toggle").click();
  await expect(page.locator("#personFilterEditor")).toBeVisible();
}
async function addRule(page, field) {
  await page.locator('[data-filter-command="add"]').click();
  const row = page.locator("[data-filter-rule]").last();
  await row.locator("[data-filter-field]").selectOption(field);
  return page.locator("[data-filter-rule]").last();
}
async function apply(page) {
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}

test("combines quick filters on the map and list, uses OR and clears filters when a different person is opened", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openFilters(page);
  await page.locator('[data-preset="living"]').click();
  await page.locator('[data-preset="minor"]').click();
  await expect(page.locator("[data-filter-rule]")).toHaveCount(2);
  await expect(page.locator("#filterEditorError")).toBeEmpty();
  await apply(page);
  await expect(page.locator("#personFilterBar")).toBeVisible();
  await expect(page.locator('#personList [data-person="p13"]')).toBeVisible();
  await expect(page.locator('#personList [data-person="p1"]')).toHaveCount(0);
  await expect(page.locator('[data-node="p13"]')).toHaveCount(1);
  await expect(page.locator('[data-node="p1"]')).toHaveCount(0);
  await openFilters(page);
  await page.locator('[data-preset="deceased"]').click();
  await page.locator("#personFilterMatch").selectOption("any");
  await apply(page);
  await expect(page.locator('#personList [data-person="p1"]')).toBeVisible();
  await expect(page.locator('#personList [data-person="p13"]')).toHaveCount(1);
  await page.locator("#globalSearch").fill('name:"Jesse Ward"');
  await page
    .locator('[data-search-kind="person"][data-search-id="p5"]')
    .click();
  await expect(page.locator("#personFilterBar")).not.toBeVisible();
  await expect(page.locator('[data-node="p5"]')).toHaveCount(1);
  await expect(page.locator("#personList .person-row")).toHaveCount(99);
  expect(errors).toEqual([]);
});

test("filters asset shares by currency, exports results and preserves saved queries in ZIP", async ({
  page,
}) => {
  await openFilters(page);
  const row = await addRule(page, "assetValue");
  await row.locator("[data-filter-value]").fill("200000");
  await row.locator("[data-filter-currency]").fill("CAD");
  await page.locator("#personFilterSort").selectOption("assetsDesc");
  await page.locator("#personFilterSortCurrency").fill("CAD");
  await expect(page.locator("[data-filter-result-count]")).toHaveText("1 / 99");
  await page.locator("#personFilterName").fill("CAD property interests");
  await page.locator('[data-filter-command="save"]').click();
  await expect(page.locator("#savedPersonFilter")).not.toHaveValue("");
  const viewId = await page.locator("#savedPersonFilter").inputValue();
  const [csvDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-filter-command="csv"]').click(),
  ]);
  const csv = await readFile(await csvDownload.path(), "utf8");
  expect(csv).toContain("Jordan Roe");
  expect(csv).toContain("200000");
  expect(csv).toContain("Recorded asset shares CAD");
  await page.screenshot({
    path: "test-results/desktop-person-filters.png",
    fullPage: true,
  });
  await apply(page);
  await expect(page.locator("#personList .person-row")).toHaveCount(1);
  await expect(page.locator('[data-node][data-kind="person"]')).toHaveCount(1);
  await page.locator('[data-action="export"]').click();
  const [zipDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await zipDownload.path());
  await page.locator("[data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "filters.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#personFilterBar")).not.toBeVisible();
  await openFilters(page);
  await page.locator("#savedPersonFilter").selectOption(viewId);
  await expect(page.locator("[data-filter-currency]")).toHaveValue("CAD");
  await expect(page.locator("[data-filter-value]")).toHaveValue("200000");
  await expect(page.locator("[data-filter-result-count]")).toHaveText("1 / 99");
  await page.locator('[data-filter-command="delete"]').click();
  await expect(
    page.locator(`#savedPersonFilter option[value="${viewId}"]`),
  ).toHaveCount(0);
  await apply(page);
  await page
    .locator('#personFilterBar [data-action="clear-person-filters"]')
    .click();
  await expect(page.locator("#personList .person-row")).toHaveCount(99);
});

test("validates age ranges and supports country, source and arbitrary profile conditions", async ({
  page,
}) => {
  await openFilters(page);
  const age = await addRule(page, "age");
  await age.locator("[data-filter-operator]").selectOption("between");
  await age.locator("[data-filter-value]").fill("60");
  await age.locator("[data-filter-max]").fill("18");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await age.locator("[data-filter-value]").fill("18");
  await age.locator("[data-filter-max]").fill("60");
  const country = await addRule(page, "visited");
  await country.locator("[data-filter-value]").fill("France");
  await page.locator('[data-preset="documents"]').click();
  await page.locator('[data-preset="identityDocuments"]').click();
  await expect(page.locator("#filterEditorError")).toBeEmpty();
  await expect(page.locator("#personFilterResults")).toContainText(
    "Jesse Ward",
  );
  await page.locator('[data-filter-command="clear"]').click();
  const section = await addRule(page, "section");
  await section.locator("[data-filter-value]").selectOption("political");
  await expect(page.locator("[data-filter-result-count]")).toHaveText("1 / 99");
  await expect(page.locator("#personFilterResults")).toContainText(
    "Jordan Roe",
  );
  await apply(page);
  await expect(page.locator("#personList .person-row")).toHaveCount(1);
});

test("filter controls and results fit a narrow phone in EN, UA and RU", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const language of ["en", "uk", "ru"]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    await openFilters(page);
    await page.locator('[data-preset="adopted"]').click();
    const age = await addRule(page, "age");
    await age.locator("[data-filter-operator]").selectOption("between");
    await age.locator("[data-filter-value]").fill("0");
    await age.locator("[data-filter-max]").fill("100");
    for (const control of await page
      .locator("[data-filter-value], [data-filter-max]")
      .all())
      expect(
        await control.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
    for (const selector of [
      "#modal",
      "#modal .modal-body",
      "#personFilterEditor",
    ])
      expect(
        await page
          .locator(selector)
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (language === "uk") {
      await page.locator("[data-filter-rule]").first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: "test-results/mobile-person-filters.png",
        fullPage: true,
      });
    }
    await apply(page);
    await expect(page.locator('[data-node="p6"]')).toHaveCount(1);
    await page
      .locator('#personFilterBar [data-action="clear-person-filters"]')
      .click();
  }
  expect(errors).toEqual([]);
});
