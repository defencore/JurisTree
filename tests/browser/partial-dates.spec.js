import { test, expect } from "@playwright/test";

async function call(page, path, method, argument) {
  await page.evaluate(
    async ({ path, method, argument }) => {
      const module = await import(
        new URL(path, document.querySelector('script[type="module"]').src).href
      );
      void module[method](argument);
    },
    { path, method, argument },
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
async function save(page) {
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
}
async function start(page, language, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("./");
  if (process.env.JURISTREE_RELEASE_HASH)
    await expect(page.locator('script[type="module"]')).toHaveAttribute(
      "src",
      new RegExp(process.env.JURISTREE_RELEASE_HASH),
    );
  await page.locator("#startDemo").click();
  await page.locator(".topbar [data-language]").selectOption(language);
}

for (const [language, width] of [
  ["en", 1280],
  ["uk", 390],
  ["ru", 320],
]) {
  test(`partial birth, death and wedding dates survive editing, printing and reload in ${language} at ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await start(page, language, width);
    await call(page, "features/profiles.js", "editPerson", "p6");
    const birth = page.locator('[name="birthDate"]'),
      death = page.locator('[name="deathDate"]');
    await expect(
      page.locator('[name="birthYear"],[name="deathYear"]'),
    ).toHaveCount(0);
    await birth.fill("05.1992");
    await birth.press("Tab");
    await expect(
      birth.locator("..").locator("[data-date-precision]"),
    ).toHaveValue("month");
    await expect(birth.locator("..").locator("[data-date-picker]")).toHaveValue(
      "",
    );
    await save(page);
    expect((await project(page)).people.find((p) => p.id === "p6").birth).toBe(
      "1992-05",
    );
    await expect(
      page.locator(
        '.node[data-node="p6"] [data-date="ui.birthDateLabel"] text',
      ),
    ).toHaveText("05.1992");

    await call(page, "features/profiles.js", "editPerson", "p6");
    await birth
      .locator("..")
      .locator("[data-date-precision]")
      .selectOption("range");
    await birth.fill("1990–1992");
    await death
      .locator("..")
      .locator("[data-date-precision]")
      .selectOption("approximate");
    await death.fill("2020");
    await death.press("Tab");
    await expect(death).toHaveValue("≈ 2020");
    const fit = await death.locator("..").evaluate((control) => {
      const field = control
          .querySelector("[data-date-input]")
          .getBoundingClientRect(),
        picker = control
          .querySelector("[data-date-picker]")
          .getBoundingClientRect();
      return (
        picker.left >= field.left &&
        picker.right <= field.right &&
        picker.top >= field.top &&
        picker.bottom <= field.bottom
      );
    });
    expect(fit).toBe(true);
    await page.screenshot({
      path: `test-results/partial-dates-${language}-${width}.png`,
      fullPage: true,
    });
    await save(page);
    const person = (await project(page)).people.find((p) => p.id === "p6");
    expect(person.birth).toBe("1990/1992");
    expect(person.death).toBe("~2020");
    await expect(
      page.locator(
        '.node[data-node="p6"] [data-date="ui.deathDateLabel"] text',
      ),
    ).toContainText("≈ 2020 (≈ ");

    await call(page, "features/relationships.js", "editRelation", "r11");
    await page.locator('[name="relationship-fromDate"]').fill("06.2017");
    await page.locator('[name="relationship-toDate"]').fill("2019–2021");
    await save(page);
    const relation = (await project(page)).relations.find(
      (r) => r.id === "r11",
    );
    expect(relation.fromDate).toBe("2017-06");
    expect(relation.toDate).toBe("2019/2021");
    await expect(
      page.locator('[data-route-label="r:r11"] .relationship-period text'),
    ).toContainText("06.2017");
    await expect(
      page.locator('[data-route-label="r:r11"] .relationship-period text'),
    ).toContainText("2019 – 2021");

    await call(page, "features/biography.js", "viewBiography", "p6");
    await expect(
      page.locator('.biography [data-biography-section="basic"]'),
    ).toContainText("1990 – 1992");
    await expect(
      page.locator('.biography [data-biography-section="basic"]'),
    ).toContainText("≈ 2020");
    await call(
      page,
      "features/print-biography.js",
      "prepareBiographyPrint",
      "p6",
    );
    await expect(page.locator("#biographyPrint")).toContainText("1990 – 1992");
    await expect(page.locator("#biographyPrint")).toContainText("06.2017");
    await expect(page.locator("#biographyPrint")).toContainText("2019 – 2021");
    await page.locator("#modal [data-close]").first().click();
    const imported = await page.evaluate(async () => {
      const base = document.querySelector('script[type="module"]').src,
        { state } = await import(new URL("core/state.js", base).href),
        { validateImport } = await import(
          new URL("model/validation.js", base).href
        );
      return validateImport(
        JSON.parse(JSON.stringify(state.project)),
      ).people.find((p) => p.id === "p6");
    });
    expect(imported.birth).toBe("1990/1992");
    expect(imported.death).toBe("~2020");
    await page.waitForTimeout(800);
    await page.reload();
    await page.locator("#startContinue").click();
    await call(page, "features/profiles.js", "editPerson", "p6");
    await expect(birth).toHaveValue("1990 – 1992");
    await expect(death).toHaveValue("≈ 2020");
    await expect(
      birth.locator("..").locator("[data-date-precision]"),
    ).toHaveValue("range");
    await expect(
      death.locator("..").locator("[data-date-precision]"),
    ).toHaveValue("approximate");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`uncertain dates validate and stay outside exact calendar cells in ${language}`, async ({
    page,
  }) => {
    await start(page, language, width);
    await call(page, "features/profiles.js", "editPerson", "p6");
    const birth = page.locator('[name="birthDate"]');
    for (const value of ["13.1992", "1992–1990", "29.02.1991"]) {
      await birth.fill(value);
      await page.locator('#modal button[type="submit"]').click();
      expect(await birth.evaluate((input) => input.checkValidity())).toBe(
        false,
      );
      await expect(page.locator("#modal")).toBeVisible();
    }
    await birth.fill("05.1992");
    await save(page);
    await call(page, "features/relationships.js", "editRelation", "r11");
    await page
      .locator('[name="relationship-fromDate"]')
      .fill("05.2017–08.2017");
    await save(page);
    const calendar = await page.evaluate(async () => {
      const base = document.querySelector('script[type="module"]').src,
        { state } = await import(new URL("core/state.js", base).href),
        { collectProjectEvents } = await import(
          new URL("model/events.js", base).href
        ),
        { yearOccurrences } = await import(
          new URL("model/calendar.js", base).href
        );
      state.view = "calendar";
      state.calendarMode = "year";
      state.calendarMonth = "2026-05";
      const { render } = await import(new URL("ui/render.js", base).href);
      render();
      return yearOccurrences(collectProjectEvents(state.project), "2026").map(
        (e) => e.id,
      );
    });
    expect(calendar).not.toContain("p6:birth:birth");
    expect(calendar).not.toContain("r11:start");
    await expect(page.locator(".calendar-undated")).toContainText("05.1992");
    await expect(page.locator(".calendar-undated")).toContainText(
      "05.2017 – 08.2017",
    );
    await page.locator(".calendar-undated summary").click();
    await page.screenshot({
      path: `test-results/partial-calendar-${language}.png`,
      fullPage: true,
    });
  });
}
