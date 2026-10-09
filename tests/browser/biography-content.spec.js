import { test, expect } from "@playwright/test";
import en from "../../src/i18n/locales/en.js";
import uk from "../../src/i18n/locales/uk.js";
import ru from "../../src/i18n/locales/ru.js";

for (const [language, width, labels] of [
  ["en", 1280, en],
  ["uk", 390, uk],
  ["ru", 320, ru],
]) {
  test(`new profiles print only entered information and retain explicit verification in ${language}`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("./");
    await page.locator("#startDemo").click();
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#viewActions [data-action="add-person"]').click();
    await page.locator('[name="name"]').fill("Alex Example");
    const claims = page.locator('[data-profile-panel="claims"]');
    await page
      .locator("[data-profile-search]")
      .fill(labels["ui.claimsAndReports"]);
    await claims.locator("summary").first().click();
    await claims.locator('[data-add-record="claims"]').click();
    await claims
      .locator('[name="claims-statement"]')
      .fill("Recorded personal account");
    await expect(claims.locator('[name="claims-verification"]')).toHaveValue(
      "unspecified",
    );
    await expect(claims.locator('[name="claims-kind"]')).toHaveValue(
      "unspecified",
    );
    await page.locator('#modal button[type="submit"]').click();
    const card = page.locator(".node").filter({ hasText: "Alex Example" });
    const id = await card.getAttribute("data-node");
    await page.locator(`#graph [data-biography="${id}"]`).click();
    const biography = page.locator("#modal .biography");
    await expect(biography).toContainText("Recorded personal account");
    for (const key of [
      "noInformationYet",
      "datesNotSpecified",
      "pendingVerification",
      "lifeStatusUnknown",
      "notSpecified",
      "dateUnknown",
    ])
      await expect(biography).not.toContainText(labels["ui." + key]);
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.locator("[data-print-biography]").click();
    await expect(page.locator("#biographyPrint")).toContainText(
      "Recorded personal account",
    );
    await expect(page.locator("#biographyPrint")).not.toContainText(
      labels["ui.pendingVerification"],
    );
    await page.locator("#modal [data-close]").first().click();
    await page
      .locator("#graph .node")
      .filter({ hasText: "Alex Example" })
      .locator(".card")
      .click();
    await page.locator(`#inspector [data-edit-person="${id}"]`).first().click();
    await page
      .locator("[data-profile-search]")
      .fill(labels["ui.claimsAndReports"]);
    await page.locator('[data-profile-panel="claims"] summary').first().click();
    await page.locator('[name="claims-verification"]').selectOption("pending");
    await page.locator('#modal button[type="submit"]').click();
    await page.locator(`#inspector [data-biography="${id}"]`).click();
    await expect(page.locator("#modal .biography")).toContainText(
      labels["ui.pendingVerification"],
    );
    expect(errors).toEqual([]);
  });
}
