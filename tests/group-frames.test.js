import test from "node:test";
import assert from "node:assert/strict";
import { groupFrames } from "../src/graph/group-frames.js";

const person = {
  kind: "person",
  x: 100.3,
  y: 200.7,
  w: 280,
  h: 212,
  groupIds: ["one", "two"],
};

test("group headings reserve space for two-line kinship badges and stack shared memberships", () => {
  const frames = groupFrames(
    [{ id: "one" }, { id: "two" }, { id: "empty" }],
    [person],
    () => 1000,
  );
  assert.equal(frames.length, 2);
  const [first, second] = frames;
  assert.ok(first.header.y + first.header.h <= person.y - 36 - 8);
  assert.ok(second.header.y + second.header.h <= first.header.y - 8);
  for (const frame of frames) {
    assert.equal(frame.count, 1);
    assert.ok(frame.header.x >= frame.x);
    assert.ok(frame.header.x + frame.header.w <= frame.x + frame.w);
    assert.ok(frame.y < frame.header.y);
    assert.ok(frame.y + frame.h > person.y + person.h);
  }
});

test("a heading avoids unrelated cards above the family without moving people", () => {
  const document = {
    kind: "document",
    x: 60,
    y: 90,
    w: 228,
    h: 60,
  };
  const nodes = [person, document],
    before = structuredClone(nodes),
    [frame] = groupFrames([{ id: "one" }], nodes);
  assert.ok(frame.header.y + frame.header.h <= document.y - 8);
  assert.deepEqual(nodes, before);
  assert.deepEqual(groupFrames([{ id: "one" }], []), []);
});
