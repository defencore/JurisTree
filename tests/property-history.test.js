import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { validateImport } from "../src/model/validation.js";
import {
  propertyPeriod,
  propertySnapshot,
  propertyClaimOpen,
  analyzeProperty,
} from "../src/model/property-history.js";
import {
  propertyPeople,
  propertyRecords,
  propertyRecordError,
  unlinkPropertyReference,
} from "../src/model/property-records.js";
import { propertyRecordConfigs } from "../src/core/property-records.js";
import { linkedDocs } from "../src/model/evidence.js";
import { withProjectIndex } from "../src/model/project.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";
import { collectProjectEvents } from "../src/model/events.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { collectPropertyRecord } from "../src/ui/forms/property-record.js";
import { setLanguage } from "../src/i18n/index.js";

function fixture() {
  state.project = validateImport(sample());
  return [
    state.project,
    state.project.property.find((a) => a.id === "doe-riverside-land"),
  ];
}
const holders = (asset, date) =>
  propertySnapshot(asset, date).ownership.map(({ record }) => [
    record.personId,
    record.sharePercent,
  ]);

test("property snapshots follow brothers, widow and gifted shares without treating plans or family links as ownership", () => {
  const [project, land] = fixture();
  const before = JSON.stringify(project);
  assert.deepEqual(holders(land, "1920-01-01"), [
    ["henry", "50"],
    ["charles", "50"],
  ]);
  assert.deepEqual(holders(land, "1932-07-01"), [["alice", "100"]]);
  assert.deepEqual(holders(land, "1933-01-01"), [
    ["edward", "50"],
    ["florence", "50"],
  ]);
  assert.equal(
    propertySnapshot(land, "1933-01-01").claims[0].personId,
    "albert",
  );
  assert.equal(propertySnapshot(land, "2026-10-09").claims.length, 2);
  assert.equal(propertySnapshot(land, "2026-10-09").ownership.length, 0);
  const house = project.property.find((a) => a.id === "demo-house");
  assert.deepEqual(holders(house, "2026-10-09"), [["p4", "100"]]);
  assert.equal(
    propertySnapshot(house, "2026-10-09").use[0].record.personId,
    "p6",
  );
  assert.equal(JSON.stringify(project), before);
});

test("year boundaries, missing dates, unresolved claims and refuted observations stay conservative", () => {
  assert.equal(
    propertyPeriod({ from: "1932", to: "1934", status: "ended" }, "1932-07-01"),
    "uncertain",
  );
  assert.equal(
    propertyPeriod({ from: "1932", to: "1934", status: "ended" }, "1933-07-01"),
    "active",
  );
  assert.equal(
    propertyPeriod({ from: "1932", to: "1934", status: "ended" }, "1934-07-01"),
    "uncertain",
  );
  assert.equal(
    propertyPeriod({ from: "1932", to: "1934", status: "ended" }, "1935-01-01"),
    "ended",
  );
  assert.equal(
    propertyPeriod({ from: "1932-01-01", status: "unspecified" }, "1933-01-01"),
    "uncertain",
  );
  assert.equal(
    propertyPeriod(
      { from: "1932-01-01", status: "current", verification: "refuted" },
      "1933-01-01",
    ),
    "excluded",
  );
  assert.equal(
    propertyPeriod({ from: "2030-01-01", status: "current" }, "2026-10-09"),
    "future",
  );
  const claim = {
    status: "recognized",
    date: "1932-08-01",
    resolvedAt: "1933-01-01",
  };
  assert.equal(propertyClaimOpen(claim, "1932-09-01"), true);
  assert.equal(propertyClaimOpen(claim, "1933-01-01"), false);
  assert.equal(
    propertyClaimOpen({ ...claim, resolvedAt: "1933" }, "1933-07-01"),
    true,
  );
  assert.equal(
    propertyClaimOpen({ ...claim, status: "disputed" }, "1933-01-02"),
    false,
  );
});

test("review locates conflicting shares, missing transfer rights and evidence without declaring transactions invalid", () => {
  const [project, land] = fixture();
  land.rights.push({
    id: "overlap",
    personId: "albert",
    kind: "ownership",
    from: "1932-06-01",
    to: "1933-12-31",
    sharePercent: "50",
    verification: "pending",
  });
  land.transfers.push({
    id: "unfounded",
    fromId: "nathan",
    toId: "p5",
    kind: "sale",
    rightKind: "ownership",
    sharePercent: "75",
    date: "1932-07-01",
    signedAt: "1932-07-01",
    verification: "pending",
  });
  const issues = analyzeProperty(land, project, "1932-09-01").issues;
  for (const code of [
    "propertyOverlappingShares",
    "propertyOutstandingClaims",
    "propertyRecordNeedsReview",
    "propertyMissingEvidence",
    "propertyTransferorRightMissing",
    "propertyRecipientRightMissing",
  ])
    assert.ok(
      issues.some((issue) => issue.code === code),
      code,
    );
  land.transfers.at(-1).fromId = "henry";
  assert.ok(
    analyzeProperty(land, project, "1933-01-01").issues.some(
      (i) => i.code === "propertyContractAfterDeath" && i.id === "unfounded",
    ),
  );
  assert.ok(
    !analyzeProperty(land, project, "1933-01-01").issues.some(
      (i) => i.code === "propertyContractAfterDeath" && i.id === "estate-alice",
    ),
  );
  land.transfers.at(-1).fromId = "edward";
  land.transfers.at(-1).date = "1933-01-01";
  assert.ok(
    analyzeProperty(land, project, "1933-01-02").issues.some(
      (i) => i.code === "propertyTransferredShareMismatch",
    ),
  );
});

