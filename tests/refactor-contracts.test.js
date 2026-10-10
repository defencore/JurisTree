import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { frameTask } from "../src/core/frame-task.js";
import { recordConfigs, sectionInfo } from "../src/core/config.js";
import { propertyRecordConfigs } from "../src/core/property-records.js";
import { setLanguage, translate } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { createProjectIndex } from "../src/model/project-index.js";
import { fresh, withProjectIndex } from "../src/model/project.js";
import { linkedDocs } from "../src/model/evidence.js";
import { projectSearchIndex } from "../src/model/search-cache.js";
import { searchIndex } from "../src/model/search.js";
import { directConnectionScope } from "../src/model/graph-view.js";
import { nodePlacementLocked } from "../src/model/placement-locks.js";
import { projectVersion } from "../src/model/project-revision.js";
import { commit, commitSnapshot, undo, redo } from "../src/services/history.js";
import { onSignal } from "../src/core/signals.js";

function projectFixture() {
  const project = fresh();
  project.people = [
    {
      id: "a",
      name: "Alex Doe",
      groupIds: ["g"],
      bioSourceIds: ["notes"],
      x: 0,
      y: 0,
    },
    {
      id: "b",
      name: "Jamie Roe",
      witnessRecords: [{ id: "w", witnessId: "a", sourceId: "witness" }],
      x: 400,
      y: 0,
    },
    { id: "c", name: "Robin Roe", x: 800, y: 0 },
  ];
  project.relations = [{ id: "r", from: "a", to: "b", type: "sibling" }];
  project.groups = [{ id: "g", name: "Doe family" }];
  project.property = [
    {
      id: "asset",
      title: "House",
      ownerId: "a",
      allocations: [],
      sourceId: "asset-source",
    },
  ];
  project.documents = [
    {
      id: "notes",
      title: "Biography",
      type: "archive",
      purposes: ["legal"],
      people: [],
      relations: [],
    },
    {
      id: "witness",
      title: "Testimony",
      type: "testimony",
      people: [],
      relations: [],
    },
    {
      id: "subject",
      title: "Register",
      type: "register",
      subjectIds: ["a"],
      people: [],
      relations: [],
    },
    {
      id: "relation",
      title: "Parentage",
      type: "archive",
      people: [],
      relations: ["r", "r"],
    },
    {
      id: "asset-source",
      title: "Title deed",
      type: "ownership",
      people: [],
      relations: [],
      propertyIds: ["asset"],
    },
  ];
  return project;
}

test("localized definitions are immutable, reused and correct after repeated language changes", () => {
  const perLanguage = new Map();
  try {
    for (const language of ["en", "uk", "ru", "en", "ru", "uk"]) {
      setLanguage(language);
      const configs = recordConfigs();
      if (perLanguage.has(language))
        assert.equal(configs, perLanguage.get(language));
      else perLanguage.set(language, configs);
      assert.equal(sectionInfo().education[0], translate("ui.education"));
      assert.equal(configs.education, recordConfigs().education);
      assert.ok(Object.isFrozen(configs.education.fields[0]));
      assert.ok(Object.isFrozen(propertyRecordConfigs().rights));
      assert.throws(() => {
        configs.education.fields[0][1] = "Changed";
      }, TypeError);
    }
    assert.notEqual(perLanguage.get("en"), perLanguage.get("uk"));
  } finally {
    setLanguage("en");
  }
});

test("one index retains complete profile sources, testimony, order and distinct evidence scopes", () => {
  const project = projectFixture(),
    before = structuredClone(project);
  const index = createProjectIndex(project);
  const biography = personBiography(project, "a", index);
  assert.deepEqual(
    biography.documents.map((d) => d.id),
    ["notes", "witness", "subject", "relation", "asset-source"],
  );
  assert.equal(biography.testimony[0].personId, "b");
  assert.equal(biography.property[0].id, "asset");
  assert.deepEqual(
    index.relationDocs.get("r").map((d) => d.id),
    ["relation"],
  );
  assert.deepEqual(
    index.propertyDocs.get("asset").map((d) => d.id),
    ["asset-source"],
  );
  const previous = state.project;
  state.project = project;
  try {
    assert.throws(
      () =>
        withProjectIndex(() => {
          const shared = state.renderIndex;
          withProjectIndex(() => assert.equal(state.renderIndex, shared));
          assert.equal(linkedDocs("person", "a").length, 0);
          assert.equal(personBiography(project, "a").documents[0].id, "notes");
          throw new Error("Interrupted render");
        }),
      /Interrupted render/,
    );
    assert.equal(state.renderIndex, null);
    assert.deepEqual(project, before);
  } finally {
    state.project = previous;
  }
});

