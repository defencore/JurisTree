import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { recordConfigs } from "../src/core/config.js";
import { sample } from "../src/data/demo.js";
import { setLanguage } from "../src/i18n/index.js";
import {
  monthBounds,
  monthOccurrences,
  shiftMonth,
} from "../src/model/calendar.js";
import { collectProjectEvents } from "../src/model/events.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { validateImport } from "../src/model/validation.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";
import { clampWindow } from "../src/ui/floating-windows.js";
import { collectProfile } from "../src/features/profiles.js";

test("calendar handles Monday weeks, leap days, year boundaries and milestone anniversaries", () => {
  assert.deepEqual(monthBounds("2024-02"), {
    first: "2024-02-01",
    last: "2024-02-29",
    days: 29,
    weekday: 3,
  });
  assert.equal(monthBounds("2026-02").days, 28);
  assert.equal(monthBounds("2026-06").weekday, 0);
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("0001-01", -1), "0001-01");
  assert.throws(() => monthBounds("2026-13"));
  const events = [
    { id: "leap", date: "2000-02-29", annual: true, type: "birth" },
    { id: "partial", date: "2000", annual: true },
    { id: "future", date: "2030-02-10", annual: true },
    { id: "one-time", date: "2025-02-11", annual: false },
  ];
  const occurrences = monthOccurrences(events, "2025-02");
  assert.deepEqual(
    occurrences.map((e) => e.id),
    ["one-time", "leap"],
  );
  assert.equal(occurrences[1].next.date, "2025-02-28");
  assert.equal(occurrences[1].next.adjusted, true);
  assert.equal(occurrences[1].next.years, 25);
  assert.equal(occurrences[1].jubilee, true);
  assert.equal(monthOccurrences(events, "2026-02")[0].jubilee, false);
  assert.equal(monthOccurrences(events, "2024-02")[0].next.date, "2024-02-29");
});

test("calendar includes hidden profile dates and distinguishes current and ended relationship anniversaries", () => {
  setLanguage("en");
  const project = sample();
  const all = collectProjectEvents(project);
  assert.ok(
    all.some((e) => e.type === "legal" && e.verification === "pending"),
  );
  assert.ok(all.some((e) => e.type === "finance" && e.date === "2026-11-01"));
  assert.ok(all.some((e) => e.type === "education" && e.date === "2011-06-30"));
  assert.ok(
    !collectProjectEvents(project, { sections: [] }).some(
      (e) => e.type === "finance",
    ),
  );
  assert.equal(all.find((e) => e.relationId === "r4").annual, true);
  assert.equal(all.find((e) => e.relationId === "r13").annual, false);
  assert.equal(all.find((e) => e.relationId === "r16").annual, false);
  assert.equal(all.find((e) => e.id === "r13:end").date, "2000-05-10");
  assert.equal(all.find((e) => e.id === "r13:end").annual, false);
  const birthdays = monthOccurrences(all, "2027-10").filter(
    (e) => e.type === "birth",
  );
  const robin = birthdays.find((event) => event.personId === "p6");
  assert.equal(robin.next.years, 35);
  assert.equal(robin.jubilee, true);
  assert.ok(
    !collectProjectEvents(project, { groupId: "g1" }).some(
      (e) => e.personId === "p11",
    ),
  );
});

test("legal, financial, employment and identity history records survive forms, import and every autobiography language", () => {
  const project = sample();
  project.people[4].financialRecords[0].amount = "0";
  state.project = validateImport(project);
  for (const id of ["p4", "p5", "p10", "p11"]) {
    const p = state.project.people.find((p) => p.id === id);
    const form = new FormData();
    for (const [section, cfg] of Object.entries(recordConfigs()))
      for (const record of p[cfg.key]) {
        form.append(section + "-id", record.id);
        for (const [key] of cfg.fields)
          form.append(section + "-" + key, record[key]);
      }
    const collected = collectProfile(form);
    for (const key of [
      "legalRecords",
      "financialRecords",
      "occupations",
      "identityHistory",
    ])
      assert.deepEqual(collected[key], p[key]);
  }
  assert.equal(state.project.people[4].favorite, true);
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p5"));
    assert.ok(html.includes("Riley Cross"));
    assert.ok(html.includes("Northbank Credit Union"));
    assert.ok(html.includes(">0<"));
    const identity = renderBiography(personBiography(state.project, "p10"));
    assert.ok(identity.includes("Pansexual"));
    assert.ok(identity.includes("Northbridge Health Centre"));
  }
  setLanguage("en");
  const configs = recordConfigs();
  assert.ok(profileRecordError(configs.legal, { from: "2026", to: "2025" }));
  assert.ok(profileRecordError(configs.finances, { amount: "Infinity" }));
  assert.ok(
    profileRecordError(configs.identityHistory, { date: "2026-02-30" }),
  );
  const invalid = sample();
  invalid.people[4].financialRecords[0].counterpartyId = "missing-person";
  assert.equal(
    validateImport(invalid).people[4].financialRecords[0].counterpartyId,
    "",
  );
});

test("demo separates biological, adoptive and step relationships and records changed surnames", () => {
  state.project = sample();
  assert.equal(kinshipBetween("p5", "p8", false).kind, "half_sibling");
  assert.equal(kinshipBetween("p5", "p6", false).adopted, true);
  assert.equal(kinshipBetween("p5", "p4", false).found, false);
  assert.equal(kinshipBetween("p5", "p4", false).kind, "step_parent");
  const parents = (id) =>
    state.project.relations
      .filter((r) => r.to === id && r.type === "parent")
      .map((r) => r.from);
  assert.deepEqual(parents("p5"), ["p3", "p7"]);
  assert.deepEqual(parents("p6"), ["p12"]);
  assert.ok(
    state.project.people
      .find((p) => p.id === "p3")
      .nameHistory.some((r) => r.fullName === "Jamie Doe"),
  );
  assert.ok(
    state.project.people
      .find((p) => p.id === "p8")
      .nameHistory.some((r) => r.fullName === "Casey Ward"),
  );
  for (const p of state.project.people)
    for (const cfg of Object.values(recordConfigs()))
      for (const r of p[cfg.key] || [])
        for (const [key, , type, options] of cfg.fields)
          if (type === "select" && r[key])
            assert.ok(
              Object.hasOwn(options, r[key]),
              p.id + ":" + key + "=" + r[key],
            );
});

test("floating windows clamp all edges to keep their headers accessible", () => {
  assert.deepEqual(
    clampWindow(
      { x: -40, y: 1000 },
      { width: 400, height: 300 },
      { width: 1000, height: 800 },
    ),
    { x: 8, y: 492 },
  );
  assert.deepEqual(
    clampWindow(
      { x: 900, y: -20 },
      { width: 300, height: 200 },
      { width: 390, height: 844 },
    ),
    { x: 82, y: 8 },
  );
});
