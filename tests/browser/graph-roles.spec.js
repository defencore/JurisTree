import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const card = (page, id) => page.locator(`#graph .node[data-node="${id}"]`);
const badge = (page, id) => card(page, id).locator(".person-card-role text");

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
});

test("selection labels the whole family in every language and exports a neutral diagram", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [id, label, group] of [
    ["p1", "Grandfather", "ancestors"],
    ["p2", "Grandmother", "ancestors"],
    ["p3", "Mother", "ancestors"],
    ["p4", "Step-parent", "affinity"],
    ["p6", "Brother", "siblings"],
    ["p8", "Half-sister", "siblings"],
  ]) {
    await expect(badge(page, id)).toHaveText(label);
    await expect(card(page, id)).toHaveAttribute("data-kinship-group", group);
  }
  await expect(card(page, "p10")).not.toHaveAttribute("data-kinship-role");
  await expect(card(page, "p6")).toHaveAttribute("aria-label", /adoption/i);
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
    for (const [i, id] of [
      "grace",
      "lucy",
      "olivia",
      "emily",
      "nathan",
    ].entries())
      await expect(badge(page, id)).toHaveText(labels[i]);
  }
  await page.locator(".topbar [data-language]").selectOption("en");
  await page.locator('#personList [data-person="p6"]').click();
  await expect(badge(page, "p8")).toHaveText("Wife");
  await page.locator('#personList [data-person="p8"]').click();
  await expect(badge(page, "p6")).toHaveText("Husband");
  await page.locator('#personList [data-person="p1"]').click();
  await expect(badge(page, "p3")).toHaveText("Daughter");
  await expect(badge(page, "p5")).toHaveText("Granddaughter");
  await page.locator('#favoriteRail [data-fast-person="p5"]').click();
  await page.locator('[data-action="zoom-out"]').click();
  await page.locator('[data-action="zoom-out"]').click();
  await page.locator("#graphLegend summary").click();
  await expect(page.locator("[data-legend-role]")).toHaveCount(7);
  await expect(page.locator(".graph-role-legend")).toContainText("Jesse Ward");
  const keyBox = await page.locator("#graphLegend").boundingBox();
  const canvasBox = await page.locator("#canvasWrap").boundingBox();
  expect(keyBox.y).toBeGreaterThanOrEqual(canvasBox.y);
  expect(keyBox.y + keyBox.height).toBeLessThan(canvasBox.y + canvasBox.height);
  const contentBox = await page.locator("#legendContent").boundingBox();
  expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(
    keyBox.y + keyBox.height,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#favoriteRail [data-fast-person="p5"]').click();
  await page.locator('[data-action="zoom-out"]').click();
  await page.locator("#graphLegend summary").click();
  await page.screenshot({
    path: "test-results/desktop-family-roles.png",
    fullPage: true,
  });
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="svg"]').click(),
  ]);
  const svg = await readFile(await download.path(), "utf8");
  expect(svg).toContain("Jesse Ward");
  expect(svg).not.toContain("data-kinship-role");
  expect(svg).not.toContain("person-card-role");
  expect(errors).toEqual([]);
});

test("adding and undoing a relationship refreshes roles without reloading", async ({
  page,
}) => {
  await expect(card(page, "p10")).not.toHaveAttribute("data-kinship-role");
  await page.locator('[data-action="add-relation"]').click();
  await page.locator('#modal [name="from"]').selectOption("p5");
  await page.locator('#modal [name="to"]').selectOption("p10");
  await page.locator('#modal [name="type"]').selectOption("spouse");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await expect(page.locator("#graph .person-card-role")).toHaveCount(0);
  await page.locator('#favoriteRail [data-fast-person="p5"]').click();
  await expect(badge(page, "p10")).toHaveText("Spouse");
  await page.locator('[data-action="undo"]').click();
  await expect(card(page, "p10")).not.toHaveAttribute("data-kinship-role");
  await page.locator('[data-action="redo"]').click();
  await expect(badge(page, "p10")).toHaveText("Spouse");
  await page.locator(".person-filter-toggle").click();
  await page.locator('[data-preset="living"]').click();
  await page.locator('#modal button[type="submit"]').click();
  await expect(card(page, "p1")).toHaveCount(0);
  await expect(badge(page, "nathan")).toHaveText("Fifth cousin");
  await expect(badge(page, "p10")).toHaveText("Spouse");
});

test("small phones keep long family badges inside their cards and expose the color key", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.locator('[data-action="focus-person"]').click();
  for (const language of ["en", "uk", "ru"]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    const overflow = await page.locator(".person-card-role").evaluateAll(
      (badges) =>
        badges.filter((badge) => {
          const background = badge.querySelector("rect").getBBox();
          const text = badge.querySelector("text").getBBox();
          return (
            text.x < background.x ||
            text.x + text.width > background.x + background.width + 1 ||
            text.y + text.height > background.y + background.height + 1
          );
        }).length,
    );
    expect(overflow).toBe(0);
    expect(
      await page
        .locator('.node[data-node="mia"] .person-card-role tspan')
        .count(),
    ).toBe(2);
    await page.locator("#graphLegend summary").click();
    await expect(page.locator(".graph-role-legend")).toBeVisible();
    await expect(page.locator("[data-legend-role]")).toHaveCount(7);
    expect(
      await page
        .locator("#legendContent")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/phone-family-key-${language}.png`,
      fullPage: true,
    });
    await page.locator("#graphLegend summary").click();
  }
  await page.screenshot({
    path: "test-results/phone-family-roles.png",
    fullPage: true,
  });
});
