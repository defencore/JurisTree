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

test("family dates exclude court and custody records while legal history opens the correct profile section", async ({
  page,
}) => {
  await page.locator('[data-view="events"]').click();
  await expect(page.locator("#eventDomain")).toHaveValue("family");
  await expect(page.locator('#eventType option[value="custody"]')).toHaveCount(
    0,
  );
  await expect(page.locator('#eventType option[value="legal"]')).toHaveCount(0);
  await expect(
    page.locator('#viewActions [data-action="add-event"]'),
  ).toBeVisible();
  await page.locator('[data-event-mode="history"]').click();
  await expect(page.locator(".family-event-list")).not.toContainText(
    "Reported custody period",
  );
  await page.locator("#eventDomain").selectOption("legal");
  await page.locator("#eventType").selectOption("custody");
  await expect(page.locator(".family-event")).not.toHaveCount(0);
  await expect(page.locator(".family-event-list")).toContainText(
    "Reported custody period",
  );
  await page.locator('[data-open-profile-section="custody"]').first().click();
  await expect(
    page.locator('[data-profile-section="custody"]'),
  ).toHaveAttribute("open", "");
  await expect(page.locator('[name="custody-facility"]')).toHaveValue(
    "Northbank Correctional Centre",
  );
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-view="calendar"]').click();
  await expect(page.locator("#calendarDomain")).toHaveValue("family");
  await expect(
    page.locator('#calendarType option[value="custody"]'),
  ).toHaveCount(0);
  await page.locator("#calendarDomain").selectOption("legal");
  await page.locator("#calendarType").selectOption("custody");
  await page.locator('[data-calendar-mode="year"]').click();
  await page.locator("#calendarYear").fill("2026");
  await page.locator("#calendarYear").press("Tab");
  await expect(page.locator(".mini-calendar-day.has-events")).toHaveCount(0);
});

