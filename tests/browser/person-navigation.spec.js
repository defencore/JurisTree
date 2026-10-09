import { test, expect } from "@playwright/test";

async function camera(page) {
  return page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return { ...state.camera };
  });
}

async function expectReadableCard(page, id) {
  const graph = await page.locator("#graph").boundingBox(),
    card = await page.locator(`.node[data-node="${id}"] .card`).boundingBox();
  expect(card.width).toBeGreaterThan(180);
  expect(card.x).toBeGreaterThanOrEqual(graph.x);
  expect(card.y).toBeGreaterThanOrEqual(graph.y);
  expect(card.x + card.width).toBeLessThanOrEqual(graph.x + graph.width + 1);
  expect(card.y + card.height).toBeLessThanOrEqual(graph.y + graph.height + 1);
  for (const selector of [
    ".legend",
    ".graph-tools",
    "#inspector",
    "#sidebar",
  ]) {
    const box = await page.locator(selector).boundingBox();
    expect(
      Boolean(
        box &&
        card.x < box.x + box.width &&
        card.x + card.width > box.x &&
        card.y < box.y + box.height &&
        card.y + card.height > box.y,
      ),
      `The focused card must not overlap ${selector}`,
    ).toBe(false);
  }
  await expect(page.locator(`.node[data-node="${id}"]`)).toHaveAttribute(
    "data-kinship-role",
    "self",
  );
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

for (const [width, height, language] of [
  [1280, 900, "en"],
  [1024, 768, "ru"],
  [390, 844, "uk"],
  [320, 740, "uk"],
]) {
  test.describe(`Search navigation at ${width}px`, () => {
    test.use({
      viewport: { width, height },
      hasTouch: width <= 1100,
      isMobile: width <= 760,
    });
    test("centers and enlarges the result, clears covering panels and allows reopening the profile", async ({
      page,
    }) => {
      await page.locator("#appShell [data-language]").selectOption(language);
      await page.locator('[data-action="fit"]').click();
      const before = await camera(page);
      if (width <= 760) await page.locator('[data-action="menu"]').tap();
      await page.locator('[data-view="people"]').click();
      const search = page.locator("#globalSearch");
      await search.fill("name:Robin Guitar");
      if (width > 1100) await search.press("Enter");
      else
        await page
          .locator('[data-search-kind="person"][data-search-id="p6"]')
          .tap();
      await expect(page.locator("#globalSearchResults")).toBeHidden();
      await expect(page.locator("#graph")).toBeFocused();
      expect((await camera(page)).z).toBeGreaterThan(before.z * 2);
      await expectReadableCard(page, "p6");
      await page.screenshot({
        path: `test-results/person-search-${width}.png`,
      });
      if (width <= 1100) {
        await expect(page.locator("#inspector")).not.toHaveClass(/open/);
        await page.locator('.node[data-node="p6"] .card').tap();
        await expect(page.locator("#inspector")).toHaveClass(/open/);
        await expect(page.locator("#canvasWrap")).toBeVisible();
        await expect(page.locator("#modal")).not.toBeVisible();
      }
      await expect(page.locator("#inspector h2")).toHaveText("Robin Roe");
      await expect(
        page.locator('#inspector [data-full-profile="p6"]'),
      ).toBeVisible();
      if (width <= 1100) {
        await search.fill("name:Casey Roe");
        await page
          .locator('[data-search-kind="person"][data-search-id="p8"]')
          .tap();
        await expect(page.locator("#inspector")).not.toHaveClass(/open/);
        await expectReadableCard(page, "p8");
      }
    });
  });
}

test("sidebar name search and favorites center the person without changing card positions or history", async ({
  page,
}) => {
  const original = await page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return { people: state.project.people, history: state.history.length };
  });
  await page.locator("#peopleSearch").fill("Robin Roe");
  await page.locator('#personList [data-person="p6"]').click();
  await expectReadableCard(page, "p6");
  await page.locator('#inspector [data-favorite="p6"]').click();
  await page.locator('[data-action="fit"]').click();
  await page.locator('#favoriteList [data-fast-person="p6"]').click();
  await expectReadableCard(page, "p6");
  const after = await page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return { people: state.project.people, history: state.history.length };
  });
  expect(after.people.map(({ id, x, y }) => ({ id, x, y }))).toEqual(
    original.people.map(({ id, x, y }) => ({ id, x, y })),
  );
  expect(after.history).toBe(original.history + 1);
});

test("a search result reveals people outside the current family and inside collapsed groups", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base).href);
    const target = state.project.people.find((p) => p.id === "p6");
    for (const group of state.project.groups)
      if (target.groupIds.includes(group.id)) group.collapsed = true;
    state.groupFilter = state.project.groups.find(
      (g) => !target.groupIds.includes(g.id),
    ).id;
    const { render } = await import(new URL("ui/render.js", base).href);
    render();
  });
  await expect(page.locator('.node[data-node="p6"]')).toHaveCount(0);
  await page.locator("#globalSearch").fill("name:Robin Guitar");
  await page
    .locator('[data-search-kind="person"][data-search-id="p6"]')
    .click();
  await expectReadableCard(page, "p6");
  await expect(page.locator('[data-group-filter=""]')).toHaveClass(/active/);
});

test("a floating inspector does not cover the focused card and stays in its chosen position", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p5"]').click();
  const header = await page.locator(".inspector-header").boundingBox();
  await page.mouse.move(header.x + 35, header.y + 20);
  await page.mouse.down();
  await page.mouse.move(300, 160, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator("#inspector")).toHaveAttribute("data-floating", "");
  const panel = await page.locator("#inspector").boundingBox();
  await page.locator("#globalSearch").fill("name:Robin Guitar");
  await page
    .locator('[data-search-kind="person"][data-search-id="p6"]')
    .click();
  await expectReadableCard(page, "p6");
  expect(await page.locator("#inspector").boundingBox()).toEqual(panel);
});

test("clicking a graph card opens its profile without moving or zooming the map", async ({
  page,
}) => {
  await page.locator("#globalSearch").fill("name:Robin Guitar");
  await page
    .locator('[data-search-kind="person"][data-search-id="p6"]')
    .click();
  const before = await camera(page);
  await page.locator('.node[data-node="p6"] .card').click();
  expect(await camera(page)).toEqual(before);
});
