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
async function property(page, id = "doe-riverside-land") {
  if (!(await page.locator('[data-view="property"]').isVisible()))
    await page.locator('[data-action="menu"]').click();
  await page.locator('[data-view="property"]').click();
  await page.locator(`[data-property-history="${id}"]`).click();
}
async function date(page, value) {
  await page.locator("#propertyDate").fill(value);
  await page.locator("#propertyDate").press("Tab");
}
async function group(page, field) {
  const details = page
    .locator("#modal .record-field-group")
    .filter({ has: page.locator(`[name="estate-${field}"]`) });
  if (!(await details.evaluate((element) => element.open)))
    await details.locator("summary").click();
}
async function model(page) {
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
async function submit(page) {
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}

test("property analysis follows dated owners and preserves the other family branch's claim after gifts", async ({
  page,
}) => {
  await page.locator('[data-view="property"]').click();
  await page.locator("#propertySearch").fill("LT/1932/417");
  await expect(page.locator(".asset-card")).toHaveCount(1);
  await page.locator("#propertySearch").fill("");
  await page.locator("#propertyReviewFilter").selectOption("claims");
  await expect(page.locator(".asset-card")).toHaveCount(1);
  await page.locator('[data-property-history="doe-riverside-land"]').click();
  await date(page, "1920-01-01");
  const snapshot = page.locator(".property-snapshot");
  await expect(snapshot).toContainText("Henry Doe");
  await expect(snapshot).toContainText("Charles Doe");
  await expect(snapshot).not.toContainText("Alice Doe");
  await date(page, "1932-07-01");
  await expect(snapshot).toContainText("Alice Doe");
  await expect(snapshot).toContainText("100%");
  await date(page, "1933-01-01");
  await page.locator("#propertyDate").fill("");
  await page.locator("#propertyDate").press("Tab");
  await expect(page.locator("#propertyDate")).toHaveValue("01.01.1933");
  await expect(snapshot).toContainText("Edward Doe");
  await expect(snapshot).toContainText("Florence Hart");
  await expect(snapshot).not.toContainText("Alice Doe");
  await expect(page.locator(".property-claims h3")).toContainText("1 open");
  await expect(
    page.locator('[data-estate-record="albert-land-objection"]'),
  ).toContainText("Charles Doe: Son");
  await page.locator(".property-family > summary").click();
  await expect(page.locator(".property-family")).toContainText(
    "Charles Doe: Brother",
  );
  await page.locator("#otherView").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: "test-results/desktop-property-history.png",
    fullPage: true,
  });
});

test("property records validate parties and periods, retain gifts and claims through ZIP, and support edit, delete and undo", async ({
  page,
}) => {
  await property(page, "demo-house");
  await date(page, "2026-10-09");
  await page.locator('[data-add-property-record="rights"]').click();
  await page.locator('[name="estate-personId"]').selectOption("p5");
  await page.locator('[name="estate-externalPerson"]').fill("Duplicate party");
  await page.locator('[name="estate-kind"]').selectOption("lease");
  await page.locator('[name="estate-from"]').fill("2025-01-01");
  await page.locator('[name="estate-to"]').fill("2024-12-31");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await page.locator('[name="estate-to"]').fill("2027-12-31");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).toContainText("one");
  await page.locator('[name="estate-externalPerson"]').fill("");
  await page
    .locator('[name="estate-grounds"]')
    .fill("Written lease for the upper floor");
  await group(page, "sourceId");
  await page.locator('[name="estate-sourceId"]').selectOption("d6");
  await page
    .locator('[name="estate-verification"]')
    .selectOption("corroborated");
  await submit(page);
  await expect(page.locator(".property-snapshot")).toContainText("Jesse Ward");
  await page.locator('[data-add-property-record="transfers"]').click();
  await page.locator('[name="estate-fromId"]').selectOption("p4");
  await page.locator('[name="estate-toId"]').selectOption("p5");
  await page.locator('[name="estate-date"]').fill("2026-09-01");
  await page.locator('[name="estate-sharePercent"]').fill("25");
  await page
    .locator('[name="estate-grounds"]')
    .fill("Gift deed pending registration");
  await group(page, "amount");
  await page.locator('[name="estate-signedAt"]').fill("2026-08-31");
  await page.locator('[name="estate-amount"]').fill("0");
  await page.locator('[name="estate-currency"]').fill("cad");
  await group(page, "reference");
  await page.locator('[name="estate-reference"]').fill("CV/2026/25");
  await page.locator('[name="estate-authority"]').fill("Brookfield registrar");
  await submit(page);
  await expect(page.locator(".property-review")).toContainText("recipient");
  await page.locator('[data-add-property-record="claims"]').click();
  await page.locator('[name="estate-personId"]').selectOption("p11");
  await page.locator('[name="estate-kind"]').selectOption("marital");
  await page.locator('[name="estate-status"]').selectOption("asserted");
  await page.locator('[name="estate-date"]').fill("2026-09-02");
  await page.locator('[name="estate-againstPersonId"]').selectOption("p4");
  await page
    .locator('[name="estate-evidenceNeeded"]')
    .fill("Review the settlement and later agreement");
  await submit(page);
  const house = (await model(page)).property.find((a) => a.id === "demo-house");
  const claim = house.claims[0];
  await page.locator(`[data-edit-property-record="${claim.id}"]`).click();
  await page.locator('[name="estate-status"]').selectOption("withdrawn");
  await page.locator('[name="estate-resolvedAt"]').fill("2026-09-20");
  await submit(page);
  await expect(page.locator(".property-claims h3")).toContainText("0 open");
  await page.locator('[data-property-command="undo"]').click();
  await expect(page.locator(".property-claims h3")).toContainText("1 open");
  await page.locator(`[data-edit-property-record="${claim.id}"]`).click();
  await page.locator(`[data-delete-property-record="${claim.id}"]`).click();
  await submit(page);
  await expect(page.locator(`[data-estate-record="${claim.id}"]`)).toHaveCount(
    0,
  );
  await page.locator('[data-property-command="undo"]').click();
  await expect(page.locator(`[data-estate-record="${claim.id}"]`)).toHaveCount(
    1,
  );
  const expected = (await model(page)).property;
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("#modal [data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "property-history.zip",
    mimeType: "application/zip",
    buffer,
  });
  await submit(page);
  expect((await model(page)).property).toEqual(expected);
});

