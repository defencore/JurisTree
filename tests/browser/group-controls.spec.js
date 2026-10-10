import { test, expect } from "@playwright/test";
const snapshot = (page) =>
  page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return { project: state.project, history: state.history.length };
  });
const coords = (items) => items.map(({ id, x, y }) => ({ id, x, y }));
async function openGroups(page) {
  if (
    !(await page
      .locator('#graphToolbar [data-action="group-visibility"]')
      .isVisible())
  )
    await page.locator('[data-action="mobile-tools"]').click();
  await page.locator('#graphToolbar [data-action="group-visibility"]').click();
}
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

for (const [language, width] of [
  ["en", 1280],
  ["uk", 390],
  ["ru", 320],
]) {
  test.describe(language + " group controls", () => {
    test.use({
      viewport: { width, height: 900 },
      hasTouch: width < 760,
      isMobile: width < 760,
    });
    test("bulk and selective group expansion preserves positions, supports undo and persists in the draft", async ({
      page,
    }) => {
      await page.locator("#appShell [data-language]").selectOption(language);
      const before = await snapshot(page);
      await openGroups(page);
      await page.locator('[data-action="collapse-all-groups"]').click();
      expect(
        (await snapshot(page)).project.groups.every((g) => g.collapsed),
      ).toBe(true);
      expect(coords((await snapshot(page)).project.people)).toEqual(
        coords(before.project.people),
      );
      expect((await snapshot(page)).history).toBe(before.history + 1);
      await expect(
        page.locator('#graph .node[data-kind="group"]'),
      ).not.toHaveCount(0);
      const first = before.project.groups[0];
      await page.locator("#groupVisibilitySearch").fill(first.name);
      await expect(page.locator("[data-visibility-group]:visible")).toHaveCount(
        1,
      );
      await page.locator('[data-group-expanded="' + first.id + '"]').check();
      expect(
        (await snapshot(page)).project.groups.find((g) => g.id === first.id)
          .collapsed,
      ).toBe(false);
      expect(
        (await snapshot(page)).project.groups
          .filter((g) => g.id !== first.id)
          .every((g) => g.collapsed),
      ).toBe(true);
      await page.locator("#groupVisibilitySearch").fill("Unknown group");
      await expect(page.locator("#groupVisibilityEmpty")).toBeVisible();
      await page.locator("#groupVisibilitySearch").fill("");
      expect(
        await page
          .locator("#modal")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await page.screenshot({
        path: "test-results/group-controls-" + language + ".png",
      });
      await page.locator("#modal [data-close]").first().click();
      await page.locator('[data-action="undo"]').click();
      expect(
        (await snapshot(page)).project.groups.every((g) => g.collapsed),
      ).toBe(true);
      await page.locator('[data-action="redo"]').click();
      const mixed = (await snapshot(page)).project.groups;
      await expect(page.locator("#saveState")).toContainText(
        /saved|збережено|сохран/,
      );
      await page.reload();
      await page.locator("#startContinue").click();
      expect((await snapshot(page)).project.groups).toEqual(mixed);
      if (width < 760) await page.locator('[data-action="menu"]').click();
      await page.locator('[data-edit-group="' + first.id + '"]').click();
      await expect(page.locator('#modal [name="color"]')).toHaveValue(
        first.color,
      );
      await expect(page.locator('#modal [name="color"]')).toHaveAttribute(
        "type",
        "color",
      );
      await page.locator('#modal [name="color"]').fill("#c315b8");
      await page.locator('#modal button[type="submit"]').click();
      expect(
        (await snapshot(page)).project.groups.find((g) => g.id === first.id)
          .color,
      ).toBe("#c315b8");
      if (width < 760) await page.locator('[data-action="menu"]').click();
      expect(coords((await snapshot(page)).project.people)).toEqual(
        coords(before.project.people),
      );
      await openGroups(page);
      await page.locator('[data-action="expand-all-groups"]').click();
      await expect(
        page.locator('#graph .node[data-kind="person"]'),
      ).toHaveCount(before.project.people.length);
      expect(coords((await snapshot(page)).project.people)).toEqual(
        coords(before.project.people),
      );
    });
  });
}

test("arranging a family group moves only its members and the whole map uses the same positions", async ({
  page,
}) => {
  await page.locator('[data-group-filter="g1"]').click();
  for (const style of ["circle", "network", "generations"]) {
    const before = await snapshot(page),
      members = new Set(
        before.project.people
          .filter((p) => p.groupIds.includes("g1"))
          .map((p) => p.id),
      );
    if (
      await page
        .locator(
          ".graph-layout-settings:not([open]) summary, .diagram-layout-settings:not([open]) summary",
        )
        .isVisible()
    )
      await page
        .locator(
          ".graph-layout-settings:not([open]) summary, .diagram-layout-settings:not([open]) summary",
        )
        .click();
    await page.locator("#graphLayout").selectOption(style);
    await page.locator('.layout-controls [data-action="layout"]').click();
    await expect
      .poll(async () => (await snapshot(page)).history)
      .toBe(before.history + 1);
    const after = await snapshot(page);
    expect(
      coords(after.project.people.filter((p) => !members.has(p.id))),
    ).toEqual(coords(before.project.people.filter((p) => !members.has(p.id))));
    expect(
      coords(after.project.people.filter((p) => members.has(p.id))),
    ).not.toEqual(
      coords(before.project.people.filter((p) => members.has(p.id))),
    );
    for (const key of ["documents", "property"])
      expect(after.project[key]).toEqual(before.project[key]);
    const transforms = await page
      .locator('#graph .node[data-kind="person"]')
      .evaluateAll((els) =>
        Object.fromEntries(
          els.map((el) => [el.dataset.node, el.getAttribute("transform")]),
        ),
      );
    await page.locator('[data-group-filter=""]').click();
    for (const [id, transform] of Object.entries(transforms))
      await expect(
        page.locator('#graph .node[data-node="' + id + '"]'),
      ).toHaveAttribute("transform", transform);
    expect(coords((await snapshot(page)).project.people)).toEqual(
      coords(after.project.people),
    );
    await page.locator('[data-group-filter="g1"]').click();
  }
  await page
    .locator('[data-toggle-group="g1"]')
    .filter({ visible: true })
    .first()
    .click();
  await expect(
    page.locator('#graph .node[data-kind="group"][data-node="g1"]'),
  ).toHaveCount(1);
  await page
    .locator('[data-toggle-group="g1"]')
    .filter({ visible: true })
    .first()
    .click();
  await expect(
    page.locator('#graph .node[data-kind="person"]'),
  ).not.toHaveCount(0);
});
