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
      camera: state.camera,
      selection: [...state.multiSelection],
      view: state.view,
    };
  });
}
async function openPerson(page, name) {
  await page.locator('#viewActions [data-action="add-person"]').click();
  await page.locator('#modal [name="name"]').fill(name);
}
async function save(page) {
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}
async function graphClick(page, id, modifiers = []) {
  await page.evaluate(async (id) => {
    const camera = await import(
      new URL(
        "graph/camera.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    camera.focusPerson(id);
  }, id);
  await page
    .locator(`.node[data-node="${id}"] .card`)
    .click({ position: { x: 30, y: 35 }, modifiers });
}
async function visibleCard(page, id) {
  const graph = await page.locator("#graph").boundingBox();
  const card = await page
    .locator(`.node[data-node="${id}"] .card`)
    .boundingBox();
  expect(card.width).toBeGreaterThan(180);
  expect(card.x).toBeGreaterThanOrEqual(graph.x);
  expect(card.y).toBeGreaterThanOrEqual(graph.y);
  expect(card.x + card.width).toBeLessThanOrEqual(graph.x + graph.width + 1);
  expect(card.y + card.height).toBeLessThanOrEqual(graph.y + graph.height + 1);
  for (const overlay of [".graph-tools", ".legend"]) {
    const box = await page.locator(overlay).boundingBox();
    expect(
      box &&
        card.x < box.x + box.width &&
        box.x < card.x + card.width &&
        card.y < box.y + box.height &&
        box.y < card.y + card.height,
      `The new card must not overlap ${overlay}`,
    ).toBe(false);
  }
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("new people stay near the current view, remain readable and never move or overlap existing people", async ({
  page,
}) => {
  await graphClick(page, "p8");
  const before = await snapshot(page);
  await openPerson(page, "Parker Doe");
  await expect(page.locator('[name="create-relationships"]')).not.toBeChecked();
  await save(page);
  const after = await snapshot(page),
    added = after.project.people.at(-1);
  expect(after.project.people.slice(0, -1)).toEqual(before.project.people);
  expect(after.project.relations).toEqual(before.project.relations);
  expect(after.camera.z).toBeGreaterThanOrEqual(0.65);
  expect(
    Math.abs(added.x - before.project.people.find((p) => p.id === "p8").x),
  ).toBeLessThan(1000);
  expect(
    before.project.people.every(
      (p) =>
        added.x + 280 <= p.x ||
        p.x + 280 <= added.x ||
        added.y + 212 <= p.y ||
        p.y + 212 <= added.y,
    ),
  ).toBe(true);
  await visibleCard(page, added.id);
  await expect(page.locator("#inspector h2")).toHaveText("Parker Doe");
});

test("Ctrl, Cmd and normal-then-modified selections prefill relationships in the user's order", async ({
  page,
}) => {
  await graphClick(page, "p8", ["Control"]);
  await graphClick(page, "p3", ["Control"]);
  expect((await snapshot(page)).selection).toEqual(["p8", "p3"]);
  await expect(page.locator("#graphContext")).toContainText(
    "Casey Roe → Jamie Roe",
  );
  await page.locator('[data-action="link-selected"]').click();
  await expect(page.locator('#modal [name="from"]')).toHaveValue("p8");
  await expect(page.locator('#modal [name="to"]')).toHaveValue("p3");
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-action="clear-selection"]').click();
  await page.locator('#personList [data-person="p3"]').click();
  await page
    .locator('#personList [data-person="p8"]')
    .click({ modifiers: ["Meta"] });
  expect((await snapshot(page)).selection).toEqual(["p3", "p8"]);
  await page.locator('#viewActions [data-action="add-relation"]').click();
  await expect(page.locator('#modal [name="from"]')).toHaveValue("p3");
  await expect(page.locator('#modal [name="to"]')).toHaveValue("p8");
  await page.locator("#modal [data-close]").first().click();
  await openPerson(page, "Quinn Doe");
  await page.locator('[name="create-relationships"]').check();
  await expect(page.locator('[name="new-link-person"]').nth(0)).toHaveValue(
    "p3",
  );
  await expect(page.locator('[name="new-link-person"]').nth(1)).toHaveValue(
    "p8",
  );
  await page.locator("#modal [data-close]").first().click();
  expect((await snapshot(page)).project.people).toHaveLength(99);
  await page.locator('[data-action="clear-selection"]').click();
  await page
    .locator('#personList [data-person="p8"]')
    .click({ modifiers: ["Control"] });
  await page
    .locator('#personList [data-person="p3"]')
    .click({ modifiers: ["Control"] });
  expect((await snapshot(page)).selection).toEqual(["p8", "p3"]);
});

test("creating a person reveals it through active analytical filters and collapsed family groups", async ({
  page,
}) => {
  await page.locator(".person-filter-toggle").click();
  await page.locator('[data-preset="deceased"]').click();
  await save(page);
  await expect(page.locator("#personFilterBar")).toBeVisible();
  await openPerson(page, "Parker Doe");
  await page.locator('[name="lifeStatus"]').selectOption("living");
  await save(page);
  let after = await snapshot(page);
  await expect(page.locator("#personFilterBar")).not.toBeVisible();
  await visibleCard(page, after.project.people.at(-1).id);
  const groupId = after.project.groups[0].id;
  await page.locator(`[data-group-filter="${groupId}"]`).click();
  const group = after.project.groups.find((g) => g.id === groupId);
  if (!group.collapsed) {
    await page.locator(`[data-edit-group="${groupId}"]`).click();
    await page.locator(`#modal [data-toggle-group="${groupId}"]`).click();
  }
  await openPerson(page, "Quinn Doe");
  await expect(
    page.locator(`#modal [name="groupIds"][value="${groupId}"]`),
  ).toBeChecked();
  await save(page);
  after = await snapshot(page);
  expect(after.project.groups.find((g) => g.id === groupId).collapsed).toBe(
    false,
  );
  expect(after.project.people.at(-1).groupIds).toContain(groupId);
  await visibleCard(page, after.project.people.at(-1).id);
});

test("a child and both parenthood relationships save, undo, redo and restore together", async ({
  page,
}) => {
  const before = await snapshot(page);
  await openPerson(page, "Quinn Roe");
  await page.locator('[name="create-relationships"]').check();
  await page.locator('[name="new-link-person"]').selectOption("p3");
  await page.locator("[data-add-creation-link]").click();
  await page.locator('[name="new-link-person"]').nth(1).selectOption("p8");
  await page.locator(".creation-link-details > summary").first().click();
  await page.locator('[name="new-link-fromDate"]').first().fill("2020-04-05");
  await page.locator('[name="new-link-notes"]').first().fill("Family account");
  await page
    .locator('[name="new-link-verification"]')
    .first()
    .selectOption("unverified");
  await save(page);
  let after = await snapshot(page);
  const added = after.project.people.at(-1);
  expect(after.project.people).toHaveLength(before.project.people.length + 1);
  expect(
    after.project.relations.slice(-2).map((r) => [r.from, r.to, r.type]),
  ).toEqual([
    ["p3", added.id, "parent"],
    ["p8", added.id, "parent"],
  ]);
  expect(after.project.relations.at(-2).verification).toBe("unverified");
  expect(after.project.relations.at(-2).fromDate).toBe("2020-04-05");
  expect(added.y).toBeGreaterThan(
    before.project.people.find((p) => p.id === "p3").y,
  );
  await visibleCard(page, added.id);
  await page.locator('[data-action="undo"]').click();
  after = await snapshot(page);
  expect(after.project.people).toEqual(before.project.people);
  expect(after.project.relations).toEqual(before.project.relations);
  await page.locator('[data-action="redo"]').click();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  after = await snapshot(page);
  expect(after.project.people.some((p) => p.id === added.id)).toBe(true);
  expect(after.project.relations.filter((r) => r.to === added.id)).toHaveLength(
    2,
  );
});

test("invalid cycles, duplicate parents and chronology keep all creation changes unsaved", async ({
  page,
}) => {
  const before = await snapshot(page);
  await openPerson(page, "Quinn Doe");
  await page.locator('[name="create-relationships"]').check();
  await page.locator('[name="new-link-person"]').selectOption("p3");
  await page.locator("[data-add-creation-link]").click();
  await page.locator('[name="new-link-person"]').nth(1).selectOption("p3");
  await page.locator('[name="new-link-role"]').nth(1).selectOption("parent");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).toContainText("generation cycle");
  expect((await snapshot(page)).project).toEqual(before.project);
  await page.locator('[name="new-link-role"]').nth(1).selectOption("child");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).toContainText("already exists");
  await page.locator("[data-remove-creation-link]").nth(1).click();
  await page.locator(".creation-link-details > summary").click();
  await page.locator('[name="new-link-fromDate"]').fill("2026");
  await page.locator('[name="new-link-toDate"]').fill("2025");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).toContainText("precede");
  await page.locator('[name="create-relationships"]').uncheck();
  await save(page);
  expect((await snapshot(page)).project.relations).toEqual(
    before.project.relations,
  );
});

