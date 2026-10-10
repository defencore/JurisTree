import test from "node:test";
import assert from "node:assert/strict";
import { fresh } from "../src/model/project.js";
import { normalizeGraphView } from "../src/core/graph-view.js";
import { layoutTypes } from "../src/core/layouts.js";
import { layoutInput } from "../src/graph/layouts/input.js";
import { computeLayout } from "../src/graph/layouts/compute.js";
import { applyLayout } from "../src/graph/layouts/placement.js";
import {
  connectedComponents,
  hierarchyLevels,
} from "../src/graph/layouts/topology.js";
import { singleCircle, multipleCircles } from "../src/graph/layouts/shapes.js";
import {
  selectedGraphNodes,
  toggleGraphNode,
  clearGraphItems,
} from "../src/model/graph-selection.js";
import { placementSelection } from "../src/model/placement-locks.js";

const runtime = (ids = []) => ({
  multiSelection: new Set(ids),
  diagramNodeSelection: new Set(),
  diagramLabelSelection: new Set(),
  layoutScope: "selected",
  graphSelectionAnchor: "",
  selected: null,
  selectionMode: false,
});
function fixture() {
  const project = fresh();
  project.people = Array.from({ length: 6 }, (_, i) => ({
    id: "p" + i,
    name: "Person " + i,
    gender: "m",
    groupIds: [],
    x: i * 430,
    y: (i % 3) * 350,
  }));
  project.relations = [
    { id: "r0", from: "p0", to: "p1", type: "parent" },
    { id: "r1", from: "p0", to: "p2", type: "adopted" },
    { id: "r2", from: "p2", to: "p3", type: "reports_to" },
    { id: "r3", from: "p4", to: "p5", type: "spouse" },
  ];
  project.documents = [{ id: "d", people: ["p0"], x: 120, y: 1800 }];
  project.property = [
    { id: "a", allocations: [{ personId: "p0" }], x: 1000, y: 1800 },
  ];
  const shown = [
    ...project.people.map((p) => ({ ...p, kind: "person", w: 280, h: 212 })),
    ...project.documents.map((p) => ({
      ...p,
      kind: "document",
      w: 228,
      h: 128,
    })),
    ...project.property.map((p) => ({
      ...p,
      kind: "property",
      w: 245,
      h: 128,
    })),
  ];
  return { project, shown };
}
const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circleRadii = (nodes, points) => {
  const centers = nodes.map((node) => ({
      x: points.get(node.key).x + node.w / 2,
      y: points.get(node.key).y + node.h / 2,
    })),
    center = {
      x: centers.reduce((sum, p) => sum + p.x, 0) / centers.length,
      y: centers.reduce((sum, p) => sum + p.y, 0) / centers.length,
    };
  return centers.map((p) => Math.hypot(p.x - center.x, p.y - center.y));
};

test("single circles are actual rings with equal center radii and no overlapping mixed-size cards", () => {
  const nodes = Array.from({ length: 24 }, (_, i) => ({
      key: String(i),
      w: i % 2 ? 280 : 228,
      h: i % 2 ? 212 : 128,
    })),
    points = singleCircle(nodes),
    radii = circleRadii(nodes, points);
  assert.ok(Math.max(...radii) - Math.min(...radii) < 1e-8);
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      assert.equal(
        overlaps(
          { ...nodes[i], ...points.get(nodes[i].key) },
          { ...nodes[j], ...points.get(nodes[j].key) },
        ),
        false,
      );
  assert.deepEqual(singleCircle([]), new Map());
});

test("multiple circles keep connected components separate and include isolated cards", () => {
  const { project, shown } = fixture(),
    input = layoutInput(project, shown, runtime());
  const components = connectedComponents(input.nodes, input.links),
    points = multipleCircles(input.nodes, input.links);
  assert.deepEqual(
    components.map((nodes) => nodes.length),
    [6, 2],
  );
  for (const nodes of components) {
    const radii = circleRadii(nodes, points);
    assert.ok(Math.max(...radii) - Math.min(...radii) < 1e-8);
  }
  assert.equal(
    connectedComponents(input.nodes, [{ from: "missing", to: "person:p0" }])
      .length,
    8,
  );
  for (let i = 0; i < input.nodes.length; i++)
    for (let j = i + 1; j < input.nodes.length; j++)
      assert.equal(
        overlaps(
          { ...input.nodes[i], ...points.get(input.nodes[i].key) },
          { ...input.nodes[j], ...points.get(input.nodes[j].key) },
        ),
        false,
      );
});

