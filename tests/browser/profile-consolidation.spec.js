import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { biographyProject } from "../fixtures/biography.js";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
});
test.afterEach(() => expect(errors).toEqual([]));

test("one activity section supports quick notes and optional expertise while health combines summaries and medical records", async ({
  page,
}) => {
  await page.locator("#startCreate").click();
  await page.locator('#viewActions [data-action="add-person"]').click();
  const editor = page.locator("[data-profile-editor]");
  await editor.locator('[name="name"]').fill("Alex Doe");
  await expect(
    editor.locator(
      '[data-profile-panel="interests"], [data-profile-panel="health"]',
    ),
  ).toHaveCount(0);
  await editor.locator("[data-profile-search]").fill("sport");
  await editor.locator('[data-profile-target="skills"]').click();
  await editor.locator('[data-add-record="skills"]').click();
  const quick = editor.locator("#records-skills .profile-record").first();
  await quick.locator('[name="skills-name"]').fill("Reading");
  await expect(quick.locator('[name="skills-category"]')).toHaveValue(
    "unspecified",
  );
  await expect(quick.locator('[name="skills-level"]')).toBeHidden();
  await editor.locator('[data-add-record="skills"]').click();
  const skill = editor.locator("#records-skills .profile-record").last();
  await skill.locator('[name="skills-category"]').selectOption("skill");
  await skill.locator('[name="skills-name"]').fill("Driving");
  await skill.locator(".record-field-group > summary").first().click();
  await skill.locator('[name="skills-from"]').fill("2014");
  await skill.locator('[name="skills-timeStatus"]').selectOption("current");
  await skill.locator(".record-field-group > summary").nth(1).click();
  await skill.locator('[name="skills-level"]').selectOption("advanced");
  await skill.locator('[name="skills-certificateNumber"]').fill("DR-2014-17");
  await editor.locator("[data-profile-search]").fill("allergy");
  await editor.locator('[data-profile-target="medical"]').click();
  await editor.locator("[data-profile-overview] > summary").click();
  await editor.locator('[name="health"]').fill("Annual health review");
  await editor.locator('[data-add-record="medical"]').click();
  await editor.locator('[name="medical-kind"]').selectOption("allergy");
  await editor.locator('[name="medical-title"]').fill("Pollen");
  await expect(editor.locator('[data-profile-count="medical"]')).toHaveText(
    "2",
  );
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator('[data-view="people"]').click();
  await page.locator("#otherView [data-full-profile]").click();
  const profile = page.locator("[data-profile-browser]");
  await profile.locator('[data-profile-target="skills"]').click();
  await expect(profile.locator('[data-profile-panel="skills"]')).toContainText(
    "Reading",
  );
  await expect(profile.locator('[data-profile-panel="skills"]')).toContainText(
    "DR-2014-17",
  );
  await profile.locator('[data-profile-target="medical"]').click();
  await expect(profile.locator('[data-profile-panel="medical"]')).toContainText(
    "Annual health review",
  );
  await expect(profile.locator('[data-profile-panel="medical"]')).toContainText(
    "Pollen",
  );
  await page.locator(".full-profile [data-biography]").click();
  await expect(page.locator('[data-biography-section="skills"]')).toContainText(
    "Reading",
  );
  await expect(
    page.locator('[data-biography-section="medical"]'),
  ).toContainText("Annual health review");
});