test("same-timestamp commits invalidate search, direct connections and placement locks", (context) => {
  state.project = projectFixture();
  state.history = [];
  state.future = [];
  state.directConnectionRoot = "a";
  context.mock.method(
    Date.prototype,
    "toISOString",
    () => "2026-01-01T00:00:00.000Z",
  );
  state.project.updatedAt = new Date().toISOString();
  const initial = projectVersion(state.project),
    cached = projectSearchIndex(state.project);
  assert.ok(directConnectionScope().people.has("b"));
  assert.equal(nodePlacementLocked(state.project, "person", "a"), false);
  commit(() => {
    state.project.people[0].name = "First change";
    state.project.relations[0].to = "c";
    state.project.placementLocks.nodes.push("person:a");
  });
  const first = projectVersion(state.project);
  assert.notEqual(first, initial);
  assert.notEqual(projectSearchIndex(state.project), cached);
  assert.ok(directConnectionScope().people.has("c"));
  assert.equal(nodePlacementLocked(state.project, "person", "a"), true);
  commit(() => {
    state.project.people[0].name = "Second change";
  });
  assert.notEqual(projectVersion(state.project), first);
  assert.deepEqual(
    searchIndex(
      projectSearchIndex(state.project),
      'type:person name:"Second change"',
    ).map((e) => e.id),
    ["a"],
  );
  assert.deepEqual(
    searchIndex(projectSearchIndex(state.project), 'name:"First change"'),
    [],
  );
  state.directConnectionRoot = "";
});

test("a failed edit restores data and preserves history, redo and change notifications", () => {
  state.project = projectFixture();
  state.history = [];
  state.future = [{ marker: "redo" }];
  const before = structuredClone(state.project);
  let notifications = 0;
  const stop = onSignal("project:changed", () => {
    notifications++;
  });
  try {
    assert.throws(
      () =>
        commit(() => {
          state.project.people[0].name = "Partial edit";
          throw new Error("Failed edit");
        }),
      /Failed edit/,
    );
    assert.deepEqual(state.project, before);
    assert.deepEqual(state.history, []);
    assert.deepEqual(state.future, [{ marker: "redo" }]);
    assert.equal(notifications, 0);
  } finally {
    stop();
  }
});

test("placement previews share history and preserve valid property and group selections through undo and redo", () => {
  state.project = projectFixture();
  state.history = [];
  state.future = [];
  state.selected = { kind: "property", id: "asset" };
  const before = structuredClone(state.project);
  state.project.property[0].x = 550;
  commitSnapshot(before);
  undo();
  assert.equal(state.selected.id, "asset");
  assert.equal(state.project.property[0].x, undefined);
  redo();
  assert.equal(state.selected.id, "asset");
  assert.equal(state.project.property[0].x, 550);
  state.selected = { kind: "group", id: "g" };
  commit(() => {
    state.project.groups[0].name = "New name";
  });
  undo();
  assert.equal(state.selected.id, "g");
  redo();
  assert.equal(state.selected.id, "g");
  commit(() => {
    state.project.groups = [];
  });
  redo();
  undo();
  redo();
  assert.equal(state.selected, null);
});

test("preview rendering batches bursts and cancellation prevents a stale frame", (context) => {
  const frames = new Map();
  let serial = 0,
    rendered = [],
    position = 0;
  globalThis.requestAnimationFrame ||= () => {};
  globalThis.cancelAnimationFrame ||= () => {};
  context.mock.method(globalThis, "requestAnimationFrame", (fn) => {
    frames.set(++serial, fn);
    return serial;
  });
  context.mock.method(globalThis, "cancelAnimationFrame", (id) => {
    frames.delete(id);
  });
  const preview = frameTask(() => {
    rendered.push(position);
  });
  for (position = 0; position < 50; position++) preview.request();
  assert.equal(frames.size, 1);
  const [id, update] = [...frames][0];
  frames.delete(id);
  update();
  assert.deepEqual(rendered, [50]);
  preview.request();
  preview.cancel();
  assert.equal(frames.size, 0);
  preview.request();
  assert.equal(frames.size, 1);
  preview.cancel();
});
