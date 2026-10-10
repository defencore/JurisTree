import { openMapOptions, openMapLayout } from "./helpers/map-options.js";
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

async function openViews(page) {
  if (
    !(await page
      .locator('#graphToolbar [data-action="saved-map-views"]')
      .isVisible())
  )
    await page
      .locator('[popovertarget="mapSettings"]:not([popovertargetaction])')
      .click();
  await openMapOptions(page);
  await page.locator('#graphToolbar [data-action="saved-map-views"]').click();
}
async function saveView(page, name) {
  await openViews(page);
  await page.locator('[name="map-view-name"]').fill(name);
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).toBeHidden();
}
const positions = (page) =>
  page
    .locator("#graph .node")
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((el) => [el.dataset.node, el.getAttribute("transform")]),
      ),
    );
const camera = (page) =>
  page.locator("#scene").evaluate((el) => {
    const { a, e, f } = el.transform.baseVal.consolidate().matrix;
    return { x: e, y: f, z: a };
  });
async function expectCenter(page, expected) {
  const actual = await center(page);
  for (const key of ["x", "y", "z"])
    expect(actual[key]).toBeCloseTo(expected[key], 4);
}
async function center(page) {
  const current = await camera(page),
    box = await page.locator("#graph").boundingBox();
  return {
    x: (box.width / 2 - current.x) / current.z,
    y: (box.height / 2 - current.y) / current.z,
    z: current.z,
  };
}

test("saved arrangement restores manual moves, zoom and filters after automatic layout, survives ZIP and keeps edited profiles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#personList [data-person="p5"]').click();
  const card = page.locator('.node[data-node="p5"] .card');
  const box = await card.boundingBox();
  await page.mouse.move(box.x + 140, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 230, box.y + 145, { steps: 5 });
  await page.mouse.up();
  await page.locator('[data-action="zoom-out"]').click();
  await openMapOptions(page);
  await page.locator('#graphToolbar [data-action="toggle-docs"]').click();
  await page.locator('[data-action="graph-filters"]').click();
  await page.locator('[name="graph-types"][value="acquaintance"]').uncheck();
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('[data-action="zoom-in"]').click();
  const original = await positions(page),
    originalCenter = await center(page);
  await saveView(page, "Doe branch");
  await openMapLayout(page);
  await page.locator("#graphLayout").selectOption("circle");
  await page.locator('.layout-controls [data-action="layout"]').click();
  await expect.poll(() => positions(page)).not.toEqual(original);
  await page.locator('#personList [data-person="p5"]').click();
  await page.locator('#inspector [data-edit-person="p5"]').first().click();
  await page.locator('[name="name"]').fill("Jesse Ward Updated");
  await page.locator('#modal button[type="submit"]').click();
  await openMapOptions(page);
  await page.locator('#graphToolbar [data-action="toggle-docs"]').click();
  await openViews(page);
  await page.locator("[data-restore-view]").click();
  await expect.poll(() => positions(page)).toEqual(original);
  await expectCenter(page, originalCenter);
  await expect(page.locator("#graphLayout")).toHaveValue("generations");
  await expect(page.locator("#docsToggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator('.node[data-node="p5"]')).toHaveAttribute(
    "aria-label",
    /^Jesse Ward Updated ·/,
  );
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("#modal [data-close]").first().click();
  await openViews(page);
  await page.locator("[data-manage-view]").click();
  await page.locator("[data-delete-map-view]").click();
  await expect(page.locator("[data-restore-view]")).toHaveCount(0);
  await page.locator("#modal [data-close]").first().click();
  await page
    .locator("#importInput")
    .setInputFiles({ name: "views.zip", mimeType: "application/zip", buffer });
  await page.locator('#modal button[type="submit"]').click();
  await openViews(page);
  await expect(page.locator("[data-restore-view]")).toContainText("Doe branch");
  await page.locator("[data-restore-view]").click();
  await expect.poll(() => positions(page)).toEqual(original);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await openViews(page);
  await page.locator("[data-restore-view]").click();
  await expect.poll(() => positions(page)).toEqual(original);
  await expectCenter(page, originalCenter);
});

