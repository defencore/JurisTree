import { test, expect } from "@playwright/test";

async function model(page) {
  return page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return state.project;
  });
}

async function moduleCall(page, path, method, argument) {
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

for (const [language, width, fromLabel, toLabel] of [
  ["en", 1280, "From", "To"],
  ["uk", 390, "Від", "До"],
  ["ru", 320, "С", "До"],
]) {
  test(`date entry, native calendar and relationship periods use DD.MM.YYYY in ${language} at ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await page.locator("#startDemo").click();
    await page.locator(".topbar [data-language]").selectOption(language);
    await moduleCall(page, "features/profiles.js", "editPerson", "p6");
    const birth = page.locator('[name="birthDate"]');
    await expect(birth).toHaveValue("16.10.1992");
    await birth.fill("29.02.1993");
    await page.locator('#modal button[type="submit"]').click();
    expect(await birth.evaluate((input) => input.validity.valid)).toBe(false);
    expect(
      (await model(page)).people.find((person) => person.id === "p6").birth,
    ).toBe("1992-10-16");
    await birth.fill("29.02.1992");
    const picker = birth.locator("..").locator("[data-date-picker]");
    await expect(picker).toHaveValue("1992-02-29");
    await page.evaluate(() => {
      const original = HTMLInputElement.prototype.showPicker;
      window.calendarOpenings = 0;
      HTMLInputElement.prototype.showPicker = function () {
        window.calendarOpenings++;
        return original.call(this);
      };
    });
    await picker.click();
    expect(await page.evaluate(() => window.calendarOpenings)).toBe(1);
    await page.keyboard.press("Escape");
    await picker.fill("1992-03-01");
    await picker.dispatchEvent("change");
    await expect(birth).toHaveValue("01.03.1992");
    await birth.fill("29.02.1992");
    await birth.press("Tab");
    const bounds = await birth.locator("..").evaluate((control) => {
      const field = control
          .querySelector("[data-date-input]")
          .getBoundingClientRect(),
        calendar = control
          .querySelector("[data-date-picker]")
          .getBoundingClientRect();
      return (
        calendar.left >= field.left &&
        calendar.right <= field.right &&
        calendar.top >= field.top &&
        calendar.bottom <= field.bottom
      );
    });
    expect(bounds).toBe(true);
    await page.screenshot({
      path: `test-results/date-input-${language}-${width}.png`,
      fullPage: true,
    });
    await page.locator('#modal button[type="submit"]').click();
    await expect(page.locator("#modal")).not.toBeVisible();
    expect(
      (await model(page)).people.find((person) => person.id === "p6").birth,
    ).toBe("1992-02-29");
    await moduleCall(page, "features/profiles.js", "editPerson", "p6");
    await expect(birth).toHaveValue("29.02.1992");
    await page.locator("#modal [data-close]").first().click();

    for (const [id, from, to] of [
      ["r11", "08.07.2017", ""],
      ["r16", "01.04.2019", "01.02.2021"],
    ]) {
      const edge = page.locator(`[data-edge="${id}"]`),
        title = edge.locator(".relationship-title text"),
        period = edge.locator(".relationship-period text");
      await expect(title).toHaveCount(1);
      await expect(title).not.toContainText(from);
      await expect(period).toHaveText(
        `${fromLabel} ${from}${to ? ` — ${toLabel} ${to}` : ""}`,
      );
      const order = await edge.evaluate((element) => {
        const name = element.querySelector(".relationship-title").getBBox(),
          date = element.querySelector(".relationship-period").getBBox();
        return name.y + name.height <= date.y;
      });
      expect(order).toBe(true);
    }
    await moduleCall(page, "features/relationships.js", "editRelation", "r11");
    const from = page.locator('[name="relationship-fromDate"]'),
      to = page.locator('[name="relationship-toDate"]');
    await expect(from).toHaveValue("08.07.2017");
    await from.fill("29.02.2024");
    await to.fill("30.04.2025");
    await page.locator('[name="type"]').selectOption("partner");
    await expect(from).toHaveValue("29.02.2024");
    await expect(to).toHaveValue("30.04.2025");
    await page
      .locator('[name="relationship-unionKind"]')
      .selectOption("dating");
    await page.locator('#modal button[type="submit"]').click();
    await expect(page.locator("#modal")).not.toBeVisible();
    const relationship = (await model(page)).relations.find(
      (relation) => relation.id === "r11",
    );
    expect(relationship.fromDate).toBe("2024-02-29");
    expect(relationship.toDate).toBe("2025-04-30");
    await expect(
      page.locator('[data-edge="r11"] .relationship-period text'),
    ).toHaveText(`${fromLabel} 29.02.2024 — ${toLabel} 30.04.2025`);
    const exportedPeriod = await page.evaluate(async () => {
      const { fullSVG } = await import(
          new URL(
            "features/archive.js",
            document.querySelector('script[type="module"]').src,
          ).href
        ),
        { svg } = await fullSVG("full");
      return new DOMParser()
        .parseFromString(svg, "image/svg+xml")
        .querySelector('[data-edge="r11"] .relationship-period').textContent;
    });
    expect(exportedPeriod).toBe(
      `${fromLabel} 29.02.2024 — ${toLabel} 30.04.2025`,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("multiple dated episodes between the same people have separate title and period blocks", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src,
      { state } = await import(new URL("core/state.js", base).href),
      { render } = await import(new URL("ui/render.js", base).href);
    const first = state.project.people.find((person) => person.id === "p6"),
      second = state.project.people.find((person) => person.id === "p8");
    Object.assign(first, { x: 100, y: 400 });
    Object.assign(second, { x: 440, y: 400 });
    state.project.relations.push({
      id: "second-episode",
      from: "p6",
      to: "p8",
      type: "partner",
      unionKind: "dating",
      fromDate: "2010-01-01",
      toDate: "2012-01-01",
    });
    render();
  });
  const overlap = await page.evaluate(() => {
    const blocks = ["r11", "second-episode"].map((id) =>
      document.querySelector(`[data-edge="${id}"] rect`).getBBox(),
    );
    return blocks[0].y + blocks[0].height > blocks[1].y;
  });
  expect(overlap).toBe(false);
});
