import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

for (const [language, width] of [
  ["en", 1440],
  ["uk", 390],
  ["ru", 320],
]) {
  test(`${language} profile search preserves composition, selection and focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".topbar [data-language]").selectOption(language);
    await page.evaluate(async () => {
      const { state } = await import(
        new URL(
          "core/state.js",
          document.querySelector('script[type="module"]').src,
        )
      );
      const { render } = await import(
        new URL(
          "ui/render.js",
          document.querySelector('script[type="module"]').src,
        )
      );
      state.view = "people";
      render();
    });
    const composing = await page.locator("#profileSearch").evaluate((input) => {
      input.focus();
      input.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      );
      input.value = "Doe";
      input.setSelectionRange(1, 3, "backward");
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          isComposing: true,
          data: "Doe",
        }),
      );
      const retained = input.isConnected && document.activeElement === input;
      input.dispatchEvent(
        new CompositionEvent("compositionend", { bubbles: true, data: "Doe" }),
      );
      return retained;
    });
    expect(composing).toBe(true);
    await expect(page.locator("#profileSearch")).toHaveValue("Doe");
    await expect(page.locator("#profileSearch")).toBeFocused();
    expect(
      await page
        .locator("#profileSearch")
        .evaluate((input) => [
          input.selectionStart,
          input.selectionEnd,
          input.selectionDirection,
        ]),
    ).toEqual([1, 3, "backward"]);
    await expect(page.locator(".profile-directory-card").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/refactor-profile-${language}.png`,
      fullPage: true,
    });
  });
}

test("every workspace search retains selected text through a refresh", async ({
  page,
}) => {
  for (const [view, id] of [
    ["people", "profileSearch"],
    ["property", "propertySearch"],
    ["calendar", "calendarSearch"],
    ["events", "eventSearch"],
    ["documents", "docSearch"],
  ]) {
    await page.evaluate(async (view) => {
      const base = document.querySelector('script[type="module"]').src;
      const { state } = await import(new URL("core/state.js", base));
      const { render } = await import(new URL("ui/render.js", base));
      state.view = view;
      render();
    }, view);
    const selection = await page.locator(`#${id}`).evaluate((input) => {
      input.focus();
      input.value = "Doe";
      input.setSelectionRange(1, 3, "backward");
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      const current = document.getElementById(input.id);
      return [
        current.value,
        current.selectionStart,
        current.selectionEnd,
        current.selectionDirection,
        document.activeElement === current,
      ];
    });
    expect(selection, view).toEqual(["Doe", 1, 3, "backward", true]);
  }
});

test("global search and analytical filters refresh for edits with identical timestamps", async ({
  page,
}) => {
  await page.locator("#globalSearch").fill("type:person name:John");
  const result = await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const [
      { state },
      { commit },
      { projectSearchIndex },
      { searchIndex },
      { personFilterReport },
    ] = await Promise.all([
      import(new URL("core/state.js", base)),
      import(new URL("services/history.js", base)),
      import(new URL("model/search-cache.js", base)),
      import(new URL("model/search.js", base)),
      import(new URL("model/person-filter-state.js", base)),
    ]);
    const original = Date.prototype.toISOString;
    Date.prototype.toISOString = () => "2026-01-01T00:00:00.000Z";
    try {
      state.personFilter = {
        match: "all",
        sort: "name",
        rules: [
          {
            field: "search",
            operator: "matches",
            value: 'type:person name:"Second update"',
          },
        ],
      };
      const before = personFilterReport().ids.size;
      commit(() => {
        state.project.people[0].name = "First update";
      });
      projectSearchIndex(state.project);
      personFilterReport();
      commit(() => {
        state.project.people[0].name = "Second update";
      });
      return {
        before,
        matches: searchIndex(
          projectSearchIndex(state.project),
          'type:person name:"Second update"',
        ).length,
        filtered: personFilterReport().ids.size,
      };
    } finally {
      Date.prototype.toISOString = original;
    }
  });
  expect(result).toEqual({ before: 0, matches: 1, filtered: 1 });
  await page.locator("#globalSearch").fill('type:person name:"Second update"');
  await expect(page.locator('[data-search-kind="person"]')).toHaveCount(1);
});

test("primary action labels and icons retain readable contrast in compact buttons", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const base = document.querySelector('script[type="module"]').src;
    const { select } = await import(new URL("ui/render.js", base));
    select("relation", "r1");
  });
  const button = page.locator('#inspector [data-add-relation-doc="r1"]');
  await expect(button).toBeVisible();
  for (const hovered of [false, true]) {
    if (hovered) await button.hover();
    const contrast = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      const luminance = (color) => {
        const rgb = color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            value /= 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const text = luminance(style.color),
        background = luminance(style.backgroundColor);
      return {
        ratio:
          (Math.max(text, background) + 0.05) /
          (Math.min(text, background) + 0.05),
        icon: getComputedStyle(element.querySelector("svg")).color,
        text: style.color,
      };
    });
    expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
    expect(contrast.icon).toBe(contrast.text);
  }
  await page.screenshot({ path: "test-results/refactor-button-contrast.png" });
});
