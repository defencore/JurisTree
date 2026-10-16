import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fresh } from "../../src/model/project.js";
import en from "../../src/i18n/locales/en.js";
import uk from "../../src/i18n/locales/uk.js";
import ru from "../../src/i18n/locales/ru.js";

function fixture() {
  const project = fresh();
  project.title = "Doe family documents";
  project.people = ["John Doe", "Jane Doe"].map((name, i) => ({
    id: "person-" + i,
    name,
    gender: i ? "f" : "m",
    birth: "1980",
    lifeStatus: "living",
    x: 100 + i * 300,
    y: 100,
    residences: [
      {
        id: "address-" + i,
        address: "12 Willow Lane",
        from: "2000",
        to: "2010",
        sourceId: "primary",
      },
    ],
  }));
  project.documents = [
    {
      id: "primary",
      title: "Address register",
      type: "register",
      status: "available",
      evidence: "indirect",
      people: [],
      subjectIds: [],
      relations: [],
      propertyIds: [],
      attachments: [],
      purposes: [],
    },
  ];
  return project;
}
async function model(page) {
  return page.evaluate(
    async () =>
      (
        await import(
          new URL(
            "core/state.js",
            document.querySelector('script[type="module"]').src,
          ).href
        )
      ).state.project,
  );
}
async function navigate(page, view) {
  if (!(await page.locator(`[data-view="${view}"]`).isVisible()))
    await page.locator('[data-action="menu"]').click();
  await page.locator(`[data-view="${view}"]`).click();
}
async function profile(page, id) {
  await navigate(page, "people");
  await page.locator(`.profile-directory [data-full-profile="${id}"]`).click();
}
async function save(page) {
  await page.locator('#modalFooter button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}
async function openGroup(page, input) {
  const group = page.locator(input).locator("xpath=ancestor::details[1]");
  if (
    !(await group.getAttribute("open")) &&
    !(await group.evaluate((element) => element.open))
  )
    await group.locator("summary").first().click();
}
async function png(page) {
  return Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 260;
      const context = canvas.getContext("2d");
      context.fillStyle = "#d8c8ac";
      context.fillRect(0, 0, 400, 260);
      context.fillStyle = "#213c58";
      context.font = "24px serif";
      context.fillText("Gift agreement", 30, 80);
      context.fillText("No. G-777 / 2005", 30, 140);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
}

for (const [language, width, labels] of [
  ["en", 1440, en],
  ["uk", 390, uk],
  ["ru", 320, ru],
]) {
  test(`shared documents, record links, particulars, archive and biography work in ${language} at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 950 });
    await page.goto("./");
    await page.locator("#startDemo").click();
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.locator("#importInput").setInputFiles({
      name: "Family.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture())),
    });
    await save(page);
    await navigate(page, "documents");
    const bytes = await png(page),
      title = "Willow Lane gift agreement";
    await page.locator("#fileInput").setInputFiles([
      { name: "Agreement.png", mimeType: "image/png", buffer: bytes },
      {
        name: "Agreement.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n%Stored original agreement\n%%EOF"),
      },
    ]);
    await expect(page.locator("[data-staged-attachment]")).toHaveCount(2);
    await page.locator('[name="title"]').fill(title);
    await page.locator('[name="type"]').selectOption("gift_contract");
    await page.locator('[name="status"]').selectOption("available");
    await page.locator('[name="date"]').fill("12.02.2005");
    await openGroup(page, '[name="document-number"]');
    await page.locator('[name="document-number"]').fill("G-777");
    await page.locator('[name="document-issuedBy"]').fill("Willow Notary");
    await openGroup(page, '[name="document-registryName"]');
    await page
      .locator('[name="document-registryName"]')
      .fill("Property rights register");
    await page
      .locator('[name="document-registrationNumber"]')
      .fill("ENTRY-901");
    await page.locator('[name="document-registrationDate"]').fill("02.2005");
    await openGroup(page, '[name="document-copyKind"]');
    await page
      .locator('[name="document-copyKind"]')
      .selectOption("certified_copy");
    await page
      .locator('[name="document-originalLocation"]')
      .fill("Family folder A");
    const subjects = page
      .locator('[name="subjectIds"]')
      .first()
      .locator("xpath=ancestor::*[@data-person-members]");
    await subjects.locator("[data-person-query]").fill("Doe");
    await page.locator('[name="subjectIds"][value="person-0"]').check();
    await page.locator('[name="subjectIds"][value="person-1"]').check();
    await openGroup(
      page,
      '[name="recordLinks"][value="person-0:residences:address-0"]',
    );
    await page
      .locator('[name="recordLinks"][value="person-0:residences:address-0"]')
      .check();
    await page
      .locator("[data-document-record-query]")
      .fill("no matching record");
    await page.locator("[data-document-record-query]").fill("");
    await expect(
      page.locator(
        '[name="recordLinks"][value="person-0:residences:address-0"]',
      ),
    ).toBeChecked();
    expect(
      await page
        .locator("#modal")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await save(page);
    let project = await model(page),
      source = project.documents.find((source) => source.title === title);
    expect([...source.subjectIds].sort()).toEqual(["person-0", "person-1"]);
    expect(source.details.registrationDate).toBe("2005-02");
    expect(source.recordLinks).toEqual([
      { personId: "person-0", section: "residences", recordId: "address-0" },
    ]);
    await page.locator("#docCategoryFilter").selectOption("contracts");
    await page.locator("#docSearch").fill("G-777 ENTRY-901");
    await expect(page.locator(".doc-card")).toHaveCount(1);
    await page.locator(".doc-preview").click();
    await expect(page.locator(".source-detail")).toContainText("G-777");
    await expect(page.locator(".source-detail")).toContainText("02.2005");
    await page.locator("[data-crop-source]").click();
    await page.locator("#cropSave").click();
    await expect(page.locator(".source-thumbnail")).toHaveCount(3);
    await page.locator("#modal [data-close]").first().click();
    await profile(page, "person-1");
    if (
      await page
        .locator('.full-profile [data-profile-target="residences"]')
        .isVisible()
    )
      await page
        .locator('.full-profile [data-profile-target="residences"]')
        .click();
    else
      await page
        .locator(".full-profile [data-profile-picker]")
        .selectOption("residences");
    await page
      .locator(
        '.full-profile [data-document-library][data-document-record="address-1"]',
      )
      .click();
    await page.locator("[data-document-library-query]").fill("G-777");
    await page.locator("[data-document-library-query]").press("Enter");
    await expect(
      page.locator('#modal[data-kind="document-picker"]'),
    ).toBeVisible();
    await expect(page.locator(".document-picker-item")).toHaveCount(1);
    await page.locator('[name="libraryDocuments"]').check();
    // Changing the search keeps the selected document in the eventual submission.
    await page
      .locator("[data-document-library-query]")
      .fill("Address register");
    await save(page);
    const panel = page.locator(
      '.full-profile [data-profile-panel="residences"]',
    );
    await expect(panel).toContainText(title);
    await expect(panel).toContainText("Address register");
    project = await model(page);

    expect(project.documents).toHaveLength(2);
    expect(project.people[1].residences[0].sourceId).toBe("primary");
    source = project.documents.find((source) => source.title === title);
    expect(source.recordLinks).toHaveLength(2);
    expect(source.attachments).toHaveLength(3);
    await page.locator('.full-profile [data-biography="person-1"]').click();
    const appendix = page.locator('[data-biography-section="documents"]');
    await expect(
      appendix.locator('[data-document-category="contracts"]'),
    ).toContainText("G-777");
    await expect(appendix).toContainText("Family folder A");
    await expect(appendix).not.toContainText(labels["ui.documentCertifiedBy"]);
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.locator("#modal [data-print-biography]").click();
    await expect(page.locator("#biographyPrint")).toContainText("ENTRY-901");
    if (language === "en")
      await page.screenshot({
        path: testInfo.outputPath("document-biography.png"),
      });
    await page.locator("#modal [data-close]").first().click();
    await page.locator('[data-action="export"]').click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-export="zip"]').click(),
    ]);
    const archive = await readFile(await download.path());
    await page.locator("#modal [data-close]").first().click();
    await page.locator("#importInput").setInputFiles({
      name: "Family.zip",
      mimeType: "application/zip",
      buffer: archive,
    });
    await save(page);
    project = await model(page);
    const restored = project.documents.find(
      (document) => document.title === title,
    );
    expect(restored.details).toEqual(source.details);
    expect(restored.recordLinks).toEqual(source.recordLinks);
    const fileDetails = (files) =>
      files.map(({ filename, mime, size }) => ({ filename, mime, size }));
    expect(fileDetails(restored.attachments)).toEqual(
      fileDetails(source.attachments),
    );
    const restoredBytes = await page.evaluate(async (sourceId) => {
      const { state } = await import(
        new URL(
          "core/state.js",
          document.querySelector('script[type="module"]').src,
        ).href
      );
      const source = state.project.documents.find(
        (source) => source.id === sourceId,
      );
      return [
        ...new Uint8Array(
          await state.blobs.get(source.attachments[0].assetId).arrayBuffer(),
        ),
      ];
    }, restored.id);
    expect(restoredBytes).toEqual([...bytes]);
    await expect(page.locator("#saveState")).toContainText(
      labels["ui.draftSaved"],
    );
    await page.reload();
    await page.locator("#startContinue").click();
    expect(
      (await model(page)).documents.find((document) => document.title === title)
        .recordLinks,
    ).toHaveLength(2);
    expect(errors).toEqual([]);
  });
}
