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
      root: state.directConnectionRoot,
      history: state.history.length,
      groupFilter: state.groupFilter,
      graphFocus: state.graphFocus,
      personFilter: state.personFilter,
    };
  });
}
const visibleIds = (page) =>
  page
    .locator('#graph .node[data-kind="person"]')
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.node).sort());
const coordinates = (items) => items.map(({ id, x, y }) => ({ id, x, y }));
function expectedScope(project, root) {
  const edges = project.relations.filter(
    (r) => r.from === root || r.to === root,
  );
  return {
    people: [
      ...new Set([root, ...edges.flatMap((r) => [r.from, r.to])]),
    ].sort(),
    edges: edges.map((r) => r.id).sort(),
  };
}
async function focus(page, id = "p6") {
  await page.locator(`#personList [data-person="${id}"]`).click();
  const card = page.locator('#graph .node[data-node="' + id + '"] .card'),
    before = await card.boundingBox(),
    zoom = await page.locator("#zoomLabel").textContent();
  await page.locator('#inspector [data-action="direct-connections"]').click();
  const after = await card.boundingBox();
  for (const key of ["x", "y", "width", "height"])
    expect(after[key]).toBeCloseTo(before[key], 1);
  await expect(page.locator("#zoomLabel")).toHaveText(zoom);
}
async function dragCard(page, id) {
  const box = await page
    .locator(`#graph .node[data-node="${id}"] .card`)
    .boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 45,
    box.y + box.height / 2 + 35,
    { steps: 5 },
  );
  await page.mouse.up();
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("direct connections highlight one hop, keep the reference while moving neighbors, and clear highlighting without losing positions", async ({
  page,
}) => {
  const before = await snapshot(page),
    expected = expectedScope(before.project, "p6");
  await focus(page);
  await expect(page.locator('#graph .node[data-kind="person"]')).toHaveCount(
    before.project.people.length,
  );
  expect(
    await page
      .locator("#graph [data-direct-connection]")
      .evaluateAll((edges) => edges.map((e) => e.dataset.edge).sort()),
  ).toEqual(expected.edges);
  for (const person of before.project.people) {
    await expect(
      page.locator('#graph .node[data-node="' + person.id + '"]'),
    ).toHaveAttribute(
      "opacity",
      expected.people.includes(person.id) ? "1" : "0.3",
    );
  }
  await expect(page.locator("#graph .group-heading")).not.toHaveCount(0);
  expect((await snapshot(page)).history).toBe(before.history);
  await expect(page.locator('#graph .node[data-node="p6"]')).toHaveAttribute(
    "data-kinship-role",
    "self",
  );
  await page.locator('#personList [data-person="p8"]').click();
  const focused = await page
    .locator('#graph [data-node="p8"] .card')
    .boundingBox();
  expect(focused.y + focused.height / 2).toBeLessThan(
    page.viewportSize().height,
  );
  await dragCard(page, "p8");
  const moved = await snapshot(page);
  expect(moved.root).toBe("p6");
  expect(
    coordinates(moved.project.people.filter((p) => p.id !== "p8")),
  ).toEqual(coordinates(before.project.people.filter((p) => p.id !== "p8")));
  expect(coordinates(moved.project.people)).not.toEqual(
    coordinates(before.project.people),
  );
  await page.locator('[data-action="undo"]').click();
  expect(coordinates((await snapshot(page)).project.people)).toEqual(
    coordinates(before.project.people),
  );
  await page.locator('[data-action="redo"]').click();
  await page
    .locator('#graphContext [data-action="restore-connection-map"]')
    .click();
  await expect(page.locator('#graph .node[data-kind="person"]')).toHaveCount(
    before.project.people.length,
  );
  expect(coordinates((await snapshot(page)).project.people)).toEqual(
    coordinates(moved.project.people),
  );
  expect((await snapshot(page)).history).toBe(moved.history);
});

test("highlight preserves previous analysis, display filters and collapsed groups; full SVG and reload keep the entire tree", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base).href);
    state.selected = { kind: "person", id: "p6" };
    state.groupFilter = "g1";
    state.graphFocus = { people: ["p3", "p6"], relations: ["r10"] };
    state.project.groups[0].collapsed = true;
    state.project.graphView.hiddenRelations = state.project.relations
      .filter((r) => r.from === "p6" || r.to === "p6")
      .map((r) => r.id);
    const { render } = await import(new URL("ui/render.js", base).href);
    render();
  });
  const before = await snapshot(page),
    previousIds = await visibleIds(page);
  await page
    .locator('#graphToolbar [data-action="direct-connections"]')
    .click();
  expect(await visibleIds(page)).toEqual(previousIds);
  const counts = await page.evaluate(async () => {
    const { fullSVG } = await import(
      new URL(
        "graph/export.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    const count = ({ svg }) =>
      new DOMParser()
        .parseFromString(svg, "image/svg+xml")
        .querySelectorAll('.node[data-kind="person"]').length;
    return {
      current: count(await fullSVG("view")),
      full: count(await fullSVG("full")),
    };
  });
  expect(counts).toEqual({
    current: previousIds.length,
    full: before.project.people.length,
  });
  await page.keyboard.press("Escape");
  expect(await visibleIds(page)).toEqual(previousIds);
  const restored = await snapshot(page);
  expect(restored.project).toEqual(before.project);
  expect(restored.groupFilter).toBe(before.groupFilter);
  expect(restored.graphFocus).toEqual(before.graphFocus);
  await page
    .locator('#graphToolbar [data-action="direct-connections"]')
    .click();
  await page.keyboard.press("Escape");
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
  await page.locator('.layout-controls [data-action="layout"]').click();
  await expect
    .poll(async () => (await snapshot(page)).history)
    .toBe(before.history + 1);
  const moved = await snapshot(page);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  const reopened = await snapshot(page);
  expect(reopened.root).toBe("");
  expect(coordinates(reopened.project.people)).toEqual(
    coordinates(moved.project.people),
  );
  expect(reopened.project.people.map(({ id, name }) => ({ id, name }))).toEqual(
    moved.project.people.map(({ id, name }) => ({ id, name })),
  );
  await expect(
    page.locator('#graphContext [data-action="restore-connection-map"]'),
  ).toHaveCount(0);
});

