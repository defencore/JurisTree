import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { recordConfigs } from "../src/core/config.js";
import {
  collectRelationship,
  duplicateRelationship,
  familyConnection,
  relationshipFields,
} from "../src/core/relationships.js";
import { validateImport } from "../src/model/validation.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { personBiography } from "../src/model/biography.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { collectProjectEvents } from "../src/model/events.js";
import { roleGroup, roleLabel } from "../src/model/relationship-labels.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { collectProfile } from "../src/features/profiles.js";
import { findGraphPaths } from "../src/graph/analysis.js";
import { renderBiography } from "../src/ui/biography.js";
import { setLanguage } from "../src/i18n/index.js";

const sections = [
  "assets",
  "encumbrances",
  "accounts",
  "crypto",
  "companies",
  "sanctions",
  "political",
];

test("business and political records retain precision, zero values, attribution and all fields through collection and import", () => {
  const project = sample();
  const target = project.people.find((p) => p.id === "p10");
  const cfg = recordConfigs();
  for (const section of sections)
    target[cfg[section].key] = structuredClone(
      project.people.flatMap((p) => p[cfg[section].key] || []).slice(0, 1),
    );
  target.companyRecords[0].sharePercent = "0";
  target.accountRecords[0].balance = "-10.50";
  target.assetRecords[0].description = "Reported <script>holding</script>";
  state.project = validateImport(project);
  const profile = state.project.people.find((p) => p.id === "p10");
  const form = new FormData();
  for (const [section, config] of Object.entries(cfg))
    for (const record of profile[config.key]) {
      form.append(section + "-id", record.id);
      for (const [key] of config.fields)
        form.append(section + "-" + key, record[key]);
    }
  const collected = collectProfile(form);
  for (const section of sections)
    assert.deepEqual(collected[cfg[section].key], profile[cfg[section].key]);
  assert.equal(profile.cryptoRecords[0].quantity, "0.125000000000000123");
  assert.equal(profile.accountRecords[0].balance, "-10.50");
  assert.equal(profile.companyRecords[0].sharePercent, "0");
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p10"));
    for (const value of [
      "CA-ON-7718",
      "CV-2022-1047/03",
      "NB-4281706",
      "-10.50",
      "0.125000000000000123",
      "ON-640281",
      "Cedar Civic Alliance",
      "Former business connection to Riley Cross",
      "Riley Cross",
      "Reported &lt;script&gt;holding&lt;/script&gt;",
      ">0<",
    ])
      assert.ok(html.includes(value), `${language}: ${value}`);
    assert.ok(!html.includes("<script>holding"));
  }
  assert.equal(profile.lifeStatus, "living");
  assert.equal(profile.gender, "x");
  setLanguage("en");
});

test("new sections participate in combined search and dated calendar events independently of workspace visibility", () => {
  state.project = validateImport(sample());
  const index = buildSearchIndex(state.project);
  for (const [query, id] of [
    ['name:Jordan "CA-ON-7718" "CV-2022-1047"', "p4"],
    ['name:Jordan "ON-640281" "35" "Cedar Civic Alliance"', "p4"],
    ['name:Jesse "NB-4281706" "4820.75"', "p5"],
    ['name:Robin "Ethereum" "0.125000000000000123"', "p6"],
    ['name:Riley "NS-2025-014"', "p11"],
  ])
    assert.ok(
      searchIndex(index, query).some((r) => r.kind === "person" && r.id === id),
      query,
    );
  const events = collectProjectEvents(state.project);
  for (const [section, type] of [
    ["assets", "asset"],
    ["encumbrances", "encumbrance"],
    ["accounts", "account"],
    ["crypto", "crypto"],
    ["companies", "company"],
    ["sanctions", "sanction"],
    ["political", "political"],
  ]) {
    assert.ok(
      events.some((e) => e.section === section && e.type === type && !e.annual),
      section,
    );
    assert.ok(
      !collectProjectEvents(state.project, { sections: [] }).some(
        (e) => e.section === section,
      ),
    );
  }
  assert.ok(
    events.some(
      (e) =>
        e.section === "companies" && e.title.includes("Willowbank Design Ltd"),
    ),
  );
  assert.ok(
    events.some(
      (e) =>
        e.section === "political" && e.title.includes("Cedar Civic Alliance"),
    ),
  );
  assert.ok(
    events.some(
      (e) =>
        e.relationId === "work-cross-roe" &&
        e.type === "professional" &&
        !e.annual,
    ),
  );
  assert.ok(
    events.some(
      (e) =>
        e.relationId === "sanctions-roe-cross" &&
        e.type === "sanction" &&
        !e.annual,
    ),
  );
  const jordan = state.project.people.find((p) => p.id === "p4");
  assert.ok(jordan.sanctionRecords.every((r) => r.kind !== "designation"));
  assert.equal(jordan.sanctionRecords[0].status, "unspecified");
});

