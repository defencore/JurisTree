import test from "node:test";
import assert from "node:assert/strict";
import {
  cropViewport,
  moveCrop,
  resizeCrop,
  scaleCrop,
} from "../src/model/crop-geometry.js";

const bounds = { width: 320, height: 480 };
const rect = { x: 0, y: 80, w: 320, h: 320 };

test("moving a portrait preserves its square and permits padded edges while document crops stay within the image", () => {
  const moved = moveCrop(rect, -100, 250, bounds, true);
  assert.deepEqual(moved, { x: -100, y: 330, w: 320, h: 320 });
  assert.deepEqual(moveCrop(rect, -100, 250, bounds, false), {
    ...rect,
    x: 0,
    y: 160,
  });
  assert.deepEqual(rect, { x: 0, y: 80, w: 320, h: 320 });
});

test("reducing photo scale preserves the frame center and displays the entire padded crop", () => {
  for (const percent of [10, 50, 100, 200, 1000]) {
    const crop = scaleCrop(rect, 320, percent),
      view = cropViewport(bounds, crop);
    assert.equal(crop.x + crop.w / 2, 160);
    assert.equal(crop.y + crop.h / 2, 240);
    assert.equal(crop.w, crop.h);
    assert.ok(view.x + crop.x * view.scale >= 23);
    assert.ok(view.y + crop.y * view.scale >= 23);
    assert.ok(view.x + (crop.x + crop.w) * view.scale <= 677);
    assert.ok(view.y + (crop.y + crop.h) * view.scale <= 397);
  }
  assert.ok(scaleCrop(rect, 320, 50).x < 0);
});

test("corner resizing anchors the opposite corner, keeps portraits square and bounds document selections", () => {
  const portrait = resizeCrop(rect, "nw", { x: -80, y: -100 }, bounds, true);
  assert.equal(portrait.x + portrait.w, rect.x + rect.w);
  assert.equal(portrait.y + portrait.h, rect.y + rect.h);
  assert.equal(portrait.w, portrait.h);
  assert.ok(portrait.x < 0);
  const document = resizeCrop(rect, "se", { x: 900, y: 900 }, bounds, false);
  assert.equal(document.x + document.w, bounds.width);
  assert.equal(document.y + document.h, bounds.height);
});
