import { test, expect } from "@playwright/test";

async function project(page) {
  return page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return state.project;
  });
}
async function save(page) {
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("family member search preserves checked people across queries, save and editing", async ({
  page,
}) => {
  await page.locator('[data-action="add-group"]').click();
  await page.locator('#modal [name="name"]').fill("Surname search");
  const search = page.locator("[data-person-members] [data-person-query]");
  await search.fill("john doe");
  await page.locator('[name="members"][value="p1"]').check();
  await search.fill("WARD CASEY");
  await expect(page.locator('[name="members"][value="p8"]')).toBeVisible();
  await expect(page.locator('[name="members"][value="p1"]')).not.toBeVisible();
  await page.locator('[name="members"][value="p8"]').check();
  await search.fill("no-such-surname");
  await expect(page.locator("[data-person-empty]")).toBeVisible();
  await expect(page.locator("[data-person-results]")).toContainText(
    "Selected: 2",
  );
  await search.press("Enter");
  await expect(page.locator("#modal")).toBeVisible();
  await search.press("Escape");
  await expect(search).toHaveValue("");
  await expect(page.locator('[name="members"][value="p1"]')).toBeChecked();
  await expect(page.locator('[name="members"][value="p8"]')).toBeChecked();
  await search.fill("casey");
  await save(page);
  const result = await project(page),
    groupId = result.groups.at(-1).id;
  expect(
    result.people.filter((p) => p.groupIds.includes(groupId)).map((p) => p.id),
  ).toEqual(["p1", "p8"]);
  await page.locator(`[data-edit-group="${groupId}"]`).click();
  await expect(page.locator("[data-person-results]")).toContainText(
    "Selected: 2",
  );
  await search.fill("john doe");
  await page.locator('[name="members"][value="p1"]').uncheck();
  await save(page);
  expect(
    (await project(page)).people
      .filter((p) => p.groupIds.includes(groupId))
      .map((p) => p.id),
  ).toEqual(["p8"]);
});

test("relationship searches are independent, keep the selection on no results and support keyboard entry", async ({
  page,
}) => {
  await page.locator('#viewActions [data-action="add-relation"]').click();
  const pickers = page.locator("[data-person-picker]");
  const from = page.locator('[name="from"]'),
    to = page.locator('[name="to"]');
  const before = [await from.inputValue(), await to.inputValue()];
  await pickers.nth(0).locator("[data-person-query]").fill("missing-surname");
  await expect(from).toHaveValue(before[0]);
  await expect(to).toHaveValue(before[1]);
  await expect(from.locator("optgroup")).toHaveAttribute(
    "label",
    "Current selection",
  );
  await expect(pickers.nth(0).locator("[data-person-results]")).toContainText(
    "No people match",
  );
  await pickers.nth(0).locator("[data-person-query]").fill("ward casey");
  await expect(from.locator('option[value="p8"]')).toHaveCount(1);
  await pickers.nth(0).locator("[data-person-query]").press("Enter");
  await expect(from).toBeFocused();
  await expect(page.locator("#modal")).toBeVisible();
  await from.selectOption("p8");
  await pickers.nth(1).locator("[data-person-query]").fill("DOE JAMIE");
  await to.selectOption("p3");
  await pickers.nth(1).locator("[data-person-query]").press("Escape");
  await expect(to).toHaveValue("p3");
  await page.locator('[name="type"]').selectOption("reports_to");
  await expect(pickers.nth(0).locator("[data-person-query]")).toHaveAttribute(
    "aria-label",
    "Search surname or name: Subordinate",
  );
  await expect(pickers.nth(1).locator("[data-person-query]")).toHaveAttribute(
    "aria-label",
    "Search surname or name: Manager / supervisor",
  );
  await page.locator('[name="type"]').selectOption("acquaintance");
  await save(page);
  const relation = (await project(page)).relations.at(-1);
  expect([relation.from, relation.to, relation.type]).toEqual([
    "p8",
    "p3",
    "acquaintance",
  ]);
  await page.locator(`[data-edit-relation="${relation.id}"]`).click();
  await expect(from).toHaveValue("p8");
  await expect(to).toHaveValue("p3");
  await pickers.nth(0).locator("[data-person-query]").fill("absent");
  await save(page);
  expect((await project(page)).relations.at(-1)).toEqual(relation);
});

test("dynamic quick relationship rows search former surnames and keep disabled searches out of submission", async ({
  page,
}) => {
  await page.locator('#viewActions [data-action="add-person"]').click();
  await page.locator('#modal [name="name"]').fill("Parker Doe");
  await expect(
    page.locator("[data-creation-links] [data-person-query]"),
  ).toBeDisabled();
  await page.locator('[name="create-relationships"]').check();
  await page
    .locator("[data-creation-links] [data-person-query]")
    .fill("jamie doe");
  await page.locator('[name="new-link-person"]').selectOption("p3");
  await page.locator("[data-add-creation-link]").click();
  const second = page.locator("[data-creation-link]").nth(1);
  await expect(second.locator("[data-person-query]")).toBeFocused();
  await expect(second.locator('[name="new-link-person"]')).toHaveValue("");
  await second.locator("[data-person-query]").fill("ward casey");
  await second.locator('[name="new-link-person"]').selectOption("p8");
  await save(page);
  let result = await project(page);
  expect(result.relations.slice(-2).map((r) => [r.from, r.to, r.type])).toEqual(
    [
      ["p3", result.people.at(-1).id, "parent"],
      ["p8", result.people.at(-1).id, "parent"],
    ],
  );
  await page.locator('#viewActions [data-action="add-person"]').click();
  await page.locator('#modal [name="name"]').fill("Quinn Doe");
  await page.locator('[name="create-relationships"]').check();
  await page
    .locator("[data-creation-links] [data-person-query]")
    .fill("no-result");
  await page.locator('[name="create-relationships"]').uncheck();
  await save(page);
  result = await project(page);
  expect(result.relations).toHaveLength(165);
});

for (const [language, width, hint] of [
  ["en", 1280, "By surname"],
  ["uk", 320, "За прізвищем"],
  ["ru", 390, "По фамилии"],
]) {
  test(`search controls and alphabetical lists fit ${language} at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.locator("#appShell [data-language]").selectOption(language);
    if (width < 760) await page.locator('[data-action="menu"]').click();
    await page.locator('[data-action="add-group"]').click();
    await expect(page.locator("[data-person-results]")).toContainText(hint);
    const people = (await project(page)).people;
    const expected = [...people]
      .sort(
        (a, b) =>
          a.name
            .split(" ")
            .at(-1)
            .localeCompare(b.name.split(" ").at(-1), language, {
              sensitivity: "base",
              numeric: true,
            }) ||
          a.name.localeCompare(b.name, language, {
            sensitivity: "base",
            numeric: true,
          }) ||
          a.id.localeCompare(b.id, language, { numeric: true }),
      )
      .map((p) => p.id);
    expect(
      await page
        .locator('[name="members"]')
        .evaluateAll((inputs) => inputs.map((input) => input.value)),
    ).toEqual(expected);
    await page.locator("[data-person-query]").fill("casey ward");
    await page.locator('[name="members"][value="p8"]').check();
    await page.addStyleTag({
      content:
        ".modal-body { scrollbar-gutter: stable; } .modal-body::-webkit-scrollbar { width: 15px; }",
    });
    expect(
      await page
        .locator("#modal .modal-body")
        .evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `test-results/person-members-${language}-${width}.png`,
    });
    await page.locator("#modal [data-close]").first().click();
    if (width < 760) await page.locator('[data-action="menu"]').click();
    await page.locator('#viewActions [data-action="add-relation"]').click();
    expect(
      await page
        .locator('[name="from"] option')
        .evaluateAll((options) => options.map((option) => option.value)),
    ).toEqual(expected);
    await page.locator("[data-person-query]").first().fill("casey ward");
    await page.locator('[name="from"]').selectOption("p8");
    expect(
      await page
        .locator("#modal .modal-body")
        .evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `test-results/person-relationship-${language}-${width}.png`,
    });
  });
}