test("hierarchy respects direction, contains cycles and uses an explicit root for undirected trees", () => {
  const nodes = ["a", "b", "c", "d", "e"].map((key) => ({ key })),
    directed = [
      { from: "a", to: "b", directed: true },
      { from: "b", to: "c", directed: true },
      { from: "c", to: "b", directed: true },
      { from: "c", to: "d", directed: true },
    ],
    levels = hierarchyLevels(nodes, directed);
  assert.equal(levels.get("a"), 0);
  assert.equal(levels.get("b"), 1);
  assert.equal(levels.get("c"), 1);
  assert.equal(levels.get("d"), 2);
  assert.equal(
    hierarchyLevels(
      nodes,
      [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
      "c",
    ).get("a"),
    2,
  );
});

test("scope is explicit, selection identities include card type, and hidden connections do not affect layouts", () => {
  const { project, shown } = fixture(),
    r = runtime(["p0"]);
  r.diagramNodeSelection.add("document:d");
  assert.deepEqual(
    layoutInput(project, shown, r).nodes.map((n) => n.key),
    ["person:p0", "document:d"],
  );
  assert.equal(
    layoutInput(project, shown, r, { documentLinks: false }).links.length,
    0,
  );
  r.layoutScope = "visible";
  const input = layoutInput(project, shown, r, {
    relationIds: new Set(["r2"]),
  });
  assert.equal(input.nodes.length, 8);
  assert.deepEqual(
    input.links.find((link) => link.type === "reports_to"),
    {
      from: "person:p3",
      to: "person:p2",
      type: "reports_to",
      key: "r:r2",
      directed: true,
    },
  );
  r.multiSelection.clear();
  r.diagramNodeSelection.clear();
  r.layoutScope = "selected";
  r.diagramLabelSelection.add("r:r0");
  assert.equal(layoutInput(project, shown, r).nodes.length, 0);
  r.diagramLabelSelection.clear();
  assert.equal(layoutInput(project, shown, r).scope, "visible");
  r.diagramNodeSelection.add("document:p0");
  assert.deepEqual(
    selectedGraphNodes([shown[0], { ...shown[6], id: "p0" }], r).map(
      (n) => n.kind,
    ),
    ["document"],
  );
  const hidden = layoutInput(project, shown, r);
  assert.equal(hidden.scope, "selected");
  assert.equal(hidden.nodes.length, 0);
  r.diagramNodeSelection.clear();
  r.multiSelection.add("p0");
  const collapsed = layoutInput(
    project,
    shown
      .filter((node) => node.id !== "p0" && node.id !== "p1")
      .concat({
        id: "g",
        kind: "group",
        members: ["p0", "p1"],
      }),
    r,
  );
  assert.equal(collapsed.scope, "selected");
  assert.equal(collapsed.nodes.length, 0);
});

test("every layout changes only selected free cards, preserves routes, avoids outsiders and supports archive limits", async () => {
  const { project, shown } = fixture();
  project.placementLocks = { nodes: ["person:p0"], connectors: ["r:r0"] };
  project.diagram = {
    "r:r0": { style: "auto", points: [], label: { x: 200, y: 30 } },
    "r:r1": { style: "polyline", points: [{ x: 200, y: 500 }], label: null },
  };
  const original = structuredClone(project),
    input = layoutInput(project, shown, runtime(["p0", "p1", "p2", "p3"]));
  for (const style of Object.keys(layoutTypes)) {
    const proposed = await computeLayout(input, style, "person:p0"),
      before = structuredClone(proposed),
      next = applyLayout(project, input, proposed, style, project.graphView);
    assert.deepEqual(next.people[0], project.people[0]);
    assert.deepEqual(next.people.slice(4), project.people.slice(4));
    assert.deepEqual(next.documents, project.documents);
    assert.deepEqual(next.property, project.property);
    assert.deepEqual(next.diagram["r:r0"], project.diagram["r:r0"]);
    assert.deepEqual(next.diagram["r:r1"], project.diagram["r:r1"]);
    assert.ok(
      next.people
        .slice(1, 4)
        .some(
          (p, i) =>
            p.x !== project.people[i + 1].x || p.y !== project.people[i + 1].y,
        ),
    );
    const boxes = shown.map((node) => ({
      ...node,
      ...next[
        { person: "people", document: "documents", property: "property" }[
          node.kind
        ]
      ].find((p) => p.id === node.id),
    }));
    for (const a of boxes.slice(1, 4))
      for (const b of boxes.filter((b) => b.id !== a.id))
        assert.equal(overlaps(a, b), false, style + " " + a.id + " / " + b.id);
    for (const p of next.people)
      assert.ok(
        [p.x, p.y].every(
          (value) => Number.isInteger(value) && Math.abs(value) <= 100000,
        ),
      );
    assert.deepEqual(normalizeGraphView(next.graphView).layout, style);
    assert.deepEqual(proposed, before);
    assert.deepEqual(project, original);
  }
  await assert.rejects(computeLayout(input, "missing"), /Unknown layout/);
});

test("a selected collapsed group moves as one unit and mixed direct scopes cannot move hidden outsiders", async () => {
  const { project, shown } = fixture();
  project.groups = [{ id: "g", name: "Family", collapsed: true, x: 0, y: 0 }];
  for (const p of project.people.slice(0, 2)) p.groupIds = ["g"];
  const group = {
      ...project.groups[0],
      kind: "group",
      members: ["p0", "p1"],
      w: 280,
      h: 130,
    },
    visible = [group, ...shown.slice(2)],
    r = runtime();
  r.diagramNodeSelection.add("group:g");
  r.multiSelection.add("p2");
  const input = layoutInput(project, visible, r),
    proposed = await computeLayout(input, "circle"),
    next = applyLayout(project, input, proposed, "circle", project.graphView);
  const dx = next.people[0].x - project.people[0].x,
    dy = next.people[0].y - project.people[0].y;
  assert.ok(dx || dy);
  assert.equal(next.people[1].x - project.people[1].x, dx);
  assert.equal(next.people[1].y - project.people[1].y, dy);
  assert.deepEqual(next.people.slice(3), project.people.slice(3));
  assert.deepEqual(placementSelection(project, r, visible).nodes, [
    "group:g",
    "person:p2",
  ]);
  const direct = { people: new Set(["p0"]), relations: new Set(["r0"]) };
  assert.equal(layoutInput(project, visible, r, { direct }).nodes.length, 0);
  const edge = structuredClone(project);
  edge.people[1].x = 100000;
  const edgeInput = layoutInput(edge, visible, r);
  assert.throws(() =>
    applyLayout(
      edge,
      edgeInput,
      new Map([
        ["group:g", { x: 100000, y: 0 }],
        ["person:p2", { x: 0, y: 0 }],
      ]),
      "incremental",
      edge.graphView,
    ),
  );
});

test("card selection and lock targets stay the same when placement tools are opened", () => {
  const { project, shown } = fixture(),
    r = runtime();
  r.selected = { kind: "person", id: "p0" };
  r.graphSelectionAnchor = "p0";
  toggleGraphNode(r, "person", "p1");
  toggleGraphNode(r, "document", "d");
  r.diagramLabelSelection.add("r:r0");
  const ordinary = placementSelection(project, r, shown);
  assert.deepEqual(ordinary, {
    nodes: ["person:p0", "person:p1", "document:d"],
    connectors: ["r:r0"],
  });
  r.diagramEditing = true;
  assert.deepEqual(placementSelection(project, r, shown), ordinary);
  clearGraphItems(r);
  assert.equal(selectedGraphNodes(shown, r).length, 0);
  assert.equal(r.diagramLabelSelection.size, 0);
});

test("large network layout yields to the browser and returns bounded finite proposals", async () => {
  const nodes = Array.from({ length: 300 }, (_, i) => ({
      key: String(i),
      x: 0,
      y: 0,
      w: 280,
      h: 212,
    })),
    links = nodes
      .slice(1)
      .map((node, i) => ({ from: String(i), to: node.key }));
  let frames = 0;
  const points = await computeLayout(
    { nodes, links },
    "network",
    null,
    async () => {
      frames++;
    },
  );
  assert.ok(frames >= 20);
  assert.equal(points.size, 300);
  for (const point of points.values())
    assert.ok(
      [point.x, point.y].every(
        (value) => Number.isFinite(value) && Math.abs(value) <= 100000,
      ),
    );
});

test("fixed collapsed groups reserve member positions so expansion does not reveal card overlap", async () => {
  const { project, shown } = fixture();
  project.people[1].x = 430;
  project.people[1].y = 0;
  project.groups = [{ id: "g", name: "Family", collapsed: true, x: 0, y: 0 }];
  for (const p of project.people.slice(0, 2)) p.groupIds = ["g"];
  project.placementLocks = { nodes: ["person:p0"], connectors: [] };
  const visible = [
    {
      ...project.groups[0],
      kind: "group",
      members: ["p0", "p1"],
      w: 280,
      h: 130,
    },
    ...shown.slice(2),
  ];
  const input = layoutInput(project, visible, runtime()),
    positions = await computeLayout(input, "generations"),
    next = applyLayout(
      project,
      input,
      positions,
      "generations",
      project.graphView,
    );
  assert.deepEqual(next.people.slice(0, 2), project.people.slice(0, 2));
  for (const p of next.people.slice(2))
    for (const member of next.people.slice(0, 2))
      assert.equal(
        overlaps({ ...p, w: 280, h: 212 }, { ...member, w: 280, h: 212 }),
        false,
      );
});
