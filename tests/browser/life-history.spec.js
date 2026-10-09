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
  if ((await panel.getAttribute("open")) === null)
    await panel.locator("summary").first().click();
  await panel.locator(`[data-add-record="${section}"]`).click();
  return panel.locator(".profile-record").last();
}

test("edits life events, service, witnesses and social contacts and restores them from ZIP", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.locator('#personList [data-person="p10"]').click();
  await page.locator('#inspector [data-edit-person="p10"]').click();
  const pregnancy = await addRecord(page, "pregnancy");
  await pregnancy
    .locator('[name="pregnancy-title"]')
    .fill("Pregnancy account from an interview");
  await pregnancy.locator('[name="pregnancy-outcome"]').selectOption("ongoing");
  await pregnancy.locator('[name="pregnancy-from"]').fill("2020-02-01");
  await pregnancy.locator('[name="pregnancy-to"]').fill("2020-04-01");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).toContainText("ongoing pregnancy");
  await pregnancy
    .locator('[name="pregnancy-outcome"]')
    .selectOption("medicalTermination");
  await pregnancy.locator(".record-field-group > summary").first().click();
  await pregnancy
    .locator('[name="pregnancy-otherParentId"]')
    .selectOption("p11");
  await pregnancy
    .locator('[name="pregnancy-parentageStatus"]')
    .selectOption("reported");
  const service = await addRecord(page, "military");
  await service.locator('[name="military-title"]').fill("Signals posting");
  await service.locator('[name="military-unit"]').fill("Signals support unit");
  await service.locator('[name="military-rank"]').fill("Corporal");
  await service.locator('[name="military-from"]').fill("2010-01-01");
  await service.locator('[name="military-to"]').fill("2012-12-31");
  await service.locator(".record-field-group > summary").first().click();
  await service
    .locator('[name="military-documentNumber"]')
    .fill("MIL-2010-047");
  const death = await addRecord(page, "death");
  await death.locator('[name="death-title"]').fill("Refuted death report");
  await death.locator('[name="death-category"]').selectOption("violent");
  await death
    .locator('[name="death-circumstances"]')
    .fill("A conflicting account retained for review.");
  await death.getByText("Sources and verification", { exact: true }).click();
  await death.locator('[name="death-verification"]').selectOption("refuted");
  const witness = await addRecord(page, "witnesses");
  await witness
    .locator('[name="witnesses-eventTitle"]')
    .fill("Archive handover at the museum");
  await witness.locator('[name="witnesses-eventDate"]').fill("2026-01-10");
  await witness.locator('[name="witnesses-witnessId"]').selectOption("p11");
  await witness.locator('[name="witnesses-role"]').selectOption("eyewitness");
  await witness
    .locator('[name="witnesses-statement"]')
    .fill("Observed the handover of the family papers.");
  await witness.getByText("Sources and verification", { exact: true }).click();
  await witness.locator('[name="witnesses-sourceId"]').selectOption("d9");
  const contact = await addRecord(page, "contacts");
  await contact.locator('[name="contacts-type"]').selectOption("social");
  await contact.locator('[name="contacts-value"]').fill("@avery.archive");
  await contact.locator(".record-field-group > summary").first().click();
  await contact.locator('[name="contacts-platform"]').fill("Circle");
  await contact
    .locator('[name="contacts-url"]')
    .fill("https://social.invalid/avery.archive");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await page.locator('#inspector [data-biography="p10"]').click();
  for (const value of [
    "Pregnancy account from an interview",
    "Riley Cross",
    "Signals support unit",
    "MIL-2010-047",
    "Refuted death report",
    "Archive handover at the museum",
  ])
    await expect(page.locator(".biography")).toContainText(value);
  await expect(
    page.locator('.biography a[href="https://social.invalid/avery.archive"]'),
  ).toHaveCount(2);
  await page.locator("[data-close]").first().click();
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
  const p = manifest.people.find((p) => p.id === "p10");
  expect(p.pregnancyRecords[0].outcome).toBe("medicalTermination");
  expect(p.pregnancyRecords[0].parentageStatus).toBe("reported");
  expect(p.militaryRecords[0].documentNumber).toBe("MIL-2010-047");
  expect(p.witnessRecords[0].witnessId).toBe("p11");
  expect(p.deathRecords[0].verification).toBe("refuted");
  expect(p.lifeStatus).toBe("living");
  expect(p.death).toBe("");
  expect(p.gender).toBe("x");
  expect(manifest.relations).toHaveLength(163);
  await page.locator("[data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "life-history.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('#personList [data-biography="p11"]').click();
  await expect(
    page.locator('[data-biography-section="testimony"]'),
  ).toContainText("Avery Hale");
  await expect(
    page.locator('[data-biography-section="testimony"]'),
  ).toContainText("Archive handover at the museum");
  const print = await page.evaluate(async () => {
    const { prepareBiographyPrint } = await import(
      new URL(
        "features/print-biography.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    prepareBiographyPrint("p11");
    return document.querySelector("#biographyPrint").innerHTML;
  });
  expect(print).toContain("Avery Hale");
  expect(print).toContain("Archive handover at the museum");
  expect(print).not.toContain("<button");
  expect(errors).toEqual([]);
});

test("biography review updates date coverage and remains readable in every language on a narrow phone", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.locator('#personList [data-person="p6"]').click();
  await page.locator('#inspector [data-review-person="p6"]').click();
  await page.locator("#reviewFrom").fill("2012-09-01");
  await page.locator("#reviewTo").fill("2020-12-31");
  await page.locator('[data-action="update-biography-review"]').click();
  await expect(page.locator("#reviewResults")).toContainText(
    "No uncovered periods",
  );
  await page.locator("#reviewMode").selectOption("corroborated");
  await page.locator('[data-action="update-biography-review"]').click();
  await expect(page.locator("#reviewResults")).toContainText(
    "Periods needing clarification",
  );
  await page.locator("#reviewFrom").fill("2021-01-01");
  await page.locator('[data-action="update-biography-review"]').click();
  await expect(page.locator("#reviewResults [data-review-report]")).toHaveCount(
    0,
  );
  await expect(page.locator("#reviewResults")).toContainText(
    "Choose valid start and end dates",
  );
  await page.locator("[data-close]").first().click();
  await page.setViewportSize({ width: 320, height: 740 });
  for (const language of ["en", "uk", "ru"]) {
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.locator('#inspector [data-biography="p6"]').click();
    await page.locator('.biography [data-review-person="p6"]').click();
    await expect(
      page.locator("#reviewResults [data-review-report]"),
    ).toHaveCount(1);
    expect(
      await page
        .locator("#modal")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    expect(
      await page
        .locator("#modal .modal-body")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (language === "uk")
      await page.screenshot({
        path: "test-results/mobile-biography-review.png",
        fullPage: true,
      });
    await page.locator("[data-close]").first().click();
  }
  expect(errors).toEqual([]);
});

test("records an attributed affair episode without replacing marriages or creating kinship", async ({
  page,
}) => {
  await page.locator('[data-action="add-relation"]').click();
  await page.locator('#modal [name="from"]').selectOption("p7");
  await page.locator('#modal [name="to"]').selectOption("p10");
  await page.locator('#modal [name="type"]').selectOption("partner");
  await page.locator('[name="relationship-unionKind"]').selectOption("affair");
  await page.locator('[name="relationship-fromDate"]').fill("2020-01-01");
  await page.locator('[name="relationship-toDate"]').fill("2020-06-30");
  await page.getByText("Verification details", { exact: true }).click();
  await page
    .locator('[name="relationship-verification"]')
    .selectOption("unverified");
  await page
    .locator('[name="relationship-reportedBy"]')
    .fill("Interview account");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await page.locator('#personList [data-biography="p7"]').click();
  const relationships = page.locator(
    '[data-biography-section="relationships"]',
  );
  await expect(relationships).toContainText("Extramarital relationship");
  await expect(relationships).toContainText("Interview account");
  await expect(relationships).toContainText("Unverified");
  await expect(relationships).toContainText("Morgan Blake");
});
