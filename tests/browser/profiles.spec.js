import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("edits detailed optional profiles, reports and name history and restores them from ZIP", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startCreate").click();
  await page.locator('#viewActions [data-action="add-person"]').click();
  await page.locator('#modal input[name="name"]').fill("John Doe (TEST)");
  await expect(page.locator("[data-profile-editor]")).toBeVisible();
  async function add(section) {
    const panel = page
      .locator(".profile-editor-section")
      .filter({ has: page.locator(`[data-add-record="${section}"]`) });
    await panel.locator("summary").first().click();
    await panel.locator(`[data-add-record="${section}"]`).click();
    return panel;
  }
  const names = await add("names");
  await names.locator('[name="names-surname"]').fill("Example Maiden Doe");
  await names.locator('[name="names-from"]').fill("1990");
  await names.locator('[name="names-to"]').fill("2010");
  const education = await add("education");
  await education
    .locator('[name="education-institution"]')
    .fill("Example University");
  await education
    .locator('[name="education-qualification"]')
    .fill("Fictional diploma");
  const claims = await add("claims");
  await claims.locator('[name="claims-kind"]').selectOption("rumor");
  await claims
    .locator('[name="claims-statement"]')
    .fill("An unverified fictional report");
  await expect(claims.locator('[name="claims-verification"]')).toHaveValue(
    "pending",
  );
  await claims.getByText("Context and attribution", { exact: true }).click();
  await claims.locator('[name="claims-reportedBy"]').fill("Fictional witness");
  const identity = await add("identity");
  await identity.locator('[name="identity-series"]').fill("DEMO");
  await identity.locator('[name="identity-number"]').fill("DEMO-PASSPORT-ONLY");
  await identity.getByText("Issue and validity", { exact: true }).click();
  await identity
    .locator('[name="identity-issuedBy"]')
    .fill("Fictional authority");
  await identity.locator('[name="identity-issueDate"]').fill("2024-01-01");
  await identity.locator('[name="identity-expiryDate"]').fill("2034-01-01");
  await identity.getByText("Holder details", { exact: true }).click();
  await identity.locator('[name="identity-holderNameLatin"]').fill("JOHN DOE");
  await identity.locator('[name="identity-citizenship"]').fill("Exampleland");
  const immigration = await add("immigration");
  await immigration.locator('[name="immigration-country"]').fill("Exampleland");
  await immigration.locator('[name="immigration-from"]').fill("2026");
  await immigration.locator('[name="immigration-to"]').fill("2025");
  const tax = await add("taxation");
  await tax.locator('[name="taxation-taxId"]').fill("DEMO-NOT-A-TIN");
  await tax.locator('[name="taxation-year"]').fill("2025");
  await tax.locator('[name="taxation-currency"]').fill("USD");
  await tax.getByText("Income and tax amounts", { exact: true }).click();
  await tax.locator('[name="taxation-income"]').fill("0");
  await tax.locator('[name="taxation-taxPaid"]').fill("12.50");
  const personal = await add("personal");
  await personal.locator('[name="personal-category"]').selectOption("religion");
  await personal
    .locator('[name="personal-title"]')
    .fill("Self-described outlook");
  await personal
    .locator('[name="personal-description"]')
    .fill("Fictional example belief");
  await personal.getByText("Context and attribution", { exact: true }).click();
  await personal.locator('[name="personal-basis"]').selectOption("self");
  const custom = await add("custom");
  await custom.locator('[name="custom-title"]').fill("Additional detail");
  await custom.locator('[name="custom-value"]').fill("A fictional custom fact");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await immigration.locator('[name="immigration-to"]').fill("2027");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator("#personList [data-biography]").click();
  for (const value of [
    "Example Maiden Doe",
    "Example University",
    "Fictional diploma",
    "An unverified fictional report",
    "Unverified — needs checking",
    "Fictional witness",
    "DEMO-PASSPORT-ONLY",
    "Fictional authority",
    "JOHN DOE",
    "Exampleland",
    "DEMO-NOT-A-TIN",
    "12.50",
    "Fictional example belief",
    "Self-reported",
    "A fictional custom fact",
  ])
    await expect(page.locator(".biography")).toContainText(value);
  await page.locator("[data-close]").first().click();
  await page.locator("#peopleSearch").fill("Example Maiden Doe");
  await expect(page.locator("#personList [data-biography]")).toHaveCount(1);
  await page.locator("#peopleSearch").fill("");
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  const manifest = await page.evaluate(async (encoded) => {
    const { default: Zip } = await import(
      new URL(
        "vendor/zip.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    const zip = await Zip.loadAsync(
      Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
    );
    return JSON.parse(await zip.file("tree.json").async("string"));
  }, buffer.toString("base64"));
  const p = manifest.people[0];
  expect(p.nameHistory[0].surname).toBe("Example Maiden Doe");
  expect(p.educationRecords[0].institution).toBe("Example University");
  expect(p.claims[0].verification).toBe("pending");
  expect(p.identityDocuments[0].number).toBe("DEMO-PASSPORT-ONLY");
  expect(p.immigrationRecords[0].to).toBe("2027");
  expect(p.taxRecords[0].income).toBe("0");
  expect(p.personalRecords[0].basis).toBe("self");
  expect(p.customFacts[0].value).toBe("A fictional custom fact");
  await page.locator("[data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "profile.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await page.locator("#personList [data-biography]").click();
  await expect(page.locator(".biography")).toContainText("DEMO-PASSPORT-ONLY");
  expect(errors).toEqual([]);
});
