import { openMapLayout, openMapOptions } from "./helpers/map-options.js";
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("./");
});
test.afterEach(() => expect(errors).toEqual([]));

async function closeGuide(page) {
  await page.locator("#modal [data-close]").first().click();
}

test("home guide downloads a usable exercise and preserves the pending map title", async ({
  page,
}) => {
  await page.locator("#startTitle").fill("My family research");
  await page.locator('#startScreen [data-action="user-guide"]').click();
  await expect(page.locator("#modalTitle")).toHaveText("Getting started");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-action="download-guide-example"]').click(),
  ]);
  expect(download.suggestedFilename()).toBe("juristree-guide-example.json");
  const buffer = await readFile(await download.path());
  const example = JSON.parse(buffer);
  expect(example.people).toHaveLength(8);
  expect(example.relations).toHaveLength(11);
  expect(example.groups).toHaveLength(3);
  await closeGuide(page);
  await expect(page.locator("#startTitle")).toHaveValue("My family research");
  await page.locator("#startCreate").click();
  await page.locator("#importInput").setInputFiles({
    name: download.suggestedFilename(),
    mimeType: "application/json",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(8);
  await expect(page.locator(".graph-view-summary")).toContainText("11/11");
  await page.locator('#personList [data-person="guide-robin"]').click();
  await expect(page.locator('.node[data-node="guide-avery"]')).toContainText(
    "First cousin",
  );
  await page.locator('#appShell [data-action="user-guide"]').click();
  await page.locator('[data-guide-target="relationships"]').click();
  await expect(page.locator("[data-guide-marriages] li")).toHaveCount(3);
  await expect(page.locator("[data-guide-parents] li")).toHaveCount(8);
  await page.locator('[data-guide-target="groups"]').click();
  await expect(page.locator(".guide-group-example")).toContainText(
    "Taylor & Jordan Lane",
  );
  await closeGuide(page);
  await expect(page.locator('.node[data-kind="person"]')).toHaveCount(8);
  await expect(page.locator("#projectTitle")).toHaveText(example.title);
  await openMapOptions(page);
  await page.locator('[data-action="graph-help"]').click();
  await page.locator('#modal [data-action="user-guide"]').click();
  await expect(page.locator("[data-user-guide]")).toBeVisible();
});

test("a beginner can create a family, group, profile record and linked source using the documented controls", async ({
  page,
}) => {
  await page.locator("#startTitle").fill("Doe household");
  await page.locator('[data-start-template="family"]').click();
  await page.locator("#startCreate").click();
  for (const [name, gender, birth] of [
    ["Jamie Doe", "m", "1985"],
    ["Casey Doe", "f", "1987"],
    ["Robin Doe", "m", "2010"],
  ]) {
    await page.locator('#viewActions [data-action="add-person"]').click();
    await page.locator('#modal [name="name"]').fill(name);
    await page.locator('#modal [name="gender"]').selectOption(gender);
    await page.locator('#modal [name="birthDate"]').fill(birth);
    await page.locator('#modal button[type="submit"]').click();
  }
  const ids = await page
    .locator("#personList [data-person]")
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((row) => [
          row.querySelector("b").textContent,
          row.dataset.person,
        ]),
      ),
    );
  for (const [from, to, type] of [
    ["Jamie Doe", "Casey Doe", "spouse"],
    ["Jamie Doe", "Robin Doe", "parent"],
    ["Casey Doe", "Robin Doe", "parent"],
  ]) {
    await page.locator('[data-action="add-relation"]').click();
    await page.locator('#modal [name="from"]').selectOption(ids[from]);
    await page.locator('#modal [name="to"]').selectOption(ids[to]);
    await page.locator('#modal [name="type"]').selectOption(type);
    await page.locator('#modal button[type="submit"]').click();
  }
  await page.locator('[data-action="add-group"]').click();
  await page.locator('#modal [name="name"]').fill("Jamie & Casey Doe");
  for (const id of Object.values(ids))
    await page.locator(`#modal [name="members"][value="${id}"]`).check();
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#groupList")).toContainText("Jamie & Casey Doe");
  await openMapLayout(page);
  await page.locator("#graphLayout").selectOption("generations");
  await page.locator('.layout-controls [data-action="layout"]').click();
  await page.locator('[data-action="fit"]').click();
  await page.locator(`#personList [data-person="${ids["Robin Doe"]}"]`).click();
  await expect(
    page.locator(`.node[data-node="${ids["Jamie Doe"]}"]`),
  ).toContainText("Father");
  await expect(
    page.locator(`.node[data-node="${ids["Casey Doe"]}"]`),
  ).toContainText("Mother");
  await page.locator('[data-view="people"]').click();
  await page.locator("#profileSearch").fill("Robin Doe");
  await page.locator("#otherView [data-full-profile]").click();
  await page.locator(".full-profile [data-edit-person]").click();
  await page.locator('#modal [data-profile-target="education"]').click();
  await page.locator('[data-add-record="education"]').click();
  await page.locator('[name="education-institution"]').fill("Northbank School");
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('.full-profile [data-profile-target="education"]').click();
  await expect(
    page.locator('#otherView [data-profile-panel="education"]'),
  ).toContainText("Northbank School");
  await page.locator('[data-view="documents"]').click();
  await page.locator('#viewActions [data-action="reference"]').click();
  await page
    .locator('#modal [name="title"]')
    .fill("Robin's birth certificate reference");
  await page
    .locator(`#modal [name="people"][value="${ids["Robin Doe"]}"]`)
    .check();
  await page.locator('#modal button[type="submit"]').click();
  await page.locator('#appShell [data-action="user-guide"]').click();
  await closeGuide(page);
  await page.locator('[data-view="people"]').click();
  await page.locator("#profileSearch").fill("Robin Doe");
  await page.locator("#otherView [data-full-profile]").click();
  await page.locator('#otherView [data-profile-target="documents"]').click();
  await expect(
    page.locator('#otherView [data-profile-panel="documents"]'),
  ).toContainText("Robin's birth certificate reference");
  await expect(page.locator("#projectTitle")).toHaveText("Doe household");
});

