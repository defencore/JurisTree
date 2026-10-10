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
