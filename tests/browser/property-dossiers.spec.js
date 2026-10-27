import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

async function navigate(page, view) {
  if (!(await page.locator(`[data-view="${view}"]`).isVisible()))
    await page.locator('[data-action="menu"]').click();
  await page.locator(`[data-view="${view}"]`).click();
}
async function reveal(page, selector) {
  const input = page.locator(selector);
  const details = page.locator("#modal details").filter({ has: input });
  for (let i = 0; i < (await details.count()); i++)
    if ((await details.nth(i).getAttribute("open")) === null)
      await details.nth(i).locator("summary").first().click();
  return input;
}
async function submit(page) {
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}
async function snapshot(page) {
  return page.evaluate(
    async () =>
      (
        await import(
          new URL(
            "core/state.js",
            document.querySelector('script[type="module"]').src,
          )
        )
      ).state.project,
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
});

for (const [language, width] of [
  ["en", 1440],
  ["uk", 390],
  ["ru", 1440],
]) {
  test(`object dossier, death inventory and asset map remain usable in ${language} at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.locator(".topbar [data-language]").selectOption(language);
    await navigate(page, "property");
    await page.locator('#viewActions [data-action="add-property"]').click();
    await page.locator('[name="title"]').fill("Willow Lane plot");
    await page.locator('[name="ownerId"]').selectOption("p1");
    await page.locator('[name="asset-cadastralNumber"]').fill("123:456:700");
    await page.locator('[name="asset-registrationNumber"]').fill("REG-900");
    await (
      await reveal(page, '[name="asset-initialOwnerId"]')
    ).selectOption("p1");
    await page
      .locator('[name="asset-acquisitionGrounds"]')
      .fill("Purchase agreement 15/2000");
    await (
      await reveal(page, '[name="asset-holdingKind"]')
    ).selectOption("personal");
    await submit(page);
    const project = await snapshot(page),
      added = project.property.find((a) => a.title === "Willow Lane plot");
    expect(added.cadastralNumber).toBe("123:456:700");
    await page.locator(`[data-property-history="${added.id}"]`).click();
    await expect(page.locator(".property-dossier")).toContainText("REG-900");
    await page.locator('[data-add-property-record="rights"]').click();
    await page.locator('[name="estate-personId"]').selectOption("p1");
    await page.locator('[name="estate-kind"]').selectOption("ownership");
    await page.locator('[name="estate-sharePercent"]').fill("100");
    await page.locator('[name="estate-from"]').fill("2000-01-01");
    await page.locator('[name="estate-to"]').fill("2011-11-03");
    await page.locator('[name="estate-status"]').selectOption("ended");
    await submit(page);
    await page.locator("[data-property-back]").click();
    await page.locator("#propertyEstateControls > summary").click();
    await page.locator("#propertySubjectId").selectOption("p1");
    await page.locator("#propertyEstateFilter").selectOption("atDeath");
    await expect(
      page.locator(".asset-card").filter({ hasText: "Willow Lane plot" }),
    ).toHaveCount(1);
    await page.locator("[data-property-death-date]").click();
    await expect(page.locator("#propertyDate")).toHaveValue("03.11.2011");
    await page.locator('[data-property-panel="map"]').click();
    await expect(page.locator(".property-economic-map")).toContainText(
      "123:456:700",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `test-results/property-dossier-${language}.png`,
    });
  });
}

test("a bank source links to a payment, appears in the evidence register and survives draft restoration", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.locator(".topbar [data-language]").selectOption("en");
  await navigate(page, "property");
  await page.locator('[data-property-history="demo-house"]').click();
  await page.locator('[data-add-property-record="cashFlows"]').click();
  await page.locator('[name="estate-fromId"]').selectOption("p3");
  await page.locator('[name="estate-toId"]').selectOption("p4");
  await page.locator('[name="estate-amount"]').fill("1200.25");
  await page.locator('[name="estate-currency"]').fill("USD");
  await page.locator('[name="estate-date"]').fill("2020-06-01");
  await page.locator('[name="estate-transactionKey"]').fill("BANK-700");
  await (
    await reveal(page, '[name="estate-verification"]')
  ).selectOption("corroborated");
  await submit(page);
  await navigate(page, "documents");
  await page.locator('#viewActions [data-action="reference"]').click();
  await page.locator('[name="title"]').fill("Willow Bank payment statement");
  await page.locator('[name="type"]').selectOption("bank_statement");
  await page.locator('[name="evidence"]').selectOption("official");
  await page.locator('[name="status"]').selectOption("available");
  await (
    await reveal(page, '[name="document-custodian"]')
  ).fill("Willow Bank archive");
  await page
    .locator('[name="document-supportedFact"]')
    .fill("Rent paid for Willow Lane");
  await page
    .locator('[name="document-acquisitionRoute"]')
    .fill("Account holder request");
  await page.locator('[name="document-inventoryNumber"]').fill("INV-700");
  await (
    await reveal(page, '[name="propertyIds"][value="demo-house"]')
  ).check();
  const target = '[name="propertyRecordLinks"][value^="demo-house:cashFlows:"]';
  await (await reveal(page, target)).check();
  await (
    await reveal(page, '[name="source-verification"]')
  ).selectOption("corroborated");
  await submit(page);
  await page.setViewportSize({ width: 390, height: 950 });
  await page.locator('[data-doc-layout="evidence"]').click();
  await page.locator("#docSearch").fill("INV-700");
  await expect(page.locator(".evidence-register")).toContainText(
    "Willow Bank archive",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  const downloaded = page.waitForEvent("download");
  await page.locator('[data-action="export-evidence"]').click();
  const file = await downloaded;
  expect(await readFile(await file.path(), "utf8")).toContain(
    "Account holder request",
  );
  await navigate(page, "property");
  await page.locator("[data-property-back]").click();
  await page.locator('[data-property-panel="flows"]').click();
  await expect(page.locator(".flow-card")).toContainText(
    "Corroborated record and source",
  );
  await expect(page.locator(".flow-card")).toContainText(
    "Willow Bank payment statement",
  );
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  const restored = await snapshot(page);
  expect(
    restored.documents.find((d) => d.title === "Willow Bank payment statement")
      .propertyRecordLinks,
  ).toHaveLength(1);
  expect(
    restored.property.find((a) => a.id === "demo-house").cashFlows[0]
      .transactionKey,
  ).toBe("BANK-700");
});
