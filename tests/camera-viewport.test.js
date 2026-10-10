import test from "node:test";
import assert from "node:assert/strict";
import { resizeCamera } from "../src/model/camera-viewport.js";

test("viewport changes retain the same world center and chosen map scale", () => {
  for (const z of [0.025, 0.85, 2.5]) {
    const camera = { x: -320, y: 190, z },
      previous = { width: 1240, height: 680 },
      next = { width: 780, height: 430 },
      changed = resizeCamera(camera, previous, next);
    assert.equal(changed.z, z);
    assert.equal(
      (previous.width / 2 - camera.x) / z,
      (next.width / 2 - changed.x) / z,
    );
    assert.equal(
      (previous.height / 2 - camera.y) / z,
      (next.height / 2 - changed.y) / z,
    );
    assert.deepEqual(resizeCamera(changed, next, previous), camera);
    assert.deepEqual(camera, { x: -320, y: 190, z });
  }
});

test("height-only changes keep the horizontal camera position", () => {
  assert.deepEqual(
    resizeCamera(
      { x: 140, y: -50, z: 1.2 },
      { width: 980, height: 600 },
      { width: 980, height: 400 },
    ),
    { x: 140, y: -150, z: 1.2 },
  );
});
