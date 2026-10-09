import test from "node:test";
import assert from "node:assert/strict";
import { recordConfigs, sectionInfo } from "../src/core/config.js";
import { orderedProfileSections } from "../src/core/profile-groups.js";
import { state } from "../src/core/state.js";
import {
  defaultScopes,
  normalizeModePurposes,
  startTemplates,
  workspaceModes,
} from "../src/core/workspace-modes.js";
import { sample } from "../src/data/demo.js";
import { setLanguage } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { sourceInScope } from "../src/model/evidence.js";
import { collectProjectEvents } from "../src/model/events.js";
import { eventDomain } from "../src/core/event-domains.js";
import { collectProfile } from "../src/model/profile-form.js";
import { profileRecordError } from "../src/model/profile-records.js";
import {
  profileReferenceLabel,
  unlinkProfileReferences,
} from "../src/model/profile-references.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { validateImport } from "../src/model/validation.js";
import { commit, undo, redo } from "../src/services/history.js";
import { renderBiography } from "../src/ui/biography.js";

test("eight modes share localized templates and valid sections while profiling exposes the complete catalog", () => {
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const modes = workspaceModes();
    assert.equal(Object.keys(modes).length, 8);
    assert.equal(Object.keys(startTemplates()).length, 9);
    for (const [key, mode] of Object.entries(modes)) {
      assert.ok(mode.title && mode.name && mode.description);
      assert.ok(
        mode.sections.every((section) => Object.hasOwn(sectionInfo(), section)),
      );
      const model = sample();
      model.purpose = key;
      assert.equal(validateImport(model).purpose, key);
    }
    assert.deepEqual(defaultScopes.profiling, orderedProfileSections());
    assert.equal(modes.civil.view, "people");
    assert.equal(modes.profiling.view, "people");
    assert.equal(modes.legal.eventDomain, "legal");
    assert.equal(modes.financial.propertyMap, true);
  }
  setLanguage("en");
});

test("unrestricted sources stay visible in new modes after old archives are normalized", () => {
  for (const selection of [
    undefined,
    [],
    ["invalid"],
    Object.keys(defaultScopes),
  ])
    assert.deepEqual(normalizeModePurposes(selection), []);
  const originalModes = ["family", "inheritance", "property", "research"];
  assert.deepEqual(normalizeModePurposes(originalModes), originalModes);
  assert.deepEqual(
    normalizeModePurposes(originalModes, { legacyDefault: true }),
    [],
  );
  assert.deepEqual(
    normalizeModePurposes(["civil", "civil", "invalid", "legal"]),
    ["civil", "legal"],
  );
  const raw = sample();
  delete raw.modeVisibilityVersion;
  raw.documents[0].purposes = ["family", "inheritance", "property", "research"];
  raw.documents[1].purposes = ["family"];
  state.project = validateImport(raw);
  for (const purpose of Object.keys(defaultScopes)) {
    state.project.purpose = purpose;
    assert.equal(sourceInScope(state.project.documents[0]), true);
    assert.equal(
      sourceInScope(state.project.documents[1]),
      purpose === "family",
    );
  }
  const current = sample();
  current.documents[0].purposes = originalModes;
  const restored = validateImport(validateImport(current));
  assert.deepEqual(restored.documents[0].purposes, originalModes);
});

test("civil records retain original names, all fields and independent family links through forms and archives", () => {
  state.project = validateImport(sample());
  const person = state.project.people.find((p) => p.id === "p6");
  const cfg = recordConfigs().civil;
  const form = new FormData();
  for (const record of person.civilRecords) {
    form.append("civil-id", record.id);
    for (const [key] of cfg.fields) form.append("civil-" + key, record[key]);
  }
  assert.deepEqual(collectProfile(form).civilRecords, person.civilRecords);
  const oldName = person.name,
    oldBirth = person.birth;
  const relations = structuredClone(state.project.relations);
  person.civilRecords[0].newName = "Robin Other";
  person.civilRecords[0].motherId = "p2";
  person.civilRecords[0].sex = "f";
  const restored = validateImport(state.project);
  assert.equal(restored.people.find((p) => p.id === "p6").name, oldName);
  assert.equal(restored.people.find((p) => p.id === "p6").birth, oldBirth);
  assert.equal(restored.people.find((p) => p.id === "p6").gender, "m");
  assert.deepEqual(restored.relations, relations);
  assert.equal(
    profileRecordError(cfg, {
      eventDate: "2026-01-05",
      registeredAt: "2026-01-04",
    }).length > 0,
    true,
  );
  assert.ok(profileRecordError(cfg, { documentIssuedAt: "2026-02-30" }));
});

test("civil references resolve through biographies and combined search, with one-time chronology outside celebrations", () => {
  state.project = validateImport(sample());
  state.project.scopePreferences.inheritance = [];
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p6"));
    for (const value of [
      "Robin Vale",
      "Robin Roe",
      "Quinn Vale",
      "AD/57/1996",
      'data-source-relation="r7"',
    ])
      assert.ok(html.includes(value), value);
    assert.ok(
      profileReferenceLabel(state.project, "relationship", "r7").includes(
        "Jamie Roe",
      ),
    );
    assert.ok(
      searchIndex(
        buildSearchIndex(state.project),
        'name:Robin "AD/57/1996" "Jamie Roe"',
      ).some((r) => r.kind === "person" && r.id === "p6"),
    );
  }
  setLanguage("en");
  const events = collectProjectEvents(state.project).filter(
    (e) => e.type === "civil",
  );
  assert.ok(events.length > 0);
  assert.ok(
    events.every((e) => !e.annual && eventDomain(e.type) === "biography"),
  );
});

test("invalid references clear on import and deletion preserves historical text with undo and redo", () => {
  const raw = sample();
  const original = raw.people.find((p) => p.id === "p6").civilRecords[0];
  const invalid = structuredClone(original);
  invalid.id = "civil-invalid-refs";
  invalid.motherId = "missing-person";
  invalid.relationshipId = "missing-relation";
  invalid.sourceId = "missing-source";
  raw.people[0].civilRecords = [invalid];
  state.project = validateImport(raw);
  const normalized = state.project.people[0].civilRecords[0];
  for (const key of ["motherId", "relationshipId", "sourceId"])
    assert.equal(normalized[key], "");
  assert.equal(normalized.motherName, "Quinn Vale");
  state.history = [];
  state.future = [];
  state.selected = null;
  commit(() => {
    unlinkProfileReferences(state.project, "person", ["p12"]);
    unlinkProfileReferences(state.project, "relationship", ["r7"]);
    unlinkProfileReferences(state.project, "source", ["d5"]);
  });
  const record = () =>
    state.project.people.find((p) => p.id === "p6").civilRecords[0];
  assert.equal(record().motherId, "");
  assert.equal(record().relationshipId, "");
  assert.equal(record().sourceId, "");
  assert.equal(record().motherName, "Quinn Vale");
  undo();
  assert.equal(record().relationshipId, "r7");
  assert.equal(record().sourceId, "d5");
  redo();
  assert.equal(record().relationshipId, "");
});
