import { test, expect } from "@playwright/test";
import { openMapOptions, openWorkingPeople } from "./helpers/map-options.js";

async function snapshot(page) {
  return page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base));
    const graph = document.querySelector("#graph").getBoundingClientRect();
    return {
      selected: state.selected,
      selection: [...state.multiSelection],
      editing: state.diagramEditing,
      camera: { ...state.camera },
      center: [
        (graph.width / 2 - state.camera.x) / state.camera.z,
        (graph.height / 2 - state.camera.y) / state.camera.z,
      ],
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.goto("./");
  await page.locator("#startDemo").click();
});

test("secondary map panels preserve the viewport, selection and camera; Escape closes only the panel", async ({
  page,
}) => {
  const graph = await page.locator("#graph").boundingBox();
  expect(graph.height).toBeGreaterThan(800);
  const before = await snapshot(page);
  await expect(page.locator("#graphToolbar")).not.toBeVisible();
  await openMapOptions(page);
  await page.locator(".map-overview summary").click();
  await expect(page.locator("#statusBoard")).toBeVisible();
  expect(await page.locator("#graph").boundingBox()).toEqual(graph);
  expect(await snapshot(page)).toEqual(before);
  await page.keyboard.press("Escape");
  await expect(page.locator("#mapSettings")).not.toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await openWorkingPeople(page);
  expect(await page.locator("#graph").boundingBox()).toEqual(graph);
  await page.locator("#viewTitle").click();
  await expect(page.locator("#favoriteRail")).not.toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await openMapOptions(page);
  await page.keyboard.press("Control+k");
  await expect(page.locator("#globalSearch")).toBeFocused();
  await expect(page.locator("#mapSettings")).not.toBeVisible();
  expect(await snapshot(page)).toEqual(before);
});

test("collapsing and restoring desktop side panels preserves the viewed world center", async ({
  page,
}) => {
  const before = await snapshot(page),
    initial = await page.locator("#graph").boundingBox();
  for (const action of ["menu", "close-panel", "toggle-inspector", "menu"]) {
    await page.locator(`[data-action="${action}"]`).click();
    const current = await snapshot(page);
    expect(current.center[0]).toBeCloseTo(before.center[0], 5);
    expect(current.center[1]).toBeCloseTo(before.center[1], 5);
    expect(current.camera.z).toBe(before.camera.z);
    expect(current.selected).toEqual(before.selected);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (action === "close-panel") {
      await expect(page.locator("#inspector")).not.toBeVisible();
      expect(
        (await page.locator("#graph").boundingBox()).width,
      ).toBeGreaterThan(initial.width + 400);
    }
  }
  expect(await page.locator("#graph").boundingBox()).toEqual(initial);
});

test("placement controls dock beside the map and can minimize without ending editing", async ({
  page,
}) => {
  await page.locator('[data-action="diagram-panel"]').click();
  const graph = await page.locator("#graph").boundingBox(),
    tools = await page.locator("#diagramTools").boundingBox();
  expect(tools.x).toBeGreaterThanOrEqual(graph.x + graph.width);
  const before = await snapshot(page);
  await page.locator('[data-action="minimize-diagram"]').click();
  await expect(page.locator("#diagramTools")).not.toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  expect(await page.locator("#graph").boundingBox()).toEqual(graph);
  await page.locator('[data-action="diagram-panel"]').click();
  await expect(page.locator("#diagramTools")).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await page.locator('#diagramTools [data-action="diagram-tools"]').click();
  expect((await snapshot(page)).editing).toBe(false);
});

