import { validDiagramKeys } from "../src/model/diagram.js";
import { assertPortraitCapacity } from "../src/services/image-region.js";
import { MAX_ATTACHMENT_BYTES } from "../src/core/config.js";
import { workspaceViews } from "../src/core/workspace-views.js";
import { catalogs } from "../src/i18n/index.js";
import test from "node:test";
import assert from "node:assert/strict";
import { sample } from "../src/data/demo.js";
import { state } from "../src/core/state.js";
import { normalizeSourceAttachments } from "../src/model/source-attachments.js";
import { validateImport } from "../src/model/validation.js";
import {
  normalizeImageRegions,
  pruneImageTargets,
  personImageItems,
  targetKey,
} from "../src/model/image-regions.js";
import { createProjectIndex } from "../src/model/project-index.js";
import { linkedDocs } from "../src/model/evidence.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { sourceRecordLinks } from "../src/model/source-record-links.js";
import { usedBlobs, pruneBlobs } from "../src/services/blobs.js";
import {
  movedRegion,
  resizedRegion,
  drawnRegion,
} from "../src/model/region-geometry.js";

const target = { kind: "person", personId: "p1" };
const rect = { x: 0.1, y: 0.2, width: 0.3, height: 0.5 };
const region = (id = "face") => ({
  id,
  title: "John at the reunion",
  notes: "Left side",
  rect,
  targets: [target],
});
const file = () => ({
  assetId: "shared-photo",
  filename: "Reunion.png",
  mime: "image/png",
  size: 12,
  width: 400,
  height: 240,
  description: "Family gathering in 1972",
  inscription: "The Doe family, August 1972",
  regions: [region()],
});
function fixture() {
  const project = sample(),
    source = project.documents[0];
  Object.assign(source, {
    type: "photo",
    people: [],
    subjectIds: [],
    relations: [],
    propertyIds: [],
    purposes: [],
    attachments: normalizeSourceAttachments({ attachments: [file()] }),
  });
  return { project, source };
}

test("image metadata and normalized regions round-trip without changing original attachment ownership", () => {
  const { project, source } = fixture();
  const imported = validateImport(project);
  assert.deepEqual(imported.documents[0].attachments, source.attachments);
  assert.equal(
    usedBlobs(imported, new Map([["shared-photo", new Blob(["original"])]]))[0],
    "shared-photo",
  );
  assert.equal(imported.documents[0].people.length, 0);
});

test("unsafe coordinates, duplicate annotation identifiers and invalid target shapes are rejected", () => {
  for (const input of [
    [region(), region()],
    [{ ...region(), id: 42 }],
    [{ ...region(), rect: { ...rect, x: -0.1 } }],
    [{ ...region(), rect: { ...rect, width: 0 } }],
    [{ ...region(), rect: { ...rect, x: 0.9 } }],
    [{ ...region(), rect: { ...rect, height: Infinity } }],
    [
      {
        ...region(),
        targets: [{ kind: "record", personId: "p1", section: "death" }],
      },
    ],
    [{ ...region(), targets: [target, target] }],
    Array.from({ length: 201 }, (_, i) => region("r" + i)),
  ])
    assert.throws(() => normalizeImageRegions(input));
  assert.equal(
    normalizeImageRegions([{ ...region(), rect: null }])[0].rect,
    null,
  );
  assert.throws(() =>
    normalizeSourceAttachments({
      attachments: [{ ...file(), mime: "application/pdf" }],
    }),
  );
});

test("image-only links participate in complete profiles, evidence and search without inferring other people", () => {
  const { project, source } = fixture();
  const index = createProjectIndex(project);
  assert.ok(index.profileDocs.get("p1").includes(source));
  assert.ok(validDiagramKeys(project).has(`d:${source.id}:p1`));
  assert.ok(!index.profileDocs.get("p2")?.includes(source));
  state.project = project;
  state.renderIndex = null;
  assert.ok(linkedDocs("person", "p1").includes(source));
  const results = searchIndex(
    buildSearchIndex(project),
    '"The Doe family, August 1972"',
  );
  assert.ok(
    results.some((result) => result.kind === "person" && result.id === "p1"),
  );
  assert.ok(
    results.some(
      (result) => result.kind === "document" && result.id === source.id,
    ),
  );
  assert.equal(personImageItems(project, "p1")[0].region.id, "face");
});

