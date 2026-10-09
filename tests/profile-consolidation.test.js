import test from "node:test";
import assert from "node:assert/strict";
import { recordConfigs, sectionInfo } from "../src/core/config.js";
import {
  profileCatalog,
  profileSectionCount,
} from "../src/core/profile-catalog.js";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { setLanguage, translate } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { buildPersonFilterFacts } from "../src/model/person-filter-facts.js";
import { collectProfile } from "../src/model/profile-form.js";
import { scopedPerson } from "../src/model/project.js";
import { validateImport, profileFormError } from "../src/model/validation.js";
import { renderBiography } from "../src/ui/biography.js";
import { profileEditors } from "../src/ui/forms/profile-sections.js";
import { renderPersonDetails } from "../src/ui/profile-details.js";

test("saved summaries move once into activities without splitting text, losing detail or colliding identifiers", () => {
  const raw = sample();
  const person = raw.people[0];
  person.hobbies = "Reading, guitar\nWatercolor painting <b>notes</b>";
  person.interests = "Local history";
  person.skillRecords = [
    {
      id: `overview-hobby-${person.id}`,
      category: "skill",
      name: "Driving",
      from: "2001",
      to: "2020",
      level: "professional",
      qualification: "Licensed instructor",
      certificateNumber: "CERT-14",
      sourceId: "d1",
    },
  ];
  person.health = "Medical summary";
  person.healthSourceIds = ["d1", "missing-source"];
  raw.scopePreferences.family = [
    "interests",
    "health",
    "skills",
    "medical",
    "missing",
  ];
  const before = structuredClone(raw);
  const project = validateImport(raw);
  const migrated = project.people[0];
  assert.deepEqual(raw, before);
  assert.equal(Object.hasOwn(migrated, "hobbies"), false);
  assert.equal(Object.hasOwn(migrated, "interests"), false);
  assert.equal(migrated.skillRecords.length, 3);
  for (const [key, value] of Object.entries(person.skillRecords[0]))
    assert.equal(migrated.skillRecords[0][key], value);
  assert.equal(migrated.skillRecords[1].id, `overview-hobby-${person.id}-1`);
  assert.equal(migrated.skillRecords[1].description, person.hobbies);
  assert.equal(migrated.skillRecords[1].name, "");
  assert.equal(migrated.skillRecords[1].category, "hobby");
  assert.equal(migrated.skillRecords[2].name, person.interests);
  assert.equal(migrated.skillRecords[2].category, "interest");
  assert.equal(migrated.skillRecords[2].from, "");
  assert.equal(migrated.skillRecords[2].level, "unspecified");
  assert.deepEqual(project.scopePreferences.family, ["skills", "medical"]);
  assert.equal(migrated.health, person.health);
  assert.deepEqual(migrated.healthSourceIds, ["d1"]);
  assert.deepEqual(validateImport(project), project);
});

test("maximum-length summaries survive a full earlier activity list while invalid lists still fail", () => {
  const raw = sample();
  const person = raw.people[0];
  person.skillRecords = Array.from({ length: 200 }, (_, i) => ({
    id: `activity-${i}`,
    name: `Activity ${i}`,
    category: "hobby",
  }));
  person.hobbies = "h".repeat(5000);
  person.interests = "i".repeat(5000);
  const project = validateImport(raw);
  assert.equal(project.people[0].skillRecords.length, 202);
  assert.equal(project.people[0].skillRecords[200].description, person.hobbies);
  assert.equal(
    project.people[0].skillRecords[201].description,
    person.interests,
  );
  assert.deepEqual(validateImport(project), project);
  const form = new FormData();
  const cfg = recordConfigs().skills;
  for (const record of project.people[0].skillRecords) {
    form.append("skills-id", record.id);
    for (const [key] of cfg.fields) form.append(`skills-${key}`, record[key]);
  }
  assert.equal(profileFormError(form, project.people[0]), "");
  form.append("skills-id", "one-too-many");
  assert.equal(
    profileFormError(form, project.people[0]),
    translate("ui.profileSectionRecordLimit", { limit: 202 }),
  );
  person.skillRecords = {};
  assert.throws(() => validateImport(raw));
  person.skillRecords = [
    { id: "duplicate", name: "One" },
    { id: "duplicate", name: "Two" },
  ];
  assert.throws(() => validateImport(raw));
});

