import { test, expect } from "@playwright/test";

// Reproduce the CSS viewport and Retina density of the reported macOS screenshots.
test.use({ viewport: { width: 1358, height: 954 }, deviceScaleFactor: 2 });

async function languageMetrics(page, selector) {
  return page.locator(selector).evaluate((select) => {
    const style = getComputedStyle(select),
      rect = select.getBoundingClientRect(),
      canvas = document.createElement("canvas"),
      context = canvas.getContext("2d");
    context.font = style.font;
    return {
      width: rect.width,
      height: rect.height,
      textWidth: context.measureText(select.selectedOptions[0].text).width,
      available:
        select.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight),
      appearance: style.appearance,
    };
  });
}

for (const language of ["en", "uk", "ru"]) {
  test(`launcher and map controls keep their proportions on Retina in ${language}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1206, height: 937 });
    await page.goto("./");
    await page.locator("#startScreen [data-language]").selectOption(language);
    expect(
      (await page.locator(".start-topbar").boundingBox()).height,
    ).toBeLessThanOrEqual(54);
    const startLanguage = await languageMetrics(
      page,
      "#startScreen [data-language]",
    );
    expect(startLanguage.height).toBe(32);
    expect(startLanguage.available).toBeGreaterThanOrEqual(
      startLanguage.textWidth,
    );
    expect(startLanguage.appearance).toBe("none");
    await page.locator("#startDemo").click();
    await page.setViewportSize({ width: 1358, height: 954 });
    await expect(page.locator("#personList .person-row")).toHaveCount(99);
    const mapLanguage = await languageMetrics(page, ".topbar [data-language]");
    expect(mapLanguage).toEqual(startLanguage);
    const graph = await page.locator("#graph").boundingBox();
    expect(graph.height).toBeGreaterThan(954 * 0.8);
    expect(graph.y + graph.height).toBeLessThanOrEqual(955);
    expect(
      (await page.locator(".topbar").boundingBox()).height,
    ).toBeLessThanOrEqual(44);
    const mode = page.locator("#purpose");
    expect((await mode.boundingBox()).height).toBeGreaterThanOrEqual(32);
    expect((await mode.boundingBox()).height).toBeLessThanOrEqual(34);
    await expect(
      page.locator(".view-actions [data-action='add-person']"),
    ).toBeVisible();
    await page.locator(".view-actions [data-action='add-person']").click();
    await expect(page.locator("#modal")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });
}

test("person lists give names and dates enough width without splitting words or date tokens", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("#startDemo").click();
  await page.locator(".topbar [data-language]").selectOption("en");
  const ella = page
    .locator("#personList .person-row")
    .filter({ hasText: "Ella Bennett" });
  await expect(ella).toHaveCount(1);
  await ella.scrollIntoViewIfNeeded();
  expect((await ella.boundingBox()).height).toBeLessThanOrEqual(125);
  const problems = await page.locator("#personList").evaluate((list) => {
    const failures = [];
    for (const element of list.querySelectorAll(
      ".person-row b, .person-row small",
    )) {
      const text = element.firstChild;
      for (const match of text.textContent.matchAll(
        /\d{2}\.\d{2}\.\d{4}|[\p{L}]+/gu,
      )) {
        const range = document.createRange();
        range.setStart(text, match.index);
        range.setEnd(text, match.index + match[0].length);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0);
        if (
          rects.length !== 1 ||
          rects[0].right > element.getBoundingClientRect().right + 1
        )
          failures.push(match[0]);
      }
    }
    return failures;
  });
  expect(problems).toEqual([]);
  await ella.locator("[data-person]").click();
  await expect(page.locator("#inspector .profile h2")).toHaveText(
    "Ella Bennett",
  );
  await ella.locator("[data-biography]").click();
  await expect(page.locator(".biography")).toBeVisible();
});

test("display pixel density does not change interface sizes or the initial map scale", async ({
  browser,
  baseURL,
}) => {
  const sizes = [];
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({
      viewport: { width: 1358, height: 954 },
      deviceScaleFactor,
    });
    const page = await context.newPage();
    try {
      await page.goto(baseURL);
      await page.locator("#startDemo").click();
      sizes.push(
        await page.evaluate(async () => {
          const base = document.querySelector('script[type="module"]').src,
            { state } = await import(new URL("core/state.js", base));
          return {
            header: document.querySelector(".topbar").getBoundingClientRect()
              .height,
            language: document
              .querySelector(".topbar [data-language]")
              .getBoundingClientRect().width,
            sidebar: document.querySelector(".sidebar").getBoundingClientRect()
              .width,
            zoom: state.camera.z,
          };
        }),
      );
    } finally {
      await context.close();
    }
  }
  expect(sizes[1]).toEqual(sizes[0]);
});

test("phone language and text fields remain readable without Safari focus zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  const language = await languageMetrics(page, "#startScreen [data-language]");
  expect(language.height).toBeGreaterThanOrEqual(44);
  expect(language.available).toBeGreaterThanOrEqual(language.textWidth);
  const input = page.locator(".start-title-field input");
  expect(
    await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await input.fill("My family");
  await page.locator("#startDemo").click();
  expect(
    (await page.locator(".topbar [data-language]").boundingBox()).height,
  ).toBeGreaterThanOrEqual(44);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
