import { test, expect } from "@playwright/test";

async function camera(page) {
  return page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src,
      { state } = await import(new URL("core/state.js", base));
    const graph = document.querySelector("#graph").getBoundingClientRect();
    return {
      ...state.camera,
      center: {
        x: (graph.width / 2 - state.camera.x) / state.camera.z,
        y: (graph.height / 2 - state.camera.y) / state.camera.z,
      },
      scroll: document.querySelector("#main").scrollTop,
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.goto("./");
  await page.locator("#startDemo").click();
  await expect(page.locator("#graph")).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
});

test("browser zoom and viewport reflow preserve the chosen map scale and center", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src,
      { state } = await import(new URL("core/state.js", base)),
      { applyCamera } = await import(new URL("graph/camera.js", base));
    state.camera = { x: -320, y: -210, z: 0.85 };
    applyCamera();
  });
  const before = await camera(page);
  // Page zoom changes the CSS viewport. Test both directions across layout breakpoints.
  for (const zoom of [1.25, 1.5, 2, 0.8, 1]) {
    await page.setViewportSize({
      width: Math.round(1800 / zoom),
      height: Math.round(1000 / zoom),
    });
    await expect.poll(async () => (await camera(page)).z).toBe(before.z);
    await expect
      .poll(async () =>
        Math.abs((await camera(page)).center.x - before.center.x),
      )
      .toBeLessThan(0.1);
    await expect
      .poll(async () =>
        Math.abs((await camera(page)).center.y - before.center.y),
      )
      .toBeLessThan(0.1);
    expect((await camera(page)).scroll).toBe(before.scroll);
  }
  await page.setViewportSize({ width: 1800, height: 700 });
  await expect
    .poll(async () => Math.abs((await camera(page)).center.y - before.center.y))
    .toBeLessThan(0.1);
  for (let toggle = 0; toggle < 2; toggle++) {
    await page.locator('[data-action="mobile-tools"]').click();
    const current = await camera(page);
    expect(current.z).toBe(before.z);
    expect(current.center.x).toBeCloseTo(before.center.x, 4);
    expect(current.center.y).toBeCloseTo(before.center.y, 4);
  }
});

test("browser zoom shortcuts never also zoom or fit the focused map", async ({
  page,
}) => {
  const graph = page.locator("#graph");
  await graph.focus();
  const before = await camera(page);
  for (const modifier of ["ctrlKey", "metaKey"]) {
    for (const key of ["+", "=", "-", "0"]) {
      const prevented = await graph.evaluate(
        (element, { key, modifier }) => {
          const event = new KeyboardEvent("keydown", {
            key,
            [modifier]: true,
            bubbles: true,
            cancelable: true,
          });
          element.dispatchEvent(event);
          return event.defaultPrevented;
        },
        { key, modifier },
      );
      expect(prevented).toBe(false);
      expect(await camera(page)).toEqual(before);
    }
  }
  await graph.press("+");
  expect((await camera(page)).z).toBeCloseTo(before.z * 1.2, 8);
});

for (const language of ["en", "uk", "ru"]) {
  test(`desktop controls are compact and all main actions fit at 80–200% page zoom in ${language}`, async ({
    page,
  }) => {
    await page.locator(".topbar [data-language]").selectOption(language);
    await expect(page.locator(".graph-layout-settings")).not.toHaveAttribute(
      "open",
      "",
    );
    const add = page.locator('.view-actions [data-action="add-person"]');
    expect((await add.boundingBox()).height).toBeLessThanOrEqual(34);
    for (const zoom of [0.8, 1, 1.25, 1.5, 2]) {
      await page.setViewportSize({
        width: Math.round(1800 / zoom),
        height: Math.round(1000 / zoom),
      });
      const dimensions = await page.evaluate(() => {
        const rect = (selector) => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            height: r.height,
          };
        };
        return {
          width: innerWidth,
          height: innerHeight,
          overflow: document.documentElement.scrollWidth - innerWidth,
          graph: rect("#graph"),
          header: rect(".topbar"),
          preferences: rect(".header-preferences"),
          search: rect(".global-search-bar"),
          filters: rect(".person-filter-toggle"),
        };
      });
      expect(dimensions.overflow).toBeLessThanOrEqual(1);
      expect(dimensions.preferences.right).toBeLessThanOrEqual(
        dimensions.width + 1,
      );
      expect(dimensions.preferences.top).toBeGreaterThanOrEqual(
        dimensions.header.top,
      );
      expect(dimensions.preferences.bottom).toBeLessThanOrEqual(
        dimensions.header.bottom + 1,
      );
      expect(dimensions.filters.bottom).toBeLessThanOrEqual(
        dimensions.search.bottom + 1,
      );
      expect(dimensions.graph.height).toBeGreaterThan(180);
      expect(dimensions.graph.bottom).toBeLessThanOrEqual(
        dimensions.height + 1,
      );
      if (zoom === 1.5) {
        await page.locator('[data-action="mobile-tools"]').click();
        await expect(page.locator("#graphToolbar")).toBeVisible();
        const options = await page.locator("#mapSettings").boundingBox();
        expect(options.height).toBeLessThanOrEqual(dimensions.height * 0.31);
        await page.locator('[data-action="mobile-tools"]').click();
      }
    }
    await page.locator('.view-actions [data-action="add-person"]').click();
    await expect(page.locator("#modal")).toBeVisible();
  });
}

test("phone controls retain touch targets after compact desktop reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const selector of [
    '.view-actions [data-action="add-person"]',
    '[data-action="mobile-tools"]',
    '.graph-tools [data-action="zoom-in"]',
  ]) {
    await expect(page.locator(selector)).toBeVisible();
    expect(
      (await page.locator(selector).boundingBox()).height,
    ).toBeGreaterThanOrEqual(44);
  }
});
