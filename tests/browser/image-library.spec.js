import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function imageBytes(page) {
  return Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 240;
      const context = canvas.getContext("2d");
      context.fillStyle = "#b42626";
      context.fillRect(0, 0, 200, 240);
      context.fillStyle = "#2453ad";
      context.fillRect(200, 0, 200, 240);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
}
async function project(page) {
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
async function library(page) {
  if (!(await page.locator('[data-view="library"]').isVisible()))
    await page.locator('[data-action="menu"]').click();
  await page.locator('[data-view="library"]').click();
}
async function upload(page) {
  const bytes = await imageBytes(page);
  await library(page);
  await page.locator("#fileInput").setInputFiles({
    name: "Family reunion.png",
    mimeType: "image/png",
    buffer: bytes,
  });
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(1);
  await page.locator('[name="title"]').fill("Doe family reunion");
  await page
    .locator("[data-attachment-description]")
    .fill("A gathering outside the family home.");
  await page
    .locator("[data-attachment-inscription]")
    .fill("John and Jane, August 1972. Written on the reverse.");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator(".media-library-card")).toHaveCount(1);
  return bytes;
}
async function openEditor(page) {
  await page.locator(".media-library-preview").click();
  await expect(page.locator(".media-editor")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".media-image-stage > img")
        .evaluate((image) => image.naturalWidth),
    )
    .toBe(400);
}
async function draw(page, x1 = 0.1, y1 = 0.1, x2 = 0.4, y2 = 0.7) {
  await page.locator("[data-media-draw]").click();
  const bounds = await page.locator(".media-image-stage").boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * x1,
    bounds.y + bounds.height * y1,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * x2,
    bounds.y + bounds.height * y2,
    { steps: 8 },
  );
  await page.mouse.up();
}
async function link(page, target) {
  const index = await page.evaluate(async (target) => {
    const base = document.querySelector('script[type="module"]').src;
    const { state } = await import(new URL("core/state.js", base).href);
    const { mediaTargetOptions, targetKey } = await import(
      new URL("model/image-regions.js", base).href
    );
    return mediaTargetOptions(state.project).findIndex(
      (option) => targetKey(option.target) === targetKey(target),
    );
  }, target);
  await page.locator("[data-media-search]").fill("");
  await page.locator("[data-media-target]").selectOption(String(index));
  await page.locator("[data-media-add-link]").click();
}
async function saveEditor(page) {
  await page.locator('.media-editor [type="submit"]').click();
  await expect(page.locator(".media-editor")).toHaveCount(0);
}
async function biography(page, id) {
  if (!(await page.locator('[data-view="people"]').isVisible()))
    await page.locator('[data-action="menu"]').click();
  await page.locator('[data-view="people"]').click();
  await page.locator(`[data-full-profile="${id}"]`).click();
  await page.locator(`.full-profile [data-biography="${id}"]`).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
  await page.locator(".topbar [data-language]").selectOption("en");
});

test("unannotated originals retain descriptions and handwritten inscriptions after draft restoration", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await upload(page);
  await expect(page.locator(".media-library-card")).toContainText(
    "John and Jane, August 1972",
  );
  const source = (await project(page)).documents.at(-1);
  expect(source.people).toEqual([]);
  expect(source.attachments[0].regions).toEqual([]);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await library(page);
  await page.locator("#librarySearch").fill("Written on the reverse");
  await expect(page.locator(".media-library-card")).toHaveCount(1);
  await openEditor(page);
  await expect(page.locator("[data-media-description]")).toHaveValue(
    "A gathering outside the family home.",
  );
  await expect(page.locator("[data-media-inscription]")).toHaveValue(
    "John and Jane, August 1972. Written on the reverse.",
  );
  await page.locator("[data-media-close]").first().click();
  expect(errors).toEqual([]);
});

