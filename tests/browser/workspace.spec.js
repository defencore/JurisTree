import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { biographyProject } from "../fixtures/biography.js";

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("./");
  await expect(page.locator("#startCreate")).toBeEnabled();
});
test.afterEach(() => expect(errors).toEqual([]));

async function demo(page) {
  await page.locator("#startDemo").click();
  await expect(page.locator("#appShell")).toBeVisible();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(13);
}

test("opens a complete autobiography from every person entry point and language", async ({
  page,
}) => {
  await demo(page);
  await page.locator("#importInput").setInputFiles({
    name: "biography.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(biographyProject())),
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#personList [data-biography]")).toHaveCount(13);
  await expect(page.locator("#graph [data-biography]")).toHaveCount(13);
  const node = page.locator('.node[data-node="p5"]');
  const position = await node.getAttribute("transform");
  await page.locator('#graph [data-biography="p5"]').click();
  await expect(page.locator("#modalTitle")).toHaveText("Autobiography");
  expect(
    await page
      .locator("#modal .modal-body")
      .evaluate((element) => element.scrollTop),
  ).toBe(0);
  for (const value of [
    "My life story.",
    "Literal <b>text</b>",
    "Graduation",
    "alex@example.org",
    "10 Example Street",
    "Example University",
    "Architecture",
    "Sunny",
    "Recorded health details",
    "Watercolor painting",
    "Local history",
    "Family studio",
    "0 USD",
    "75%",
    "Family book collection",
    "30%",
    "Relationship-only source",
    "Property-only source",
    "Research note for the complete profile",
  ])
    await expect(page.locator(".biography")).toContainText(value);
  await expect(
    page.locator(".biography script, .biography .biography-prose b"),
  ).toHaveCount(0);
  await expect(page.locator(".biography")).not.toContainText(
    "Unrelated source",
  );
  await page.locator("[data-close]").first().click();
  await expect(node).toHaveAttribute("transform", position);
  for (const [language, title] of [
    ["uk", "Автобіографія"],
    ["ru", "Автобиография"],
    ["en", "Autobiography"],
  ]) {
    await page.locator("#appShell [data-language]").selectOption(language);
    await page.locator('#personList [data-biography="p5"]').click();
    await expect(page.locator("#modalTitle")).toHaveText(title);
    await expect(page.locator(".biography")).toContainText("Alex Example");
    await page.locator("[data-close]").first().click();
  }
  await page.locator('#personList [data-person="p5"]').click();
  await page.locator('#inspector [data-biography="p5"]').click();
  await page.locator('.biography [data-biography="p3"]').click();
  await expect(page.locator(".biography-header h2")).toHaveText("Jamie Roe");
  await page.locator("[data-close]").first().click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#graph [data-biography="p5"]').focus();
  await page.locator('#graph [data-biography="p5"]').press("Space");
  await expect(page.locator("#modalTitle")).toHaveText("Autobiography");
  expect(
    await page
      .locator("#modal .modal-body")
      .evaluate((element) => element.scrollTop),
  ).toBe(0);
  expect(
    await page
      .locator("#modalContent")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-biography.png" });
});

test("switches every language in the launch screen and editor", async ({
  page,
}) => {
  await page.locator("#startScreen [data-language]").selectOption("uk");
  await expect(page.locator("#startHeading")).toHaveText(
    "Відкрийте або створіть схему",
  );
  await page.locator("#startScreen [data-language]").selectOption("ru");
  await expect(page.locator("#startHeading")).toHaveText(
    "Откройте или создайте схему",
  );
  await page.locator("#startScreen [data-language]").selectOption("en");
  await demo(page);
  await page.locator("#appShell [data-language]").selectOption("uk");
  await expect(page.locator("#viewTitle")).toHaveText("Схема зв’язків");
  await expect(page.locator("#projectTitle")).toHaveText(
    "Doe and Roe families — fictional demo",
  );
  await page.locator("#appShell [data-language]").selectOption("ru");
  await expect(page.locator("#viewTitle")).toHaveText("Схема связей");
  await expect(page.locator("#saveState")).toContainText("Черновик сохранён");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("#startContinue")).toBeEnabled();
});

test("creates, edits, undoes and restores a saved draft", async ({ page }) => {
  await page.locator("#startTitle").fill("Test family");
  await page.locator("#startCreate").click();
  await page.locator('#viewActions [data-action="add-person"]').click();
  await page.locator('#modal input[name="name"]').fill("Alice Example");
  await page.locator('#modal input[name="birthYear"]').fill("1980");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#personList")).toContainText("Alice Example");
  await page.locator('[data-action="undo"]').click();
  await expect(page.locator("#personList")).not.toContainText("Alice Example");
  await page.locator('[data-action="redo"]').click();
  await expect(page.locator("#personList")).toContainText("Alice Example");
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await expect(page.locator("#projectTitle")).toHaveText("Test family");
  await expect(page.locator("#personList")).toContainText("Alice Example");
});

test("renders all workspace sections and finds a graph path", async ({
  page,
}) => {
  await demo(page);
  for (const view of ["documents", "events", "gaps", "property", "tree"]) {
    await page.locator(`[data-view="${view}"]`).click();
    await expect(page.locator("#viewTitle")).not.toBeEmpty();
  }
  await page.locator('[data-action="graph-search"]').click();
  await page.locator("#analysisFrom").selectOption("p1");
  await page.locator("#analysisTo").selectOption("p5");
  await page.locator('[data-action="run-graph-analysis"]').click();
  await expect(page.locator(".analysis-path")).not.toHaveCount(0);
});

test("exports a full ZIP, reimports it and exports SVG and PNG", async ({
  page,
}) => {
  await demo(page);
  await page.locator('[data-view="documents"]').click();
  await page.locator("#fileInput").setInputFiles({
    name: "note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Archive attachment round trip"),
  });
  await page.locator('#modal input[name="title"]').fill("Attachment test");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#docCount")).toHaveText("10");
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.locator('[data-action="export"]').click();
  const [zip] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const zipPath = await zip.path();
  await page.locator("[data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "backup.zip",
    mimeType: "application/zip",
    buffer: await readFile(zipPath),
  });
  await expect(page.locator("#modalTitle")).toHaveText("Import tree?");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#personList .person-row")).toHaveCount(13);
  await page.locator('[data-view="documents"]').click();
  await page
    .locator(".doc-card")
    .filter({ hasText: "Attachment test" })
    .locator("[data-document]")
    .first()
    .click();
  const [attachment] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-download-doc]").click(),
  ]);
  expect(await readFile(await attachment.path(), "utf8")).toBe(
    "Archive attachment round trip",
  );
  await page.locator("[data-close]").first().click();
  await page.locator('[data-view="tree"]').click();
  await page.locator('[data-action="export"]').click();
  for (const format of ["svg", "png"]) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(`[data-export="${format}"]`).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));
  }
});