test("property forms and archive retain all fields, external parties, unknown shares, zero payments and currency precision", () => {
  const [project, land] = fixture();
  for (const [kind, cfg] of Object.entries(propertyRecordConfigs())) {
    const row = land[kind][0];
    row.reference = "LT/417/2";
    row.authority = "Property register";
    row.documentUrl = "https://example.org/register/417";
    row.notes = "Literal <script>content</script>";
    row.recordedAt = "2026-10-09";
    if (kind === "transfers") {
      row.amount = "0";
      row.currency = "cad";
    }
    const form = new FormData();
    for (const [key] of cfg.fields) form.set("estate-" + key, row[key] || "");
    const collected = collectPropertyRecord(form, kind);
    assert.equal(propertyRecordError(kind, collected), "");
    assert.equal(collected.reference, row.reference);
    if (kind === "transfers") assert.equal(collected.currency, "CAD");
    Object.assign(row, collected);
  }
  const restored = validateImport(JSON.parse(JSON.stringify(project)));
  const result = restored.property.find((a) => a.id === land.id);
  assert.deepEqual(result, land);
  assert.equal(restored.property[0].currency, "CAD");
  assert.equal(result.transfers[0].amount, "0");
  assert.equal(
    result.transfers[0].fromExternal,
    "Brookfield Agricultural Trust",
  );
  assert.equal(result.claims[1].sharePercent, "");
});

test("invalid parties, percentages, dates, URLs, enum values and duplicate ledger IDs are rejected", () => {
  const [project, land] = fixture();
  const row = land.rights[0];
  for (const changes of [
    { externalPerson: "Duplicate party" },
    { personId: "" },
    { sharePercent: "101" },
    { sharePercent: "0" },
    { to: "1901" },
    { documentUrl: "javascript:alert(1)" },
  ])
    assert.ok(propertyRecordError("rights", { ...row, ...changes }));
  assert.ok(
    propertyRecordError("transfers", {
      ...land.transfers[0],
      fromId: "henry",
      fromExternal: "",
    }),
  );
  assert.ok(
    propertyRecordError("transfers", { ...land.transfers[0], currency: "" }),
  );
  land.rights.push({ ...row });
  assert.throws(() => validateImport(project));
  land.rights.pop();
  row.kind = "invented";
  assert.throws(() => validateImport(project));
});

test("ledger-only sources resolve consistently in both evidence paths and survive complete biographies and multilingual search", () => {
  const [project, land] = fixture();
  const doc = project.documents.find((d) => d.id === "land-claim");
  doc.propertyIds = [];
  doc.people = [];
  assert.ok(linkedDocs("property", land.id).some((d) => d.id === doc.id));
  withProjectIndex(() =>
    assert.ok(linkedDocs("property", land.id).some((d) => d.id === doc.id)),
  );
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const biography = personBiography(project, "albert");
    assert.ok(biography.property.includes(land));
    assert.ok(biography.documents.includes(doc));
    const html = renderBiography(biography);
    assert.ok(html.includes("Riverside agricultural parcel"));
    assert.ok(html.includes("Charles Doe"));
    assert.ok(
      html.includes("Charles Doe&#39;s estate papers") ||
        html.includes("Charles Doe's estate papers"),
    );
    const matches = searchIndex(
      buildSearchIndex(project),
      'type:property "Albert Doe" "BR-LOT-417"',
    );
    assert.equal(matches[0].id, land.id);
  }
  setLanguage("en");
});

test("deleting people and sources preserves historical party names and grounds rather than dropping the chain", () => {
  const [project, land] = fixture();
  unlinkPropertyReference(land, "person", "charles", "Charles Doe");
  assert.equal(
    land.rights.find((r) => r.id.startsWith("land-right-charles"))
      .externalPerson,
    "Charles Doe",
  );
  assert.equal(land.claims[0].throughPersonId, "");
  assert.match(land.claims[0].notes, /Charles Doe/);
  unlinkPropertyReference(land, "source", "land-claim");
  assert.equal(land.claims[0].sourceId, "");
  project.people = project.people.filter((p) => p.id !== "charles");
  project.relations = project.relations.filter(
    (r) => r.from !== "charles" && r.to !== "charles",
  );
  const restored = validateImport(project).property.find(
    (a) => a.id === land.id,
  );
  assert.equal(propertyRecords(restored).length, propertyRecords(land).length);
  assert.ok(!propertyPeople(restored).has("charles"));
});

test("property dates use financial one-time chronology and respect participant group filtering", () => {
  const [project] = fixture();
  const events = collectProjectEvents(project).filter(
    (e) => e.propertyId === "doe-riverside-land",
  );
  assert.ok(events.length > 10);
  assert.ok(events.every((e) => e.type === "asset" && !e.annual));
  assert.ok(events.some((e) => e.propertyRecordId === "albert-land-objection"));
  assert.ok(
    collectProjectEvents(project, { groupId: "fifth-cousins" }).some(
      (e) => e.propertyRecordId === "albert-land-objection",
    ),
  );
  assert.ok(
    !collectProjectEvents(project, { groupId: "g1" }).some(
      (e) => e.propertyId === "doe-riverside-land",
    ),
  );
});
