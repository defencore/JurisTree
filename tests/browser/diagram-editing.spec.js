import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const stateOf = (page) =>
  page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return {
      project: state.project,
      camera: state.camera,
      history: state.history.length,
      labels: [...state.diagramLabelSelection],
      selection: [...state.multiSelection],
    };
  });
async function fixture(page, phone = false) {
  await page.evaluate(async (phone) => {
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
      {
        id: "p1",
        name: "John Doe",
        gender: "m",
        birth: "1960-06-15",
        x: 0,
        y: 0,
        groupIds: ["g1"],
      },
      {
        id: "p2",
        name: "Jane Doe",
        gender: "f",
        birth: "1962-08-19",
        x: 430,
        y: phone ? 45 : 40,
        groupIds: ["g1"],
      },
      ...(phone
        ? []
        : [
            {
              id: "p3",
              name: "Jamie Doe",
              gender: "m",
              birth: "1988-04-12",
              x: 0,
              y: 400,
              groupIds: ["g1"],
            },
            {
              id: "p4",
              name: "Jesse Roe",
              gender: "f",
              birth: "1989-03-09",
              x: 430,
              y: 460,
              groupIds: ["g1"],
            },
          ]),
    ];
    p.groups = [
      { id: "g1", name: "Doe family", color: "#ba6792", collapsed: false },
    ];
    p.relations = [
      {
        id: "r1",
        from: "p1",
        to: "p2",
        type: "spouse",
        unionKind: "marriage",
        fromDate: "1984-07-14",
        toDate: "1998-08-12",
        status: "divorced",
      },
      ...(phone
        ? []
        : [
            { id: "r2", from: "p1", to: "p3", type: "parent" },
            { id: "r3", from: "p3", to: "p4", type: "partner" },
          ]),
    ];
    if (!phone) {
      p.documents = [
        {
          id: "d1",
          title: "Birth register",
          type: "birth",
          status: "available",
          evidence: "official",
          people: ["p3"],
          relations: ["r2"],
          x: 900,
          y: 0,
        },
      ];
      p.property = [
        {
          id: "a1",
          title: "Willow Lane house",
          ownerId: "p2",
          value: 200000,
          currency: "USD",
          allocations: [{ personId: "p4", percent: 100 }],
          x: 900,
          y: 400,
        },
      ];
    }
    activateTree(validateImport(p));
    state.showDocs = true;
    render();
    fit();
  }, phone);
}
async function editing(page) {
  if (
    !(await page
      .locator('#graphToolbar [data-action="diagram-tools"]')
      .isVisible())
  )
    await page.locator('[data-action="mobile-tools"]').click();
  await page.locator('#graphToolbar [data-action="diagram-tools"]').click();
  await expect(page.locator("#diagramTools")).toBeVisible();
  await page.locator('[data-action="fit"]').click();
}
async function pathPoint(page, key, fraction = 0.3) {
  return page
    .locator('#graph [data-connector="' + key + '"] .connector-path')
    .evaluate((el, fraction) => {
      const p = el.getPointAtLength(el.getTotalLength() * fraction),
        screen = new DOMPoint(p.x, p.y).matrixTransform(el.getScreenCTM());
      return { x: screen.x, y: screen.y };
    }, fraction);
}
async function chooseLine(page, key) {
  const p = await pathPoint(page, key);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator("[data-diagram-style]")).toBeVisible();
}
async function worldPoint(page, x, y) {
  return page.locator("#scene").evaluate(
    (el, p) => {
      const point = new DOMPoint(p.x, p.y).matrixTransform(el.getScreenCTM());
      return { x: point.x, y: point.y };
    },
    { x, y },
  );
}
async function addPoint(page, x, y) {
  await page.locator('[data-action="diagram-add-point"]').click();
  const p = await worldPoint(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function drag(page, locator, dx, dy) {
  const b = await locator.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, {
    steps: 5,
  });
  await page.mouse.up();
}
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
});
test.afterEach(() => expect(errors).toEqual([]));
test.describe("desktop diagram editing", () => {
  test.use({ viewport: { width: 1680, height: 1100 } });
  test("manual waypoints and labels move, follow cards, undo as one gesture and survive a draft reload", async ({
    page,
  }) => {
    await fixture(page);
    await editing(page);
    await chooseLine(page, "r:r1");
    const before = await stateOf(page);
    await addPoint(page, 350, 290);
    let routed = await stateOf(page);
    expect(routed.project.diagram["r:r1"].style).toBe("orthogonal");
    expect(routed.project.diagram["r:r1"].points[0].x).toBeCloseTo(350, 1);
    expect(routed.project.diagram["r:r1"].points[0].y).toBeCloseTo(290, 1);
    expect(routed.history).toBe(before.history + 1);
    const handle = page.locator('#graph [data-route-point="0"]');
    await drag(page, handle, 40, 30);
    const moved = await stateOf(page);
    expect(moved.project.diagram["r:r1"].points[0].x).toBeGreaterThan(350);
    expect(moved.history).toBe(routed.history + 1);
    await page.locator('[data-action="undo"]').click();
    expect((await stateOf(page)).project.diagram).toEqual(
      routed.project.diagram,
    );
    await page.locator('[data-action="redo"]').click();
    expect((await stateOf(page)).project.diagram).toEqual(
      moved.project.diagram,
    );
    const label = page.locator('#graph [data-route-label="r:r1"]');
    await drag(page, label, -40, 30);
    await expect(label.locator(".relationship-period")).toContainText(
      "14.07.1984",
    );
    await expect(label.locator(".relationship-period")).toContainText(
      "12.08.1998",
    );
    const selectedCard = page.locator('#graph [data-node="p1"] .card');
    const cardBefore = await selectedCard.boundingBox();
    await selectedCard.click();
    const cardAfter = await selectedCard.boundingBox();
    for (const axis of ["x", "y"])
      expect(cardAfter[axis]).toBeCloseTo(cardBefore[axis], 1);
    expect((await stateOf(page)).labels).toEqual([]);
    await expect(page.locator("[data-diagram-style]")).toHaveCount(0);
    await chooseLine(page, "r:r1");
    const labelled = await stateOf(page);
    expect(labelled.project.diagram["r:r1"].label).toBeTruthy();
    const path = await page
      .locator('#graph [data-edge="r1"] .connector-path')
      .getAttribute("d");
    await drag(page, page.locator('#graph [data-node="p1"] .card'), -25, 20);
    expect(
      await page
        .locator('#graph [data-edge="r1"] .connector-path')
        .getAttribute("d"),
    ).not.toBe(path);
    expect((await stateOf(page)).project.diagram).toEqual(
      labelled.project.diagram,
    );
    await page.locator("[data-diagram-style]").selectOption("polyline");
    await expect(page.locator("#saveState")).toContainText("Draft saved");
    const saved = (await stateOf(page)).project.diagram;
    await page.reload();
    await page.locator("#startContinue").click();
    expect((await stateOf(page)).project.diagram).toEqual(saved);
    await expect(page.locator("#diagramTools")).toBeHidden();
    await editing(page);
    await chooseLine(page, "r:r1");
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    expect(
      (await stateOf(page)).project.diagram["r:r1"].points[0].x,
    ).toBeGreaterThan(saved["r:r1"].points[0].x);
    await page.keyboard.press("Delete");
    expect((await stateOf(page)).project.diagram["r:r1"].points).toHaveLength(
      0,
    );
    await page.locator('[data-action="diagram-reset-route"]').click();
    expect((await stateOf(page)).project.diagram["r:r1"].label).toEqual(
      saved["r:r1"].label,
    );
    await page.locator('[data-action="diagram-reset-label"]').click();
    expect((await stateOf(page)).project.diagram["r:r1"]).toBeUndefined();
  });
  test("cards, relationship captions and group names align to grid and to one another without changing other nodes", async ({
    page,
  }) => {
    await fixture(page);
    await editing(page);
    await page.locator('[data-diagram-setting="snapToGrid"]').check();
    await page.locator('[data-diagram-setting="gridSize"]').fill("40");
    await page.locator('[data-diagram-setting="gridSize"]').press("Tab");
    await drag(page, page.locator('#graph [data-node="p1"] .card'), 37, 23);
    const snapped = await stateOf(page);
    expect(snapped.project.people[0].x % 40).toBe(0);
    expect(snapped.project.people[0].y % 40).toBe(0);
    for (const id of ["p2", "p3"])
      await page
        .locator('#graph [data-node="' + id + '"] .card')
        .click({ modifiers: ["Control"] });
    const before = await stateOf(page);
    await page.locator("[data-diagram-align]").selectOption("top");
    const aligned = await stateOf(page);
    const selected = aligned.project.people.filter((p) =>
      before.selection.includes(p.id),
    );
    expect(new Set(selected.map((p) => p.y)).size).toBe(1);
    expect(
      aligned.project.people.filter((p) => !before.selection.includes(p.id)),
    ).toEqual(
      before.project.people.filter((p) => !before.selection.includes(p.id)),
    );
    await page.locator('#graph [data-route-label="g:g1"]').click();
    await page
      .locator('#graph [data-route-label="r:r3"]')
      .click({ modifiers: ["Control"] });
    await page.locator("[data-diagram-align]").selectOption("top");
    const captions = await stateOf(page);
    expect(captions.project.diagram["g:g1"].label.y).toBe(
      captions.project.diagram["r:r3"].label.y,
    );
    await drag(page, page.locator('#graph [data-route-label="g:g1"]'), 30, 30);
    const shifted = await stateOf(page);
    expect(
      shifted.project.diagram["g:g1"].label.y -
        captions.project.diagram["g:g1"].label.y,
    ).toBe(
      shifted.project.diagram["r:r3"].label.y -
        captions.project.diagram["r:r3"].label.y,
    );
    expect(shifted.project.people).toEqual(captions.project.people);
    await page.locator('[data-action="diagram-select-items"]').click();
    for (const id of ["d1", "a1"])
      await page.locator('#graph [data-node="' + id + '"] .card').click();
    const otherCards = await stateOf(page);
    await page.locator("[data-diagram-align]").selectOption("right");
    const sourceBox = await page
        .locator('#graph [data-node="d1"] .card')
        .boundingBox(),
      propertyBox = await page
        .locator('#graph [data-node="a1"] .card')
        .boundingBox();
    expect(sourceBox.x + sourceBox.width).toBeCloseTo(
      propertyBox.x + propertyBox.width,
      1,
    );
    expect((await stateOf(page)).project.people).toEqual(
      otherCards.project.people,
    );
    await page.screenshot({
      path: "test-results/diagram-alignment-desktop.png",
    });
  });
  test("source and property routes, named views and ZIP archives preserve manual placement; image exports include routes without editing handles", async ({
    page,
  }) => {
    await fixture(page);
    await editing(page);
    for (const key of ["d:d1:p3", "p:a1:p4"]) {
      await chooseLine(page, key);
      await addPoint(page, 800, 320);
      await drag(
        page,
        page.locator('#graph [data-route-label="' + key + '"]'),
        -30,
        -20,
      );
    }
    const original = (await stateOf(page)).project.diagram;
    await page.locator('#graphToolbar [data-action="saved-map-views"]').click();
    await page.locator('[name="map-view-name"]').fill("Estate connections");
    await page.locator('#modal button[type="submit"]').click();
    await page.locator('[data-action="diagram-reset-route"]').click();
    await page.locator('[data-action="diagram-reset-label"]').click();
    await page.locator('#graphToolbar [data-action="saved-map-views"]').click();
    await page.locator("[data-restore-view]").click();
    expect((await stateOf(page)).project.diagram).toEqual(original);
    await page.locator('[data-action="export"]').click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-export="zip"]').click(),
    ]);
    const buffer = await readFile(await download.path());
    await page.locator("#modal [data-close]").first().click();
    await page.locator("#importInput").setInputFiles({
      name: "arrangement.zip",
      mimeType: "application/zip",
      buffer,
    });
    await page.locator('#modal button[type="submit"]').click();
    expect((await stateOf(page)).project.diagram).toEqual(original);
    await editing(page);
    await chooseLine(page, "r:r1");
    // Place a far waypoint through the model to verify export bounds beyond the viewport.
    const exports = await page.evaluate(async () => {
      const base = document.querySelector('script[type="module"]').src;
      const { state } = await import(new URL("core/state.js", base).href);
      state.project.diagram["r:r1"] = {
        style: "orthogonal",
        points: [{ x: -1500, y: 1900 }],
        label: { x: -1600, y: 1950 },
      };
      const { fullSVG } = await import(
        new URL("features/archive.js", base).href
      );
      return Promise.all([fullSVG("view"), fullSVG("full")]);
    });
    for (const output of exports) {
      expect(output.width).toBeGreaterThan(2800);
      expect(output.height).toBeGreaterThan(2000);
      expect(output.svg).toContain("-1500 1900");
      expect(output.svg).not.toContain('class="route-point"');
      expect(output.svg).not.toContain('class="diagram-grid"');
      expect(output.svg).not.toContain("diagram-label-selected");
    }
  });
});
for (const [language, width] of [
  ["en", 390],
  ["uk", 320],
  ["ru", 320],
]) {
  test.describe(language + " diagram editing on phone", () => {
    test.use({
      viewport: { width, height: 900 },
      hasTouch: true,
      isMobile: true,
    });
    test("native touch moves waypoints and labels, cancellation rolls back and controls fit the screen", async ({
      page,
    }) => {
      await fixture(page, true);
      await page.locator("#appShell [data-language]").selectOption(language);
      await editing(page);
      await chooseLine(page, "r:r1");
      const placementY = await page.locator("#graph").evaluate(async (el) => {
        const { state } = await import(
          new URL(
            "core/state.js",
            document.querySelector('script[type="module"]').src,
          ).href
        );
        return (
          (el.getBoundingClientRect().height * 0.6 - state.camera.y) /
          state.camera.z
        );
      });
      await addPoint(page, 340, placementY);
      const before = await stateOf(page),
        session = await page.context().newCDPSession(page);
      const handle = page.locator('[data-route-point="0"]');
      const box = await handle.boundingBox(),
        start = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 0 };
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [start],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ ...start, x: start.x + 16, y: start.y + 12 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      const moved = await stateOf(page);
      expect(moved.project.diagram["r:r1"].points[0].x).toBeGreaterThan(
        before.project.diagram["r:r1"].points[0].x,
      );
      expect(moved.history).toBe(before.history + 1);
      const newBox = await handle.boundingBox(),
        cancelStart = {
          x: newBox.x + newBox.width / 2,
          y: newBox.y + newBox.height / 2,
          id: 0,
        };
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [cancelStart],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { ...cancelStart, x: cancelStart.x - 15, y: cancelStart.y - 12 },
        ],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
      expect((await stateOf(page)).project.diagram).toEqual(
        moved.project.diagram,
      );
      expect((await stateOf(page)).history).toBe(moved.history);
      const label = page.locator('#graph [data-route-label="r:r1"]');
      const labelBox = await label.boundingBox(),
        labelStart = {
          x: labelBox.x + labelBox.width / 2,
          y: labelBox.y + labelBox.height / 2,
          id: 0,
        };
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [labelStart],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { ...labelStart, x: labelStart.x - 15, y: labelStart.y + 20 },
        ],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      expect((await stateOf(page)).project.diagram["r:r1"].label).toBeTruthy();
      expect(
        await page
          .locator("#diagramTools")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.locator('[data-action="diagram-select-items"]').tap();
      for (const id of ["p1", "p2"])
        await page.locator('#graph [data-node="' + id + '"] .card').tap();
      expect((await stateOf(page)).selection.sort()).toEqual(["p1", "p2"]);
      await page.locator("[data-diagram-align]").selectOption("bottom");
      const arranged = (await stateOf(page)).project.people;
      expect(arranged[0].y).toBe(arranged[1].y);
      await page.screenshot({
        path: "test-results/diagram-editing-" + language + "-phone.png",
      });
      await session.detach();
    });
  });
}
