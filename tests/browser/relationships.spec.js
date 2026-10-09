import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
});

test("records separate partnership episodes, validates dates and displays their verification", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  async function openEpisode() {
    await page.locator('[data-action="add-relation"]').click();
    await page.locator('#modal [name="from"]').selectOption("p3");
    await page.locator('#modal [name="to"]').selectOption("p7");
    await page.locator('#modal [name="type"]').selectOption("partner");
    await page
      .locator('[name="relationship-unionKind"]')
      .selectOption("dating");
    await page.locator('[name="relationship-status"]').selectOption("ended");
    await page
      .locator('[name="relationship-duration"]')
      .selectOption("temporary");
  }
  await openEpisode();
  await page.locator('[name="relationship-fromDate"]').fill("2022");
  await page.locator('[name="relationship-toDate"]').fill("2021");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modalError")).not.toBeEmpty();
  await page.locator('[name="relationship-toDate"]').fill("2023");
  await page.getByText("Verification details", { exact: true }).click();
  await page
    .locator('[name="relationship-verification"]')
    .selectOption("unverified");
  await page
    .locator('[name="relationship-reportedBy"]')
    .fill("Fictional witness");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#inspector")).toContainText("2022");
  await expect(page.locator("#inspector")).toContainText("Fictional witness");
  await expect(page.locator("#inspector")).toContainText("Unverified");
  await openEpisode();
  await page.locator('[name="relationship-fromDate"]').fill("2024");
  await page.locator('[name="relationship-toDate"]').fill("2025");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  const paths = await page
    .locator(
      '.edge[aria-label*="Jamie Roe"][aria-label*="Taylor Ward"][aria-label*="Dating"] > path:nth-child(2)',
    )
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("d")));
  expect(new Set(paths).size).toBe(2);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('#personList [data-biography="p3"]').click();
  await expect(
    page.locator('.biography [data-biography-section="relationships"]'),
  ).toContainText("2022");
  await expect(
    page.locator('.biography [data-biography-section="relationships"]'),
  ).toContainText("2024");
  expect(errors).toEqual([]);
});

function silentWav() {
  const data = Buffer.alloc(1644);
  data.write("RIFF");
  data.writeUInt32LE(1636, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(8000, 24);
  data.writeUInt32LE(16000, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(1600, 40);
  return data;
}

test("attaches, plays and restores an audio source without promoting it to official evidence", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const audio = silentWav();
  await page.locator('[data-view="documents"]').click();
  await page.locator("#fileInput").setInputFiles({
    name: "fictional-recording.wav",
    mimeType: "audio/x-wav",
    buffer: audio,
  });
  await expect(page.locator('#modal [name="type"]')).toHaveValue("recording");
  await page.locator('#modal [name="evidence"]').selectOption("official");
  await expect(page.locator('#modal [name="evidence"]')).toHaveValue(
    "indirect",
  );
  await page.locator('#modal [name="status"]').selectOption("available");
  await page.getByText("Verification details", { exact: true }).click();
  await page
    .locator('[name="source-verification"]')
    .selectOption("corroborated");
  await page.locator('[name="source-checkedBy"]').fill("Fictional reviewer");
  await page.locator('[name="source-checkedAt"]').fill("2026-01-01");
  await page
    .locator('[name="transcription"]')
    .fill("Fictional transcript; contents evaluated separately.");
  await page.locator('#modal button[type="submit"]').click();
  await page
    .locator(".doc-card")
    .filter({ hasText: "fictional-recording.wav" })
    .locator(".doc-preview")
    .click();
  await expect(page.locator("audio.media-view")).toBeVisible();
  await expect
    .poll(() => page.locator("audio").evaluate((el) => el.readyState))
    .toBeGreaterThan(0);
  await expect(page.locator("#modal")).toContainText("Indirect evidence");
  await expect(page.locator("#modal")).toContainText("Fictional reviewer");
  await page.locator("[data-close]").first().click();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  const archived = await page.evaluate(async (encoded) => {
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
    const d = manifest.documents.find(
      (d) => d.filename === "fictional-recording.wav",
    );
    const bytes = await zip
      .file(manifest.attachments[d.assetId].path)
      .async("uint8array");
    return { document: d, bytes: Array.from(bytes) };
  }, buffer.toString("base64"));
  expect(archived.bytes).toEqual([...audio]);
  expect(archived.document.evidence).toBe("indirect");
  expect(archived.document.verification).toBe("corroborated");
  await page.locator("[data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "recording.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('[data-view="documents"]').click();
  await page
    .locator(".doc-card")
    .filter({ hasText: "fictional-recording.wav" })
    .locator(".doc-preview")
    .click();
  await expect(page.locator("audio.media-view")).toBeVisible();
  await expect(page.locator("#modal")).toContainText("Fictional transcript");
  expect(errors).toEqual([]);
});
