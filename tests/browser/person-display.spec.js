import { test, expect } from "@playwright/test";

for (const [language, width, age, death] of [
  ["en", 1280, "37 years", "11/03/2011 (79 years)"],
  ["uk", 390, "37 років", "03.11.2011 (79 років)"],
  ["ru", 320, "37 лет", "03.11.2011 (79 лет)"],
]) {
  test(`current names, maiden surnames and ages remain consistent on ${language} ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install({ time: new Date("2026-10-09T12:00:00Z") });
    await page.goto("./");
    await page.locator("#startDemo").click();
    await page.locator(".topbar [data-language]").selectOption(language);
    const jane = page.locator('.node[data-node="p2"]');
    await expect(jane.locator(".person-card-name title")).toHaveText(
      "Jane Doe (Hart)",
    );
    await expect(jane).toHaveAttribute("aria-label", /Jane Doe \(Hart\)/);
    await expect(
      page.locator('.node[data-node="p5"] [data-date="ui.currentAge"] text'),
    ).toHaveText(age);
    await expect(
      page.locator('.node[data-node="p5"] [data-date="ui.deathDateLabel"]'),
    ).toHaveCount(0);
    await expect(
      page.locator(
        '.node[data-node="p1"] [data-date="ui.deathDateLabel"] text',
      ),
    ).toHaveText(death);
    const fits = await page
      .locator('.node[data-kind="person"]')
      .evaluateAll((nodes) =>
        nodes.every((node) => {
          const card = node.querySelector(".card").getBBox();
          return [
            ...node.querySelectorAll(
              ".person-card-name,.person-card-date,[data-person-status]",
            ),
          ].every((item) => {
            const box = item.getBBox();
            return (
              box.x >= 0 &&
              box.y >= 0 &&
              box.x + box.width <= card.width + 0.5 &&
              box.y + box.height <= card.height + 0.5
            );
          });
        }),
      );
    expect(fits).toBe(true);
    await page.locator("#globalSearch").fill("name:Hart");
    const result = page.locator(
      '[data-search-kind="person"][data-search-id="p2"]',
    );
    await expect(result.locator("b")).toHaveText("Jane Doe (Hart)");
    await result.click();
    if (width < 760) await jane.locator(".card").click();
    await expect(page.locator("#inspector h2")).toHaveText("Jane Doe (Hart)");
    await page.locator('#inspector [data-biography="p2"]').click();
    await expect(page.locator(".biography-header h2")).toHaveText(
      "Jane Doe (Hart)",
    );
    await expect(
      page.locator('.biography [data-biography-section="basic"]'),
    ).toContainText(
      language === "en" ? "81 years" : language === "uk" ? "81 рік" : "81 год",
    );
    const printed = await page.evaluate(async () => {
      const src = document.querySelector('script[type="module"]').src;
      const { prepareBiographyPrint } = await import(
        new URL("features/print-biography.js", src).href
      );
      const { state } = await import(new URL("core/state.js", src).href);
      prepareBiographyPrint("p2");
      return {
        name: state.project.people.find((p) => p.id === "p2").name,
        heading: document.querySelector("#biographyPrint h2").textContent,
      };
    });
    expect(printed).toEqual({ name: "Jane Doe", heading: "Jane Doe (Hart)" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.locator("#modal [data-close]").first().click();
    await page.locator('#inspector [data-edit-person="p2"]').click();
    await expect(page.locator('#modal [name="name"]')).toHaveValue("Jane Doe");
    expect(errors).toEqual([]);
  });
}

test("search refreshes the current age after the local date changes without altering birth records", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-12-11T12:00:00Z") });
  await page.goto("./");
  await page.locator("#startDemo").click();
  await page.locator("#globalSearch").fill("name:Jesse");
  const result = page.locator(
    '[data-search-kind="person"][data-search-id="p5"]',
  );
  await expect(result.locator("small")).toContainText("37 years");
  await page.clock.setSystemTime(new Date("2026-12-12T12:00:00Z"));
  await page.locator("#globalSearch").fill("name:Jesse Ward");
  await expect(result.locator("small")).toContainText("38 years");
  await result.click();
  await expect(
    page.locator('.node[data-node="p5"] [data-date="ui.currentAge"] text'),
  ).toHaveText("38 years");
});