test("earlier summaries remain editable and survive PDF preparation, ZIP restoration and draft reload", async ({
  page,
}) => {
  await page.locator("#startDemo").click();
  const raw = biographyProject();
  const person = raw.people.find((person) => person.id === "p5");
  person.hobbies = "Reading, guitar\nWatercolor <b>notes</b>";
  person.interests = "Local history";
  person.skillRecords = [
    {
      id: "driving",
      category: "skill",
      name: "Driving",
      from: "2014",
      level: "advanced",
      sourceId: "d1",
    },
  ];
  person.medicalRecords = [
    {
      id: "allergy",
      kind: "allergy",
      title: "Pollen",
      sourceId: "health-source",
    },
  ];
  raw.scopePreferences.family = ["interests", "health"];
  await page.locator("#importInput").setInputFiles({
    name: "earlier-profile.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(raw)),
  });
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('#personList [data-person="p5"]').click();
  await page.locator('#inspector [data-edit-person="p5"]').click();
  const editor = page.locator("[data-profile-editor]");
  await editor.locator('[data-profile-target="skills"]').click();
  await expect(editor.locator("#records-skills .profile-record")).toHaveCount(
    3,
  );
  await expect(
    editor.locator('[name="skills-description"]').nth(1),
  ).toHaveValue(person.hobbies);
  await editor
    .locator('[name="skills-name"]')
    .nth(2)
    .fill("Local and family history");
  await editor.locator('[data-profile-target="medical"]').click();
  await expect(editor.locator('[name="health"]')).toHaveValue(
    "Recorded health details",
  );
  await expect(
    editor.locator('[name="healthSourceIds"][value="health-source"]'),
  ).toBeChecked();
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('#personList [data-biography="p5"]').click();
  await expect(page.locator('[data-biography-section="skills"]')).toContainText(
    person.hobbies,
  );
  await expect(page.locator('[data-biography-section="skills"]')).toContainText(
    "Local and family history",
  );
  await expect(
    page.locator('[data-biography-section="medical"]'),
  ).toContainText("Recorded health details");
  await expect(
    page.locator('[data-biography-section="medical"]'),
  ).toContainText("Health record source");
  await expect(
    page.locator(
      '[data-biography-section="health"], [data-biography-section="interests"]',
    ),
  ).toHaveCount(0);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator('#modal [data-print-biography="p5"]').click();
  await expect(
    page.locator('#biographyPrint [data-biography-section="skills"]'),
  ).toContainText("Watercolor <b>notes</b>");
  await expect(
    page.locator('#biographyPrint [data-biography-section="medical"]'),
  ).toContainText("Pollen");
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
    name: "combined-profile.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('#personList [data-person="p5"]').click();
  await page.locator('#inspector [data-edit-person="p5"]').click();
  await expect(page.locator("#records-skills .profile-record")).toHaveCount(3);
  await expect(page.locator('[name="skills-name"]').nth(2)).toHaveValue(
    "Local and family history",
  );
  await expect(page.locator('[name="health"]')).toHaveValue(
    "Recorded health details",
  );
  await expect(
    page.locator('[name="healthSourceIds"][value="health-source"]'),
  ).toBeChecked();
});

for (const [language, label, sport, allergy] of [
  ["en", "Hobbies and skills", "sport", "allergy"],
  ["uk", "Захоплення та навички", "спорт", "алергія"],
  ["ru", "Увлечения и навыки", "спорт", "аллергия"],
]) {
  test(`combined profile sections are discoverable and fit a narrow phone in ${language}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.locator("#startScreen [data-language]").selectOption(language);
    await page.locator("#startCreate").click();
    await page.locator('#viewActions [data-action="add-person"]').click();
    const editor = page.locator("[data-profile-editor]");
    await expect(
      editor.locator('[data-profile-picker] option[value="skills"]'),
    ).toHaveText(label);
    await expect(
      editor.locator(
        '[data-profile-picker] option[value="interests"], [data-profile-picker] option[value="health"]',
      ),
    ).toHaveCount(0);
    await editor.locator("[data-profile-search]").fill(sport);
    await editor.locator("[data-profile-picker]").selectOption("skills");
    await editor.locator('[data-add-record="skills"]').click();
    await editor.locator('[name="skills-name"]').fill("Guitar");
    await expect(editor.locator('[name="skills-level"]')).toBeHidden();
    await page.screenshot({
      path: `test-results/activities-mobile-${language}.png`,
    });
    await editor.locator("[data-profile-search]").fill(allergy);
    await editor.locator("[data-profile-picker]").selectOption("medical");
    await editor.locator("[data-profile-overview] > summary").click();
    await editor.locator('[name="health"]').fill("General health note");
    await editor.locator('[data-add-record="medical"]').click();
    await editor.locator('[name="medical-title"]').fill("Pollen");
    await editor.locator("[data-profile-search]").fill(sport);
    await editor.locator("[data-profile-picker]").selectOption("skills");
    await expect(editor.locator('[name="skills-name"]')).toHaveValue("Guitar");
    for (const selector of ["#modal", "#modalContent", "[data-profile-editor]"])
      expect(
        await page
          .locator(selector)
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
      ).toBe(true);
  });
}
