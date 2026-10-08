import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { validateImport } from "../src/model/validation.js";
import { kinshipBetween } from "../src/model/kinship.js";
import {
  edgeState,
  isOfficial,
  route,
  requirements,
} from "../src/model/evidence.js";
import {
  duplicateRelationship,
  relationshipConfig,
} from "../src/core/relationships.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";
import { setLanguage } from "../src/i18n/index.js";

test("name history, education and attributed claims survive import and autobiography in all languages", () => {
  const model = sample();
  Object.assign(model.people[0], {
    nameHistory: [
      {
        id: "name1",
        kind: "maiden",
        surname: "Example Doe",
        from: "1990",
        to: "2010",
        reason: "Fictional marriage",
        sourceId: "d3",
      },
    ],
    educationRecords: [
      {
        id: "study1",
        institution: "Example University",
        qualification: "Demo diploma",
        field: "History",
        from: "2000",
        to: "2004",
        status: "completed",
        diplomaNumber: "DEMO-ONLY",
      },
    ],
    claims: [
      {
        id: "claim1",
        kind: "rumor",
        statement: "Unconfirmed fictional report",
        verification: "pending",
        reportedBy: "Fictional witness",
        basis: "hearsay",
        sourceId: "d3",
      },
    ],
  });
  state.project = validateImport(model);
  assert.equal(state.project.people[0].nameHistory[0].kind, "maiden");
  assert.equal(state.project.people[0].claims[0].verification, "pending");
  state.project.people[0].requirements = null;
  assert.ok(
    requirements(state.project.people[0]).some((r) => r.type === "name_change"),
  );
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p1"));
    for (const value of [
      "Example Doe",
      "Example University",
      "Demo diploma",
      "Unconfirmed fictional report",
      "Fictional witness",
    ])
      assert.ok(html.includes(value));
  }
  setLanguage("en");
});

test("social and explicitly unverified links cannot establish kinship or inheritance paths", () => {
  state.project = sample();
  state.project.purpose = "inheritance";
  state.project.subjectId = "p1";
  state.project.claimantId = "p2";
  for (const r of [
    { type: "partner", unionKind: "dating" },
    { type: "parent", verification: "unverified" },
    { type: "spouse", verification: "refuted" },
    { type: "spouse", status: "divorced" },
  ]) {
    state.project.relations = [{ id: "test-link", from: "p1", to: "p2", ...r }];
    assert.equal(kinshipBetween("p1", "p2").found, false);
    assert.equal(route().found, false);
  }
  const r = {
    id: "test-link",
    from: "p1",
    to: "p2",
    type: "parent",
    verification: "unverified",
  };
  state.project.relations = [r];
  state.project.documents = [
    {
      id: "proof",
      type: "birth",
      status: "available",
      evidence: "official",
      people: ["p1", "p2"],
      relations: [r.id],
    },
  ];
  assert.equal(edgeState(r), "review");
  r.verification = "refuted";
  assert.equal(edgeState(r), "conflict");
  r.verification = "confirmed";
  assert.equal(kinshipBetween("p1", "p2").found, true);
});

test("relationship episodes retain dates, reject chronology and exact duplicates", () => {
  const first = {
    id: "episode",
    from: "p1",
    to: "p2",
    type: "partner",
    unionKind: "dating",
    fromDate: "2020",
    toDate: "2021",
    status: "ended",
    duration: "temporary",
    reportedBy: "Fictional witness",
    verification: "unverified",
  };
  assert.equal(duplicateRelationship([first], { ...first, id: "new" }), true);
  assert.equal(
    duplicateRelationship([first], { ...first, from: "p2", to: "p1" }),
    true,
  );
  assert.equal(
    duplicateRelationship([first], {
      ...first,
      fromDate: "2023",
      toDate: "2024",
    }),
    false,
  );
  assert.ok(
    profileRecordError(relationshipConfig(), {
      fromDate: "2024",
      toDate: "2023",
    }),
  );
  const model = sample();
  model.relations.push(first);
  const imported = validateImport(model).relations.at(-1);
  assert.equal(imported.from, "p1");
  assert.equal(imported.to, "p2");
  assert.equal(imported.fromDate, "2020");
  assert.equal(imported.reportedBy, "Fictional witness");
  first.toDate = "2019";
  assert.throws(() => validateImport(model));
});

test("recordings, testimony, rumors and refuted sources cannot become official evidence", () => {
  for (const type of ["recording", "testimony", "rumor"])
    assert.equal(
      isOfficial({
        type,
        status: "available",
        evidence: "official",
        verification: "corroborated",
      }),
      false,
    );
  assert.equal(
    isOfficial({
      type: "birth",
      status: "available",
      evidence: "official",
      verification: "refuted",
    }),
    false,
  );
  const model = sample();
  Object.assign(model.documents[0], {
    type: "recording",
    evidence: "official",
    verification: "corroborated",
    checkedBy: "Fictional reviewer",
    checkedAt: "2026-01-01",
    verificationNotes: "Recording reviewed, claims evaluated separately",
  });
  const imported = validateImport(model).documents[0];
  assert.equal(imported.evidence, "indirect");
  assert.equal(imported.checkedBy, "Fictional reviewer");
});
