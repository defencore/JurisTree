import test from "node:test";
import assert from "node:assert/strict";
import { sample } from "../src/data/demo.js";
import { emptyPersonFilter } from "../src/core/person-filter-fields.js";
import {
  arrangeItems,
  normalizeDiagram,
  MAX_ROUTE_POINTS,
  snapPoint,
} from "../src/model/diagram.js";
import {
  connectorVertices,
  connectorPoints,
  closestRouteInsertion,
  shiftConnectorSegment,
  routedConnector,
} from "../src/model/connector-path.js";
import { captureMapView, restoreMapView } from "../src/model/map-views.js";
import { validateImport } from "../src/model/validation.js";

const route = (points = [], label = null, style = "orthogonal") => ({
  style,
  points,
  label,
});

test("floating endpoints align with nearby waypoints, and dragging a section preserves right angles and the input route", () => {
  const a = { x: 0, y: 0, w: 100, h: 60 },
    b = { x: 400, y: 100, w: 100, h: 60 };
  const manual = route([
    { x: 200, y: 20 },
    { x: 200, y: 120 },
  ]);
  assert.deepEqual(
    connectorVertices(a, b, manual).map(({ x, y }) => ({ x, y })),
    [
      { x: 100, y: 20 },
      { x: 200, y: 20 },
      { x: 200, y: 120 },
      { x: 400, y: 120 },
    ],
  );
  const shifted = shiftConnectorSegment(a, b, manual, 1, 40);
  assert.deepEqual(shifted.points, [
    { x: 240, y: 20 },
    { x: 240, y: 120 },
  ]);
  assert.deepEqual(manual.points, [
    { x: 200, y: 20 },
    { x: 200, y: 120 },
  ]);
  const movedExit = shiftConnectorSegment(a, b, manual, 0, 10);
  assert.equal(connectorVertices(a, b, movedExit)[0].y, 30);
  const points = connectorPoints(a, b, shifted);
  for (let i = 1; i < points.length; i++)
    assert.ok(
      points[i].x === points[i - 1].x || points[i].y === points[i - 1].y,
    );
  assert.equal(closestRouteInsertion(a, b, manual, { x: 190, y: 90 }), 1);
  assert.equal(closestRouteInsertion(a, a, route(), { x: 100, y: 30 }), 0);
  const straight = shiftConnectorSegment(a, { ...b, y: 0 }, route(), 0, 8);
  assert.equal(straight.points.length, 2);
  assert.equal(connectorVertices(a, { ...b, y: 0 }, straight)[0].y, 38);
  const top = connectorVertices(a, b, route([{ x: 20, y: -60 }]));
  assert.equal(top[0].x, 20);
  assert.equal(top[0].y, 0);
  const slant = connectorVertices(
    a,
    b,
    route([{ x: 200, y: 10 }], null, "polyline"),
  )[0];
  assert.equal(slant.x, 100);
  assert.ok(slant.y > 10 && slant.y < 30);
});
test("manual routes validate every coordinate, style and point limit, retaining only existing graph connections", () => {
  const p = sample(),
    document = p.documents.find((d) => d.people.length),
    property = p.property.find((a) => a.allocations.length);
  p.diagram = {
    "r:r1": route([{ x: -120, y: 420 }], { x: 40, y: 390 }),
    "g:g1": route([], { x: 80, y: 100 }, "auto"),
    ["d:" + document.id + ":" + document.people[0]]: route([
      { x: 250, y: 650 },
    ]),
    ["p:" + property.id + ":" + property.allocations[0].personId]: route(
      [],
      { x: 99, y: 200 },
      "polyline",
    ),
  };
  assert.deepEqual(
    validateImport(JSON.parse(JSON.stringify(p))).diagram,
    p.diagram,
  );
  assert.deepEqual(
    normalizeDiagram(
      { ...p.diagram, "r:deleted": route([{ x: Infinity, y: 0 }]) },
      p,
    ),
    p.diagram,
  );
  for (const invalid of [
    route([{ x: NaN, y: 0 }]),
    route([{ x: 100001, y: 0 }]),
    route([{ x: "12", y: 0 }]),
    route([], { x: 1, y: Infinity }),
    route([], null, "unknown"),
    route(Array.from({ length: MAX_ROUTE_POINTS + 1 }, () => ({ x: 1, y: 2 }))),
    route([{ x: 1, y: 2 }], null, "auto"),
  ])
    assert.throws(() => normalizeDiagram({ "r:r1": invalid }, p));
  assert.throws(() => normalizeDiagram({ "g:g1": route([{ x: 1, y: 2 }]) }, p));
  assert.throws(() => normalizeDiagram([], p));
});

