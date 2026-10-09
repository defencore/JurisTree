import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

async function fixture(page, phone = false) {
  await page.evaluate(async (phone) => {
    const base = document.querySelector('script[type="module"]').src,
      load = (path) => import(new URL(path, base).href);
    const [
      { fresh },
      { validateImport },
      { activateTree },
      { state },
      { render },
      { fit },
    ] = await Promise.all([
      load("model/project.js"),
      load("model/validation.js"),
      load("features/workspace-session.js"),
      load("core/state.js"),
      load("ui/render.js"),
      load("graph/camera.js"),
    ]);
    const p = fresh();
    p.title = "Doe family";
    p.purpose = "property";
    p.groups = [
      { id: "g1", name: "Doe family", color: "#ba6792", collapsed: false },
    ];
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
        y: 45,
        groupIds: ["g1"],
      },
      ...(phone
        ? []
        : [
            { id: "p3", name: "Jamie Doe", x: 0, y: 400, groupIds: ["g1"] },
            { id: "p4", name: "Jesse Roe", x: 430, y: 460 },
            { id: "p5", name: "Robin Roe", x: 850, y: 720 },
          ]),
    ];
    p.relations = [
      {
        id: "r1",
        from: "p1",
        to: "p2",
        type: "spouse",
        unionKind: "marriage",
        fromDate: "1984-07-14",
        status: "active",
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
    p.diagram = {
      "r:r1": {
        style: "orthogonal",
        points: [{ x: 350, y: 300 }],
        label: { x: 730, y: 320 },
      },
    };
    activateTree(validateImport(p));
    state.showDocs = true;
    render();
    fit();
  }, phone);
}
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
      history: state.history.length,
      camera: state.camera,
      selected: state.selected,
    };
  });
}
async function edit(page) {
  const button = page.locator('#graphToolbar [data-action="diagram-tools"]');
  if (!(await button.isVisible()))
    await page.locator('[data-action="mobile-tools"]').click();
  await button.click();
  await page.locator('[data-action="fit"]').click();
}
const card = (page, id) =>
  page.locator('#graph [data-node="' + id + '"] .card');
const label = (page, key) =>
  page.locator('#graph [data-route-label="' + key + '"]');
async function drag(page, target, dx = 50, dy = 35) {
  const box = await target.boundingBox(),
    x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}
