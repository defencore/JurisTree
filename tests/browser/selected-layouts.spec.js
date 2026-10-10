import { test, expect } from "@playwright/test";

async function snapshot(page) {
  return page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return {
      project: state.project,
      selected: state.selected,
      people: [...state.multiSelection],
      nodes: [...state.diagramNodeSelection],
      labels: [...state.diagramLabelSelection],
      mode: state.selectionMode,
      busy: state.analysisBusy,
      history: state.history.length,
      camera: state.camera,
    };
  });
}
async function fixture(page) {
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src,
      module = (path) => import(new URL(path, base).href);
    const [
      { fresh },
      { validateImport },
      { activateTree },
      { state },
      { render },
      { fit },
    ] = await Promise.all([
      module("model/project.js"),
      module("model/validation.js"),
      module("features/workspace-session.js"),
      module("core/state.js"),
      module("ui/render.js"),
      module("graph/camera.js"),
    ]);
    const p = fresh();
    p.title = "Doe family";
    p.purpose = "property";
    p.people = [
      "John Doe",
      "Jane Doe",
      "Jamie Doe",
      "Jesse Roe",
      "Jordan Roe",
      "Jean Roe",
    ].map((name, i) => ({
      id: "p" + i,
      name,
      gender: i % 2 ? "f" : "m",
      birth: "1980-01-01",
      groupIds: [],
      x: (i % 3) * 440,
      y: Math.floor(i / 3) * 400,
    }));
    p.relations = [
      { id: "r0", from: "p0", to: "p1", type: "spouse" },
      { id: "r1", from: "p0", to: "p2", type: "parent" },
      { id: "r2", from: "p2", to: "p3", type: "sibling" },
      { id: "r3", from: "p4", to: "p5", type: "spouse" },
    ];
    p.documents = [
      {
        id: "d",
        title: "Birth register",
        type: "birth",
        status: "available",
        evidence: "official",
        people: ["p0"],
        relations: [],
        x: 1450,
        y: 0,
      },
    ];
    p.property = [
      {
        id: "a",
        title: "Willow Lane house",
        ownerId: "p0",
        allocations: [{ personId: "p1", percent: 100 }],
        x: 1450,
        y: 400,
      },
    ];
    activateTree(validateImport(p));
    state.showDocs = true;
    render();
    fit();
  });
}
async function showTools(page) {
  if (!(await page.locator("#graphLayout").isVisible()))
    await page.locator('[data-action="mobile-tools"]').click();
}
async function edit(page) {
  await showTools(page);
  await page.locator('#graphToolbar [data-action="diagram-tools"]').click();
  await expect(page.locator("#diagramTools")).toBeVisible();
}
async function apply(page, style) {
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
  const history = (await snapshot(page)).history;
  await page.locator('.layout-controls [data-action="layout"]').click();
  await expect.poll(async () => (await snapshot(page)).busy).toBe(false);
  await expect
    .poll(async () => (await snapshot(page)).history)
    .toBe(history + 1);
}
const card = (page, id) =>
  page.locator('#graph [data-node="' + id + '"] .card');
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const release = process.env.JURISTREE_RELEASE_HASH;
  await page.goto(release ? "./?release=" + release : "./");
  if (release)
    await expect(page.locator('script[type="module"]')).toHaveAttribute(
      "src",
      new RegExp(release),
    );
  await page.locator("#startDemo").click();
  await fixture(page);
});
test.afterEach(() => expect(errors).toEqual([]));

