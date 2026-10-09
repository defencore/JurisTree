import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").tap();
  await expect(page.locator("#appShell")).toBeVisible();
});

async function touch(session, type, points) {
  await session.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map(([x, y], id) => ({ x, y, id })),
  });
}
async function drag(session, start, end, cancel = false) {
  await touch(session, "touchStart", [start]);
  await touch(session, "touchMove", [end]);
  await touch(session, cancel ? "touchCancel" : "touchEnd", []);
}

test("native touch opens a relationship once while dragging its label still pans the map", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base).href);
    const { render } = await import(new URL("ui/render.js", base).href);
    const { fit } = await import(new URL("graph/camera.js", base).href);
    state.graphFocus = { people: ["p1", "p2"], relations: ["r1"] };
    state.selected = null;
    render();
    fit();
  });
  const label = page.locator('.edge[data-edge="r1"] rect'),
    box = await label.boundingBox(),
    scene = page.locator("#scene"),
    transform = await scene.getAttribute("transform"),
    session = await page.context().newCDPSession(page);
  await drag(
    session,
    [box.x + box.width / 2, box.y + box.height / 2],
    [box.x + box.width / 2 + 24, box.y + box.height / 2 + 24],
  );
  await expect(scene).not.toHaveAttribute("transform", transform);
  await expect(page.locator("#inspector")).not.toHaveClass(/open/);
  await label.tap();
  await expect(page.locator("#inspector")).toHaveClass(/open/);
  await expect(
    page.locator('#inspector [data-edit-relation="r1"]'),
  ).toBeVisible();
  await expect(page.locator("#modal")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile map gives space to the graph and supports real pan, pinch and tap gestures", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const graph = page.locator("#graph"),
    scene = page.locator("#scene");
  const box = await graph.boundingBox();
  expect(box.height).toBeGreaterThan(844 * 0.55);
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThanOrEqual(80);
  await expect(page.locator("#mapSettings")).not.toBeVisible();
  const node = page.locator('.node[data-node="p5"]');
  const original = await node.getAttribute("transform");
  const transform = await scene.getAttribute("transform");
  const session = await page.context().newCDPSession(page);
  await drag(session, [box.x + 20, box.y + 100], [box.x + 100, box.y + 155]);
  await expect(scene).not.toHaveAttribute("transform", transform);
  await expect(node).toHaveAttribute("transform", original);
  const beforeZoom = parseInt(await page.locator("#zoomLabel").textContent());
  await touch(session, "touchStart", [
    [130, box.y + 180],
    [230, box.y + 180],
  ]);
  await touch(session, "touchMove", [
    [80, box.y + 200],
    [280, box.y + 200],
  ]);
  await touch(session, "touchEnd", []);
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThan(beforeZoom);
  await expect(node).toHaveAttribute("transform", original);
  await page.locator('[data-action="focus-person"]').tap();
  const card = await node.locator(".card").boundingBox();
  await page.touchscreen.tap(card.x + 40, card.y + 35);
  await expect(page.locator("#inspector")).toHaveClass(/open/);
  await expect(page.locator("#inspector h2")).toHaveText("Jesse Ward");
  const sheet = await page.locator("#inspector").boundingBox();
  expect(sheet.height).toBeLessThanOrEqual(844 * 0.61);
  await page.locator('[data-action="close-panel"]').tap();
  await page.locator('[data-action="mobile-tools"]').tap();
  await expect(page.locator("#mapSettings")).toBeVisible();
  await page.locator('[data-action="mobile-tools"]').tap();
  await page.screenshot({ path: "test-results/mobile-map-touch.png" });
  await page.locator('[data-action="fit"]').tap();
  await page.locator('[data-action="menu"]').tap();
  await page.locator('#personList [data-person="p8"]').tap();
  await expect(page.locator("#inspector h2")).toHaveText("Casey Roe (Ward)");
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThanOrEqual(80);
  expect(errors).toEqual([]);
});

