import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test.use({ timezoneId: "Europe/Kyiv" });

test("backups use local date and seconds across midnight, match metadata and remain importable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startTitle").fill("Родина Doe / Roe");
  await page.locator("#startCreate").click();
  await page.locator('#viewActions [data-action="add-person"]').click();
  await page.locator('#modal [name="name"]').fill("Alex Doe");
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('[data-action="export"]').click();
  const names = [];
  let latest;
  for (const [utc, local] of [
    ["2026-12-31T21:59:59.000Z", "2026-12-31_23-59-59"],
    ["2026-12-31T22:00:00.000Z", "2027-01-01_00-00-00"],
  ]) {
    await page.clock.setFixedTime(new Date(utc));
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-export="zip"]').click(),
    ]);
    names.push(download.suggestedFilename());
    expect(download.suggestedFilename()).toBe(`Родина Doe - Roe_${local}.zip`);
    latest = await readFile(await download.path());
    const manifest = await page.evaluate(
      async (bytes) => {
        const { default: Zip } = await import(
          new URL(
            "vendor/zip.js",
            document.querySelector('script[type="module"]').src,
          ).href
        );
        const zip = await Zip.loadAsync(Uint8Array.from(bytes));
        return JSON.parse(await zip.file("tree.json").async("string"));
      },
      [...latest],
    );
    expect(manifest.title).toBe("Родина Doe / Roe");
    expect(manifest.exportedAt).toBe(utc);
    expect(manifest.people[0].name).toBe("Alex Doe");
  }
  expect(names[0] < names[1]).toBe(true);
  await page.locator("#modal [data-close]").first().click();
  await page
    .locator("#importInput")
    .setInputFiles({
      name: names[1],
      mimeType: "application/zip",
      buffer: latest,
    });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#projectTitle")).toHaveText("Родина Doe / Roe");
  await expect(page.locator("#personList")).toContainText("Alex Doe");
  expect(errors).toEqual([]);
});
