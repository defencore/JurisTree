import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
});
test.afterEach(() => expect(errors).toEqual([]));

test("section discovery preserves unsaved fields, validates hidden basic fields and saves the complete profile", async ({
  page,
}) => {
  await page.locator("#startCreate").click();
  await page.locator('#viewActions [data-action="add-person"]').click();
  const editor = page.locator("[data-profile-editor]");
  await editor.locator("[data-profile-search]").fill("passport");
  await expect(editor.locator('[data-profile-panel="basic"]')).toBeHidden();
  await page.locator('#modal button[type="submit"]').click();
  await expect(editor.locator('[name="name"]')).toBeFocused();
  await expect(editor.locator("[data-profile-search]")).toHaveValue("");
  await editor.locator('[name="name"]').fill("Alex Doe");
  await editor.locator("[data-profile-search]").fill("passport");
  await editor.locator('[data-profile-target="identity"]').click();
  await editor.locator('[data-add-record="identity"]').click();
  await editor.locator('[name="identity-number"]').fill("AX-74219");
  await expect(editor.locator('[data-profile-count="identity"]')).toHaveText(
    "1",
  );
  await editor.locator("[data-profile-search]").fill("specialty");
  await editor.locator('[data-profile-target="education"]').click();
  await editor.locator('[data-add-record="education"]').click();
  await editor
    .locator('[name="education-institution"]')
    .fill("Northbank University");
  await editor.locator('[name="education-field"]').fill("Architecture");
  await editor.locator("[data-profile-search]").fill("passport");
  await expect(editor.locator('[name="identity-number"]')).toHaveValue(
    "AX-74219",
  );
  await editor.locator("[data-profile-search]").fill("no-matching-section");
  await expect(editor.locator("[data-profile-no-results]")).toBeVisible();
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator('[data-view="people"]').click();
  await page.locator("#profileSearch").fill("Alex Doe");
  await page.locator("#otherView [data-full-profile]").click();
  const profile = page.locator("[data-profile-browser]");
  await profile.locator('[data-profile-target="identity"]').click();
  await expect(
    profile.locator('[data-profile-panel="identity"]'),
  ).toContainText("AX-74219");
  await profile.locator('[data-profile-target="education"]').click();
  await expect(
    profile.locator('[data-profile-panel="education"]'),
  ).toContainText("Northbank University");
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('[data-view="people"]').click();
  await page.locator("#otherView [data-full-profile]").click();
  await expect(page.locator('[data-profile-panel="identity"]')).toContainText(
    "AX-74219",
  );
});

test("full profiles retain all sections across purpose changes and keep family navigation in the profile workspace", async ({
  page,
}) => {
  await page.locator("#startDemo").click();
  await page.locator('#inspector [data-full-profile="p5"]').click();
  const profile = page.locator("[data-profile-browser]");
  await expect(profile).toBeVisible();
  await profile.locator('[data-profile-target="custody"]').click();
  await expect(profile.locator('[data-profile-panel="custody"]')).toContainText(
    "No information yet.",
  );
  await profile.locator('[data-open-profile-section="custody"]').click();
  await expect(
    page.locator('#modal [data-profile-section="custody"]'),
  ).toHaveAttribute("open", "");
  await expect(
    page.locator('#modal [data-profile-count="biography"]'),
  ).toHaveText("1");
  await page.locator("#modal [data-close]").first().click();
  await profile.locator('[data-profile-target="relationships"]').click();
  await profile.locator('.kin-person[data-full-profile="p3"]').click();
  await expect(page.locator(".full-profile-overview h2")).toHaveText(
    "Jamie Roe (Doe)",
  );
  await page.locator("#purpose").selectOption("family");
  await expect(profile.locator('[data-profile-panel="accounts"]')).toHaveCount(
    1,
  );
  await page.locator('.full-profile [data-profile-map="p3"]').click();
  await expect(page.locator("#canvasWrap")).toBeVisible();
  await expect(page.locator("#inspector h2")).toContainText("Jamie Roe");
});

test("profile document and property actions preselect their person and remain available after saving", async ({
  page,
}) => {
  await page.locator("#startDemo").click();
  await page.locator('#inspector [data-full-profile="p5"]').click();
  await page.locator('.full-profile [data-profile-reference="p5"]').click();
  await page.locator('[name="title"]').fill("Archive contact reference");
  await page.locator('#modal button[type="submit"]').click();
  await expect(
    page.locator('.full-profile [data-profile-panel="documents"]'),
  ).toContainText("Archive contact reference");
  await page.locator('.full-profile [data-profile-property="p5"]').click();
  await expect(page.locator('[name="ownerId"]')).toHaveValue("p5");
  await page.locator('[name="title"]').fill("Northbank apartment");
  await page.locator('#modal button[type="submit"]').click();
  await expect(
    page.locator('.full-profile [data-profile-panel="property"]'),
  ).toContainText("Northbank apartment");
  await page.locator('[data-history-command="undo"]').click();
  await expect(
    page.locator('.full-profile [data-profile-panel="property"]'),
  ).not.toContainText("Northbank apartment");
  await expect(
    page.locator('.full-profile [data-profile-panel="documents"]'),
  ).toContainText("Archive contact reference");
  await page.locator('[data-history-command="redo"]').click();
  await expect(
    page.locator('.full-profile [data-profile-panel="property"]'),
  ).toContainText("Northbank apartment");
  await page.locator('.full-profile [data-biography="p5"]').click();
  await expect(page.locator(".biography")).toContainText(
    "Archive contact reference",
  );
  await expect(page.locator(".biography")).toContainText("Northbank apartment");
});

for (const width of [320, 390, 768, 1440]) {
  for (const language of ["en", "uk", "ru"]) {
    test(`complete profile navigation and language preferences fit ${width}px in ${language}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#startDemo").click();
      const languageControl = page.locator(
        ".topbar .header-preferences [data-language]",
      );
      await expect(languageControl).toBeVisible();
      await languageControl.selectOption(language);
      if (width <= 760) await page.locator('[data-action="menu"]').click();
      await page.locator('[data-view="people"]').click();
      await page.locator("#profileSearch").fill("Jesse Ward");
      await page.locator('#otherView [data-full-profile="p5"]').click();
      const contentBounds = await page.locator("#otherView").boundingBox();
      const historyBounds = await page
        .locator("#workspaceHistory")
        .boundingBox();
      expect(historyBounds.y).toBeGreaterThanOrEqual(
        contentBounds.y + contentBounds.height - 1,
      );
      await page.locator('.full-profile [data-edit-person="p5"]').click();
      const editor = page.locator("[data-profile-editor]");
      if (width <= 760)
        await editor.locator("[data-profile-picker]").selectOption("identity");
      else await editor.locator('[data-profile-target="identity"]').click();
      await expect(
        editor.locator('[data-profile-section="identity"]'),
      ).toHaveAttribute("open", "");
      for (const selector of [
        "#modal",
        "#modal .modal-body",
        "#otherView",
        ".topbar",
      ])
        expect(
          await page
            .locator(selector)
            .evaluate(
              (element) => element.scrollWidth <= element.clientWidth + 1,
            ),
          selector,
        ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.locator("#modal [data-close]").first().click();
    });
  }
}