test("expanding the map keeps its camera and opens details and navigation as overlays", async ({
  page,
}) => {
  const before = await snapshot(page),
    initial = await page.locator("#graph").boundingBox();
  const focus = page.locator('[data-action="toggle-map-focus"]');
  await focus.click();
  await expect(focus).toHaveAttribute("aria-pressed", "true");
  const expanded = await page.locator("#graph").boundingBox();
  expect(expanded.width).toBe(1800);
  expect(expanded.height).toBeGreaterThan(1000 * 0.85);
  const current = await snapshot(page);
  expect(current.center[0]).toBeCloseTo(before.center[0], 5);
  expect(current.center[1]).toBeCloseTo(before.center[1], 5);
  expect(current.camera.z).toBe(before.camera.z);
  expect(current.selected).toEqual(before.selected);
  await expect(page.locator("#inspector")).not.toBeVisible();
  await page.locator('[data-action="toggle-inspector"]').click();
  await expect(page.locator("#inspector")).toBeVisible();
  expect(await page.locator("#graph").boundingBox()).toEqual(expanded);
  await page.locator('[data-action="menu"]').click();
  await expect(page.locator("#sidebar")).toBeVisible();
  await expect(page.locator("#inspector")).not.toBeVisible();
  expect(await page.locator("#graph").boundingBox()).toEqual(expanded);
  await page.locator('[data-action="menu"]').click();
  await focus.click();
  expect(await page.locator("#graph").boundingBox()).toEqual(initial);
  const restored = await snapshot(page);
  expect(restored.center[0]).toBeCloseTo(before.center[0], 5);
  expect(restored.center[1]).toBeCloseTo(before.center[1], 5);
  expect(restored.camera.z).toBe(before.camera.z);
  expect(restored.selected).toEqual(before.selected);
  expect(restored.selection).toEqual(before.selection);
  expect(restored.editing).toBe(before.editing);
});

test("map focus restores previously collapsed panels and still offers complete navigation", async ({
  page,
}) => {
  await page.locator('[data-action="menu"]').click();
  await page.locator('[data-action="close-panel"]').click();
  const initial = await page.locator("#graph").boundingBox();
  await page.locator('[data-action="toggle-map-focus"]').click();
  await page.locator('[data-action="menu"]').click();
  await expect(page.locator("#sidebar .nav-text").first()).toBeVisible();
  await expect(page.locator("#peopleSearch")).toBeVisible();
  await page.locator('[data-action="toggle-map-focus"]').click();
  await expect(page.locator("body")).toHaveClass(/sidebar-collapsed/);
  await expect(page.locator("#inspector")).not.toBeVisible();
  expect(await page.locator("#graph").boundingBox()).toEqual(initial);
});

test("selection details float above the map without consuming another toolbar row", async ({
  page,
}) => {
  const initial = await page.locator("#graph").boundingBox();
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src,
      { state } = await import(new URL("core/state.js", base)),
      { renderGraph } = await import(new URL("graph/render.js", base));
    state.multiSelection = new Set(["p5", "p6"]);
    renderGraph();
  });
  await expect(
    page.locator('#graphContext [data-action="link-selected"]'),
  ).toBeVisible();
  expect(await page.locator("#graph").boundingBox()).toEqual(initial);
  expect(
    await page.locator("#graphContext b").evaluate((label) => {
      const rect = label.getBoundingClientRect();
      return !!document
        .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        ?.closest("#graph");
    }),
  ).toBe(true);
  await page.locator('#graphContext [data-action="link-selected"]').click();
  await expect(page.locator('#modal [name="from"]')).toHaveValue("p5");
  await expect(page.locator('#modal [name="to"]')).toHaveValue("p6");
});

test("search keeps its text, keyboard focus and results when it moves between header and mobile row", async ({
  page,
}) => {
  const input = page.locator("#globalSearch");
  await input.fill("Jesse Ward");
  await expect(page.locator("#headerSearchSlot #globalSearch")).toBeVisible();
  for (const width of [1100, 390, 1800]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("Jesse Ward");
    await expect(page.locator("#globalSearchBar")).toHaveCount(1);
    const results = page.locator("#globalSearchResults");
    await expect(results).toBeVisible();
    const box = await results.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
  await page.keyboard.press("Enter");
  await expect(page.locator("#globalSearchResults")).not.toBeVisible();
  await expect(page.locator("#inspector .profile h2")).toHaveText("Jesse Ward");
});
