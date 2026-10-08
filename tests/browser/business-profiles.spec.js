import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
});

async function addRecord(page, section) {
  const panel = page
    .locator(".profile-editor-section")
    .filter({ has: page.locator(`[data-add-record="${section}"]`) });
  if (!(await panel.isVisible()))
    await page.locator(".profile-additional-sections > summary").click();
  if ((await panel.getAttribute("open")) === null)
    await panel.locator("summary").first().click();
  await panel.locator(`[data-add-record="${section}"]`).click();
  return panel.locator(".profile-record").last();
}

async function expandFields(record) {
  for (const group of await record.locator(".record-field-group").all())
    if ((await group.getAttribute("open")) === null)
      await group.locator("summary").click();
}

async function projectState(page) {
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

test("edits optional business modules, validates percentages and restores precise records from ZIP", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.locator('#personList [data-person="p10"]').click();
  await page.locator('#inspector [data-edit-person="p10"]').click();
  const asset = await addRecord(page, "assets");
  await asset.locator('[name="assets-title"]').fill("Workshop building");
  await asset.locator('[name="assets-identifier"]').fill("BLD-3472");
  const restriction = await addRecord(page, "encumbrances");
  await restriction
    .locator('[name="encumbrances-title"]')
    .fill("Court attachment of the workshop");
  await restriction
    .locator('[name="encumbrances-kind"]')
    .selectOption("attachment");
  await restriction
    .locator('[name="encumbrances-assetReference"]')
    .fill("BLD-3472");
  await expandFields(restriction);
  await restriction
    .locator('[name="encumbrances-caseNumber"]')
    .fill("CV-2026-0512");
  await restriction
    .locator('[name="encumbrances-sourceId"]')
    .selectOption("d6");
  const account = await addRecord(page, "accounts");
  await account.locator('[name="accounts-number"]').fill("AC-784512");
  await expandFields(account);
  await account.locator('[name="accounts-balance"]').fill("-250.25");
  await account.locator('[name="accounts-balanceDate"]').fill("2026-10-01");
  const crypto = await addRecord(page, "crypto");
  await crypto.locator('[name="crypto-asset"]').fill("Ether");
  await crypto.locator('[name="crypto-quantity"]').fill("0.125000000000000123");
  const company = await addRecord(page, "companies");
  await company
    .locator('[name="companies-company"]')
    .fill("Cedar Workshop Ltd");
  await company
    .locator('[name="companies-registrationNumber"]')
    .fill("ON-784512");
  await company.locator('[name="companies-sharePercent"]').fill("101");
  expect(
    await company
      .locator('[name="companies-sharePercent"]')
      .evaluate((el) => el.validity.rangeOverflow),
  ).toBe(true);
  await company.locator('[name="companies-sharePercent"]').fill("0");
  await expandFields(company);
  await company.locator('[name="companies-votingPercent"]').fill("100");
  const sanction = await addRecord(page, "sanctions");
  await sanction
    .locator('[name="sanctions-title"]')
    .fill("Recorded business association");
  await sanction.locator('[name="sanctions-kind"]').selectOption("association");
  await expandFields(sanction);
  await sanction
    .locator('[name="sanctions-relatedPersonId"]')
    .selectOption("p11");
  await sanction
    .locator('[name="sanctions-connection"]')
    .fill("Shared former business appointment");
  const party = await addRecord(page, "political");
  await party.locator('[name="political-party"]').fill("Cedar Civic Alliance");
  await party.locator('[name="political-kind"]').selectOption("member");
  await party.locator('[name="political-from"]').fill("2020");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await page.locator('#inspector [data-biography="p10"]').click();
  for (const value of [
    "Workshop building",
    "BLD-3472",
    "CV-2026-0512",
    "AC-784512",
    "-250.25",
    "0.125000000000000123",
    "ON-784512",
    "Riley Cross",
    "Cedar Civic Alliance",
  ])
    await expect(page.locator(".biography")).toContainText(value);
  const print = await page.evaluate(async () => {
    const { prepareBiographyPrint } = await import(
      new URL(
        "features/print-biography.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    prepareBiographyPrint("p10");
    return document.querySelector("#biographyPrint").innerHTML;
  });
  expect(print).toContain("CV-2026-0512");
  expect(print).toContain("0.125000000000000123");
  expect(print).not.toContain("<button");
  await page.locator("[data-close]").first().click();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("[data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "business-records.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const p = (await projectState(page)).people.find((p) => p.id === "p10");
  expect(p.assetRecords[0].identifier).toBe("BLD-3472");
  expect(p.encumbranceRecords[0].sourceId).toBe("d6");
  expect(p.accountRecords[0].balance).toBe("-250.25");
  expect(p.cryptoRecords[0].quantity).toBe("0.125000000000000123");
  expect(p.companyRecords[0].sharePercent).toBe("0");
  expect(p.companyRecords[0].votingPercent).toBe("100");
  expect(p.sanctionRecords[0].kind).toBe("association");
  expect(p.sanctionRecords[0].status).toBe("unspecified");
  expect(p.politicalRecords[0].party).toBe("Cedar Civic Alliance");
  expect(errors).toEqual([]);
});

test("creates formal reporting lines with correct direction and distinct professional editor fields", async ({
  page,
}) => {
  await page.locator('[data-action="add-relation"]').click();
  await page.locator('#modal [name="from"]').selectOption("p10");
  await page.locator('#modal [name="to"]').selectOption("p11");
  await page.locator('#modal [name="type"]').selectOption("reports_to");
  await expect(page.locator("#parenthoodDirectionHint")).not.toBeVisible();
  await expect(page.locator("#subordinationHint")).toBeVisible();
  await expect(page.locator("#relationshipFromLabel")).toHaveText(
    "Subordinate",
  );
  await expect(page.locator("#relationshipToLabel")).toHaveText(
    "Manager / supervisor",
  );
  await expect(page.locator('[name="relationship-unionKind"]')).toHaveCount(0);
  await page.locator('[name="relationship-fromDate"]').fill("2024-01-01");
  const group = page
    .locator(".record-field-group")
    .filter({ has: page.locator('[name="relationship-organization"]') });
  await group.locator("summary").click();
  await group
    .locator('[name="relationship-organization"]')
    .fill("Cedar Workshop Ltd");
  await group.locator('[name="relationship-formality"]').selectOption("formal");
  await group
    .locator('[name="relationship-professionalKind"]')
    .selectOption("service");
  await group
    .locator('[name="relationship-fromRole"]')
    .fill("Archive coordinator");
  await group
    .locator('[name="relationship-toRole"]')
    .fill("Operations manager");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const r = (await projectState(page)).relations.find(
    (r) => r.from === "p10" && r.to === "p11" && r.type === "reports_to",
  );
  expect(r.organization).toBe("Cedar Workshop Ltd");
  await expect(page.locator(`[data-edge="${r.id}"] [marker-end]`)).toHaveCount(
    1,
  );
  await expect(page.locator(`[data-edge="${r.id}"] text`)).toContainText(
    "2024-01-01",
  );
  await expect(
    page.locator('[data-edge="sanctions-roe-cross"] [marker-end]'),
  ).toHaveCount(0);
  await page.locator('#personList [data-biography="p10"]').click();
  await expect(
    page.locator('[data-biography-section="relationships"]'),
  ).toContainText("Manager / supervisor");
  await expect(
    page.locator('[data-biography-section="relationships"]'),
  ).toContainText("Operations manager");
  await page.locator("[data-close]").first().click();
  await page.locator('#personList [data-biography="p11"]').click();
  await expect(
    page.locator('[data-biography-section="relationships"]'),
  ).toContainText("Subordinate");
  await expect(
    page.locator('[data-biography-section="relationships"]'),
  ).toContainText("Archive coordinator");
});

test("new profiles and directional graph labels fit desktop and a narrow phone in all languages", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator('[data-edge="work-cross-roe"] text')).toContainText(
    "2019-01-01–2021-12-31",
  );
  await expect(
    page.locator('[data-edge="sanctions-roe-cross"] text'),
  ).toContainText("2010-04-01–2022-10-12");
  await page.locator('#personList [data-biography="p4"]').click();
  await expect(page.locator(".biography")).toContainText("CA-ON-7718");
  await expect(page.locator(".biography")).toContainText(
    "Cedar Civic Alliance",
  );
  await page
    .locator('[data-biography-section="companies"]')
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/desktop-business-profile.png",
    fullPage: true,
  });
  await page.locator("[data-close]").first().click();
  await page.locator('#personList [data-person="p4"]').click();
  await page.setViewportSize({ width: 320, height: 740 });
  for (const language of ["en", "uk", "ru"]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.locator('#inspector [data-edit-person="p4"]').click();
    const company = page
      .locator(".profile-editor-section")
      .filter({ has: page.locator('[data-add-record="companies"]') });
    if (!(await company.isVisible()))
      await page.locator(".profile-additional-sections > summary").click();
    await company.locator("summary").first().click();
    await expandFields(company.locator(".profile-record").first());
    for (const selector of ["#modal", "#modal .modal-body"])
      expect(
        await page
          .locator(selector)
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (language === "uk") {
      await company
        .locator('[name="companies-company"]')
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: "test-results/mobile-business-profile.png",
        fullPage: true,
      });
    }
    await page.locator("[data-close]").first().click();
  }
  expect(errors).toEqual([]);
});
