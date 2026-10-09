import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

async function moveHeader(page, header, dx, dy) {
  const box = await header.boundingBox();
  await page.mouse.move(box.x + 70, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 70 + dx, box.y + box.height / 2 + dy, {
    steps: 6,
  });
  await page.mouse.up();
}

test("moves dialogs and the profile window, resets position and preserves unfinished form data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-action="export"]').click();
  const modal = page.locator("#modal");
  const initial = await modal.boundingBox();
  await moveHeader(page, modal.locator(".modal-head"), 100, 70);
  await expect(modal).toHaveAttribute("data-floating", "");
  const moved = await modal.boundingBox();
  expect(moved.x).toBeCloseTo(initial.x + 100, 0);
  expect(moved.y).toBeCloseTo(initial.y + 70, 0);
  await modal.locator("[data-reset-window]").click();
  await expect(modal).not.toHaveAttribute("data-floating", "");
  expect((await modal.boundingBox()).x).toBeCloseTo(initial.x, 0);
  await modal.locator(".modal-head").focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(modal).toHaveAttribute("data-floating", "");
  await page.keyboard.press("Alt+Home");
  await expect(modal).not.toHaveAttribute("data-floating", "");
  await modal.locator("[data-close]").first().click();
  await page.locator('#personList [data-person="p5"]').click();
  const inspector = page.locator("#inspector");
  const panel = await inspector.boundingBox();
  await moveHeader(page, inspector.locator(".inspector-header"), -180, 20);
  await expect(inspector).toHaveAttribute("data-floating", "");
  expect((await inspector.boundingBox()).x).toBeLessThan(panel.x - 100);
  await inspector.locator("[data-reset-window]").click();
  await expect(inspector).not.toHaveAttribute("data-floating", "");
  await inspector.locator('[data-edit-person="p5"]').first().click();
  await modal.locator('[name="name"]').fill("Draft name retained");
  await moveHeader(page, modal.locator(".modal-head"), -100, -40);
  await expect(modal.locator('[name="name"]')).toHaveValue(
    "Draft name retained",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const resized = await modal.boundingBox();
  expect(resized.x).toBeGreaterThanOrEqual(0);
  expect(resized.x + resized.width).toBeLessThanOrEqual(391);
  await modal.locator("[data-reset-window]").click();
  await modal.locator("[data-close]").first().click();
  await page.locator('#inspector [data-biography="p5"]').click();
  await expect(page.locator(".biography-header h2")).toHaveText("Jesse Ward");
});

test("favorites remain accessible across filters, center the card and survive ZIP and reload", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p8"]').click();
  await page.locator('#graph [data-favorite="p8"]').click();
  await expect(
    page.locator('#favoriteList [data-fast-person="p8"]'),
  ).toBeVisible();
  await page.locator("#peopleSearch").fill("John Doe");
  await expect(page.locator("#personList .person-row")).toHaveCount(1);
  await page.locator('[data-group-filter="g1"]').click();
  await expect(page.locator('.node[data-node="p8"]')).toHaveCount(0);
  await page.locator('#favoriteRail [data-fast-person="p8"]').click();
  await expect(page.locator("#inspector h2")).toHaveText("Casey Roe");
  await expect(page.locator('.node[data-node="p8"]')).toHaveCount(1);
  expect(
    parseInt(await page.locator("#zoomLabel").textContent()),
  ).toBeGreaterThanOrEqual(80);
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await expect(
    page.locator('#favoriteRail [data-fast-person="p8"]'),
  ).toBeVisible();
  await page.locator('[data-action="export"]').click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-export="zip"]').click(),
  ]);
  const buffer = await readFile(await download.path());
  await page.locator("[data-close]").first().click();
  await page.locator('#personList [data-person="p8"]').click();
  await page.locator('#graph [data-favorite="p8"]').click();
  await expect(
    page.locator('#favoriteList [data-fast-person="p8"]'),
  ).toHaveCount(0);
  await page.locator("#importInput").setInputFiles({
    name: "favorites.zip",
    mimeType: "application/zip",
    buffer,
  });
  await page.locator('#modal button[type="submit"]').click();
  await expect(
    page.locator('#favoriteList [data-fast-person="p8"]'),
  ).toBeVisible();
});