test("business validation bounds shares and amounts, orders dates, rejects unsafe links and cleans missing references", () => {
  const cfg = recordConfigs();
  for (const [section, record] of [
    ["assets", { sharePercent: "100.01" }],
    ["assets", { sharePercent: "-0.01" }],
    ["companies", { sharePercent: "101" }],
    ["companies", { votingPercent: "101" }],
    ["crypto", { quantity: "-1" }],
    ["crypto", { value: "Infinity" }],
    ["encumbrances", { amount: "-1" }],
    ["accounts", { openedAt: "2026-03-01", closedAt: "2025-03-01" }],
    ["sanctions", { listedAt: "2026-01-01", removedAt: "2025-01-01" }],
    ["political", { from: "2026", to: "2025" }],
    ["companies", { website: "javascript:alert(1)" }],
    ["sanctions", { officialUrl: "data:text/html,hi" }],
  ])
    assert.ok(profileRecordError(cfg[section], record), section);
  for (const [section, record] of [
    ["companies", { sharePercent: "0", votingPercent: "100" }],
    ["assets", { sharePercent: "100", value: "0" }],
    ["accounts", { balance: "-250.25" }],
    ["crypto", { quantity: "0.125000000000000123" }],
  ])
    assert.equal(profileRecordError(cfg[section], record), "", section);
  const project = sample();
  for (const section of sections) {
    const config = cfg[section];
    for (const p of project.people)
      for (const r of p[config.key] || []) {
        r.sourceId = "missing-source";
        for (const [key, , type] of config.fields)
          if (type === "person") r[key] = "missing-person";
      }
  }
  const imported = validateImport(project);
  for (const section of sections)
    for (const p of imported.people)
      for (const r of p[cfg[section].key]) {
        assert.equal(r.sourceId, "");
        for (const [key, , type] of cfg[section].fields)
          if (type === "person") assert.equal(r[key], "");
      }
  const invalid = sample();
  invalid.people.find((p) => p.id === "p4").companyRecords[0].sharePercent =
    "101";
  assert.throws(() => validateImport(invalid));
});

test("professional episodes preserve directed hierarchy and never establish ancestry or inherit marital metadata", () => {
  const project = sample();
  const reporting = project.relations.find((r) => r.id === "work-cross-roe");
  state.project = validateImport(project);
  assert.equal(roleLabel(reporting, "p11"), "Manager / supervisor");
  assert.equal(roleLabel(reporting, "p4"), "Subordinate");
  for (const type of ["professional", "reports_to", "sanctions_link"]) {
    const r = { ...reporting, type, verification: "confirmed" };
    assert.equal(familyConnection(r), false);
    assert.equal(roleGroup(r, r.from), "professional");
    const fields = relationshipFields(type).groups.flatMap((g) => g.fields);
    assert.ok(fields.some(([key]) => key === "organization"));
    assert.ok(!fields.some(([key]) => key === "unionKind"));
    assert.ok(
      !Object.hasOwn(fields.find(([key]) => key === "status")[3], "divorced"),
    );
    assert.equal(duplicateRelationship([r], r), true);
    assert.equal(
      duplicateRelationship([r], { ...r, from: r.to, to: r.from }),
      type !== "reports_to",
    );
    assert.equal(
      duplicateRelationship([r], {
        ...r,
        organization: "Another organization",
      }),
      false,
    );
  }
  const form = new FormData();
  form.set("type", "parent");
  form.set("relationship-organization", "Discarded work context");
  form.set("relationship-formality", "formal");
  const collected = collectRelationship(form);
  assert.equal(collected.organization, "");
  assert.equal(collected.formality, "unspecified");
  const parentFields = relationshipFields("parent").groups;
  assert.ok(parentFields.every((g) => g.fields.length));
  assert.ok(
    !parentFields
      .flatMap((g) => g.fields)
      .some(([key]) => key === "organization"),
  );
  const invalid = sample();
  invalid.relations.find((r) => r.type === "parent").organization =
    "Invalid parent metadata";
  assert.throws(() => validateImport(invalid));
  const invalidStatus = sample();
  invalidStatus.relations.find((r) => r.type === "reports_to").status =
    "divorced";
  assert.throws(() => validateImport(invalidStatus));
  state.project.people = state.project.people.filter((p) =>
    ["p4", "p11"].includes(p.id),
  );
  state.project.relations = [{ ...reporting, verification: "confirmed" }];
  assert.equal(kinshipBetween("p4", "p11", false).found, false);
  const opts = { scope: "all", types: ["reports_to"], direction: "down" };
  assert.equal(findGraphPaths("p11", "p4", opts).paths.length, 1);
  assert.equal(findGraphPaths("p4", "p11", opts).paths.length, 0);
  assert.equal(
    findGraphPaths("p4", "p11", { ...opts, direction: "up" }).paths.length,
    1,
  );
});
