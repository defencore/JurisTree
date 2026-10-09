import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { directConnections } from "../src/model/direct-connections.js";
import {
  directConnectionScope,
  relationShown,
  resetAnalysis,
  visiblePeople,
} from "../src/model/graph-view.js";
import { fresh } from "../src/model/project.js";
import { filteredGraphNodes } from "../src/graph/node-data.js";
import { positionScopedLayout } from "../src/graph/layouts/scoped.js";
import { familyLayout } from "../src/graph/layouts/family.js";
import {
  PERSON_CARD_WIDTH as w,
  PERSON_CARD_HEIGHT as h,
} from "../src/core/config.js";
import { graphRole } from "../src/graph/roles.js";

function fixture() {
  const project = fresh();
  project.people = [
    "root",
    "parent",
    "child",
    "colleague",
    "grandchild",
    "stranger",
  ].map((id, i) => ({
    id,
    name: id,
    gender: "m",
    groupIds: ["family"],
    x: i * 340,
    y: i * 280,
  }));
  project.groups = [
    { id: "family", name: "Family", collapsed: true, x: 40, y: 60 },
  ];
  project.relations = [
    { id: "parent", from: "parent", to: "root", type: "parent" },
    { id: "child", from: "root", to: "child", type: "adopted" },
    {
      id: "work",
      from: "colleague",
      to: "root",
      type: "professional",
      verification: "unverified",
    },
    {
      id: "episode",
      from: "root",
      to: "colleague",
      type: "acquaintance",
      verification: "refuted",
    },
    { id: "indirect", from: "child", to: "grandchild", type: "parent" },
    { id: "neighbor", from: "parent", to: "colleague", type: "acquaintance" },
  ];
  project.documents = [
    { id: "source", people: ["root"], relations: [], x: 100, y: 100 },
  ];
  project.property = [{ id: "asset", ownerId: "root", x: 500, y: 100 }];
  return project;
}

test("direct scope includes every recorded incident relationship in both directions, with no second hop or neighbor-to-neighbor edges", () => {
  const project = fixture();
  project.relations.push(
    { id: "self", from: "root", to: "root" },
    { id: "dangling", from: "root", to: "missing" },
  );
  const scope = directConnections(project, "root");
  assert.deepEqual([...scope.people].sort(), [
    "child",
    "colleague",
    "parent",
    "root",
  ]);
  assert.deepEqual([...scope.relations].sort(), [
    "child",
    "episode",
    "parent",
    "work",
  ]);
  assert.equal(directConnections(project, "missing"), null);
  assert.deepEqual(
    [...directConnections(project, "stranger").people],
    ["stranger"],
  );
  assert.equal(directConnections(project, "stranger").relations.size, 0);
});

test("highlight keeps the current nodes, display filters and group states; full exports remain complete", () => {
  state.project = fixture();
  state.directConnectionRoot = "";
  state.groupFilter = "family";
  state.showDocs = true;
  state.graphFocus = null;
  state.project.graphView.hiddenRelations = ["work"];
  const original = structuredClone(state.project),
    nodes = filteredGraphNodes();
  state.directConnectionRoot = "root";
  assert.equal(visiblePeople().length, 6);
  assert.equal(relationShown(state.project.relations[2]), false);
  assert.equal(relationShown(state.project.relations[4]), true);
  assert.deepEqual(filteredGraphNodes(), nodes);
  state.project.groups[0].collapsed = false;
  assert.equal(
    filteredGraphNodes().filter((node) => node.kind === "person").length,
    6,
  );
  state.project.groups[0].collapsed = true;
  state.groupFilter = "other";
  state.graphFocus = { people: ["stranger"], relations: ["neighbor"] };
  assert.deepEqual(visiblePeople(), []);
  state.exportingDiagram = "full";
  assert.equal(visiblePeople().length, 6);
  assert.equal(relationShown(state.project.relations[2]), true);
  assert.ok(filteredGraphNodes().some((n) => n.kind === "document"));
  state.exportingDiagram = false;
  state.directConnectionRoot = "";
  assert.deepEqual(state.project, original);
  resetAnalysis(false);
  state.groupFilter = "";
});

test("scope refreshes after relationship edits, undo-style replacement and reference deletion", () => {
  state.project = fixture();
  state.directConnectionRoot = "root";
  assert.equal(directConnectionScope().people.size, 4);
  state.project.relations.push({
    id: "new",
    from: "root",
    to: "stranger",
    type: "possible",
  });
  state.project.updatedAt = "edited";
  assert.equal(directConnectionScope().people.size, 5);
  state.project = { ...state.project, relations: [] };
  assert.equal(directConnectionScope().people.size, 1);
  state.project = { ...state.project, people: [] };
  assert.equal(directConnectionScope(), null);
  resetAnalysis(false);
});

test("partial layout keeps its relative geometry, avoids hidden cards, and does not mutate the project or input positions", () => {
  const project = fixture(),
    original = structuredClone(project),
    scope = directConnections(project, "root"),
    input = familyLayout({
      ...project,
      people: project.people.filter((p) => scope.people.has(p.id)),
      relations: project.relations.filter((r) => scope.relations.has(r.id)),
      documents: [],
      property: [],
    }).people,
    before = structuredClone(input),
    output = positionScopedLayout(input, project, scope),
    shift = {
      x: output.get("root").x - input.get("root").x,
      y: output.get("root").y - input.get("root").y,
    };
  for (const [id, p] of output) {
    assert.equal(p.x - input.get(id).x, shift.x);
    assert.equal(p.y - input.get(id).y, shift.y);
    const obstacles = [
      ...project.people
        .filter((x) => !scope.people.has(x.id))
        .map((x) => ({ ...x, w, h })),
      ...project.documents.map((x) => ({ ...x, w: 228, h: 128 })),
      ...project.property.map((x) => ({ ...x, w: 245, h: 128 })),
    ];
    assert.ok(
      obstacles.every(
        (o) =>
          p.x + w <= o.x ||
          o.x + o.w <= p.x ||
          p.y + h <= o.y ||
          o.y + o.h <= p.y,
      ),
    );
  }
  assert.deepEqual(project, original);
  assert.deepEqual(input, before);
});

test("family badges retain the reference person when another visible card is selected", () => {
  state.project = fixture();
  state.directConnectionRoot = "root";
  state.selected = { kind: "person", id: "child" };
  assert.equal(graphRole("root").kind, "self");
  assert.equal(graphRole("parent").kind, "parent");
  assert.equal(graphRole("child").kind, "child");
  state.directConnectionRoot = "";
  assert.equal(graphRole("child").kind, "self");
});