test("all automatic layouts move only direct connections and preserve other people, sources, property and group positions", async ({
  page,
}) => {
  await focus(page);
  for (const style of ["circle", "network", "generations"]) {
    const before = await snapshot(page),
      expected = expectedScope(before.project, "p6"),
      hidden = before.project.people.filter(
        (p) => !expected.people.includes(p.id),
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
      coordinates(
        after.project.people.filter((p) => !expected.people.includes(p.id)),
      ),
    ).toEqual(coordinates(hidden));
    for (const key of ["documents", "property", "groups"])
      expect(after.project[key]).toEqual(before.project[key]);
    await expect(page.locator('#graph .node[data-kind="person"]')).toHaveCount(
      before.project.people.length,
    );
    expect(coordinates(after.project.people)).not.toEqual(
      coordinates(before.project.people),
    );
  }
  await page
    .locator('#graphContext [data-action="restore-connection-map"]')
    .click();
  await expect(page.locator('#graph .node[data-kind="person"]')).toHaveCount(
    99,
  );
});

test("relationship edits refresh the view, an isolated person stays visible, and outside search leaves it", async ({
  page,
}) => {
  await focus(page);
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base).href);
    const { commit } = await import(new URL("services/history.js", base).href);
    commit(() => {
      state.project.relations.push({
        id: "new-link",
        from: "p6",
        to: "p1",
        type: "unconfirmed",
        notes: "Reported connection",
      });
    });
  });
  await expect(page.locator('#graph .node[data-node="p1"]')).toHaveAttribute(
    "opacity",
    "1",
  );
  await expect(page.locator('#graph [data-edge="new-link"]')).toHaveAttribute(
    "data-direct-connection",
    "true",
  );
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator('#graph .node[data-node="p1"]')).toHaveAttribute(
    "opacity",
    "0.3",
  );
  await page.locator("#globalSearch").fill("John Doe");
  await page
    .locator('[data-search-kind="person"][data-search-id="p1"]')
    .click();
  expect((await snapshot(page)).root).toBe("");
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base).href);
    const { commit } = await import(new URL("services/history.js", base).href);
    commit(() => {
      state.project.relations = state.project.relations.filter(
        (r) => r.from !== "p1" && r.to !== "p1",
      );
    });
  });
  await page.locator('#inspector [data-action="direct-connections"]').click();
  await expect(
    page.locator('#graph .node[data-kind="person"][opacity="1"]'),
  ).toHaveCount(1);
  await expect(page.locator('#graph .node[data-kind="person"]')).toHaveCount(
    99,
  );
  await expect(
    page.locator('#graphContext [data-action="restore-connection-map"]'),
  ).toBeVisible();
});

for (const [language, width] of [
  ["en", 390],
  ["uk", 320],
  ["ru", 320],
]) {
  test.describe(`Direct connections on a ${width}px phone in ${language}`, () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    test("highlights in the existing map, supports native touch rearranging and keeps return accessible", async ({
      page,
    }) => {
      await page.locator("#appShell [data-language]").selectOption(language);
      await page.locator("#globalSearch").fill("Robin Roe");
      await page
        .locator('[data-search-kind="person"][data-search-id="p6"]')
        .tap();
      await page.locator('#graph .node[data-node="p6"] .card').tap();
      await page.locator('#inspector [data-action="direct-connections"]').tap();
      const before = await snapshot(page);
      await expect(
        page.locator('#graph .node[data-kind="person"]'),
      ).toHaveCount(before.project.people.length);
      await expect(page.locator("#inspector")).toHaveClass(/open/);
      await page.locator('#inspector [data-action="close-panel"]').tap();
      await expect(page.locator("body")).not.toHaveClass(/mobile-tools-open/);
      const returnButton = page.locator(
        '#graphContext [data-action="restore-connection-map"]',
      );
      await expect(returnButton).toBeVisible();
      expect(
        await returnButton.evaluate((el) => getComputedStyle(el).color),
      ).toBe("rgb(255, 255, 255)");
      expect(
        await page
          .locator("#graphContext")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await page.locator('[data-action="focus-person"]').tap();
      await page.locator('[data-action="touch-move"]').tap();
      const box = await page
          .locator('#graph .node[data-node="p6"] .card')
          .boundingBox(),
        session = await page.context().newCDPSession(page);
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + 35, y: y + 30, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(async () => (await snapshot(page)).history)
        .toBe(before.history + 1);
      const moved = await snapshot(page);
      expect(
        coordinates(moved.project.people.filter((p) => p.id !== "p6")),
      ).toEqual(
        coordinates(before.project.people.filter((p) => p.id !== "p6")),
      );
      await page.screenshot({
        path: `test-results/direct-connections-${language}-phone.png`,
      });
      await returnButton.tap();
      await expect(
        page.locator('#graph .node[data-kind="person"]'),
      ).toHaveCount(99);
      expect(coordinates((await snapshot(page)).project.people)).toEqual(
        coordinates(moved.project.people),
      );
      await session.detach();
    });
  });
}