const position = (item) => ({ x: item.x, y: item.y });
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const hash = process.env.JURISTREE_RELEASE_HASH;
  await page.goto(hash ? "./?release=" + hash : "./");
  if (hash)
    await expect(page.locator('script[type="module"]')).toHaveAttribute(
      "src",
      new RegExp(hash),
    );
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test.describe("fixed placement on desktop", () => {
  test.use({ viewport: { width: 1680, height: 1100 } });
  test("fixed cards remain selectable; mixed dragging and alignment move only unlocked cards, undo releases the lock", async ({
    page,
  }) => {
    await fixture(page);
    await edit(page);
    await card(page, "p1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    const fixed = await snapshot(page);
    await expect(page.locator('[data-node="p1"]')).toHaveAttribute(
      "data-placement-locked",
      "true",
    );
    await drag(page, card(page, "p1"));
    expect((await snapshot(page)).project.people).toEqual(fixed.project.people);
    expect((await snapshot(page)).history).toBe(fixed.history);
    await card(page, "p1").click();
    expect((await snapshot(page)).selected).toEqual({
      kind: "person",
      id: "p1",
    });
    for (const id of ["p1", "p2"])
      await card(page, id).click({ modifiers: ["Control"] });
    await drag(page, card(page, "p2"));
    const moved = await snapshot(page);
    expect(position(moved.project.people[0])).toEqual(
      position(fixed.project.people[0]),
    );
    expect(position(moved.project.people[1])).not.toEqual(
      position(fixed.project.people[1]),
    );
    await page.locator("[data-diagram-align]").selectOption("top");
    expect((await snapshot(page)).project.people[1].y).toBe(
      fixed.project.people[0].y,
    );
    await page.locator("[data-diagram-align]").selectOption("grid");
    expect(position((await snapshot(page)).project.people[0])).toEqual(
      position(fixed.project.people[0]),
    );
    await page
      .locator('#diagramTools [data-action="unlock-placement"]')
      .click();
    await drag(page, card(page, "p1"));
    expect(position((await snapshot(page)).project.people[0])).not.toEqual(
      position(fixed.project.people[0]),
    );
    await page.locator('[data-action="undo"]').click();
    await page.locator('[data-action="undo"]').click();
    expect((await snapshot(page)).project.placementLocks.nodes).toContain(
      "person:p1",
    );
  });
  test("fixed routes and captions reject pointer and keyboard edits while ends follow movable cards", async ({
    page,
  }) => {
    await fixture(page);
    await edit(page);
    await label(page, "r:r1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    const fixed = await snapshot(page);
    await expect(page.locator("[data-route-point]")).toHaveCount(0);
    await expect(page.locator("[data-diagram-style]")).toBeDisabled();
    for (const action of [
      "diagram-add-point",
      "diagram-reset-route",
      "diagram-reset-label",
    ])
      await expect(
        page.locator('[data-action="' + action + '"]'),
      ).toBeDisabled();
    await drag(page, label(page, "r:r1"));
    await label(page, "r:r1").focus();
    await page.keyboard.press("ArrowRight");
    expect((await snapshot(page)).project.diagram).toEqual(
      fixed.project.diagram,
    );
    expect((await snapshot(page)).history).toBe(fixed.history);
    const path = await page
      .locator('[data-edge="r1"] .connector-path')
      .getAttribute("d");
    await drag(page, card(page, "p2"), -25, -35);
    expect((await snapshot(page)).project.diagram).toEqual(
      fixed.project.diagram,
    );
    expect(
      await page.locator('[data-edge="r1"] .connector-path').getAttribute("d"),
    ).not.toBe(path);
    await label(page, "r:r1").click();
    await page
      .locator('#diagramTools [data-action="unlock-placement"]')
      .click();
    await expect(page.locator("[data-route-point]")).toHaveCount(1);
    await drag(page, label(page, "r:r1"));
    expect((await snapshot(page)).project.diagram["r:r1"].label).not.toEqual(
      fixed.project.diagram["r:r1"].label,
    );
    await page.screenshot({ path: "test-results/placement-locks-desktop.png" });
  });
  test("all automatic layouts respect fixed people, sources, assets and route captions without overlapping fixed cards", async ({
    page,
  }) => {
    await fixture(page);
    await edit(page);
    await page.locator('[data-action="diagram-select-items"]').click();
    for (const id of ["p1", "d1", "a1"]) await card(page, id).click();
    await label(page, "r:r1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    const fixed = (await snapshot(page)).project;
    for (const style of ["generations", "circle", "network"]) {
      await page.locator("#graphLayout").selectOption(style);
      await expect(page.locator("#graphLayout")).toBeEnabled({
        timeout: 30000,
      });
      const p = (await snapshot(page)).project;
      expect(position(p.people[0])).toEqual(position(fixed.people[0]));
      expect(position(p.documents[0])).toEqual(position(fixed.documents[0]));
      expect(position(p.property[0])).toEqual(position(fixed.property[0]));
      expect(p.diagram["r:r1"]).toEqual(fixed.diagram["r:r1"]);
      const all = [
        ...p.people.map((p) => ({ ...p, w: 280, h: 212 })),
        ...p.documents.map((p) => ({ ...p, w: 228, h: 128 })),
        ...p.property.map((p) => ({ ...p, w: 245, h: 128 })),
      ];
      for (const a of all.filter((a) => !["p1", "d1", "a1"].includes(a.id)))
        for (const b of all.filter((b) => ["p1", "d1", "a1"].includes(b.id)))
          expect(
            a.x + a.w <= b.x ||
              b.x + b.w <= a.x ||
              a.y + a.h <= b.y ||
              b.y + b.h <= a.y,
          ).toBe(true);
    }
    // Direct-connection layout leaves outsiders untouched as well as the fixed root.
    await page.evaluate(async () => {
      const base = document.querySelector('script[type="module"]').src;
      const { select } = await import(new URL("ui/render.js", base).href);
      select("person", "p1");
      const { focusDirectConnections } = await import(
        new URL("features/direct-connections.js", base).href
      );
      focusDirectConnections();
    });
    const before = (await snapshot(page)).project;
    await page.locator("#graphLayout").selectOption("generations");
    await expect(page.locator("#graphLayout")).toBeEnabled();
    const after = (await snapshot(page)).project;
    expect(position(after.people[0])).toEqual(position(before.people[0]));
    for (const id of ["p4", "p5"])
      expect(position(after.people.find((p) => p.id === id))).toEqual(
        position(before.people.find((p) => p.id === id)),
      );
  });
  test("collapsed groups and headings can be fixed; fixed members block group dragging and survive expansion", async ({
    page,
  }) => {
    await fixture(page);
    await edit(page);
    await label(page, "g:g1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    const heading = (await snapshot(page)).project.diagram["g:g1"].label;
    await drag(page, label(page, "g:g1"));
    expect((await snapshot(page)).project.diagram["g:g1"].label).toEqual(
      heading,
    );
    await page.locator('#diagramTools [data-action="diagram-tools"]').click();
    await label(page, "g:g1").click();
    await edit(page);
    await page.locator('[data-action="diagram-select-items"]').click();
    await card(page, "g1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    const fixed = (await snapshot(page)).project;
    await page.locator('[data-action="diagram-select-items"]').click();
    await drag(page, card(page, "g1"));
    expect((await snapshot(page)).project.people).toEqual(fixed.people);
    await page.locator("#graphLayout").selectOption("circle");
    await expect(page.locator("#graphLayout")).toBeEnabled();
    const after = (await snapshot(page)).project;
    for (const person of fixed.people.filter((p) => p.groupIds.includes("g1")))
      expect(position(after.people.find((p) => p.id === person.id))).toEqual(
        position(person),
      );
    await page
      .locator('#diagramTools [data-action="unlock-placement"]')
      .click();
    await drag(page, card(page, "g1"));
    expect((await snapshot(page)).project.people[0].x).not.toBe(
      fixed.people[0].x,
    );
  });
  test("an individually fixed member prevents a collapsed group from moving while expanded free members still move", async ({
    page,
  }) => {
    await fixture(page);
    await edit(page);
    await card(page, "p1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    await page.locator('#sidebar [data-toggle-group="g1"]').click();
    await page.locator('[data-action="fit"]').click();
    const fixed = (await snapshot(page)).project,
      transform = await page
        .locator('[data-node="g1"]')
        .getAttribute("transform");
    await drag(page, card(page, "g1"));
    expect((await snapshot(page)).project.people).toEqual(fixed.people);
    await page.locator("#graphLayout").selectOption("generations");
    await expect(page.locator("#graphLayout")).toBeEnabled();
    expect(position((await snapshot(page)).project.people[0])).toEqual(
      position(fixed.people[0]),
    );
    expect(
      await page.locator('[data-node="g1"]').getAttribute("transform"),
    ).toBe(transform);
    await page.locator('#sidebar [data-toggle-group="g1"]').click();
    await page.locator('[data-action="fit"]').click();
    const free = (await snapshot(page)).project.people[1];
    await drag(page, card(page, "p2"), 30, 20);
    expect(position((await snapshot(page)).project.people[1])).not.toEqual(
      position(free),
    );
    expect(position((await snapshot(page)).project.people[0])).toEqual(
      position(fixed.people[0]),
    );
  });
  test("the ordinary map toolbar fixes cards and captures automatic captions without opening Placement", async ({
    page,
  }) => {
    await fixture(page);
    await card(page, "p1").click();
    await page.locator('#graphToolbar [data-action="lock-placement"]').click();
    const fixed = (await snapshot(page)).project.people[0];
    await drag(page, card(page, "p1"));
    expect(position((await snapshot(page)).project.people[0])).toEqual(
      position(fixed),
    );
    await label(page, "r:r2").click();
    await page.locator('#graphToolbar [data-action="lock-placement"]').click();
    const line = (await snapshot(page)).project.diagram["r:r2"];
    expect(line.style).toBe("auto");
    expect(line.label).toBeTruthy();
    await drag(page, card(page, "p3"), -30, 20);
    expect((await snapshot(page)).project.diagram["r:r2"]).toEqual(line);
    await page
      .locator('#graphToolbar [data-action="unlock-placement"]')
      .click();
    expect(
      (await snapshot(page)).project.placementLocks.connectors,
    ).not.toContain("r:r2");
  });
  test("draft, ZIP, saved views and image exports retain locks and restore only unfixed objects", async ({
    page,
  }) => {
    await fixture(page);
    await edit(page);
    await page.locator('#graphToolbar [data-action="saved-map-views"]').click();
    await page.locator('[name="map-view-name"]').fill("Earlier arrangement");
    await page.locator('#modal button[type="submit"]').click();
    await drag(page, card(page, "p1"));
    await card(page, "p1").click();
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    await drag(page, label(page, "r:r1"));
    await page.locator('#diagramTools [data-action="lock-placement"]').click();
    const fixed = (await snapshot(page)).project;
    await page.locator('#graphToolbar [data-action="saved-map-views"]').click();
    await page.locator("[data-restore-view]").click();
    expect(position((await snapshot(page)).project.people[0])).toEqual(
      position(fixed.people[0]),
    );
    expect((await snapshot(page)).project.diagram["r:r1"]).toEqual(
      fixed.diagram["r:r1"],
    );
    await page.locator('[data-action="export"]').click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-export="zip"]').click(),
    ]);
    const buffer = await readFile(await download.path());
    await page.locator("#modal [data-close]").first().click();
    await page.locator("#importInput").setInputFiles({
      name: "fixed.zip",
      mimeType: "application/zip",
      buffer,
    });
    await page.locator('#modal button[type="submit"]').click();
    expect((await snapshot(page)).project.placementLocks).toEqual(
      fixed.placementLocks,
    );
    await expect(page.locator("#saveState")).toContainText("Draft saved");
    await page.reload();
    await page.locator("#startContinue").click();
    expect((await snapshot(page)).project.placementLocks).toEqual(
      fixed.placementLocks,
    );
    const svg = await page.evaluate(async () => {
      const { fullSVG } = await import(
        new URL(
          "features/archive.js",
          document.querySelector('script[type="module"]').src,
        ).href
      );
      return (await fullSVG("full")).svg;
    });
    expect(svg).not.toContain('class="placement-lock-indicator"');
  });
});
for (const [language, width] of [
  ["en", 390],
  ["uk", 320],
  ["ru", 320],
]) {
  test.describe(language + " fixed placement on phone", () => {
    test.use({
      viewport: { width, height: 900 },
      isMobile: true,
      hasTouch: true,
    });
    test("native touch respects fixed cards and captions, unlocking restores movement and controls fit", async ({
      page,
    }) => {
      await fixture(page, true);
      await page.locator("#appShell [data-language]").selectOption(language);
      await edit(page);
      await card(page, "p1").tap();
      await page.locator('#diagramTools [data-action="lock-placement"]').tap();
      const fixed = await snapshot(page),
        session = await page.context().newCDPSession(page);
      // Card movement is explicitly enabled, so the lock is what prevents translation.
      await page.evaluate(async () => {
        const { state } = await import(
          new URL(
            "core/state.js",
            document.querySelector('script[type="module"]').src,
          ).href
        );
        state.touchMove = true;
      });
      async function touchDrag(target) {
        const b = await target.boundingBox(),
          start = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 0 };
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [start],
        });
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ ...start, x: start.x + 18, y: start.y + 16 }],
        });
        await session.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      }
      await touchDrag(card(page, "p1"));
      expect(position((await snapshot(page)).project.people[0])).toEqual(
        position(fixed.project.people[0]),
      );
      await page.locator('[data-action="fit"]').tap();
      await label(page, "r:r1").tap();
      await page.locator('#diagramTools [data-action="lock-placement"]').tap();
      const line = (await snapshot(page)).project.diagram["r:r1"];
      await touchDrag(label(page, "r:r1"));
      expect((await snapshot(page)).project.diagram["r:r1"]).toEqual(line);
      await card(page, "p1").tap();
      await page
        .locator('#diagramTools [data-action="unlock-placement"]')
        .tap();
      const before = (await snapshot(page)).project.people[0];
      await touchDrag(card(page, "p1"));
      expect(position((await snapshot(page)).project.people[0])).not.toEqual(
        position(before),
      );
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
      await page.screenshot({
        path: "test-results/placement-locks-" + language + "-phone.png",
      });
      await session.detach();
    });
  });
}
