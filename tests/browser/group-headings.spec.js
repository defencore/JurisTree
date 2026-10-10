import { test, expect } from "@playwright/test";

for (const [language, width, height] of [
  ["en", 1280, 900],
  ["en", 1280, 700],
  ["uk", 390, 844],
  ["ru", 320, 740],
]) {
  test.describe(`Group headings in ${language}`, () => {
    test.use({
      viewport: { width, height },
      hasTouch: width < 760,
      isMobile: width < 760,
    });
    test(`family headings stay clear of kinship badges and long names at ${width}×${height}px in ${language}`, async ({
      page,
    }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height });
      await page.goto("./");
      await page.locator("#startDemo").click();
      await page.locator("#appShell [data-language]").selectOption(language);
      if (width < 760) await page.locator('[data-action="menu"]').click();
      await page.locator('[data-action="add-group"]').click();
      const name = "Жовнович — родина та спадкоємці земельної ділянки";
      await page.locator('#modal [name="name"]').fill(name);
      await page
        .locator("[data-person-members] [data-person-query]")
        .fill("John Doe");
      await page.locator('[name="members"][value="p1"]').check();
      await page.locator('#modal button[type="submit"]').click();
      await expect(page.locator("#modal")).not.toBeVisible();
      await page.locator("#globalSearch").fill("name:John Doe");
      await page
        .locator('[data-search-kind="person"][data-search-id="p1"]')
        .click();
      const heading = page
        .locator(".group-heading")
        .filter({ has: page.locator("title", { hasText: name }) });
      await expect(heading).toHaveCount(1);
      const geometry = await heading.evaluate((element) => {
        const label = element.querySelector("text").getBoundingClientRect(),
          plate = element.querySelector("rect").getBoundingClientRect(),
          role = document
            .querySelector('.node[data-node="p1"] .person-card-role')
            .getBoundingClientRect(),
          groupHeadings = [...document.querySelectorAll(".group-heading")],
          edges = [...document.querySelectorAll(".edge")];
        return {
          label: { left: label.left, right: label.right },
          plate: { left: plate.left, right: plate.right, bottom: plate.bottom },
          roleTop: role.top,
          foreground: edges.every((edge) =>
            Boolean(
              edge.compareDocumentPosition(element) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          ),
          separate: groupHeadings
            .filter((other) => other !== element)
            .every((other) => {
              const box = other.querySelector("rect").getBoundingClientRect();
              return (
                plate.right <= box.left ||
                plate.left >= box.right ||
                plate.bottom <= box.top ||
                plate.top >= box.bottom
              );
            }),
        };
      });
      expect(geometry.plate.bottom).toBeLessThan(geometry.roleTop - 2);
      expect(geometry.label.left).toBeGreaterThan(geometry.plate.left);
      expect(geometry.label.right).toBeLessThan(geometry.plate.right - 10);
      expect(geometry.foreground).toBe(true);
      expect(geometry.separate).toBe(true);
      const graph = await page.locator("#graph").boundingBox(),
        visibleHeading = await heading.locator("rect").boundingBox();
      expect(visibleHeading.y).toBeGreaterThanOrEqual(graph.y);
      expect(visibleHeading.y + visibleHeading.height).toBeLessThanOrEqual(
        graph.y + graph.height,
      );
      await expect(heading.locator("title")).toHaveText(name + " · 1");
      await page.screenshot({
        path: `test-results/group-heading-${language}-${width}x${height}.png`,
      });
      if (width < 760) await heading.tap();
      else {
        await heading.focus();
        await page.keyboard.press("Enter");
      }
      await expect(heading).toHaveCount(0);
      await expect(
        page
          .locator('.node[data-kind="group"]')
          .filter({ has: page.locator("text", { hasText: "Жовнович" }) }),
      ).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  });
}
