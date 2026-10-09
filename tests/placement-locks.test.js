import test from "node:test";
import assert from "node:assert/strict";
import { sample } from "../src/data/demo.js";
import { validateImport } from "../src/model/validation.js";
import {
  normalizePlacementLocks,
  nodePlacementLocked,
  connectorPlacementLocked,
} from "../src/model/placement-locks.js";
import { constrainedPlacement } from "../src/model/constrained-placement.js";
import { arrangeItems } from "../src/model/diagram.js";
import { captureMapView, restoreMapView } from "../src/model/map-views.js";
import { emptyPersonFilter } from "../src/core/person-filter-fields.js";

const locks = (nodes = [], connectors = []) => ({ nodes, connectors });

test("placement locks validate archive limits and discard only deleted references", () => {
  const p = sample();
  p.placementLocks = locks(
    ["person:p1", "person:p1", "group:g1", "person:deleted"],
    ["r:r1", "g:g1", "r:deleted"],
  );
  assert.deepEqual(
    validateImport(p).placementLocks,
    locks(["person:p1", "group:g1"], ["r:r1", "g:g1"]),
  );
  assert.deepEqual(normalizePlacementLocks(undefined, p), locks());
  for (const bad of [
    null,
    [],
    {},
    locks([4]),
    { nodes: [], connectors: {} },
    locks(Array(2451).fill("person:p1")),
    locks([], Array(3001).fill("r:r1")),
  ])
    assert.throws(() => normalizePlacementLocks(bad, p));
});

test("group locks protect members and a collapsed group containing a fixed member cannot translate", () => {
  const p = sample();
  const group = p.groups[0],
    member = p.people.find((p) => p.groupIds?.includes(group.id)),
    outsider = p.people.find((p) => !p.groupIds?.includes(group.id));
  p.placementLocks = locks(["group:" + group.id]);
  assert.equal(nodePlacementLocked(p, "person", member.id), true);
  assert.equal(nodePlacementLocked(p, "person", outsider.id), false);
  assert.equal(connectorPlacementLocked(p, "g:" + group.id), true);
  p.placementLocks = locks(["person:" + member.id], ["r:r1"]);
  assert.equal(nodePlacementLocked(p, "group", group.id), true);
  assert.equal(connectorPlacementLocked(p, "g:" + group.id), false);
  assert.equal(connectorPlacementLocked(p, "r:r1"), true);
  p.placementLocks = locks();
  assert.equal(nodePlacementLocked(p, "person", member.id), false);
});

test("alignment uses fixed cards as anchors, grid leaves them unchanged and distribution preserves internal anchors", () => {
  const items = [
    { id: "a", x: 17, y: 53, w: 100, h: 60 },
    { id: "b", x: 222, y: 123, w: 80, h: 40, locked: true },
    { id: "c", x: 999, y: 444, w: 60, h: 50 },
  ];
  for (const mode of [
    "left",
    "top",
    "centerX",
    "centerY",
    "right",
    "bottom",
    "grid",
    "distributeX",
    "distributeY",
  ])
    assert.deepEqual(arrangeItems(items, mode).get("b"), { x: 222, y: 123 });
  assert.equal(arrangeItems(items, "top").get("a").y, 123);
  assert.equal(arrangeItems(items, "right").get("c").x + 60, 302);
  assert.equal(arrangeItems(items, "centerX").get("a").x + 50, 262);
  const row = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      x: i * i * 100,
      y: 0,
      w: 60,
      h: 40,
      locked: i === 3,
    })),
    positions = arrangeItems(row, "distributeX");
  assert.equal(positions.get("3").x, 900);
  for (const [a, b] of [
    [0, 3],
    [3, 6],
  ]) {
    const gaps = row
      .slice(a + 1, b + 1)
      .map(
        (item, i) =>
          positions.get(item.id).x - positions.get(row[a + i].id).x - 60,
      );
    assert.equal(new Set(gaps).size, 1);
  }
});

test("automatic placement avoids fixed and previously placed cards without moving fixed coordinates", () => {
  const items = [
    { id: "locked", x: 0, y: 0, w: 280, h: 212, locked: true },
    ...Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      x: 20,
      y: 20,
      w: 228,
      h: 128,
    })),
  ];
  const positions = constrainedPlacement(items),
    boxes = items.map((item) => ({ ...item, ...positions.get(item.id) }));
  assert.deepEqual(positions.get("locked"), { x: 0, y: 0 });
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i],
        b = boxes[j];
      assert.ok(
        a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y,
      );
    }
  assert.deepEqual(constrainedPlacement(items), positions);
});

test("restoring saved views preserves current fixed positions and routes until explicitly unlocked", () => {
  const p = sample(),
    runtime = {
      camera: { x: 0, y: 0, z: 1 },
      groupFilter: "",
      personFilter: emptyPersonFilter(),
      showDocs: false,
      graphFocus: null,
      analysisHighlight: null,
      analysisReveal: new Set(),
      analysisExpandedGroups: new Set(),
      selected: null,
      multiSelection: new Set(),
    };
  p.diagram = {
    "r:r1": {
      style: "orthogonal",
      points: [{ x: 10, y: 20 }],
      label: { x: 30, y: 40 },
    },
    "r:r2": { style: "polyline", points: [], label: { x: 2, y: 3 } },
  };
  const view = captureMapView(
    p,
    runtime,
    { width: 1000, height: 700 },
    { id: "v1", name: "Family" },
  );
  p.people[0].x = 987;
  p.people[1].x = 321;
  p.diagram["r:r1"].points[0].x = 777;
  delete p.diagram["r:r2"];
  p.placementLocks = locks(["person:" + p.people[0].id], ["r:r1", "r:r2"]);
  restoreMapView(p, view);
  assert.equal(p.people[0].x, 987);
  assert.equal(p.people[1].x, view.positions.people[1].x);
  assert.equal(p.diagram["r:r1"].points[0].x, 777);
  assert.equal(p.diagram["r:r2"], undefined);
  p.placementLocks = locks();
  restoreMapView(p, view);
  assert.equal(p.people[0].x, view.positions.people[0].x);
  assert.deepEqual(p.diagram, view.diagram);
  const group = p.groups[0],
    members = p.people.filter((person) => person.groupIds.includes(group.id)),
    collapsedView = structuredClone(view);
  collapsedView.positions.groups.find(
    (item) => item.id === group.id,
  ).collapsed = true;
  group.collapsed = true;
  group.x = null;
  group.y = null;
  members.forEach((person, index) =>
    Object.assign(person, { x: 500 + index * 340, y: 200 + index * 20 }),
  );
  p.placementLocks = locks(["person:" + members[0].id]);
  restoreMapView(p, collapsedView);
  assert.deepEqual({ x: group.x, y: group.y }, { x: 500, y: 200 });
  assert.deepEqual({ x: members[0].x, y: members[0].y }, { x: 500, y: 200 });
  assert.notEqual(members[1].x, 840);
});
