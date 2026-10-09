import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const modes = [
  "family",
  "civil",
  "inheritance",
  "property",
  "research",
  "profiling",
  "legal",
  "financial",
];
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
});
test.afterEach(() => expect(errors).toEqual([]));

test("explicit source visibility retains the original four-mode subset after saving and restoring a draft", async ({
  page,
}) => {
  await page.locator("#startDemo").click();
  await page.locator('[data-view="documents"]').click();
  await page.locator('#otherView [data-edit-document="d3"]').click();
  await expect(page.locator('#modal [name="purposes"]')).toHaveCount(8);
  for (const mode of ["civil", "profiling", "legal", "financial"])
    await page.locator(`#modal [name="purposes"][value="${mode}"]`).uncheck();
  await page.locator('#modal button[type="submit"]').click();
  await page.locator("#purpose").selectOption("civil");
  await expect(page.locator("#docCount")).toHaveText("101");
  await expect(
    page.locator('#otherView [data-edit-document="d3"]'),
  ).toHaveCount(0);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await expect(page.locator("#purpose")).toHaveValue("civil");
  await expect(page.locator("#docCount")).toHaveText("101");
  await page.locator("#purpose").selectOption("family");
  await expect(page.locator("#docCount")).toHaveText("102");
});

for (const [mode, view] of [
  ["civil", "people"],
  ["profiling", "people"],
  ["legal", "events"],
  ["financial", "property"],
]) {
  test(`${mode} template starts in its recommended view`, async ({ page }) => {
    await expect(page.locator("[data-start-template]")).toHaveCount(9);
    await page.locator(`[data-start-template="${mode}"]`).click();
    await page.locator("#startCreate").click();
    await expect(page.locator("#purpose")).toHaveValue(mode);
    await expect(page.locator(`[data-view="${view}"]`)).toHaveClass(/active/);
    await expect(page.locator("#otherView")).toBeVisible();
    if (mode === "legal") {
      await expect(page.locator("#eventDomain")).toHaveValue("legal");
      await expect(page.locator('[data-event-mode="history"]')).toHaveAttribute(
        "aria-selected",
        "true",
      );
    }
    await expect(page.locator("#purposeHint")).not.toHaveText("");
  });
}

for (const width of [390, 1440]) {
  for (const language of ["en", "uk", "ru"]) {
    test(`mode switching preserves full profiles and source visibility at ${width}px in ${language}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#startDemo").click();
      await page.locator(".topbar [data-language]").selectOption(language);
      if (width <= 760) await page.locator('[data-action="menu"]').click();
      await page.locator('[data-view="people"]').click();
      await page.locator("#profileSearch").fill("Jesse Ward");
      await page.locator('#otherView [data-full-profile="p5"]').click();
      for (const mode of modes) {
        if (width <= 760) await page.locator('[data-action="menu"]').click();
        await page.locator("#purpose").selectOption(mode);
        await expect(page.locator("#purpose option")).toHaveCount(8);
        await expect(page.locator("#docCount")).toHaveText("102");
        await expect(page.locator("#purposeHint")).not.toHaveText("");
        if (width <= 760) await page.locator('[data-action="menu"]').click();
        await expect(
          page.locator('.full-profile [data-profile-panel="civil"]'),
        ).toContainText("1988-00412");
        await expect(
          page.locator('.full-profile [data-profile-panel="accounts"]'),
        ).toHaveCount(1);
      }
      await page.locator('.full-profile [data-edit-person="p5"]').click();
      const editor = page.locator("[data-profile-editor]");
      if (width <= 760)
        await editor.locator("[data-profile-picker]").selectOption("civil");
      else await editor.locator('[data-profile-target="civil"]').click();
      await expect(
        editor.locator('[data-profile-section="civil"]'),
      ).toHaveAttribute("open", "");
      for (const selector of ["#modal", "#modal .modal-body", ".topbar"])
        expect(
          await page
            .locator(selector)
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
}

test("civil details link to relationships, remain printable and restore from an editable archive", async ({
  page,
}) => {
  await page.locator("#startDemo").click();
  await page.locator('#inspector [data-full-profile="p5"]').click();
  await page.locator('.full-profile [data-profile-target="civil"]').click();
  await page
    .locator('.full-profile [data-open-profile-section="civil"]')
    .click();
  const civil = page.locator('[data-record-section="civil"]').first();
  await civil.locator('[name="civil-actNumber"]').fill("412-A");
  await civil.getByText("Registration details", { exact: true }).click();
  await civil.locator('[name="civil-registryNumber"]').fill("BR-1988-412-A");
  await civil.getByText("Changes and annotations", { exact: true }).click();
  await civil
    .locator('[name="civil-annotations"]')
    .fill("Registration corrected following archive review.");
  await page.locator('#modal button[type="submit"]').click();
  await expect(
    page.locator('.full-profile [data-profile-panel="civil"]'),
  ).toContainText("BR-1988-412-A");
  await page.locator('.full-profile [data-profile-target="civil"]').click();
  await page.locator('.full-profile [data-source-relation="r5"]').click();
  await expect(page.locator("#canvasWrap")).toBeVisible();
  await expect(
    page.locator('#inspector [data-edit-relation="r5"]'),
  ).toBeVisible();
  await page.locator('#inspector [data-edit-relation="r5"]').click();
  await page.locator('#modal [data-delete-relation="r5"]').click();
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('[data-action="undo"]').click();
  await page.locator('#personList [data-biography="p5"]').click();
  await expect(page.locator('[data-biography-section="civil"]')).toContainText(
    "Registration corrected following archive review.",
  );
  await expect(
    page.locator(
      '[data-biography-section="civil"] [data-source-relation="r5"]',
    ),
  ).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator('#modal [data-print-biography="p5"]').click();
  await expect(page.locator("#biographyPrint")).toContainText("BR-1988-412-A");
  await expect(page.locator("#biographyPrint")).toContainText("Jamie Doe");
  await expect(page.locator("#biographyPrint button")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.locator("#modal [data-close]").first().click();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("#modal [data-close]").first().click();
  await page.locator("#importInput").setInputFiles({
    name: "civil-records.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator('#personList [data-biography="p5"]').click();
  await expect(page.locator('[data-biography-section="civil"]')).toContainText(
    "BR-1988-412-A",
  );
  await expect(
    page.locator(
      '[data-biography-section="civil"] [data-source-relation="r5"]',
    ),
  ).toBeVisible();
});