test("mobile launch screen and map have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/mobile-launch.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await demo(page);
  await page.screenshot({
    path: "test-results/mobile-editor.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("desktop layout renders with a clean console", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await demo(page);
  await page.screenshot({
    path: "test-results/desktop-editor.png",
    fullPage: true,
  });
});

test("adds groups, relationships, property shares and personal events", async ({
  page,
}) => {
  await demo(page);
  await page.locator("#purpose").selectOption("family");
  await page.locator('[data-action="add-group"]').click();
  await page.locator('#modal input[name="name"]').fill("Research group");
  await page.locator('#modal input[name="members"][value="p1"]').check();
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#groupList")).toContainText("Research group");
  await page.locator('[data-action="add-relation"]').click();
  await page.locator('#modal select[name="from"]').selectOption("p3");
  await page.locator('#modal select[name="to"]').selectOption("p7");
  await page.locator('#modal select[name="type"]').selectOption("sibling");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator(".graph-view-summary")).toContainText("21/21");
  await page.locator('[data-view="property"]').click();
  await page.locator('#viewActions [data-action="add-property"]').click();
  await page.locator('#modal input[name="title"]').fill("Family house");
  await page.locator('#modal input[name="value"]').fill("100000");
  await page.locator("[data-add-allocation]").click();
  await page.locator('[name="allocation-person"]').selectOption("p5");
  await page.locator('[name="allocation-percent"]').fill("100");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#otherView")).toContainText("Family house");
  await expect(
    page
      .locator(".asset-card")
      .filter({
        has: page.getByRole("heading", { name: "Family house", exact: true }),
      })
      .locator(".asset-total"),
  ).toContainText("100%");
  await page.locator('[data-view="events"]').click();
  await page.locator('[data-action="add-event"]').click();
  await page.locator('#modal input[name="title"]').fill("Family gathering");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page
    .locator('#modal input[name="date"]')
    .fill(tomorrow.toISOString().slice(0, 10));
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#otherView")).toContainText("Family gathering");
});

test("works without IndexedDB and explains the backup option", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", { value: undefined }),
  );
  await page.reload();
  await expect(page.locator("#startStorageNote")).toContainText(
    "Autosave is unavailable",
  );
  await demo(page);
  await expect(page.locator("#personList .person-row")).toHaveCount(13);
});