for (const [role, type, incoming] of [
  ["parent", "parent", false],
  ["adopted_child", "adopted", true],
  ["spouse", "spouse", false],
  ["supervisor", "reports_to", true],
]) {
  test(`quick creation records the ${role} direction and works in People & profiles`, async ({
    page,
  }) => {
    await page.locator('[data-view="people"]').click();
    await openPerson(page, "Parker Doe");
    await page.locator('[name="create-relationships"]').check();
    await page.locator('[name="new-link-person"]').selectOption("p8");
    await page.locator('[name="new-link-role"]').selectOption(role);
    await save(page);
    const after = await snapshot(page),
      added = after.project.people.at(-1),
      relation = after.project.relations.at(-1);
    expect(after.view).toBe("people");
    expect([relation.from, relation.to, relation.type]).toEqual(
      incoming ? ["p8", added.id, type] : [added.id, "p8", type],
    );
    if (role === "spouse") expect(relation.unionKind).toBe("marriage");
    await expect(page.locator(".full-profile-overview h2")).toHaveText(
      "Parker Doe",
    );
  });
}

for (const language of ["en", "uk", "ru"]) {
  for (const width of [320, 390, 768]) {
    test(`quick links fit ${width}px in ${language}, with a visible new card`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.locator("#appShell [data-language]").selectOption(language);
      await openPerson(page, "Parker Doe");
      await page.locator('[name="create-relationships"]').check();
      await page.locator('[name="new-link-person"]').selectOption("p8");
      await page.locator("[data-add-creation-link]").click();
      await page.locator('[name="new-link-person"]').nth(1).selectOption("p3");
      await page.locator(".creation-link-details > summary").first().click();
      await page.addStyleTag({
        content:
          ".modal-body { scrollbar-gutter: stable; } .modal-body::-webkit-scrollbar { width: 15px; } .creation-links .btn { font-size: 16px; }",
      });
      expect(
        await page
          .locator("#modal")
          .evaluate((el) => el.scrollWidth - el.clientWidth),
      ).toBeLessThanOrEqual(1);
      expect(
        await page
          .locator(".profile-editor-content")
          .evaluate((el) => el.scrollWidth - el.clientWidth),
      ).toBeLessThanOrEqual(1);
      await save(page);
      await visibleCard(page, (await snapshot(page)).project.people.at(-1).id);
      if (width <= 760)
        await expect(page.locator("#inspector")).not.toHaveClass(/open/);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
    });
  }
}