test("family photo regions are editable, shared across people and exact records, and backed up once", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const bytes = await upload(page);
  const oldAwardSource = (await project(page)).people
    .find((p) => p.id === "p4")
    .militaryRecords.find((r) => r.id === "award-jordan").sourceId;
  await openEditor(page);
  await draw(page);
  await expect(
    page.locator('[data-media-coordinate="height"]'),
  ).not.toHaveValue("0.1");
  await page.locator("[data-media-title]").fill("John at the reunion");
  await link(page, { kind: "person", personId: "p1" });
  await link(page, {
    kind: "record",
    personId: "p4",
    section: "military",
    recordId: "award-jordan",
  });
  await page.locator("[data-media-portrait]").click();
  await expect(page.locator('.media-editor [type="submit"]')).toBeEnabled();
  await draw(page, 0.55, 0.15, 0.9, 0.65);
  await page.locator("[data-media-title]").fill("Jane at the reunion");
  await link(page, { kind: "person", personId: "p2" });
  await page.locator('[data-media-coordinate="x"]').fill("60");
  await page.locator('[data-media-coordinate="width"]').fill("30");
  await page.locator("[data-media-zoom]").fill("2");
  await expect(page.locator("[data-media-zoom-value]")).toHaveText("200%");
  await saveEditor(page);
  let current = await project(page),
    source = current.documents.at(-1);
  expect(source.attachments).toHaveLength(1);
  expect(source.attachments[0].regions).toHaveLength(2);
  expect(source.attachments[0].regions[1].rect.x).toBeCloseTo(0.6);
  expect(current.people.find((p) => p.id === "p1").avatarId).toBeTruthy();
  expect(
    current.people
      .find((p) => p.id === "p4")
      .militaryRecords.find((r) => r.id === "award-jordan").sourceId,
  ).toBe(oldAwardSource);
  await biography(page, "p1");
  await expect(page.locator("#modal .biography-image")).toHaveCount(1);
  await expect(page.locator("#modal .biography-image")).toContainText(
    "John at the reunion",
  );
  await page.locator("#modal [data-close]").first().click();
  await biography(page, "p4");
  await expect(
    page.locator('#modal [data-biography-section="military"] .biography-image'),
  ).toHaveCount(1);
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  const result = await page.evaluate(async (encoded) => {
    const { default: Zip } = await import(
      new URL(
        "vendor/zip.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    const zip = await Zip.loadAsync(
      Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
    );
    const tree = JSON.parse(await zip.file("tree.json").async("string"));
    const source = tree.documents.at(-1),
      file = source.attachments[0];
    return {
      source,
      bytes: [
        ...(await zip
          .file(tree.attachments[file.assetId].path)
          .async("uint8array")),
      ],
      originalPaths: Object.keys(zip.files).filter(
        (path) => path === tree.attachments[file.assetId].path,
      ),
    };
  }, buffer.toString("base64"));
  expect(result.bytes).toEqual([...bytes]);
  expect(result.originalPaths).toHaveLength(1);
  expect(result.source.attachments[0].regions).toEqual(
    source.attachments[0].regions,
  );
  await page.locator("#modal [data-close]").first().click();
  await page
    .locator("#importInput")
    .setInputFiles({ name: "Family.zip", mimeType: "application/zip", buffer });
  await page.locator('#modal [type="submit"]').click();
  await library(page);
  await openEditor(page);
  await expect(page.locator("[data-media-select]")).toHaveCount(2);
  await page.locator("[data-media-select]").nth(1).click();
  await expect(page.locator('[data-media-coordinate="x"]')).toHaveValue("60");
  await page.locator("[data-media-description]").fill("Cancelled description");
  await page.locator("[data-media-close]").first().click();
  expect(
    (await project(page)).documents.at(-1).attachments[0].description,
  ).toBe("A gathering outside the family home.");
  expect(errors).toEqual([]);
});

test("library selection adds existing image views to a record without uploads or replacing sources", async ({
  page,
}) => {
  await upload(page);
  const before = (await project(page)).documents.length;
  await page.locator('[data-view="people"]').click();
  await page.locator('[data-full-profile="p4"]').click();
  await page.locator('[data-profile-target="military"]').click();
  await page.locator('[data-library-record="award-jordan"]').click();
  await page.locator("[data-library-search]").fill("August 1972");
  await page.locator("[data-library-source]").click();
  await expect(
    page.locator('[data-profile-panel="military"] .biography-image'),
  ).toHaveCount(1);
  const current = await project(page);
  expect(current.documents).toHaveLength(before);
  expect(current.documents.at(-1).attachments[0].regions[0].targets).toEqual([
    {
      kind: "record",
      personId: "p4",
      section: "military",
      recordId: "award-jordan",
    },
  ]);
  await library(page);
  await page.locator(".media-library-card [data-document]").click();
  await expect(page.locator("#modal")).toContainText("Linked profile records");
  await page.locator("[data-delete-document]").click();
  await expect(page.locator("#modal")).toContainText("Jordan Roe");
  await page.locator("#modalFooter [data-close]").click();
});

