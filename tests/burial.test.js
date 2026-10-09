import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { recordConfigs } from "../src/core/config.js";
import { sample } from "../src/data/demo.js";
import { setLanguage } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { collectProjectEvents } from "../src/model/events.js";
import { collectProfile } from "../src/model/profile-form.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { validateImport } from "../src/model/validation.js";
import { renderBiography } from "../src/ui/biography.js";

test("burial details survive forms and import and appear in search, biographies and one-time history", () => {
  setLanguage("en");
  const project = sample(),
    p = project.people.find((p) => p.id === "p1");
  const burial = {
    burialCountry: "Canada",
    burialCity: "Brookfield",
    burialPlace: "West gate, beside the stone wall",
    burialCemetery: "Maplewood Memorial Park",
    burialPlot: "F-14",
    burialGrave: "72-B",
    burialMapUrl: "https://maps.example.org/memorial/72-B",
    burialDate: "2011-11-12",
  };
  Object.assign(p.deathRecords[0], burial);
  state.project = validateImport(project);
  const saved = state.project.people.find((p) => p.id === "p1").deathRecords[0];
  for (const [key, value] of Object.entries(burial))
    assert.equal(saved[key], value);
  const form = new FormData(),
    cfg = recordConfigs().death;
  form.append("death-id", saved.id);
  for (const [key] of cfg.fields) form.append("death-" + key, saved[key] ?? "");
  assert.deepEqual(collectProfile(form).deathRecords, [saved]);
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p1"));
    for (const value of Object.values(burial).filter(
      (v) => v !== burial.burialDate,
    ))
      assert.ok(html.includes(value));
    const results = searchIndex(
      buildSearchIndex(state.project),
      'name:John country:Canada "Maplewood Memorial Park" "72-B"',
    );
    assert.ok(results.some((r) => r.kind === "person" && r.id === "p1"));
  }
  const events = collectProjectEvents(state.project).filter(
    (e) => e.section === "death" && e.date === burial.burialDate,
  );
  assert.ok(events.length > 0);
  assert.ok(events.every((e) => !e.annual));
  setLanguage("en");
  assert.ok(
    profileRecordError(cfg, { date: "2011-11-03", burialDate: "2011-10-01" }),
  );
  assert.ok(profileRecordError(cfg, { burialMapUrl: "javascript:alert(1)" }));
});

test("existing free-text burial locations remain intact and do not set a person's life status", () => {
  const project = sample(),
    p = project.people.find((p) => p.id === "p5");
  p.deathRecords = [
    {
      id: "reported",
      burialPlace: "Cedarbank family vault",
      verification: "refuted",
    },
  ];
  const normalized = validateImport(project).people.find((p) => p.id === "p5");
  assert.equal(
    normalized.deathRecords[0].burialPlace,
    "Cedarbank family vault",
  );
  assert.equal(normalized.deathRecords[0].burialCemetery, "");
  assert.equal(normalized.lifeStatus, "living");
  assert.equal(normalized.death, "");
});
