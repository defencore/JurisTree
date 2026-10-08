import test from "node:test";
import assert from "node:assert/strict";
import { personStatus } from "../src/model/person-status.js";
import { sample } from "../src/data/demo.js";
import { validateImport } from "../src/model/validation.js";
import {
  recordConfigs,
  PERSON_CARD_WIDTH,
  PERSON_CARD_HEIGHT,
} from "../src/core/config.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { state } from "../src/core/state.js";
import { setLanguage } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";
import { collectProjectEvents } from "../src/model/events.js";
import { collectProfile } from "../src/features/profiles.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { familyLayout } from "../src/graph/layouts/family.js";

test("life and age markers preserve unknowns and cross the 18th birthday precisely", () => {
  assert.equal(personStatus({ birth: "2010" }, "2026-10-09").life, "unknown");
  assert.equal(personStatus({ lifeStatus: "living" }, "2026-10-09").age, null);
  const p = { birth: "2008-10-10", lifeStatus: "living" };
  assert.equal(personStatus(p, "2026-10-09").minor, true);
  assert.equal(personStatus(p, "2026-10-10").minor, false);
  assert.deepEqual(personStatus(p, "2026-10-10").age, { min: 18, max: 18 });
  assert.equal(
    personStatus({ birth: "2008" }, "2026-10-09").uncertainAge,
    true,
  );
  assert.equal(personStatus({ birth: "2008" }, "2026-10-09").minor, false);
  assert.equal(personStatus({ birth: "2009" }, "2026-10-09").minor, true);
  assert.equal(personStatus({ birth: "2027" }, "2026-10-09").age, null);
  const died = personStatus(
    { birth: "2015-01-01", death: "2020-01-01", lifeStatus: "living" },
    "2026-10-09",
  );
  assert.equal(died.life, "deceased");
  assert.equal(died.minor, false);
  assert.deepEqual(died.age, { min: 5, max: 5 });
  assert.equal(personStatus({ birth: "2008-02-29" }, "2026-02-27").minor, true);
  assert.equal(
    personStatus({ birth: "2008-02-29" }, "2026-02-28").minor,
    false,
  );
});

test("country residence periods survive collection, validation, all biographies, search and calendar", () => {
  state.project = validateImport(sample());
  const p = state.project.people.find((p) => p.id === "p6");
  const config = recordConfigs().residences;
  const form = new FormData();
  for (const r of p.residences) {
    form.append("residences-id", r.id);
    for (const [key] of config.fields)
      form.append("residences-" + key, r[key] || "");
  }
  assert.deepEqual(collectProfile(form).residences, p.residences);
  assert.ok(profileRecordError(config, { from: "2020", to: "2010" }));
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p6"));
    for (const value of [
      "Sample Republic",
      "Sample City",
      "2012",
      "2014",
      "Example Street 12",
    ])
      assert.ok(html.includes(value), value);
    assert.ok(
      searchIndex(
        buildSearchIndex(state.project),
        'name:Robin country:"Sample Republic" 2012',
      ).some((e) => e.id === "p6"),
    );
    const events = collectProjectEvents(state.project).filter(
      (e) => e.personId === "p6" && e.type === "residence",
    );
    assert.ok(events.some((e) => e.date === "2012-09-01"));
    assert.ok(events.some((e) => e.date === "2014-06-30"));
  }
  setLanguage("en");
  const older = sample();
  older.people[0].residences = [
    {
      id: "old-address",
      address: "Example old address",
      from: "1950",
      to: "1952",
    },
  ];
  assert.equal(
    validateImport(older).people[0].residences[0].address,
    "Example old address",
  );
});

test("adopted children retain independent biological parents and layout separates all cards and sources", () => {
  const model = validateImport(sample());
  assert.equal(
    model.relations.filter((r) => r.to === "p6" && r.type === "adopted").length,
    2,
  );
  assert.equal(
    model.relations.filter((r) => r.to === "p6" && r.type === "parent").length,
    1,
  );
  model.relations.push({
    id: "additional-bio-parent",
    from: "p7",
    to: "p6",
    type: "parent",
  });
  const imported = validateImport(model);
  assert.equal(
    imported.relations.filter((r) => r.to === "p6" && r.type === "adopted")
      .length,
    2,
  );
  assert.equal(
    imported.relations.filter((r) => r.to === "p6" && r.type === "parent")
      .length,
    2,
  );
  const layout = familyLayout(imported),
    positions = [...layout.people.values()];
  for (let i = 0; i < positions.length; i++)
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i],
        b = positions[j];
      assert.ok(
        Math.abs(a.x - b.x) >= PERSON_CARD_WIDTH + 20 ||
          Math.abs(a.y - b.y) >= PERSON_CARD_HEIGHT + 30,
      );
    }
  const bottom = Math.max(...positions.map((p) => p.y + PERSON_CARD_HEIGHT));
  assert.ok([...layout.documents.values()].every((p) => p.y >= bottom + 80));
});