test("custody periods, charges and facility survive validation, printing and ZIP restoration", async ({
  page,
}) => {
  await page.locator('[data-view="events"]').click();
  await page.locator("#eventDomain").selectOption("legal");
  await page
    .locator('#viewActions [data-add-profile-record="custody"]')
    .click();
  await page.locator('[name="recordPerson"]').selectOption("p5");
  await page.locator('#modal button[type="submit"]').click();
  const row = page.locator("#records-custody .profile-record").last();
  await expect(row.locator('[name="custody-kind"]')).toBeFocused();
  await row.locator('[name="custody-kind"]').selectOption("imprisonment");
  await row.locator('[name="custody-title"]').fill("Archived sentence record");
  await row.locator('[name="custody-from"]').fill("2018-04-12");
  await row.locator('[name="custody-to"]').fill("2017-04-12");
  await row
    .locator('[name="custody-facility"]')
    .fill("Riverbank Correctional Centre");
  await row.locator('[name="custody-location"]').fill("14 River Road");
  await row.locator('[name="custody-country"]').fill("Canada");
  await row.locator(".record-field-group > summary").nth(0).click();
  await row.locator('[name="custody-caseNumber"]').fill("CR-2018-314");
  await row.locator('[name="custody-proceedingNumber"]').fill("P-2018-914");
  await row
    .locator('[name="custody-legalProvision"]')
    .fill("Recorded charge provision 12");
  await row
    .locator('[name="custody-convictionProvision"]')
    .fill("Recorded judgment provision 14");
  await row.locator(".record-field-group > summary").nth(1).click();
  await row.locator('[name="custody-sentence"]').fill("Two years");
  await row.locator('[name="custody-releasedAt"]').fill("2020-04-12");
  await row
    .locator('[name="custody-releaseGrounds"]')
    .fill("Release order R-2020-14");
  await row.locator(".record-field-group > summary").nth(2).click();
  await row.locator('[name="custody-sourceId"]').selectOption("d1");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await row.locator('[name="custody-to"]').fill("2020-04-12");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator("#globalSearch").fill('name:Jesse "CR-2018-314"');
  await page.locator('[data-search-kind="person"]').click();
  await page.locator('#inspector [data-biography="p5"]').click();
  const values = [
    "Riverbank Correctional Centre",
    "CR-2018-314",
    "P-2018-914",
    "Recorded charge provision 12",
    "Recorded judgment provision 14",
    "Two years",
    "Release order R-2020-14",
  ];
  for (const value of values)
    await expect(
      page.locator('[data-biography-section="custody"]'),
    ).toContainText(value);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator('[data-print-biography="p5"]').click();
  for (const value of values)
    await expect(page.locator("#biographyPrint")).toContainText(value);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("#modal [data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "custody-profile.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('#personList [data-biography="p5"]').click();
  for (const value of values)
    await expect(
      page.locator('[data-biography-section="custody"]'),
    ).toContainText(value);
});

test("education and dated interests use focused section entry and appear in the complete biography", async ({
  page,
}) => {
  await page.locator('[data-view="events"]').click();
  await page.locator("#eventDomain").selectOption("biography");
  await page
    .locator('#viewActions [data-add-profile-domain="biography"]')
    .click();
  await page.locator('[name="recordPerson"]').selectOption("p5");
  await page.locator('[name="recordSection"]').selectOption("education");
  await page.locator('#modal button[type="submit"]').click();
  const study = page.locator("#records-education .profile-record").last();
  await expect(study.locator('[name="education-institution"]')).toBeFocused();
  await study
    .locator('[name="education-institution"]')
    .fill("Northern Design University");
  await study
    .locator('[name="education-institutionType"]')
    .selectOption("university");
  await study
    .locator('[name="education-field"]')
    .fill("Architecture and urban planning");
  await study
    .locator('[name="education-qualification"]')
    .fill("Master of Architecture");
  await study.locator('[name="education-from"]').fill("2012");
  await study.locator('[name="education-to"]').fill("2014");
  await study.locator('[name="education-graduatedAt"]').fill("2014");
  await study.locator(".record-field-group > summary").first().click();
  await study.locator('[name="education-specialtyCode"]').fill("191");
  await study
    .locator('[name="education-faculty"]')
    .fill("Design and architecture");
  await page.locator('[data-profile-section="skills"] > summary').click();
  await page.locator('[data-add-record="skills"]').click();
  const hobby = page.locator("#records-skills .profile-record").last();
  await hobby.locator('[name="skills-category"]').selectOption("interest");
  await hobby.locator('[name="skills-name"]').fill("Watercolor painting");
  await hobby.locator(".record-field-group > summary").first().click();
  await hobby.locator('[name="skills-from"]').fill("2015");
  await hobby.locator('[name="skills-to"]').fill("2020");
  await hobby.locator('[name="skills-timeStatus"]').selectOption("past");
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('#personList [data-biography="p5"]').click();
  for (const value of [
    "Willow Park Secondary School",
    "Riverside Arts College",
    "Northern Design University",
    "Master of Architecture",
    "Architecture and urban planning",
    "2012",
    "2014",
    "191",
  ])
    await expect(
      page.locator('[data-biography-section="education"]'),
    ).toContainText(value);
  for (const value of ["Watercolor painting", "2015", "2020", "Past / ended"])
    await expect(
      page.locator('[data-biography-section="skills"]'),
    ).toContainText(value);
});

test("category controls and grouped profile forms fit a narrow phone in all three languages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const language of ["uk", "ru", "en"]) {
    await page.locator("#appShell [data-language]").selectOption(language);
    await page.locator('[data-action="menu"]').click();
    await page.locator('[data-view="calendar"]').click();
    for (const domain of ["family", "biography", "legal", "financial"]) {
      await page.locator("#calendarDomain").selectOption(domain);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator("#calendarDomain")
          .evaluate((el) => el.getBoundingClientRect().right <= innerWidth),
      ).toBe(true);
    }
    await page.locator("#calendarDomain").selectOption("legal");
    await page
      .locator('#viewActions [data-add-profile-record="custody"]')
      .click();
    await page.locator('[name="recordPerson"]').selectOption("p5");
    await page.locator('#modal button[type="submit"]').click();
    await expect(page.locator('[name="custody-kind"]')).toBeFocused();
    const overflow = await page
      .locator("#modalContent")
      .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({
      path: `test-results/mobile-custody-${language}.png`,
    });
    await page.locator("#modal [data-close]").first().click();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-view="events"]').click();
  await page.locator("#eventDomain").selectOption("legal");
  await page.locator('[data-event-mode="history"]').click();
  await page.screenshot({
    path: "test-results/legal-chronology-desktop.png",
    fullPage: true,
  });
});