test("multiple views can be renamed, replaced and deleted with undo, while duplicate names are rejected", async ({
  page,
}) => {
  await saveView(page, "Whole tree");
  const first = await positions(page);
  await openMapLayout(page);
  await page.locator("#graphLayout").selectOption("circle");
  await page.locator('.layout-controls [data-action="layout"]').click();
  await expect.poll(() => positions(page)).not.toEqual(first);
  const second = await positions(page);
  await saveView(page, "Circle");
  await openViews(page);
  await page.locator('[name="map-view-name"]').fill("whole TREE");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await page
    .locator(".saved-map-view")
    .filter({ hasText: "Whole tree" })
    .locator("[data-manage-view]")
    .click();
  await page.locator('[name="map-view-name"]').fill("Working view");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("[data-restore-view]")).toHaveCount(2);
  await page
    .locator(".saved-map-view")
    .filter({ hasText: "Working view" })
    .locator("[data-restore-view]")
    .click();
  await expect.poll(() => positions(page)).toEqual(first);
  await page.locator('[data-action="undo"]').click();
  await expect.poll(() => positions(page)).toEqual(second);
  await openViews(page);
  await page
    .locator(".saved-map-view")
    .filter({ hasText: "Working view" })
    .locator("[data-manage-view]")
    .click();
  await page.locator("[data-update-map-view]").click();
  await page
    .locator(".saved-map-view")
    .filter({ hasText: "Working view" })
    .locator("[data-restore-view]")
    .click();
  await expect.poll(() => positions(page)).toEqual(second);
  await openViews(page);
  await page
    .locator(".saved-map-view")
    .filter({ hasText: "Circle" })
    .locator("[data-manage-view]")
    .click();
  await page.locator("[data-delete-map-view]").click();
  await expect(page.locator("[data-restore-view]")).toHaveCount(1);
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-action="undo"]').click();
  await openViews(page);
  await expect(page.locator("[data-restore-view]")).toHaveCount(2);
});

for (const language of ["en", "uk", "ru"]) {
  test(`saved views fit a narrow phone and restore the same center after changing screen size in ${language}`, async ({
    page,
  }) => {
    await page.locator('#personList [data-person="p6"]').click();
    await page.locator(".topbar [data-language]").selectOption(language);
    const original = await positions(page);
    const originalCenter = await center(page);
    await saveView(page, "Family branch");
    await page.setViewportSize({ width: 320, height: 740 });
    await openViews(page);
    const modal = page.locator("#modal");
    expect(
      await modal.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    const box = await modal.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(321);
    expect(
      await page
        .locator('#modalFooter button[type="submit"]')
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/saved-view-dialog-${language}-phone.png`,
    });
    await page.locator("[data-manage-view]").click();
    expect(
      await modal.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.locator("#modal [data-close]").first().click();
    await page.locator("[data-restore-view]").click();
    await expect.poll(() => positions(page)).toEqual(original);
    await expect(page.locator("#inspector")).not.toHaveClass(/open/);
    await expect(page.locator("#mapSettings")).not.toBeVisible();
    const restoredCenter = await center(page);
    for (const key of ["x", "y", "z"])
      expect(restoredCenter[key]).toBeCloseTo(originalCenter[key], 3);
    await page.screenshot({
      path: `test-results/saved-views-${language}-phone.png`,
    });
  });
}

test("saved views restore a family group, collapsed cards and analytical person filters", async ({
  page,
}) => {
  await page.locator('[data-group-filter="g1"]').click();
  await page.locator(".person-filter-toggle").click();
  await page.locator('[data-preset="living"]').click();
  await page.locator('#modal button[type="submit"]').click();
  const filteredCount = await page.locator("#personList .person-row").count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(7);
  await page.locator('[data-edit-group="g1"]').click();
  await page.locator('#modal [data-toggle-group="g1"]').click();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(0);
  await expect(page.locator('.node[data-node="g1"]')).toHaveCount(1);
  await saveView(page, "Living Doe family");
  await page.locator('[data-group-filter=""]').click();
  await page
    .locator('#personFilterBar [data-action="clear-person-filters"]')
    .click();
  await page.locator('[data-edit-group="g1"]').click();
  await page.locator('#modal [data-toggle-group="g1"]').click();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(99);
  await openViews(page);
  await page.locator("[data-restore-view]").click();
  await expect(page.locator('[data-group-filter="g1"]')).toHaveClass(/active/);
  await expect(page.locator("#personFilterBar")).toBeVisible();
  await expect(page.locator("#personList .person-row")).toHaveCount(
    filteredCount,
  );
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(0);
  await expect(page.locator('.node[data-node="g1"]')).toHaveCount(1);
});