test.describe("selected layout and consistent selection", () => {
  test.use({ viewport: { width: 1680, height: 1100 } });
  test("Ctrl selects a pair consistently; all methods affect only selected free cards and undo in one step", async ({
    page,
  }) => {
    await card(page, "p0").click();
    await card(page, "p1").click({ modifiers: ["Control"] });
    await card(page, "p2").click({ modifiers: ["Control"] });
    await expect(page.locator("#graphLayoutScope")).toHaveValue("selected");
    expect((await snapshot(page)).people).toEqual(["p0", "p1", "p2"]);
    const before = await snapshot(page);
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
    await page.locator("#graphLayout").selectOption("circle");
    expect((await snapshot(page)).project).toEqual(before.project);
    for (const style of [
      "circle",
      "hierarchy",
      "circles",
      "network",
      "incremental",
      "orthogonal",
      "generations",
    ]) {
      const previous = await snapshot(page);
      await apply(page, style);
      const after = await snapshot(page);
      expect(after.project.people.slice(3)).toEqual(
        before.project.people.slice(3),
      );
      expect(after.project.documents).toEqual(before.project.documents);
      expect(after.project.property).toEqual(before.project.property);
      expect(after.people).toEqual(before.people);
      await page.locator('[data-action="undo"]').click();
      expect((await snapshot(page)).project.people).toEqual(
        previous.project.people,
      );
      await page.locator('[data-action="redo"]').click();
      expect((await snapshot(page)).project.people).toEqual(
        after.project.people,
      );
    }
    await page.screenshot({ path: "test-results/selected-layout-desktop.png" });
  });
  test("mixed card and connection selection survives opening and closing placement; fixed selections disable layout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1680, height: 800 });
    await page.locator('[data-action="selection-mode"]').click();
    for (const id of ["p0", "p1", "d", "a"]) {
      await page.locator('[data-action="fit"]').click();
      await card(page, id).click();
    }
    await page.locator('#graph [data-route-label="r:r0"]').click();
    const selected = await snapshot(page);
    await edit(page);
    expect((await snapshot(page)).people).toEqual(selected.people);
    expect((await snapshot(page)).nodes).toEqual(selected.nodes);
    expect((await snapshot(page)).labels).toEqual(selected.labels);
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    await expect(
      page.locator('.layout-controls [data-action="layout"]'),
    ).toBeDisabled();
    await page.locator('#diagramTools [data-action="diagram-tools"]').click();
    expect((await snapshot(page)).mode).toBe(true);
    expect((await snapshot(page)).people).toEqual(selected.people);
    expect((await snapshot(page)).nodes).toEqual(selected.nodes);
    await expect(
      page.locator('.layout-controls [data-action="layout"]'),
    ).toBeDisabled();
    await page
      .locator('#graphToolbar [data-action="unlock-placement"]')
      .click();
    const before = await snapshot(page);
    await apply(page, "circle");
    const after = await snapshot(page);
    expect(after.project.people.slice(2)).toEqual(
      before.project.people.slice(2),
    );
    expect(after.project.documents[0].x).not.toBe(
      before.project.documents[0].x,
    );
    expect(after.project.property[0].y).not.toBe(before.project.property[0].y);
  });
  test("hiding the selected source never switches layout to the entire diagram", async ({
    page,
  }) => {
    await page.locator('[data-action="selection-mode"]').click();
    await card(page, "d").click();
    await page.locator("#docsToggle").click();
    await expect(page.locator("#graphLayoutScope")).toHaveValue("selected");
    await expect(
      page.locator('.layout-controls [data-action="layout"]'),
    ).toBeDisabled();
    expect((await snapshot(page)).nodes).toEqual(["document:d"]);
    await page.locator("#docsToggle").click();
    const before = await snapshot(page);
    await apply(page, "circle");
    const after = await snapshot(page);
    expect(after.project.people).toEqual(before.project.people);
    expect(after.project.property).toEqual(before.project.property);
  });
  test("a relationship has the same identity through its line and caption in either mode", async ({
    page,
  }) => {
    for (const editing of [false, true]) {
      if (editing) await edit(page);
      await page.locator('#graph [data-route-label="r:r1"]').focus();
      await page.keyboard.press("Enter");
      expect((await snapshot(page)).selected).toEqual({
        kind: "relation",
        id: "r1",
      });
      await page
        .locator('#graph [data-connector="r:r0"][data-from-node]')
        .focus();
      await page.keyboard.press("Enter");
      expect((await snapshot(page)).selected).toEqual({
        kind: "relation",
        id: "r0",
      });
      expect((await snapshot(page)).labels).toEqual(["r:r0"]);
      await page.locator('[data-action="selection-mode"]').click();
      await page.locator('#graph [data-route-label="r:r1"]').focus();
      await page.keyboard.press("Enter");
      await page
        .locator('#graph [data-connector="r:r0"][data-from-node]')
        .focus();
      await page.keyboard.press("Enter");
      expect((await snapshot(page)).labels).toEqual(["r:r1", "r:r0"]);
      expect((await snapshot(page)).mode).toBe(true);
      await page.locator('[data-action="selection-mode"]').click();
    }
  });
  test("grid visibility is independent from snapping and survives undo and a draft reload", async ({
    page,
  }) => {
    const button = page.locator('[data-action="toggle-grid"]');
    await button.click();
    await expect(page.locator(".diagram-grid")).toHaveCount(1);
    await edit(page);
    await page.locator(".diagram-grid-settings summary").click();
    await page.locator('[data-diagram-setting="snapToGrid"]').check();
    await button.click();
    await expect(page.locator(".diagram-grid")).toHaveCount(0);
    expect((await snapshot(page)).project.graphView.snapToGrid).toBe(true);
    await page.locator('[data-action="undo"]').click();
    await expect(page.locator(".diagram-grid")).toHaveCount(1);
    await button.click();
    await expect(page.locator("#saveState")).toContainText("Draft saved");
    await page.reload();
    await page.locator("#startContinue").click();
    const after = await snapshot(page);
    expect(after.project.graphView.showGrid).toBe(false);
    expect(after.project.graphView.snapToGrid).toBe(true);
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });
  test("changing selection while a network layout runs prevents a stale arrangement", async ({
    page,
  }) => {
    const before = await snapshot(page);
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
    await page.locator("#graphLayout").selectOption("network");
    await page.locator('.layout-controls [data-action="layout"]').click();
    await page.evaluate(async () => {
      const base = document.querySelector('script[type="module"]').src;
      const { toggleGraphSelection } = await import(
        new URL("features/graph-analysis.js", base).href
      );
      toggleGraphSelection("p0");
    });
    await expect.poll(async () => (await snapshot(page)).busy).toBe(false);
    const after = await snapshot(page);
    expect(after.project).toEqual(before.project);
    expect(after.history).toBe(before.history);
  });
});

