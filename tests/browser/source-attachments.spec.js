import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

async function png(page, color = "#456789") {
  return Buffer.from(
    await page.evaluate((color) => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 220;
      const context = canvas.getContext("2d");
      context.fillStyle = color;
      context.fillRect(0, 0, 160, 220);
      context.fillStyle = "white";
      context.font = "20px Arial";
      context.fillText("Register page", 8, 50);
      return canvas.toDataURL("image/png").split(",")[1];
    }, color),
    "base64",
  );
}
async function mockClipboard(page, buffers) {
  await page.evaluate(
    (encoded) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          read: async () =>
            encoded.map((data) => ({
              types: ["image/png", "text/html"],
              getType: async (type) => {
                if (type !== "image/png")
                  throw Error("Only image bytes should be read");
                return new Blob(
                  [Uint8Array.from(atob(data), (c) => c.charCodeAt(0))],
                  { type },
                );
              },
            })),
        },
      });
    },
    buffers.map((buffer) => buffer.toString("base64")),
  );
}
async function paste(page, selector, buffer, name = "Pasted page.png") {
  return page.locator(selector).evaluate(
    (element, { data, name }) => {
      const transfer = new DataTransfer();
      transfer.items.add(
        new File([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], name, {
          type: "image/png",
        }),
      );
      const event = new ClipboardEvent("paste", {
        clipboardData: transfer,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    },
    { data: buffer.toString("base64"), name },
  );
}
async function documents(page) {
  if (!(await page.locator('[data-view="documents"]').isVisible()))
    await page.locator('[data-action="menu"]').click();
  await page.locator('[data-view="documents"]').click();
}
async function sourceCard(page, title) {
  return page
    .locator(".doc-card")
    .filter({ has: page.locator("h3", { hasText: title }) });
}
async function save(page) {
  await expect(page.locator('#modal button[type="submit"]')).toBeEnabled();
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}
async function archive(page) {
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("#modal [data-close]").first().click();
  return buffer;
}
async function archivedSource(page, buffer, title) {
  return page.evaluate(
    async ({ encoded, title }) => {
      const { default: Zip } = await import(
        new URL(
          "vendor/zip.js",
          document.querySelector('script[type="module"]').src,
        ).href
      );
      const zip = await Zip.loadAsync(
        Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
      );
      const manifest = JSON.parse(await zip.file("tree.json").async("string"));
      const source = manifest.documents.find(
        (source) => source.title === title,
      );
      const files = await Promise.all(
        source.attachments.map(async (file) => ({
          ...file,
          bytes: Array.from(
            await zip
              .file(manifest.attachments[file.assetId].path)
              .async("uint8array"),
          ),
        })),
      );
      return { source, files };
    },
    { encoded: buffer.toString("base64"), title },
  );
}
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
  await page.locator(".topbar [data-language]").selectOption("en");
});
test.afterEach(() => expect(errors).toEqual([]));

test("one source groups original register pages, clipboard images and documents and restores every file from ZIP", async ({
  page,
}) => {
  test.setTimeout(90000);
  const first = await png(page),
    second = await png(page, "#893245"),
    title = "Riverdale register, 1948";
  await documents(page);
  await page.locator("#fileInput").setInputFiles([
    { name: "Register page 1.png", mimeType: "image/png", buffer: first },
    { name: "Register page 2.png", mimeType: "image/png", buffer: second },
    {
      name: "Transcript.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Original register transcript"),
    },
  ]);
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(3);
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="type"]').selectOption("register");
  await page.locator('[name="status"]').selectOption("available");
  await page.locator('[name="subjectIds"][value="p1"]').check();
  await page.locator('[name="reference"]').fill("Volume 3, pages 1–4");
  expect(
    await paste(page, '[name="title"]', second, "Register page 3.png"),
  ).toBe(true);
  await mockClipboard(page, [first]);
  await page.locator("[data-paste-images]").click();
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(5);
  await save(page);
  const card = await sourceCard(page, title);
  await expect(card).toContainText("Files: 5");
  await card.locator(".doc-preview").click();
  await expect(page.locator(".source-thumbnail")).toHaveCount(5);
  await page
    .locator('.source-thumbnail[aria-label="Register page 2.png"]')
    .click();
  await expect(page.locator(".gallery-caption")).toContainText("2 / 5");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-download-doc]").click(),
  ]);
  expect(await readFile(await download.path())).toEqual(second);
  await page.locator("[data-crop-source]").click();
  await expect(page.locator("#cropDialog")).toBeVisible();
  await page.locator("#cropSave").click();
  await expect(page.locator(".source-thumbnail")).toHaveCount(6);
  await page.locator("#modal [data-close]").first().click();
  const buffer = await archive(page),
    archived = await archivedSource(page, buffer, title);
  expect(archived.source.subjectIds).toEqual(["p1"]);
  expect(archived.files).toHaveLength(6);
  expect(archived.files[0].bytes).toEqual([...first]);
  expect(archived.files[1].bytes).toEqual([...second]);
  expect(Buffer.from(archived.files[2].bytes).toString()).toBe(
    "Original register transcript",
  );
  expect(archived.files[5].filename).toBe("Register page 2-copy.webp");
  expect(archived.source).not.toHaveProperty("assetId");
  await page.locator("#importInput").setInputFiles({
    name: "Register.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await documents(page);
  await (await sourceCard(page, title)).locator(".doc-preview").click();
  await expect(page.locator(".source-thumbnail")).toHaveCount(6);
  await page
    .locator('.source-thumbnail[aria-label="Register page 1.png"]')
    .click();
  const [restored] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-download-doc]").click(),
  ]);
  expect(await readFile(await restored.path())).toEqual(first);
  await page.locator("#modal [data-close]").first().click();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await documents(page);
  await (await sourceCard(page, title)).locator(".doc-preview").click();
  await expect(page.locator(".source-thumbnail")).toHaveCount(6);
});