test("region handles, keyboard movement, annotation deletion and undo preserve the original", async ({
  page,
}) => {
  await upload(page);
  await openEditor(page);
  await draw(page);
  await link(page, { kind: "person", personId: "p1" });
  const box = await page.locator("[data-region-box]").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 25,
    box.y + box.height / 2 + 12,
  );
  await page.mouse.up();
  expect(
    Number(await page.locator('[data-media-coordinate="x"]').inputValue()),
  ).toBeGreaterThan(10);
  const previousWidth = Number(
    await page.locator('[data-media-coordinate="width"]').inputValue(),
  );
  const corner = await page.locator('[data-region-handle="se"]').boundingBox();
  await page.mouse.move(
    corner.x + corner.width / 2,
    corner.y + corner.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    corner.x + corner.width / 2 + 35,
    corner.y + corner.height / 2 + 10,
  );
  await page.mouse.up();
  expect(
    Number(await page.locator('[data-media-coordinate="width"]').inputValue()),
  ).toBeGreaterThan(previousWidth);
  await page.locator("[data-region-box]").focus();
  await page.keyboard.press("ArrowRight");
  await saveEditor(page);
  await openEditor(page);
  await page.locator("[data-media-delete]").click();
  await saveEditor(page);
  expect(
    (await project(page)).documents.at(-1).attachments[0].regions,
  ).toHaveLength(0);
  await page.locator('[data-history-command="undo"]').click();
  expect(
    (await project(page)).documents.at(-1).attachments[0].regions,
  ).toHaveLength(1);
  await page.locator('[data-view="people"]').click();
  await page.locator('[data-full-profile="p1"]').click();
  await page.locator('.full-profile [data-portrait="p1"]').click();
  await page.locator("[data-library-portrait]").click();
  await page
    .locator("[data-library-region]")
    .filter({ hasText: "Region" })
    .click();
  await expect(page.locator(".full-profile .avatar img").first()).toBeVisible();
  expect((await project(page)).documents.at(-1).attachments).toHaveLength(1);
});

for (const [language, width] of [
  ["en", 1280],
  ["uk", 390],
  ["ru", 320],
]) {
  test(`image annotations and a family biography with originals fit ${language} at ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await upload(page);
    await page.locator(".topbar [data-language]").selectOption(language);
    await openEditor(page);
    await draw(page, 0.1, 0.1, 0.45, 0.6);
    await expect(
      page.locator('[data-media-coordinate="height"]'),
    ).not.toHaveValue("0.1");
    await page.locator("[data-media-title]").fill("John at the reunion");
    await link(page, { kind: "person", personId: "p1" });
    expect(
      await page
        .locator(".media-editor")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await saveEditor(page);
    await biography(page, "p1");
    await page.locator('#modal [data-report-biography="p1"]').click();
    await expect(
      page.locator("[data-report-preview] .biography-image"),
    ).toHaveCount(1);
    await page.locator("#modal details").nth(1).locator("summary").click();
    await page.locator('[name="report-appendix"]').check();
    await expect(
      page.locator(
        '[data-report-preview] [data-biography-section="appendix"] .biography-image',
      ),
    ).toHaveCount(1);
    expect(
      await page
        .locator("#modal")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await page.locator('[name="report-image"]').uncheck();
    await expect(
      page.locator("[data-report-preview] .biography-image"),
    ).toHaveCount(0);
    await page.locator('[name="report-image"]').check();
    await page.evaluate(() => {
      window.print = () => {
        window.printed = true;
      };
    });
    await page.locator('#modal [type="submit"]').click();
    await expect.poll(() => page.evaluate(() => window.printed)).toBe(true);
    await expect(page.locator("#biographyPrint .biography-image")).toHaveCount(
      2,
    );
    await expect(page.locator("#biographyPrint button")).toHaveCount(0);
    await expect(page.locator("#biographyPrint")).toContainText(
      "John and Jane, August 1972",
    );
    expect(errors).toEqual([]);
  });
}
