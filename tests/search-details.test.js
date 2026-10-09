import test from "node:test";
import assert from "node:assert/strict";
import { sample } from "../src/data/demo.js";
import { state } from "../src/core/state.js";
import { recordConfigs } from "../src/core/config.js";
import { setLanguage } from "../src/i18n/index.js";
import {
  buildSearchIndex,
  normalizeSearch,
  parseSearchQuery,
  searchIndex,
} from "../src/model/search.js";
import { validateImport } from "../src/model/validation.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { collectProfile } from "../src/model/profile-form.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";
import { collectProjectEvents } from "../src/model/events.js";
import { yearOccurrences } from "../src/model/calendar.js";

const personIds = (index, query) =>
  searchIndex(index, query)
    .filter((e) => e.kind === "person")
    .map((e) => e.id);

test("global search combines hidden values, exact gender filters, multilingual aliases, quoted phrases and alternatives", () => {
  state.project = validateImport(sample());
  state.project.scopePreferences[state.project.purpose] = [];
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const index = buildSearchIndex(state.project);
    assert.deepEqual(personIds(index, "name:Robin gender:male Guitar"), ["p6"]);
    assert.deepEqual(
      personIds(
        index,
        'прізвище:Avery країна:"United Kingdom" стать:небінарна',
      ),
      ["p10"],
    );
    assert.deepEqual(personIds(index, 'имя:Jesse пол:женский "green" 62,5'), [
      "p5",
    ]);
    assert.deepEqual(
      personIds(index, "name:Robin -Guitar | name:Jesse allergy"),
      ["p5"],
    );
    assert.ok(!personIds(index, "gender:male").includes("p5"));
    assert.ok(!personIds(index, "male").includes("p5"));
    assert.ok(
      personIds(index, "gender:female document:PA7314062").includes("p5"),
    );
    assert.ok(personIds(index, "name:Robin єдиноборств").includes("p6"));
    assert.deepEqual(searchIndex(index, " "), []);
    assert.ok(
      searchIndex(index, "type:document").some((e) => e.kind === "document"),
    );
    assert.ok(
      searchIndex(index, "hostile business").some(
        (e) => e.kind === "relation" && e.id === "r17",
      ),
    );
  }
  assert.equal(normalizeSearch("Élodie 62,5 Ім’я"), "elodie 62.5 ім'я");
  assert.deepEqual(
    parseSearchQuery(
      'name:"Jane Doe" -country:Exampleland | gender:female',
    ).map((g) => g.length),
    [2, 1],
  );
  setLanguage("en");
});

test("extended appearance, health, skills, weapons, travel and citizenship retain every field through forms and import", () => {
  state.project = validateImport(sample());
  const keys = [
    "appearanceRecords",
    "medicalRecords",
    "skillRecords",
    "weaponRecords",
    "travelRecords",
    "immigrationRecords",
  ];
  for (const p of state.project.people) {
    const form = new FormData();
    for (const [section, cfg] of Object.entries(recordConfigs()))
      for (const r of p[cfg.key]) {
        form.append(section + "-id", r.id);
        for (const [key] of cfg.fields)
          form.append(section + "-" + key, r[key]);
      }
    const collected = collectProfile(form);
    for (const key of keys) assert.deepEqual(collected[key], p[key]);
  }
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const jesse = renderBiography(personBiography(state.project, "p5"));
    for (const value of ["62.5", "168", "Peanut", "Portugal", "600"])
      assert.ok(jesse.includes(value), value);
    const robin = renderBiography(personBiography(state.project, "p6"));
    for (const value of ["Guitar", "Judo", "Aster AR-12", "AG28471"])
      assert.ok(robin.includes(value), value);
  }
  setLanguage("en");
  const cfg = recordConfigs();
  assert.ok(profileRecordError(cfg.appearance, { heightCm: "-1" }));
  assert.equal(profileRecordError(cfg.appearance, { weightKg: "0" }), "");
  assert.ok(
    profileRecordError(cfg.travel, {
      departureDate: "2026-10-10",
      exitDate: "2026-10-09",
    }),
  );
  assert.ok(
    profileRecordError(cfg.travel, {
      entryDate: "2026-10-10",
      returnDate: "2026-10-09",
    }),
  );
  assert.ok(
    profileRecordError(cfg.weapons, {
      acquiredDate: "2026-10-10",
      disposedDate: "2026-10-09",
    }),
  );
  const invalid = sample();
  invalid.people[4].appearanceRecords[0].weightKg = "-2";
  assert.throws(() => validateImport(invalid));
});

test("year calendar collects registry dates, preserves one-time trips and handles leap days without future anniversaries", () => {
  const project = sample();
  const all = collectProjectEvents(project);
  for (const type of ["travel", "medical", "immigration", "weapon", "skill"])
    assert.ok(
      all.some((e) => e.type === type),
      type,
    );
  assert.ok(
    yearOccurrences(all, "2026").some(
      (e) => e.type === "travel" && e.next.date === "2026-10-11",
    ),
  );
  assert.ok(!yearOccurrences(all, "2027").some((e) => e.type === "travel"));
  const events = [
    { id: "leap", date: "2000-02-29", annual: true, type: "birth" },
    { id: "future", date: "2030-01-01", annual: true, type: "birth" },
    { id: "end", date: "2025-12-31", annual: false },
    { id: "start", date: "2025-01-01", annual: false },
  ];
  const result = yearOccurrences(events, "2025");
  assert.deepEqual(
    result.map((e) => e.id),
    ["start", "leap", "end"],
  );
  assert.equal(result[1].next.date, "2025-02-28");
  assert.equal(result[1].jubilee, true);
  assert.equal(yearOccurrences(events, "2024")[0].next.date, "2024-02-29");
  assert.throws(() => yearOccurrences(events, "0000"));
});