test("editing attachments stages additions and removals, cancellation retains originals and saved deletion supports undo", async ({
  page,
}) => {
  const image = await png(page),
    title = "Ledger pages";
  await documents(page);
  await page.locator("#fileInput").setInputFiles({
    name: "Ledger.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(1);
  await page.locator('[name="title"]').fill(title);
  await save(page);
  await (await sourceCard(page, title)).locator("[data-edit-document]").click();
  await page.locator("[data-remove-attachment]").click();
  await paste(page, "[data-image-paste]", image, "Cancelled.png");
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(1);
  await page.locator("#modalFooter [data-close]").click();
  await (await sourceCard(page, title)).locator(".doc-preview").click();
  await expect(page.locator(".gallery-caption")).toContainText("Ledger.png");
  await page.locator("#modal [data-edit-document]").click();
  await page.locator("[data-remove-attachment]").click();
  await save(page);
  await expect(await sourceCard(page, title)).toContainText("No copy");
  await page.locator('[data-history-command="undo"]').click();
  await (await sourceCard(page, title)).locator(".doc-preview").click();
  await expect(page.locator(".file-view")).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-download-doc]").click(),
  ]);
  expect(await readFile(await download.path())).toEqual(image);
});

test("clipboard permission and unsupported API keep a usable paste area, while ordinary text is not intercepted", async ({
  page,
}) => {
  const image = await png(page);
  await documents(page);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        read: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      },
    }),
  );
  await page.locator("[data-paste-source]").click();
  await expect(page.locator("[data-attachment-message]")).toContainText(
    "Ctrl+V",
  );
  const prevented = await page.locator('[name="notes"]').evaluate((element) => {
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "A record note");
    const event = new ClipboardEvent("paste", {
      clipboardData: transfer,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {},
    }),
  );
  await page.locator("[data-paste-images]").click();
  await expect(page.locator("[data-attachment-message]")).toContainText(
    "Ctrl+V",
  );
  expect(await paste(page, "[data-image-paste]", image)).toBe(true);
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(1);
  await page.locator('[name="title"]').fill("Clipboard photo");
  await save(page);
  await expect(await sourceCard(page, "Clipboard photo")).toContainText(
    "Files: 1",
  );
});

test("pasting on the map links a new source to the selected person and pasting in its viewer appends pages", async ({
  page,
}) => {
  const image = await png(page);
  await page.locator('#personList [data-person="p1"]').click();
  await paste(page, "#canvasWrap", image, "Evidence.png");
  await expect(page.locator('[name="subjectIds"][value="p1"]')).toBeChecked();
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(1);
  await save(page);
  await documents(page);
  await (
    await sourceCard(page, "Evidence.png")
  )
    .locator(".doc-preview")
    .click();
  await paste(page, ".source-preview", image, "Evidence page 2.png");
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(2);
  await save(page);
  await (
    await sourceCard(page, "Evidence.png")
  )
    .locator(".doc-preview")
    .click();
  await expect(page.locator(".source-thumbnail")).toHaveCount(2);
});

