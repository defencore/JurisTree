import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("divorced spouses have explicit edge, search, inspector and former-spouse labels in every language", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p7"]').click();
  for (const [language, label, former, current] of [
    ["en", "Divorced", "Former wife", "Registered marriage"],
    ["uk", "Розлучені", "Колишня дружина", "Зареєстрований шлюб"],
    ["ru", "Разведены", "Бывшая жена", "Зарегистрированный брак"],
  ]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    await expect(page.locator('[data-edge="r13"]')).toContainText(label);
    await expect(page.locator('[data-edge="r13"]')).not.toContainText(current);
    await expect(page.locator('[data-edge="r4"]')).toContainText(current);
    await expect(
      page.locator('.node[data-node="p9"] .person-card-role text'),
    ).toHaveText(former);
    await page.locator("#globalSearch").fill(`type:relation ${label}`);
    const result = page.locator(
      '[data-search-kind="relation"][data-search-id="r13"]',
    );
    await expect(result).toContainText(label);
    await result.click();
    await expect(page.locator("#inspector h2")).toHaveText(label);
    await page.locator('#personList [data-person="p7"]').click();
    await page.locator('#inspector [data-biography="p7"]').click();
    await expect(page.locator(".biography")).toContainText(former);
    await page.locator("#modal [data-close]").first().click();
  }
  await page.locator(".topbar [data-language]").selectOption("en");
  await page.locator("#globalSearch").fill("type:relation Divorced");
  await page
    .locator('[data-search-kind="relation"][data-search-id="r13"]')
    .click();
  await page.locator('[data-edit-relation="r13"]').click();
  await page.locator('[name="relationship-status"]').selectOption("current");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator('[data-edge="r13"]')).toContainText(
    "Registered marriage",
  );
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator('[data-edge="r13"]')).toContainText("Divorced");
});

for (const [language, width, burialLabel] of [
  ["en", 1280, "Burial"],
  ["uk", 390, "Поховання"],
  ["ru", 320, "Погребение"],
]) {
  test(`burial details are discoverable, editable and searchable on ${width}px in ${language}`, async ({
    page,
  }) => {
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.setViewportSize({ width, height: 900 });
    await page.locator("#globalSearch").fill('name:"John Doe"');
    await page
      .locator('[data-search-kind="person"][data-search-id="p1"]')
      .click();
    if (width <= 1100)
      await page.locator('.node[data-node="p1"] .card').click();
    await page.locator('#inspector [data-edit-person="p1"]').click();
    await page.locator("[data-profile-search]").fill(burialLabel);
    await expect(page.locator('[data-profile-panel="death"]')).toBeVisible();
    if (width > 760)
      await page.locator('[data-profile-target="death"]').click();
    else await page.locator("[data-profile-picker]").selectOption("death");
    const burial = page
      .locator(".record-field-group")
      .filter({ has: page.locator('[name="death-burialCemetery"]') });
    await expect(burial.locator("summary")).toHaveText(new RegExp(burialLabel));
    await burial.locator("summary").click();
    await burial
      .locator('[name="death-burialCemetery"]')
      .fill("Maplewood Memorial Park");
    await burial.locator('[name="death-burialCountry"]').fill("Canada");
    await burial.locator('[name="death-burialCity"]').fill("Brookfield");
    await burial
      .locator('[name="death-burialPlace"]')
      .fill("West gate, beside the stone wall");
    await burial.locator('[name="death-burialPlot"]').fill("F-14");
    await burial.locator('[name="death-burialGrave"]').fill("72-B");
    await burial
      .locator('[name="death-burialMapUrl"]')
      .fill("https://maps.example.org/memorial/72-B");
    await burial.locator('[name="death-burialDate"]').fill("2011-10-01");
    await page.locator('#modal button[type="submit"]').click();
    await expect(page.locator("#modalError")).not.toBeEmpty();
    await burial.locator('[name="death-burialDate"]').fill("2011-11-12");
    await page.screenshot({
      path: `test-results/burial-${language}-${width}.png`,
    });
    await page.locator('#modal button[type="submit"]').click();
    await expect(page.locator("#modal")).toBeHidden();
    await page
      .locator("#globalSearch")
      .fill('name:John country:Canada "Maplewood Memorial Park" "72-B"');
    await expect(
      page.locator('[data-search-kind="person"][data-search-id="p1"]'),
    ).toHaveCount(1);
    await page
      .locator('[data-search-kind="person"][data-search-id="p1"]')
      .click();
    if (width <= 1100)
      await page.locator('.node[data-node="p1"] .card').click();
    await page.locator('#inspector [data-biography="p1"]').click();
    for (const text of [
      "Maplewood Memorial Park",
      "Canada",
      "Brookfield",
      "West gate, beside the stone wall",
      "F-14",
      "72-B",
    ])
      await expect(page.locator(".biography")).toContainText(text);
    await expect(
      page.locator(
        '.biography a[href="https://maps.example.org/memorial/72-B"]',
      ),
    ).toHaveCount(1);
  });
}