test("cancelled touch rearranging restores the card", async ({ page }) => {
  const node = page.locator('.node[data-node="p5"]');
  const original = await node.getAttribute("transform");
  const session = await page.context().newCDPSession(page);
  await page.locator('[data-action="touch-move"]').tap();
  await expect(page.locator('[data-action="touch-move"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const card = await node.locator(".card").boundingBox();
  await drag(
    session,
    [card.x + 40, card.y + 35],
    [card.x + 90, card.y + 85],
    true,
  );
  await expect(node).toHaveAttribute("transform", original);
});

test("touch rearranging commits one undoable movement", async ({ page }) => {
  const node = page.locator('.node[data-node="p5"]');
  const original = await node.getAttribute("transform");
  const session = await page.context().newCDPSession(page);
  await page.locator('[data-action="touch-move"]').tap();
  const card = await node.locator(".card").boundingBox();
  await drag(session, [card.x + 40, card.y + 35], [card.x + 90, card.y + 85]);
  await expect(node).not.toHaveAttribute("transform", original);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { state } = await import(
          new URL(
            "core/state.js",
            document.querySelector('script[type="module"]').src,
          ).href
        );
        return state.history.length;
      }),
    )
    .toBe(1);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  // Headless Linux omits a click after this synthetic drag; exercise the history control with a pointer click.
  await page.locator('[data-action="undo"]').click();
  await expect(node).toHaveAttribute("transform", original);
});

test("mobile history controls respond to native touch taps", async ({
  page,
}) => {
  const originalCount = await page.locator('.node[data-kind="person"]').count();
  await page.locator('#viewActions [data-action="add-person"]').tap();
  await page.locator('#modal [name="name"]').fill("Fictional Touch Doe");
  await page.locator('#modal button[type="submit"]').tap();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(
    originalCount + 1,
  );
  await page.locator('[data-action="undo"]').tap();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(
    originalCount,
  );
  await page.locator('[data-action="redo"]').tap();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(
    originalCount + 1,
  );
});

test("phone users can open the autobiography and edit optional document details", async ({
  page,
}) => {
  await page.locator('.graph-biography[data-biography="p5"]').tap();
  await expect(page.locator(".biography")).toContainText("PA7314062");
  await page.locator("[data-close]").first().tap();
  const card = await page.locator('.node[data-node="p5"] .card').boundingBox();
  await page.touchscreen.tap(card.x + 40, card.y + 35);
  await page.locator('#inspector [data-edit-person="p5"]').first().tap();
  await expect(page.locator("[data-profile-editor]")).toBeVisible();
  const identity = page
    .locator(".profile-editor-section")
    .filter({ has: page.locator('[data-add-record="identity"]') });
  await identity.locator("summary").first().tap();
  await identity.getByText("Holder details", { exact: true }).tap();
  await identity.locator('[name="identity-holderNameLatin"]').fill("JESSE DOE");
  await identity.locator('[name="identity-sex"]').selectOption("f");
  await expect(identity.locator('[name="identity-holderNameLatin"]')).toHaveCSS(
    "font-size",
    "16px",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const body = page.locator("#modal .modal-body");
  await body.evaluate((el) => {
    el.scrollTop = el.querySelector('[name="identity-number"]').offsetTop - 100;
  });
  await page.screenshot({ path: "test-results/mobile-passport-editor.png" });
  await page.locator('#modal button[type="submit"]').tap();
  await expect(page.locator("#modal")).not.toBeVisible();
  await page.locator('#inspector [data-biography="p5"]').tap();
  await expect(page.locator(".biography")).toContainText("JESSE DOE");
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 430, height: 932 },
  { width: 740, height: 390 },
]) {
  test(`mobile layout fits ${viewport.width} by ${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const language of ["en", "uk", "ru"]) {
      await page.locator("#appShell [data-language]").selectOption(language);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (await page.locator("#graph").boundingBox()).height,
      ).toBeGreaterThanOrEqual(180);
      await expect(page.locator('[data-action="zoom-in"]')).toBeVisible();
    }
    await page.screenshot({
      path: `test-results/mobile-map-${viewport.width}.png`,
    });
  });
}