test("each language exposes one activity section and one health section with searchable categories and optional expertise", () => {
  state.project = sample();
  const person = state.project.people[0];
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const sections = sectionInfo();
    assert.equal(Object.hasOwn(sections, "interests"), false);
    assert.equal(Object.hasOwn(sections, "health"), false);
    assert.equal(sections.skills[0], translate("ui.activitiesAndSkills"));
    const catalog = profileCatalog().flatMap((group) => group.sections);
    assert.ok(
      catalog
        .find((s) => s.key === "skills")
        .search.includes(translate("ui.sport")),
    );
    assert.ok(
      catalog
        .find((s) => s.key === "medical")
        .search.includes(translate("ui.allergy")),
    );
    const html = profileEditors(person);
    assert.equal((html.match(/data-profile-panel="skills"/g) || []).length, 1);
    assert.equal((html.match(/data-profile-panel="medical"/g) || []).length, 1);
    assert.ok(!/name="(?:hobbies|interests)"/.test(html));
    const cfg = recordConfigs().skills;
    assert.ok(!cfg.groups[0].fields.some(([key]) => key === "level"));
    assert.ok(
      cfg.groups
        .find((group) => group.label === translate("ui.levelAndQualifications"))
        .fields.some(([key]) => key === "level"),
    );
  }
  setLanguage("en");
});

test("unified health and activities remain complete through forms, reports, section visibility and analytical filters", () => {
  const raw = sample();
  const person = raw.people[0];
  person.skillRecords = [{ id: "hobby", category: "hobby", name: "Painting" }];
  person.health = "General health note <b>literal</b>";
  person.healthSourceIds = ["d1"];
  person.medicalRecords = [
    {
      id: "allergy",
      kind: "allergy",
      title: "Pollen",
      from: "2004",
      sourceId: "d1",
    },
  ];
  state.project = validateImport(raw);
  const saved = state.project.people[0];
  const form = new FormData();
  for (const [section, cfg] of Object.entries(recordConfigs()))
    for (const record of saved[cfg.key]) {
      form.append(`${section}-id`, record.id);
      for (const [key] of cfg.fields)
        form.append(`${section}-${key}`, record[key]);
    }
  form.set("health", saved.health);
  form.append("healthSourceIds", "d1");
  const collected = collectProfile(form);
  assert.equal(collected.health, saved.health);
  assert.deepEqual(collected.healthSourceIds, saved.healthSourceIds);
  assert.deepEqual(collected.medicalRecords, saved.medicalRecords);
  assert.deepEqual(collected.skillRecords, saved.skillRecords);
  assert.ok(!Object.hasOwn(collected, "hobbies"));
  assert.ok(!Object.hasOwn(collected, "interests"));
  assert.equal(profileSectionCount(saved, "medical"), 2);
  assert.equal(profileSectionCount({ healthSourceIds: ["d1"] }, "medical"), 1);
  assert.equal(profileSectionCount({ health: "   " }, "medical"), 0);
  const report = renderBiography(personBiography(state.project, saved.id));
  assert.match(report, /General health note &lt;b&gt;literal&lt;\/b&gt;/);
  assert.match(report, /Pollen/);
  assert.match(report, /Painting/);
  assert.equal(
    (report.match(/data-biography-section="medical"/g) || []).length,
    1,
  );
  assert.ok(!/data-biography-section="(?:health|interests)"/.test(report));
  const details = renderPersonDetails(saved, { complete: true });
  assert.match(details, /General health note/);
  assert.match(details, /Pollen/);
  const summaryOnly = { ...saved, medicalRecords: [] };
  const facts = buildPersonFilterFacts(
    { ...state.project, people: [summaryOnly] },
    "2026-10-09",
  );
  assert.ok(facts[0].section.includes("medical"));
  state.project.purpose = "family";
  state.project.scopePreferences.family = ["skills"];
  assert.ok(!Object.hasOwn(scopedPerson(saved), "health"));
  assert.ok(!Object.hasOwn(scopedPerson(saved), "medicalRecords"));
  state.project.scopePreferences.family = ["medical"];
  assert.equal(scopedPerson(saved).health, saved.health);
  assert.deepEqual(scopedPerson(saved).healthSourceIds, saved.healthSourceIds);
  assert.ok(!Object.hasOwn(scopedPerson(saved), "skillRecords"));
});