for (const [language, width, hasTouch] of [
  ["en", 1280, false],
  ["uk", 390, true],
  ["ru", 320, true],
]) {
  test.describe(`Clipboard controls in ${language}`, () => {
    test.use({
      viewport: { width, height: 900 },
      isMobile: hasTouch,
      hasTouch,
    });
    test(`portrait and source clipboard controls fit ${width}px in ${language}`, async ({
      page,
    }) => {
      const image = await png(page);
      await page.locator(".topbar [data-language]").selectOption(language);
      await page.locator("#globalSearch").fill('name:"John Doe"');
      await page
        .locator('[data-search-kind="person"][data-search-id="p1"]')
        .click();
      if (width < 760) await page.locator('.node[data-node="p1"] .card').tap();
      await page.locator('#inspector [data-portrait="p1"]').click();
      await mockClipboard(page, [image]);
      if (hasTouch) await page.locator("[data-paste-images]").tap();
      else await page.locator("[data-paste-images]").click();
      await expect(page.locator("#cropDialog")).toBeVisible();
      await page.locator("#cropSave").click();
      await expect(page.locator("#inspector .avatar img")).toBeVisible();
      await documents(page);
      if (hasTouch) await page.locator("[data-paste-source]").tap();
      else await page.locator("[data-paste-source]").click();
      await expect(page.locator("[data-staged-attachment]")).toHaveCount(1);
      await paste(page, "[data-image-paste]", image, "Second photo.png");
      await expect(page.locator("[data-staged-attachment]")).toHaveCount(2);
      await page.locator('[name="title"]').fill("Photographic evidence");
      expect(
        await page
          .locator("#modal")
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
      ).toBe(true);
      await save(page);
      await (
        await sourceCard(page, "Photographic evidence")
      )
        .locator(".doc-preview")
        .click();
      if (hasTouch)
        await page
          .locator('.source-thumbnail[aria-label="Second photo.png"]')
          .tap();
      else
        await page
          .locator('.source-thumbnail[aria-label="Second photo.png"]')
          .click();
      await expect(page.locator(".gallery-caption")).toContainText(
        "Second photo.png",
      );
      expect(
        await page
          .locator("#modal")
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
      ).toBe(true);
    });
  });
}

test("award photos link to the exact profile record and retain captions, publication metadata and attachments in biographies and ZIP", async ({
  page,
}) => {
  test.setTimeout(60000);
  const image = await png(page),
    title = "Service Merit Medal · Jordan Roe";
  await page.locator('[data-view="people"]').click();
  await page.locator('.profile-directory [data-full-profile="p4"]').click();
  await page.locator('[data-profile-target="military"]').click();
  await page.locator('[data-record-attachments="award-jordan"]').click();
  await expect(page.locator('[name="type"]')).toHaveValue("award");
  await expect(page.locator('[name="title"]')).toHaveValue(title);
  await expect(page.locator('[name="subjectIds"][value="p4"]')).toBeChecked();
  await paste(page, "[data-image-paste]", image, "Medal front.png");
  await paste(page, "[data-image-paste]", image, "Medal reverse.png");
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(2);
  await page.locator("[data-attachment-caption]").nth(0).fill("Medal, obverse");
  await page.locator("[data-attachment-caption]").nth(1).fill("Medal, reverse");
  await page
    .locator('[name="collectionTitle"]')
    .fill("Regional service awards register");
  await page.locator('[name="volume"]').fill("Volume 7");
  await page.locator('[name="pages"]').fill("Folio 18, reverse");
  await save(page);
  await expect(page.locator('[data-profile-panel="military"]')).toContainText(
    title,
  );
  await page.locator('[data-record-attachments="award-jordan"]').click();
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(2);
  await expect(page.locator("[data-attachment-caption]").nth(1)).toHaveValue(
    "Medal, reverse",
  );
  await page.locator("#modalFooter [data-close]").click();
  await documents(page);
  await (await sourceCard(page, title)).locator(".doc-preview").click();
  await expect(page.locator("#modal")).toContainText("Linked profile records");
  await expect(page.locator("#modal")).toContainText(
    "Regional service awards register",
  );
  await page.locator('.source-thumbnail[aria-label="Medal, reverse"]').click();
  await expect(page.locator(".gallery-caption")).toContainText(
    "Medal reverse.png",
  );
  await page.locator("#modal [data-close]").first().click();
  await page.locator("#globalSearch").fill('"Folio 18, reverse"');
  await expect(page.locator('[data-search-kind="document"]')).toHaveCount(1);
  await page.locator("#globalSearch").fill("");
  await page.locator('[data-view="people"]').click();
  await page.locator('.profile-directory [data-full-profile="p4"]').click();
  await page.locator('.full-profile [data-biography="p4"]').click();
  await expect(page.locator(".biography")).toContainText("Medal, obverse");
  await expect(page.locator(".biography")).toContainText("Folio 18, reverse");
  await page.locator("#modal [data-close]").first().click();
  const buffer = await archive(page),
    result = await archivedSource(page, buffer, title);
  expect(result.files.map((file) => file.caption)).toEqual([
    "Medal, obverse",
    "Medal, reverse",
  ]);
  expect(result.files[0].bytes).toEqual([...image]);
  await page
    .locator("#importInput")
    .setInputFiles({ name: "Award.zip", mimeType: "application/zip", buffer });
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('[data-view="people"]').click();
  await page.locator('.profile-directory [data-full-profile="p4"]').click();
  await page.locator('[data-profile-target="military"]').click();
  await expect(page.locator('[data-profile-panel="military"]')).toContainText(
    title,
  );
  await page.locator('[data-record-attachments="award-jordan"]').click();
  await expect(page.locator("[data-staged-attachment]")).toHaveCount(2);
});
