import test from "node:test";
import assert from "node:assert/strict";
import {
  ageBounds,
  dateInputValue,
  displayDate,
  partialDate,
  nextAnniversary,
} from "../src/model/dates.js";
import { emptyPersonFilter } from "../src/core/person-filter-fields.js";
import { sample } from "../src/data/demo.js";
import {
  validateImport,
  chronologyError,
  profileFormError,
} from "../src/model/validation.js";
import { relationshipConfig } from "../src/core/relationships.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { personStatus } from "../src/model/person-status.js";
import { formatAge } from "../src/model/person-display.js";
import { setLanguage } from "../src/i18n/index.js";
import { monthOccurrences } from "../src/model/calendar.js";
import {
  evaluatePersonFilter,
  personFilterCsv,
} from "../src/model/person-filters.js";
import { formatFilterAge } from "../src/ui/person-filter-results.js";
import {
  defaultReviewPeriod,
  reviewBiography,
} from "../src/model/biography-review.js";
import { propertyPeriod } from "../src/model/property-history.js";

test("date precision and uncertainty round-trip without manufacturing months or days", () => {
  for (const [entered, stored, displayed] of [
    ["05.1980", "1980-05", "05.1980"],
    ["1980", "1980", "1980"],
    ["≈ 1980", "~1980", "≈ 1980"],
    ["~05.1980", "~1980-05", "≈ 05.1980"],
    ["≈ 16.05.1980", "~1980-05-16", "≈ 16.05.1980"],
    ["1980-1985", "1980/1985", "1980 – 1985"],
    ["05.1980 – 08.1981", "1980-05/1981-08", "05.1980 – 08.1981"],
    ["16.05.1980 — 1981", "1980-05-16/1981", "16.05.1980 – 1981"],
  ]) {
    assert.equal(dateInputValue(entered), stored);
    assert.equal(displayDate(stored), displayed);
    assert.equal(dateInputValue(displayed), stored);
    assert.ok(partialDate(stored));
    assert.equal(nextAnniversary(stored, "2026-01-01"), null);
  }
  assert.equal(partialDate("2024-02").max, "2024-02-29");
  assert.equal(partialDate("1900-02").max, "1900-02-28");
  assert.equal(partialDate("1980-05/1981-08").min, "1980-05-01");
  assert.equal(partialDate("1980-05/1981-08").max, "1981-08-31");
});

test("malformed dates, out-of-bounds months and reversed ranges are rejected", () => {
  for (const value of [
    "00.1980",
    "13.1980",
    "0000",
    "2026-02-29",
    "2020/2019",
    "2020-12/2020-01",
    "1980/",
    "1980/1981/1982",
    "~1980/1981",
    "1980s",
    "1.1980",
  ]) {
    assert.equal(partialDate(dateInputValue(value)), null, value);
    const project = sample();
    project.people[0].birth = dateInputValue(value);
    assert.throws(() => validateImport(project));
  }
});

test("birth, death, relationships and family events retain date precision through archive validation", () => {
  const project = sample();
  Object.assign(project.people[0], { birth: "1940/1945", death: "~2020-05" });
  project.people[0].events = [
    {
      id: "partial-event",
      title: "Wedding",
      category: "anniversary",
      date: "1965-05/1965-08",
      repeat: "annual",
    },
  ];
  Object.assign(project.relations[0], { fromDate: "1965-05", toDate: "~1970" });
  const imported = validateImport(JSON.parse(JSON.stringify(project)));
  assert.equal(imported.people[0].birth, "1940/1945");
  assert.equal(imported.people[0].death, "~2020-05");
  assert.equal(imported.people[0].events[0].date, "1965-05/1965-08");
  assert.equal(imported.relations[0].fromDate, "1965-05");
  assert.equal(imported.relations[0].toDate, "~1970");
  const form = new FormData();
  form.set("birthDate", "1940/1945");
  form.set("deathDate", "2020-05");
  assert.equal(profileFormError(form, {}), "");
});

test("chronology validates known bounds while preserving overlapping or approximate observations", () => {
  assert.ok(chronologyError({ birth: "1980-05", death: "1980-04" }));
  assert.equal(chronologyError({ birth: "1980/1985", death: "1983" }), "");
  assert.equal(chronologyError({ birth: "~1980", death: "1979" }), "");
  assert.ok(
    profileRecordError(relationshipConfig(), {
      fromDate: "1980-05",
      toDate: "1980-04",
    }),
  );
  assert.equal(
    profileRecordError(relationshipConfig(), {
      fromDate: "1980/1985",
      toDate: "1983-06",
    }),
    "",
  );
});

test("ages use inclusive possible dates and explicitly mark approximate estimates", () => {
  assert.deepEqual(ageBounds("1980-05", "2026-05-16"), { min: 45, max: 46 });
  assert.deepEqual(ageBounds("1980/1985", "2026-01-01"), { min: 40, max: 46 });
  assert.deepEqual(ageBounds("1980-05", "2020-04/2020-06"), {
    min: 39,
    max: 40,
  });
  const approximate = ageBounds("~1980", "2026-10-10");
  assert.deepEqual(approximate, { min: 45, max: 46, approximate: true });
  setLanguage("en");
  assert.equal(formatAge(approximate), "≈ 45–46 years");
  assert.equal(
    personStatus({ birth: "~2010", lifeStatus: "living" }, "2026-10-10").minor,
    false,
  );
  assert.equal(
    personStatus({ birth: "2010/2012", lifeStatus: "living" }, "2026-10-10")
      .minor,
    true,
  );
});

test("approximate ages do not satisfy exact numeric analytics or create birthdays", () => {
  const project = sample();
  project.people = [
    { id: "uncertain", name: "Jane Doe", birth: "~1980", lifeStatus: "living" },
  ];
  project.relations = [];
  project.documents = [];
  project.property = [];
  const result = evaluatePersonFilter(
    project,
    {
      ...emptyPersonFilter(),
      rules: [{ field: "age", operator: "gte", value: "18" }],
    },
    { today: "2026-10-10" },
  );
  assert.equal(result.matches.length, 0);
  const all = evaluatePersonFilter(project, emptyPersonFilter(), {
    today: "2026-10-10",
  });
  assert.equal(formatFilterAge(all.matches[0]), "≈ 45–46");
  const csv = personFilterCsv(all, "2026-10-10");
  assert.ok(csv.includes('"Age approximate"'));
  assert.ok(csv.includes('"45","46","true"'));
  const events = ["1980-05", "1980/1985", "~1980-05-16"].map((date, index) => ({
    id: String(index),
    date,
    annual: true,
    type: "birth",
  }));
  assert.deepEqual(monthOccurrences(events, "2026-05"), []);
});

test("biography review and property snapshots avoid definite conclusions from approximate boundaries", () => {
  assert.deepEqual(defaultReviewPeriod({ birth: "1980/1985" }, "2026-10-10"), {
    from: "2003-12-31",
    to: "2026-10-10",
  });
  assert.equal(defaultReviewPeriod({ birth: "~1980" }, "2026-10-10").from, "");
  const review = reviewBiography(
    {
      birth: "1980",
      residences: [{ id: "r", from: "~2000", to: "2020", country: "US" }],
    },
    { from: "2000-01-01", to: "2020-12-31", today: "2026-10-10" },
  );
  assert.equal(review.incomplete.length, 1);
  assert.equal(review.coverage.length, 0);
  assert.equal(
    propertyPeriod({ from: "~2000", status: "current" }, "2026-10-10"),
    "uncertain",
  );
});
