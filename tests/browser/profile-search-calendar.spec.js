import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("global search combines hidden profile data, opens all result kinds and refreshes after edits and undo", async ({
  page,
}) => {
  const input = page.locator("#globalSearch");
  await page.locator('[data-group-filter="g1"]').click();
  await page.locator("#peopleSearch").fill("John Doe");
  await input.fill("name:Robin gender:male Guitar");
  await expect(page.locator("[data-search-kind]")).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("#inspector h2")).toHaveText("Robin Roe");
  await expect(page.locator('.node[data-node="p6"]')).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(input).toBeFocused();
  await input.fill("name:Jesse gender:female document:PA7314062 62,5");
  await expect(page.locator('[data-search-kind="person"]')).toHaveCount(1);
  await page.keyboard.press("Enter");
  await page.locator('#inspector [data-edit-person="p5"]').first().click();
  await page.locator('#modal [name="name"]').fill("Jesse Example-Edited");
  await page.locator('#modal button[type="submit"]').click();
  await input.fill('name:"Jesse Example-Edited"');
  await expect(page.locator('[data-search-kind="person"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("#globalSearchResults")).toBeHidden();
  await page.locator('[data-action="undo"]').click();
  await input.focus();
  await expect(page.locator('[data-search-kind="person"]')).toHaveCount(0);
  await input.fill("type:document");
  await page.locator('[data-search-kind="document"]').first().click();
  await expect(page.locator("#modal")).toBeVisible();
  await page.locator("#modal [data-close]").first().click();
  await input.fill("type:relation hostile business");
  await page
    .locator('[data-search-kind="relation"][data-search-id="r17"]')
    .click();
  await expect(
    page.locator('#inspector [data-edit-relation="r17"]'),
  ).toBeVisible();
  await page.locator('#inspector [data-edit-relation="r17"]').click();
  await page.getByText("Nature of the relationship", { exact: true }).click();
  await page.locator('[name="relationship-quality"]').selectOption("mixed");
  await page.locator('[name="relationship-context"]').selectOption("conflict");
  await page
    .locator('[name="relationship-contextNotes"]')
    .fill("Example recorded disagreement");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#inspector")).toContainText(
    "Example recorded disagreement",
  );
  await input.fill('type:relation "Example recorded disagreement"');
  await expect(
    page.locator('[data-search-kind="relation"][data-search-id="r17"]'),
  ).toHaveCount(1);
  for (const language of ["uk", "ru", "en"]) {
    await page.locator("#appShell [data-language]").selectOption(language);
    await input.fill('ім’я:Avery країна:"United Kingdom" стать:небінарна');
    await expect(page.locator('[data-search-kind="person"]')).toHaveCount(1);
  }
});