test("manual connectors visit waypoints, attach to card boundaries and follow moved cards", () => {
  const a = { x: 0, y: 0, w: 100, h: 60 },
    b = { x: 400, y: 240, w: 100, h: 60 };
  const manual = route([
    { x: 160, y: -100 },
    { x: 600, y: -100 },
    { x: 600, y: 270 },
  ]);
  const automatic = { path: "old curve", x: 12, y: 45 };
  assert.equal(
    routedConnector(a, b, route([], null, "auto"), automatic),
    automatic,
  );
  for (const routed of [manual, route()]) {
    const output = routedConnector(a, b, routed, automatic),
      points = output.path
        .match(/[ML][^ML]+/g)
        .map((s) => s.slice(1).trim().split(/\s+/).map(Number));
    for (let i = 1; i < points.length; i++)
      assert.ok(
        points[i][0] === points[i - 1][0] || points[i][1] === points[i - 1][1],
      );
    for (const p of routed.points)
      assert.ok(points.some(([x, y]) => x === p.x && y === p.y));
  }
  const vertices = connectorVertices(a, b, manual);
  assert.equal(vertices[0].y, 0);
  assert.equal(vertices.at(-1).x, b.x + b.w);
  b.x += 100;
  assert.notDeepEqual(connectorVertices(a, b, manual).at(-1), vertices.at(-1));
  assert.deepEqual(manual.points, [
    { x: 160, y: -100 },
    { x: 600, y: -100 },
    { x: 600, y: 270 },
  ]);
  const polyline = routedConnector(
    a,
    b,
    { ...manual, style: "polyline" },
    automatic,
  );
  assert.ok(polyline.path.match(/L/g).length <= manual.points.length + 1);
  for (const point of manual.points)
    assert.ok(polyline.path.includes("L" + point.x + " " + point.y));
});

test("alignment accounts for different caption widths and distribution preserves outer cards with equal gaps", () => {
  const items = [
    { id: "a", x: -17, y: 43, w: 100, h: 60 },
    { id: "b", x: 181, y: 90, w: 40, h: 20 },
    { id: "c", x: 530, y: 160, w: 80, h: 40 },
  ];
  const center = arrangeItems(items, "centerX"),
    right = arrangeItems(items, "right"),
    vertical = arrangeItems(items, "centerY");
  assert.equal(new Set(items.map((i) => center.get(i.id).x + i.w / 2)).size, 1);
  assert.equal(new Set(items.map((i) => right.get(i.id).x + i.w)).size, 1);
  assert.equal(
    new Set(items.map((i) => vertical.get(i.id).y + i.h / 2)).size,
    1,
  );
  for (const [mode, axis, size] of [
    ["distributeX", "x", "w"],
    ["distributeY", "y", "h"],
  ]) {
    const positions = arrangeItems(items, mode);
    assert.equal(positions.get("a")[axis], items[0][axis]);
    assert.equal(positions.get("c")[axis], items[2][axis]);
    const gap1 =
      positions.get("b")[axis] - positions.get("a")[axis] - items[0][size];
    const gap2 =
      positions.get("c")[axis] - positions.get("b")[axis] - items[1][size];
    assert.equal(gap1, gap2);
  }
  assert.deepEqual(arrangeItems(items, "grid", 20).get("a"), { x: -20, y: 40 });
  assert.deepEqual(
    snapPoint({ x: 51, y: -31 }, { snapToGrid: true, gridSize: 20 }),
    { x: 60, y: -40 },
  );
  assert.deepEqual(
    snapPoint({ x: 51, y: -31 }, { snapToGrid: true, gridSize: 20 }, true),
    { x: 51, y: -31 },
  );
});

test("saved map views own their routes and restore them without reverting profile changes", () => {
  const p = sample();
  p.diagram = { "r:r1": route([{ x: 100, y: 200 }], { x: 300, y: 400 }) };
  const runtime = {
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
  const view = captureMapView(
    p,
    runtime,
    { width: 1000, height: 600 },
    { id: "arrangement", name: "Northern branch" },
  );
  p.diagram["r:r1"].points[0].x = 999;
  p.people[0].name = "John Updated";
  restoreMapView(p, view);
  assert.deepEqual(p.diagram, view.diagram);
  assert.equal(p.people[0].name, "John Updated");
  p.relations = p.relations.filter((r) => r.id !== "r1");
  restoreMapView(p, view);
  assert.deepEqual(p.diagram, {});
});
