import { test, expect } from "@playwright/test";

async function openPortrait(page) {
  const buffer = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1268ac";
      ctx.fillRect(0, 0, 320, 480);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page.locator("#globalSearch").fill('name:"John Doe"');
  await page
    .locator('[data-search-kind="person"][data-search-id="p1"]')
    .click();
  if (!(await page.locator('#inspector [data-portrait="p1"]').isVisible()))
    await page.locator('#graph .node[data-node="p1"] .card').tap();
  await page.locator('#inspector [data-portrait="p1"]').click();
  await page
    .locator("[data-attachment-files]")
    .setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer });
  await expect(page.locator("#cropDialog")).toBeVisible();
}
const crop = (page) =>
  page.locator("#cropCanvas").evaluate((el) => JSON.parse(el.dataset.cropRect));
async function zoom(page, percent) {
  await page.locator("#cropZoom").evaluate((el, percent) => {
    el.value = String(Math.round(Math.log10(percent / 100) * 100));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, percent);
  await expect(page.locator("#cropZoomValue")).toHaveText(percent + "%");
}
async function framePoint(page, fx, fy) {
  return page.locator("#cropCanvas").evaluate(
    (el, { fx, fy }) => {
      const box = el.getBoundingClientRect(),
        crop = JSON.parse(el.dataset.cropRect),
        view = JSON.parse(el.dataset.cropView);
      return {
        x:
          box.left +
          ((view.x + (crop.x + crop.w * fx) * view.scale) * box.width) /
            el.width,
        y:
          box.top +
          ((view.y + (crop.y + crop.h * fy) * view.scale) * box.height) /
            el.height,
      };
    },
    { fx, fy },
  );
}
async function savedPixels(page) {
  await page.locator("#cropSave").click();
  await expect(page.locator("#cropDialog")).toBeHidden();
  await expect(page.locator("#inspector .avatar img")).toBeVisible();
  return page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    const id = state.project.people.find((p) => p.id === "p1").avatarId,
      image = await createImageBitmap(state.blobs.get(id)),
      canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    return {
      id,
      width: image.width,
      height: image.height,
      corner: [...ctx.getImageData(2, 2, 1, 1).data],
      center: [
        ...ctx.getImageData(image.width / 2, image.height / 2, 1, 1).data,
      ],
    };
  });
}
let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.locator("#startDemo").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("portrait frame moves, resizes at corners and saves a reduced image with white edges; cancellation keeps the existing photo", async ({
  page,
}) => {
  await openPortrait(page);
  await zoom(page, 200);
  const before = await crop(page),
    center = await framePoint(page, 0.5, 0.5);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 35, center.y + 20, { steps: 5 });
  await page.mouse.up();
  const moved = await crop(page);
  expect(moved.x).toBeGreaterThan(before.x);
  expect(moved.y).toBeGreaterThan(before.y);
  expect(moved.w).toBe(before.w);
  expect(moved.h).toBe(before.h);
  const corner = await framePoint(page, 1, 1);
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.down();
  await page.mouse.move(corner.x + 25, corner.y + 25, { steps: 5 });
  await page.mouse.up();
  const resized = await crop(page);
  expect(resized.w).toBeGreaterThan(moved.w);
  expect(resized.h).toBe(resized.w);
  await page.locator("#cropCanvas").focus();
  await page.keyboard.press("ArrowLeft");
  expect((await crop(page)).x).toBeLessThan(resized.x);
  await page.locator("#cropReset").click();
  expect((await crop(page)).w).toBe(480);
  await zoom(page, 10);
  expect((await crop(page)).w).toBe(3200);
  await zoom(page, 50);
  const saved = await savedPixels(page);
  expect(saved.width).toBe(640);
  expect(saved.height).toBe(640);
  expect(saved.corner.slice(0, 3).every((v) => v > 245)).toBe(true);
  expect(saved.center[2]).toBeGreaterThan(150);
  expect(saved.center[0]).toBeLessThan(40);
  await openPortrait(page);
  await zoom(page, 10);
  await page.locator("#cropCancel").click();
  const id = await page.evaluate(async () => {
    const { state } = await import(
      new URL(
        "core/state.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    return state.project.people.find((p) => p.id === "p1").avatarId;
  });
  expect(id).toBe(saved.id);
});

for (const [language, width] of [
  ["en", 390],
  ["uk", 320],
  ["ru", 320],
]) {
  test.describe(language + " portrait crop on phone", () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    test("native touch moves the frame and a reduced photo saves without overflowing the screen", async ({
      page,
    }) => {
      await page.locator("#appShell [data-language]").selectOption(language);
      await openPortrait(page);
      await zoom(page, 200);
      const before = await crop(page),
        center = await framePoint(page, 0.5, 0.5),
        session = await page.context().newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: center.x, y: center.y, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: center.x + 22, y: center.y + 12, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      const moved = await crop(page);
      expect(moved.x).toBeGreaterThan(before.x);
      expect(moved.y).toBeGreaterThan(before.y);
      expect(moved.w).toBe(before.w);
      await zoom(page, 1000);
      const tiny = await crop(page),
        tinyCenter = await framePoint(page, 0.5, 0.5);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: tinyCenter.x, y: tinyCenter.y, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: tinyCenter.x + 12, y: tinyCenter.y + 6, id: 0 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      expect((await crop(page)).w).toBe(tiny.w);
      expect((await crop(page)).x).toBeGreaterThan(tiny.x);
      await page.locator("#cropReset").tap();
      await zoom(page, 50);
      expect(
        await page
          .locator("#cropDialog")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await page.screenshot({
        path: "test-results/portrait-crop-" + language + ".png",
      });
      const saved = await savedPixels(page);
      expect(saved.corner.slice(0, 3).every((v) => v > 245)).toBe(true);
      expect(saved.center[2]).toBeGreaterThan(150);
      await session.detach();
    });
  });
}

test("document selection resizes and moves within the page without changing its original file", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 480;
    canvas.getContext("2d").fillRect(0, 0, 320, 480);
    const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      ),
      file = new File([blob], "register.png", { type: "image/png" });
    const { cropImage } = await import(
      new URL(
        "ui/cropper.js",
        document.querySelector('script[type="module"]').src,
      ).href
    );
    window.documentCropResult = cropImage(file, false).then(async (result) => {
      const image = await createImageBitmap(result);
      return {
        width: image.width,
        height: image.height,
        original: file.size,
        unchanged: blob.size,
      };
    });
  });
  await expect(page.locator("#cropDialog")).toBeVisible();
  await expect(page.locator("#cropZoomControl")).toBeHidden();
  await expect(page.locator("#cropSizeControl")).toBeVisible();
  const corner = await framePoint(page, 1, 1);
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.down();
  await page.mouse.move(corner.x - 55, corner.y - 100, { steps: 5 });
  await page.mouse.up();
  const resized = await crop(page);
  expect(resized.w).toBeLessThan(320);
  expect(resized.h).toBeLessThan(480);
  const center = await framePoint(page, 0.5, 0.5);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x - 200, center.y - 200, { steps: 5 });
  await page.mouse.up();
  const moved = await crop(page);
  expect(moved.x).toBe(0);
  expect(moved.y).toBe(0);
  expect(moved.w).toBe(resized.w);
  await page.locator("#cropSave").click();
  const result = await page.evaluate(() => window.documentCropResult);
  expect(result.width).toBe(Math.round(resized.w));
  expect(result.height).toBe(Math.round(resized.h));
  expect(result.original).toBe(result.unchanged);
});
