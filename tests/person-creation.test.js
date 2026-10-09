import test from "node:test";
import assert from "node:assert/strict";
import { newPersonRoles } from "../src/core/person-creation.js";
import {
  PERSON_CARD_WIDTH as w,
  PERSON_CARD_HEIGHT as h,
} from "../src/core/config.js";
import { state } from "../src/core/state.js";
import { setLanguage } from "../src/i18n/index.js";
import {
  collectCreationLinks,
  creationLinksError,
  creationLinkTargets,
} from "../src/model/person-creation.js";
import {
  freePersonPosition,
  relatedPersonPosition,
  viewportPersonPosition,
} from "../src/model/person-placement.js";
import {
  relationshipDefaults,
  relationshipDraftError,
} from "../src/model/relationship-draft.js";
import { renderPersonForm } from "../src/ui/forms/person.js";

const people = [
  { id: "a", name: "Alex Doe", x: 0, y: 0 },
  { id: "b", name: "Morgan Doe", x: 400, y: 0 },
  { id: "c", name: "Jamie Doe", x: 0, y: 300 },
];
function linkForm(rows) {
  const form = new FormData();
  form.set("create-relationships", "on");
  for (const row of rows) {
    for (const key of [
      "person",
      "role",
      "fromDate",
      "toDate",
      "notes",
      "verification",
    ])
      form.append("new-link-" + key, row[key] || "");
  }
  return form;
}

test("relationship defaults use exactly two valid people in selection order and respect explicit context", () => {
  const selected = { kind: "person", id: "c" };
  const defaults = relationshipDefaults(
    people,
    ["missing", "b", "a", "b"],
    selected,
  );
  assert.equal(defaults.from, "b");
  assert.equal(defaults.to, "a");
  assert.equal(
    relationshipDefaults(people, ["a", "b", "c"], selected).from,
    "c",
  );
  const contextual = relationshipDefaults(people, ["a", "b"], selected, {
    from: "c",
    to: "b",
    type: "spouse",
  });
  assert.equal(contextual.from, "c");
  assert.equal(contextual.to, "b");
  assert.equal(contextual.type, "spouse");
  assert.deepEqual(creationLinkTargets(people, ["b", "a"], selected), [
    "b",
    "a",
  ]);
  assert.deepEqual(creationLinkTargets(people, ["a", "b", "c"], selected), [
    "c",
  ]);
});

test("quick creation roles retain direction, verification, period and normal relationship defaults", () => {
  for (const [key, role] of Object.entries(newPersonRoles)) {
    const links = collectCreationLinks(
      linkForm([
        {
          person: "a",
          role: key,
          fromDate: "2020",
          toDate: "2022",
          notes: "Known period",
          verification: "unverified",
        },
      ]),
      "new",
    );
    assert.equal(links.length, 1);
    assert.equal(links[0].from, role.incoming ? "a" : "new");
    assert.equal(links[0].to, role.incoming ? "new" : "a");
    assert.equal(links[0].type, role.type);
    assert.equal(links[0].fromDate, "2020");
    assert.equal(links[0].toDate, "2022");
    assert.equal(links[0].verification, "unverified");
    assert.equal(links[0].notes, "Known period");
    if (key === "spouse") assert.equal(links[0].unionKind, "marriage");
  }
  const unchecked = linkForm([{ person: "a", role: "child" }]);
  unchecked.delete("create-relationships");
  assert.deepEqual(collectCreationLinks(unchecked, "new"), []);
});

test("atomic creation rejects batch cycles, duplicate parenthood, missing people and reversed periods without mutating the project", () => {
  const project = {
    people,
    relations: [{ id: "parent", from: "a", to: "c", type: "parent" }],
  };
  const original = structuredClone(project);
  const cases = [
    [
      { person: "c", role: "child" },
      { person: "a", role: "parent" },
    ],
    [
      { person: "b", role: "child" },
      { person: "b", role: "parent" },
    ],
    [
      { person: "a", role: "child" },
      { person: "a", role: "child" },
    ],
    [{ person: "missing", role: "child" }],
    [{ person: "a", role: "unknown" }],
    [{ person: "a", role: "spouse", fromDate: "2025", toDate: "2024" }],
  ];
  for (const rows of cases)
    assert.ok(creationLinksError(linkForm(rows), "new", project));
  assert.equal(
    creationLinksError(
      linkForm([
        { person: "a", role: "child" },
        { person: "b", role: "child" },
      ]),
      "new",
      project,
    ),
    "",
  );
  assert.equal(
    creationLinksError(
      linkForm([
        { person: "a", role: "adopted_child" },
        { person: "b", role: "child" },
      ]),
      "new",
      project,
    ),
    "",
  );
  assert.ok(
    relationshipDraftError(
      { from: "c", to: "a", type: "parent" },
      project.relations,
      new Set(people.map((p) => p.id)),
    ),
  );
  assert.equal(
    relationshipDraftError(
      { from: "a", to: "c", type: "parent" },
      project.relations,
      new Set(people.map((p) => p.id)),
      "parent",
    ),
    "",
  );
  assert.deepEqual(project, original);
});

test("placement follows the viewport at every zoom and finds free space near relatives in a dense map", () => {
  for (const z of [0.025, 0.3, 1, 2]) {
    const camera = { x: -300, y: 120, z };
    const p = viewportPersonPosition(camera, 900, 600);
    assert.equal((p.x + w / 2) * z + camera.x, 450);
    assert.equal((p.y + h / 2) * z + camera.y, 300);
  }
  const center = { x: 10, y: 20 };
  assert.deepEqual(freePersonPosition(center, []), center);
  const obstacles = [];
  for (let x = -4; x <= 4; x++)
    for (let y = -4; y <= 4; y++)
      obstacles.push({ x: x * (w + 32), y: y * (h + 32), w, h });
  const p = freePersonPosition({ x: 0, y: 0 }, obstacles);
  assert.ok(
    obstacles.every(
      (o) =>
        p.x + w <= o.x || o.x + w <= p.x || p.y + h <= o.y || o.y + h <= p.y,
    ),
  );
  assert.ok(Math.abs(p.x) <= 5 * (w + 32) && Math.abs(p.y) <= 5 * (h + 32));
  const child = relatedPersonPosition(
    people,
    [
      { from: "a", to: "new", type: "parent" },
      { from: "b", to: "new", type: "adopted" },
    ],
    "new",
    center,
  );
  assert.equal(child.x, 200);
  assert.ok(child.y > people[0].y + h);
  assert.ok(
    relatedPersonPosition(
      people,
      [{ from: "new", to: "c", type: "parent" }],
      "new",
      center,
    ).y < people[2].y,
  );
});

test("quick relationships are localized in all languages and only appear when creating a person in a nonempty map", () => {
  state.project = { people, groups: [], documents: [], relations: [] };
  const p = {
    name: "",
    gender: "u",
    birth: "",
    death: "",
    lifeStatus: "unknown",
  };
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const markup = renderPersonForm(p, [], null, ["b", "a"]);
    assert.ok(markup.includes("data-creation-links"));
    assert.equal((markup.match(/data-creation-link>/g) || []).length, 2);
    assert.ok(!renderPersonForm(p, [], "a").includes("data-creation-links"));
  }
  state.project.people = [];
  assert.ok(!renderPersonForm(p, [], null).includes("data-creation-links"));
  setLanguage("en");
});