for (const width of [320, 390, 768, 1440]) {
  for (const [language, title] of [
    ["en", "Getting started"],
    ["uk", "Інструкція"],
    ["ru", "Инструкция"],
  ]) {
    test(`guide controls and lessons fit ${width}px in ${language}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#startScreen [data-language]").selectOption(language);
      await page.locator('#startScreen [data-action="user-guide"]').click();
      await expect(page.locator("#modalTitle")).toHaveText(title);
      await closeGuide(page);
      await page.locator("#startCreate").click();
      await expect(
        page.locator("#appShell .header-preferences [data-language]"),
      ).toBeVisible();
      const controls = await page
        .locator(
          ".topbar > .brand, .topbar > .top-actions, .topbar > .header-preferences",
        )
        .evaluateAll((elements) =>
          elements.map((el) => {
            const box = el.getBoundingClientRect();
            return { left: box.left, right: box.right };
          }),
        );
      for (let i = 1; i < controls.length; i++)
        expect(controls[i].left).toBeGreaterThanOrEqual(controls[i - 1].right);
      await page.locator('#appShell [data-action="user-guide"]').click();
      const root = page.locator("[data-user-guide]");
      for (const key of [
        "people",
        "relationships",
        "groups",
        "profiles",
        "sources",
        "map",
        "backup",
        "start",
      ]) {
        if (width <= 760)
          await root.locator("[data-guide-picker]").selectOption(key);
        else await root.locator(`[data-guide-target="${key}"]`).click();
        const lesson = root.locator(`[data-guide-lesson="${key}"]`);
        await expect(lesson).toHaveAttribute("open", "");
        await expect(lesson.locator("summary").first()).toBeFocused();
        if (width <= 760) {
          const picker = await root.locator(".guide-picker").boundingBox();
          const summary = await lesson.locator("summary").first().boundingBox();
          expect(summary.y).toBeGreaterThanOrEqual(
            picker.y + picker.height - 1,
          );
        }
      }
      for (const selector of [
        "#modal",
        "#modal .modal-body",
        "[data-user-guide]",
        ".topbar",
      ])
        expect(
          await page
            .locator(selector)
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          selector,
        ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (language === "uk")
        await page.screenshot({ path: `test-results/guide-${width}.png` });
      await closeGuide(page);
      await expect(
        page.locator('#appShell [data-action="user-guide"]'),
      ).toBeFocused();
    });
  }
}