test("property history is searchable, prints in biographies, appears only in financial dates and preserves deleted participants", async ({
  page,
}) => {
  await page
    .locator("#globalSearch")
    .fill('type:property "Albert Doe" "BR-LOT-417"');
  await page.locator('[data-search-kind="property"]').click();
  await expect(page.locator(".property-detail-title h2")).toHaveText(
    "Riverside agricultural parcel",
  );
  await page.locator(".property-family > summary").click();
  await page.locator('.property-family [data-biography="albert"]').click();
  await expect(page.locator(".biography")).toContainText("Albert Doe states");
  await expect(page.locator(".biography")).toContainText("LT/1932/417");
  await page.evaluate(async () => {
    const { prepareBiographyPrint } = await import(
      new URL(
        "features/print-biography.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    prepareBiographyPrint("albert");
  });
  await expect(page.locator("#biographyPrint")).toContainText(
    "Albert Doe states",
  );
  await expect(page.locator("#biographyPrint")).toContainText("CV/1932/189");
  await page.emulateMedia({ media: "print" });
  await expect(
    page.locator("#biographyPrint [data-edit-property-record]"),
  ).toHaveCount(0);
  await page.emulateMedia({ media: "screen" });
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-view="calendar"]').click();
  await page.locator("#calendarMonth").fill("1932-10");
  await page.locator("#calendarMonth").press("Tab");
  await page.locator("#calendarDomain").selectOption("financial");
  await page.locator('[data-calendar-day="1932-10-13"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Riverside agricultural parcel",
  );
  await page
    .locator('.calendar-agenda [data-property-history="doe-riverside-land"]')
    .first()
    .click();
  await expect(page.locator(".property-detail-title h2")).toHaveText(
    "Riverside agricultural parcel",
  );
  await page.locator('[data-view="tree"]').click();
  await page.locator('#personList [data-person="charles"]').click();
  await page.locator('#inspector [data-edit-person="charles"]').first().click();
  await page.locator('[data-delete-person="charles"]').click();
  await submit(page);
  let land = (await model(page)).property.find(
    (a) => a.id === "doe-riverside-land",
  );
  expect(
    land.transfers.find((r) => r.id === "registration-alice").fromExternal,
  ).toBe("Charles Doe");
  expect(land.claims[0].notes).toContain("Charles Doe");
  await page.locator('[data-action="undo"]').click();
  land = (await model(page)).property.find(
    (a) => a.id === "doe-riverside-land",
  );
  expect(land.claims[0].throughPersonId).toBe("charles");
});

test("property analysis and progressive record forms fit a narrow phone in every language", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await property(page);
  await date(page, "1933-01-01");
  for (const language of ["uk", "ru", "en"]) {
    await page.locator("#appShell [data-language]").selectOption(language);
    await expect(page.locator(".property-snapshot")).toContainText(
      "Florence Hart",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator('[data-add-property-record="claims"]').click();
    await group(page, "sourceId");
    await expect(page.locator('[name="estate-sourceId"]')).toBeVisible();
    expect(
      await page
        .locator("#modal")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await page.locator("#modal [data-close]").first().click();
  }
  await page.locator("#otherView").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: "test-results/mobile-property-history.png",
    fullPage: true,
  });
});
