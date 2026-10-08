import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { recordConfigs } from "../src/core/config.js";
import { familyConnection } from "../src/core/relationships.js";
import { validateImport } from "../src/model/validation.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { personBiography } from "../src/model/biography.js";
import { contactHref } from "../src/model/contacts.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { collectProjectEvents } from "../src/model/events.js";
import { collectProfile } from "../src/features/profiles.js";
import { renderBiography } from "../src/ui/biography.js";
import { setLanguage } from "../src/i18n/index.js";

test("life history survives forms and import, preserves attribution and appears in every autobiography language", () => {
  const project = sample();
  const p = project.people.find((person) => person.id === "p5");
  p.pregnancyRecords[0].circumstances = "Reported <script>observation</script>";
  p.pregnancyRecords[0].gestationWeeks = "0";
  p.militaryRecords = structuredClone(
    project.people.find((person) => person.id === "p4").militaryRecords,
  );
  p.deathRecords = [
    {
      id: "conflicting-report",
      date: "2025-01-01",
      category: "undetermined",
      circumstances: "Disputed account",
      verification: "refuted",
      sourceId: "d9",
    },
  ];
  state.project = validateImport(project);
  const profile = state.project.people.find((person) => person.id === "p5");
  const form = new FormData();
  for (const [section, cfg] of Object.entries(recordConfigs()))
    for (const r of profile[cfg.key]) {
      form.append(section + "-id", r.id);
      for (const [key] of cfg.fields)
        form.append(section + "-" + key, r[key] ?? "");
    }
  const collected = collectProfile(form);
  for (const cfg of Object.values(recordConfigs()))
    assert.deepEqual(collected[cfg.key], profile[cfg.key]);
  assert.equal(profile.pregnancyRecords[0].gestationWeeks, "0");
  assert.equal(profile.death, "");
  assert.equal(profile.lifeStatus, "living");
  assert.equal(profile.gender, "f");
  assert.deepEqual(state.project.relations, validateImport(sample()).relations);
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p5"));
    for (const value of [
      "MR-790184",
      "SR-601728",
      "AW/1982/117",
      "Service Merit Medal",
      "Disputed account",
      "jesse.ward@family.invalid",
      "https://social.invalid/jesse.ward",
      "Reported &lt;script&gt;observation&lt;/script&gt;",
    ])
      assert.ok(html.includes(value), `${language}: ${value}`);
    assert.ok(!html.includes("<script>observation"));
  }
  setLanguage("en");
});

test("witness accounts resolve in both biographies, search and calendar while affairs remain outside kinship", () => {
  state.project = validateImport(sample());
  const witness = personBiography(state.project, "p11");
  assert.equal(witness.testimony[0].personId, "p4");
  assert.equal(witness.testimony[0].record.verification, "pending");
  assert.ok(witness.documents.some((d) => d.id === "interview-cross"));
  assert.ok(
    renderBiography(witness).includes("Meeting at the Willowbank summer fair"),
  );
  const index = buildSearchIndex(state.project);
  assert.ok(
    searchIndex(index, 'name:Riley "Willowbank summer fair"').some(
      (r) => r.kind === "person" && r.id === "p11",
    ),
  );
  assert.ok(
    searchIndex(index, 'name:Jordan "MR-790184"').some((r) => r.id === "p4"),
  );
  const events = collectProjectEvents(state.project);
  for (const [section, date] of [
    ["military", "1982-11-11"],
    ["witnesses", "2001-06-16"],
    ["pregnancy", "2018-05-21"],
    ["death", "2011-11-09"],
  ])
    assert.ok(
      events.some((e) => e.section === section && e.date === date && !e.annual),
      section,
    );
  assert.equal(
    familyConnection({
      type: "partner",
      unionKind: "affair",
      verification: "confirmed",
    }),
    false,
  );
  const withoutWitness = structuredClone(state.project);
  withoutWitness.people = withoutWitness.people.filter((p) => p.id !== "p11");
  withoutWitness.relations = withoutWitness.relations.filter(
    (r) => r.from !== "p11" && r.to !== "p11",
  );
  const imported = validateImport(withoutWitness);
  assert.equal(
    imported.people.find((p) => p.id === "p4").witnessRecords[0].witnessId,
    "",
  );
});

test("pregnancy, death, military and contact validation reject inconsistent dates and active URLs", () => {
  const cfg = recordConfigs();
  for (const [section, record] of [
    ["pregnancy", { outcome: "ongoing", to: "2026-01-01" }],
    ["pregnancy", { from: "2026-02-01", to: "2026-01-01" }],
    ["pregnancy", { from: "2026-02-01", expectedDate: "2026-01-01" }],
    ["pregnancy", { fetuses: "0" }],
    ["death", { date: "2026-02-01", burialDate: "2026-01-01" }],
    ["military", { from: "2026-02-01", dischargeDate: "2026-01-01" }],
    ["witnesses", { eventDate: "2025-02-29" }],
    ["contacts", { url: "javascript:alert(1)" }],
    ["contacts", { url: "data:text/html,hi" }],
  ])
    assert.ok(profileRecordError(cfg[section], record), section);
  assert.equal(
    profileRecordError(cfg.pregnancy, {
      outcome: "ongoing",
      expectedDate: "2027-02-28",
      gestationWeeks: "0",
    }),
    "",
  );
  assert.equal(
    contactHref({ type: "email", value: "jesse@family.invalid" }),
    "mailto:jesse@family.invalid",
  );
  assert.equal(
    contactHref({ type: "phone", value: "+1 (202) 555-0146" }),
    "tel:+12025550146",
  );
  assert.equal(
    contactHref({
      type: "social",
      value: "@jesse",
      url: "https://social.invalid/jesse",
    }),
    "https://social.invalid/jesse",
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "file:///etc/passwd",
  ])
    assert.equal(contactHref({ type: "social", value }), "");
  const project = sample();
  project.people[0].contacts = [
    { id: "unsafe", type: "social", url: "javascript:alert(1)" },
  ];
  assert.throws(() => validateImport(project));
});