for (const language of ["en", "uk", "ru"])
  for (const width of [320, 390])
    test.describe(language + " phone " + width, () => {
      test.use({
        viewport: { width, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      test("touch selection, selected circle and grid controls remain usable without horizontal overflow", async ({
        page,
      }) => {
        await page.locator("#appShell [data-language]").selectOption(language);
        await page.locator('[data-action="selection-mode"]').tap();
        for (const id of ["p0", "p1", "p2"]) {
          await page.locator('[data-action="fit"]').tap();
          await card(page, id).tap();
        }
        const selected = await snapshot(page),
          box = await page.locator("#graph").boundingBox(),
          session = await page.context().newCDPSession(page),
          center = { x: box.x + box.width / 2, y: box.y + 40 };
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [
            { x: center.x - 24, y: center.y, id: 0 },
            { x: center.x + 24, y: center.y, id: 1 },
          ],
        });
        for (let step = 1; step <= 5; step++) {
          const spread = 24 + step * 4;
          await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              { x: center.x - spread, y: center.y, id: 0 },
              { x: center.x + spread, y: center.y, id: 1 },
            ],
          });
          await page.evaluate(() => new Promise(requestAnimationFrame));
        }
        await session.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await session.detach();
        const pinched = await snapshot(page);
        expect(pinched.camera.z).toBeGreaterThan(selected.camera.z);
        expect(pinched.people).toEqual(selected.people);
        expect(pinched.nodes).toEqual(selected.nodes);
        await showTools(page);
        await expect(page.locator("#graphLayoutScope")).toHaveValue("selected");
        const before = await snapshot(page);
        await apply(page, "circle");
        expect((await snapshot(page)).project.people.slice(3)).toEqual(
          before.project.people.slice(3),
        );
        await expect(
          page.locator('[data-action="mobile-tools"]'),
        ).toHaveAttribute("aria-expanded", "false");
        await page.locator('[data-action="toggle-grid"]').tap();
        await expect(page.locator(".diagram-grid")).toHaveCount(1);
        await expect(
          page.locator('[data-action="selection-mode"]'),
        ).toHaveAttribute("aria-pressed", "true");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const tools = await page.locator(".graph-tools").boundingBox(),
          legend = await page.locator("#graphLegend").boundingBox();
        expect(legend.y + legend.height).toBeLessThan(tools.y);
        const graph = await page.locator("#graph").boundingBox();
        expect(graph.height).toBeGreaterThan(220);
        await page.screenshot({
          path:
            "test-results/selected-layout-" + language + "-" + width + ".png",
        });
      });
    });
