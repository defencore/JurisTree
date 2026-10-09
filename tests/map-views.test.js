import test from "node:test";
import assert from "node:assert/strict";
import { emptyPersonFilter } from "../src/core/person-filter-fields.js";
import { sample } from "../src/data/demo.js";
import {
  cameraForMapView,
  captureMapView,
  MAP_VIEW_LIMIT,
  mapViewCamera,
  normalizeMapView,
  restoreMapView,
} from "../src/model/map-views.js";
import { validateImport } from "../src/model/validation.js";

const viewport = { width: 1024, height: 700 };
function runtime() {
  return {
    camera: { x: -314, y: 106, z: 0.8 },
    groupFilter: "g1",
    personFilter: emptyPersonFilter(),
    showDocs: true,
    graphFocus: { people: ["p1", "p2"], relations: ["r1"] },
    analysisHighlight: {
      people: ["p1", "p2"],
      relations: ["r1"],
      label: "Two generations",
    },
    analysisReveal: new Set(["r1"]),
    analysisExpandedGroups: new Set(["g1"]),
    selected: { kind: "person", id: "p1" },
    multiSelection: new Set(["p1", "p2"]),
  };
}
const capture = (p) =>
  captureMapView(p, runtime(), viewport, { id: "view1", name: "Doe branch" });

test("saved map views preserve all node placement, collapse states, visibility and responsive camera center through import", () => {
  const p = sample();
  p.groups[0].collapsed = true;
  p.groups[0].x = null;
  p.documents[0].x = 1220;
  p.documents[0].y = 876;
  p.property[0].x = 640;
  p.graphView.hiddenRelations = ["r2"];
  const view = capture(p);
  p.mapViews = [view];
  const imported = validateImport(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(imported.mapViews, [view]);
  assert.deepEqual(cameraForMapView(view.camera, viewport), runtime().camera);
  const phone = { width: 320, height: 600 };
  assert.deepEqual(
    mapViewCamera(cameraForMapView(view.camera, phone), phone),
    view.camera,
  );
  assert.equal(view.positions.groups[0].x, null);
  assert.equal(view.positions.groups[0].collapsed, true);
  assert.equal(view.positions.documents[0].x, 1220);
  assert.equal(view.positions.property[0].x, 640);
  assert.equal(view.visibility.showDocs, true);
  assert.deepEqual(view.visibility.focus, runtime().graphFocus);
  assert.deepEqual(view.visibility.selection, ["p1", "p2"]);
});

test("restoration moves surviving cards without reverting edits, removing new people or resurrecting deleted cards", () => {
  const p = sample(),
    view = capture(p),
    saved = view.positions.people[0];
  p.people[0].x += 700;
  p.people[0].name = "John Updated";
  p.people[0].notes = "New information";
  p.people = p.people.filter((person) => person.id !== "p2");
  p.relations = p.relations.filter((r) => r.id !== "r1");
  p.people.push({ ...p.people[0], id: "added-later", x: 999, y: 888 });
  p.groups = p.groups.filter((g) => g.id !== "g1");
  const restored = restoreMapView(p, view);
  assert.equal(p.people[0].x, saved.x);
  assert.equal(p.people[0].name, "John Updated");
  assert.equal(p.people[0].notes, "New information");
  assert.equal(p.people.find((person) => person.id === "added-later").x, 999);
  assert.ok(!p.people.some((person) => person.id === "p2"));
  assert.deepEqual(restored.visibility.focus, {
    people: ["p1"],
    relations: [],
  });
  assert.equal(restored.visibility.groupId, "");
  assert.deepEqual(restored.visibility.expandedGroups, []);
  assert.equal(view.visibility.focus.people.length, 2);
  assert.ok(!Object.hasOwn(view, "people"));
});

test("snapshots own their data and archive validation rejects corrupt, oversized or duplicate views", () => {
  const p = sample(),
    view = capture(p);
  p.people[0].x += 10;
  p.graphView.hiddenRelations.push("r3");
  assert.notEqual(view.positions.people[0].x, p.people[0].x);
  assert.ok(!view.graphView.hiddenRelations.includes("r3"));
  for (const mutate of [
    (v) => {
      v.camera.z = 0;
    },
    (v) => {
      v.camera.x = Infinity;
    },
    (v) => {
      v.positions.people[0].x = 100001;
    },
    (v) => {
      v.positions.people.push(v.positions.people[0]);
    },
    (v) => {
      v.visibility.personFilter.rules = [{ field: "unknown" }];
    },
    (v) => {
      v.savedAt = "bad-date";
    },
  ]) {
    const invalid = structuredClone(view);
    mutate(invalid);
    assert.throws(() => normalizeMapView(invalid, p));
  }
  p.mapViews = [view, view];
  assert.throws(() => validateImport(p));
  p.mapViews = Array.from({ length: MAP_VIEW_LIMIT + 1 }, (_, i) => ({
    ...view,
    id: `view-${i}`,
  }));
  assert.throws(() => validateImport(p));
  delete p.mapViews;
  assert.deepEqual(validateImport(p).mapViews, []);
});