test("the same image links to multiple exact records while each record keeps its existing source", () => {
  const { project, source } = fixture();
  const configKey = "militaryRecords",
    person = project.people.find((p) => p.id === "p4");
  const award = person[configKey].find(
      (record) => record.id === "award-jordan",
    ),
    previous = award.sourceId;
  const recordTarget = {
    kind: "record",
    personId: "p4",
    section: "military",
    recordId: award.id,
  };
  source.attachments[0].regions[0].targets.push(recordTarget);
  assert.equal(
    sourceRecordLinks(project, source.id).find((link) => link.record === award)
      .section,
    "military",
  );
  assert.equal(
    personImageItems(project, "p4", {
      section: "military",
      recordId: award.id,
    })[0].file.assetId,
    "shared-photo",
  );
  assert.equal(award.sourceId, previous);
  assert.notEqual(targetKey(recordTarget), targetKey(target));
});

test("deleting a target or record removes only its links and retains image annotations and descriptions", () => {
  const { project, source } = fixture();
  source.attachments[0].regions[0].targets.push({
    kind: "record",
    personId: "p4",
    section: "military",
    recordId: "removed-award",
  });
  pruneImageTargets(project);
  assert.deepEqual(source.attachments[0].regions[0].targets, [target]);
  project.people = project.people.filter((person) => person.id !== "p1");
  pruneImageTargets(project);
  assert.equal(source.attachments[0].regions[0].targets.length, 0);
  assert.equal(source.attachments[0].description, file().description);
  assert.deepEqual(source.attachments[0].regions[0].rect, rect);
});

test("unlinked library originals survive draft pruning and remain available through undo", () => {
  const { project, source } = fixture();
  source.attachments[0].regions = [];
  state.project = project;
  state.history = [];
  state.future = [];
  state.urls = new Map();
  state.blobs = new Map([
    ["shared-photo", new Blob(["original"])],
    ["orphan", new Blob(["orphan"])],
  ]);
  pruneBlobs();
  assert.deepEqual([...state.blobs.keys()], ["shared-photo"]);
  state.history.push(structuredClone(project));
  project.documents = [];
  pruneBlobs();
  assert.ok(state.blobs.has("shared-photo"));
});

test("moving and resizing region corners stay within the original and support reversed drawing", () => {
  assert.deepEqual(movedRegion(rect, -1, 1), {
    x: 0,
    y: 0.5,
    width: 0.3,
    height: 0.5,
  });
  const resized = resizedRegion(rect, "se", { x: 0.8, y: 0.9 });
  assert.ok(Math.abs(resized.width - 0.7) < 1e-12);
  assert.ok(Math.abs(resized.height - 0.7) < 1e-12);
  const reversed = drawnRegion({ x: 0.8, y: 0.9 }, { x: 0.1, y: 0.2 });
  assert.deepEqual(reversed, resized);
});

test("every workspace navigation message resolves before the shell is mounted", () => {
  for (const view of workspaceViews)
    for (const key of [view.group, view.title, view.eyebrow, view.hint])
      for (const catalog of Object.values(catalogs))
        assert.equal(typeof catalog[key], "string", `${view.key}: ${key}`);
});

test("one burial photograph belongs only to the explicitly linked burial records", () => {
  const { project, source } = fixture();
  const dates = new Map(
    project.people.map((person) => [person.id, person.death]),
  );
  for (const id of ["p1", "p2"]) {
    const person = project.people.find((p) => p.id === id);
    person.deathRecords = [
      { id: "burial-" + id, cemetery: "Family plot", sourceId: "" },
    ];
  }
  source.attachments[0].regions = [
    {
      ...region(),
      rect: null,
      targets: ["p1", "p2"].map((personId) => ({
        kind: "record",
        personId,
        section: "death",
        recordId: "burial-" + personId,
      })),
    },
  ];
  for (const personId of ["p1", "p2"]) {
    const items = personImageItems(project, personId, {
      section: "death",
      recordId: "burial-" + personId,
    });
    assert.equal(items.length, 1);
    assert.equal(items[0].file.assetId, "shared-photo");
    assert.equal(
      project.people.find((p) => p.id === personId).death,
      dates.get(personId),
    );
  }
  assert.equal(
    personImageItems(project, "p3", { section: "death", recordId: "unrelated" })
      .length,
    0,
  );
});

test("portrait replacement counts the resulting archive rather than a removed portrait", () => {
  const project = {
    people: [{ id: "a", avatarId: "old" }],
    documents: [{ attachments: [{ assetId: "original" }] }],
  };
  const files = new Map([
    ["old", { size: MAX_ATTACHMENT_BYTES - 20 }],
    ["original", { size: 10 }],
  ]);
  assert.doesNotThrow(() =>
    assertPortraitCapacity(project, files, new Map([["a", { size: 15 }]])),
  );
  assert.throws(() =>
    assertPortraitCapacity(project, files, new Map([["b", { size: 15 }]])),
  );
});