test("year calendar jumps directly across years and opens months with travel and medical events", async ({
  page,
}) => {
  await page.locator('[data-view="calendar"]').click();
  await page.locator('[data-calendar-mode="year"]').click();
  await page.locator("#calendarYear").fill("2035");
  await page.locator("#calendarYear").press("Tab");
  await expect(page.locator(".calendar-month")).toHaveCount(12);
  await expect(page.locator(".calendar-navigation h2")).toHaveText("2035");
  await page.locator('[data-action="calendar-previous"]').click();
  await expect(page.locator("#calendarYear")).toHaveValue("2034");
  await page.locator("#calendarYear").fill("2026");
  await page.locator("#calendarYear").press("Tab");
  await page.locator('[data-calendar-open-month="2026-10"]').click();
  await expect(page.locator("#calendarMonth")).toHaveValue("2026-10");
  await page.locator("#calendarType").selectOption("travel");
  await page.locator('[data-calendar-day="2026-10-11"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Autumn trip to Portugal",
  );
  await page.locator("#calendarType").selectOption("medical");
  await page.locator('[data-calendar-day="2026-10-22"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Peanut allergy",
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await page.locator('[data-calendar-mode="year"]').click();
  await page.screenshot({
    path: "test-results/mobile-year-calendar.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("#globalSearch")).toBeVisible();
});

test("edits optional physical, medical, skill, weapon, travel, spending and citizenship records and preserves them in ZIP", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p10"]').click();
  await page.locator('#inspector [data-edit-person="p10"]').first().click();
  await page.locator(".profile-additional-sections > summary").click();
  async function add(section) {
    const panel = page
      .locator(".profile-editor-section")
      .filter({ has: page.locator(`[data-add-record="${section}"]`) });
    await panel.locator("summary").first().click();
    await panel.locator(`[data-add-record="${section}"]`).click();
    return panel.locator(".profile-record").last();
  }
  const appearance = await add("appearance");
  await appearance.locator('[name="appearance-heightCm"]').fill("182.5");
  await appearance.locator('[name="appearance-weightKg"]').fill("-1");
  expect(
    await appearance
      .locator('[name="appearance-weightKg"]')
      .evaluate((e) => e.validity.rangeUnderflow),
  ).toBe(true);
  await appearance.locator('[name="appearance-weightKg"]').fill("75");
  await appearance.locator('[name="appearance-glasses"]').selectOption("yes");
  const medical = await add("medical");
  await medical.locator('[name="medical-kind"]').selectOption("restriction");
  await medical
    .locator('[name="medical-title"]')
    .fill("Example dietary record");
  const skill = await add("skills");
  await skill
    .locator('[name="skills-name"]')
    .fill("Example martial arts skill");
  await skill.locator('[name="skills-category"]').selectOption("martialArt");
  const weapon = await add("weapons");
  await weapon
    .locator('[name="weapons-title"]')
    .fill("Example ownership record");
  const travel = await add("travel");
  await travel
    .locator('[name="travel-toCountry"]')
    .fill("Example travel country");
  await travel.locator('[name="travel-departureDate"]').fill("2026-10-20");
  await travel.locator('[name="travel-returnDate"]').fill("2026-10-19");
  const finance = await add("finances");
  await finance.locator('[name="finances-kind"]').selectOption("expense");
  await finance
    .locator('[name="finances-title"]')
    .fill("Example recurring spending");
  await finance.locator('[name="finances-amount"]').fill("99.50");
  const immigration = await add("immigration");
  await immigration
    .locator('[name="immigration-country"]')
    .fill("Example residence country");
  await immigration
    .locator('[name="immigration-status"]')
    .selectOption("permit");
  await immigration
    .getByText("Citizenship and status changes", { exact: true })
    .click();
  await immigration
    .locator('[name="immigration-change"]')
    .selectOption("restored");
  await immigration
    .locator('[name="immigration-changeDate"]')
    .fill("2026-09-10");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).toContainText(
    "end cannot precede start",
  );
  await travel.locator('[name="travel-returnDate"]').fill("2026-10-25");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("#modal [data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "extended.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('#personList [data-biography="p10"]').click();
  for (const value of [
    "182.5",
    "75",
    "Example dietary record",
    "Example martial arts skill",
    "Example ownership record",
    "Example travel country",
    "Example recurring spending",
    "99.50",
    "Example residence country",
    "Restored",
  ])
    await expect(page.locator("#modal .biography")).toContainText(value);
});

test("prints a complete biography with hidden sections, preserves sources and generates an A4 PDF without app controls", async ({
  page,
}) => {
  await page.locator('#personList [data-biography="p5"]').click();
  await page.evaluate(() => {
    window.print = () => {
      window.printCalls = (window.printCalls || 0) + 1;
    };
  });
  const originalTitle = await page.title();
  await page.locator('[data-print-biography="p5"]').click();
  await expect.poll(() => page.evaluate(() => window.printCalls)).toBe(1);
  const report = page.locator("#biographyPrint");
  for (const value of [
    "Jesse Ward",
    "168",
    "62.5",
    "Peanuts",
    "Autumn trip to Portugal",
    "PA7314062",
    "Household spending",
  ])
    await expect(report).toContainText(value);
  await expect(report.locator("button")).toHaveCount(0);
  await expect(
    report.locator('[data-biography-section="documents"]'),
  ).toContainText("Birth record for Jesse Ward");
  await page.emulateMedia({ media: "print" });
  await expect(report).toBeVisible();
  await expect(page.locator("#appShell")).toBeHidden();
  const pdf = await page.pdf({
    path: "test-results/jesse-biography.pdf",
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  await page.screenshot({
    path: "test-results/print-biography.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page).toHaveTitle(originalTitle);
  await expect(report).toBeEmpty();
  await expect(page.locator("#modal .biography")).toBeVisible();
});

test.describe("phone global search", () => {
  test.use({
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  test("finds hidden details using native touch and opens the full profile", async ({
    page,
  }) => {
    await page.locator("#globalSearch").tap();
    await page.locator("#globalSearch").fill("name:Robin Guitar");
    await page.locator('[data-search-kind="person"]').tap();
    await expect(page.locator("#inspector h2")).toHaveText("Robin Roe");
    await page.locator('#inspector [data-biography="p6"]').tap();
    await expect(page.locator("#modal .biography")).toContainText("Judo");
    await expect(page.locator('[data-print-biography="p6"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: "test-results/mobile-profile-details.png" });
  });
});