test("calendar shows hidden profile dates, jubilee birthdays and saved memorial events in all languages", async ({
  page,
}) => {
  await page.locator('[data-view="calendar"]').click();
  await page.locator("#calendarMonth").fill("2026-10");
  await expect(page.locator(".calendar-day")).toHaveCount(31);
  await page.locator('[data-calendar-day="2026-10-16"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText("Robin Roe");
  await expect(page.locator(".calendar-agenda")).toContainText("34 years");
  await page.locator('[data-calendar-day="2026-10-20"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Annual family gathering",
  );
  await page.locator('[data-action="add-calendar-event"]').click();
  await expect(page.locator('#modal [name="date"]')).toHaveValue("2026-10-20");
  await page.locator('#modal [name="title"]').fill("Example remembrance day");
  await page.locator('#modal [name="category"]').selectOption("memorial");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Example remembrance day",
  );
  await page.locator("#calendarMonth").fill("2027-10");
  await page.locator("#calendarType").selectOption("jubilee");
  await page.locator('[data-calendar-day="2027-10-16"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText("35 years");
  await expect(page.locator(".calendar-agenda")).toContainText("Jubilees");
  for (const language of ["uk", "ru", "en"]) {
    await page.locator("#appShell [data-language]").selectOption(language);
    await expect(page.locator(".calendar-agenda")).toContainText("Robin Roe");
  }
  await page.locator("#calendarType").selectOption("memorial");
  await page.locator('[data-calendar-day="2027-10-20"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Example remembrance day",
  );
  await page.locator("#calendarDomain").selectOption("financial");
  await page.locator("#calendarType").selectOption("finance");
  await page.locator("#calendarMonth").fill("2026-11");
  await page.locator('[data-calendar-day="2026-11-01"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText("Family loan");
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('[data-view="calendar"]').click();
  await page.locator("#calendarMonth").fill("2027-10");
  await page.locator('[data-calendar-day="2027-10-20"]').click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Example remembrance day",
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await page.screenshot({
    path: "test-results/mobile-calendar.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("edits court, financial, public office and self-described identity records with linked people", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p10"]').click();
  await page.locator('#inspector [data-edit-person="p10"]').first().click();
  await page.locator(".profile-additional-sections > summary").click();
  async function add(section) {
    const panel = page
      .locator(".profile-editor-section")
      .filter({ has: page.locator(`[data-add-record="${section}"]`) });
    await panel.locator("summary").first().click();
    await panel.locator(`[data-add-record="${section}"]`).click();
    return panel.locator(".profile-record").last();
  }
  const legal = await add("legal");
  await legal.locator('[name="legal-kind"]').selectOption("claim");
  await legal.locator('[name="legal-title"]').fill("Fictional court claim");
  await legal.locator('[name="legal-date"]').fill("2026-10-10");
  await legal.getByText("Case and party details", { exact: true }).click();
  await legal.locator('[name="legal-counterpartyId"]').selectOption("p4");
  await legal.locator('[name="legal-caseNumber"]').fill("DEMO-CASE-ONLY");
  const finance = await add("finances");
  await finance.locator('[name="finances-kind"]').selectOption("loan");
  await finance
    .locator('[name="finances-title"]')
    .fill("Fictional loan agreement");
  await finance.locator('[name="finances-amount"]').fill("0");
  await finance.getByText("Parties and terms", { exact: true }).click();
  await finance.locator('[name="finances-counterpartyId"]').selectOption("p5");
  await finance.locator('[name="finances-dueDate"]').fill("2027-01-01");
  const work = await add("occupations");
  await work
    .locator('[name="occupations-organization"]')
    .fill("Example Council");
  await work.locator('[name="occupations-kind"]').selectOption("office");
  await work
    .getByText("Appointment and income details", { exact: true })
    .click();
  await work
    .locator('[name="occupations-appointment"]')
    .selectOption("elected");
  await work.locator('[name="occupations-income"]').fill("1250.50");
  const identity = await add("identityHistory");
  await identity
    .locator('[name="identityHistory-kind"]')
    .selectOption("orientation");
  await identity
    .locator('[name="identityHistory-value"]')
    .fill("Example self-description");
  await identity.locator('[name="identityHistory-from"]').fill("2026-01-01");
  await identity.getByText("Context and attribution", { exact: true }).click();
  await identity.locator('[name="identityHistory-basis"]').selectOption("self");
  await page.locator('#modal button[type="submit"]').click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await expect(page.locator("#saveState")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#startContinue").click();
  await page.locator('#personList [data-biography="p10"]').click();
  for (const value of [
    "Fictional court claim",
    "DEMO-CASE-ONLY",
    "Jordan Roe",
    "Fictional loan agreement",
    "Jesse Ward",
    "Example Council",
    "1250.50",
    "Pansexual",
    "Example self-description",
    "Northbridge Health Centre",
    "Self-reported",
    "Unverified — needs checking",
  ])
    await expect(page.locator(".biography")).toContainText(value);
});

test("deleting a counterparty clears linked references and undo restores them", async ({
  page,
}) => {
  await page.locator('#personList [data-person="p11"]').click();
  await page.locator('#inspector [data-edit-person="p11"]').first().click();
  await page.locator('[data-delete-person="p11"]').click();
  await page.locator('#modal button[type="submit"]').click();
  const readCounterparty = () =>
    page.evaluate(async () => {
      const { state } = await import(
        new URL(
          "core/state.js",
          document.querySelector('script[type="module"]').src,
        ).href
      );
      return state.project.people.find((p) => p.id === "p5").financialRecords[0]
        .counterpartyId;
    });
  await expect.poll(readCounterparty).toBe("");
  await page.locator('[data-action="undo"]').click();
  await expect.poll(readCounterparty).toBe("p11");
});

test.describe("native phone working tools", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("taps a favorite and drags its profile header with cancellation support", async ({
    page,
  }) => {
    await page.locator('#favoriteRail [data-fast-person="p4"]').tap();
    const inspector = page.locator("#inspector");
    await expect(inspector.locator("h2")).toHaveText("Jordan Roe");
    const original = await inspector.boundingBox();
    const header = await inspector.locator(".inspector-header").boundingBox();
    const session = await page.context().newCDPSession(page);
    async function drag(cancel) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: header.x + 70, y: header.y + 25, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: header.x + 70, y: header.y - 55, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: cancel ? "touchCancel" : "touchEnd",
        touchPoints: [],
      });
    }
    await drag(true);
    await expect(inspector).not.toHaveAttribute("data-floating", "");
    expect((await inspector.boundingBox()).y).toBeCloseTo(original.y, 0);
    await drag(false);
    await expect(inspector).toHaveAttribute("data-floating", "");
    expect((await inspector.boundingBox()).y).toBeLessThan(original.y - 50);
    await page.screenshot({ path: "test-results/mobile-floating-profile.png" });
  });
});
