import assert from "node:assert/strict";
import test from "node:test";
import { ageBounds } from "../src/model/dates.js";
import {
  personDisplayName,
  personLifeDates,
  personLifeDetail,
} from "../src/model/person-display.js";
import { setLanguage } from "../src/i18n/index.js";
import { sample } from "../src/data/demo.js";
import { state } from "../src/core/state.js";
import { validateImport } from "../src/model/validation.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { personBiography } from "../src/model/biography.js";
import { renderBiography } from "../src/ui/biography.js";

test("current names display explicit maiden surnames without changing stored names or using aliases", () => {
  const person = {
    name: "Casey Roe",
    aliases: "C. Ward",
    nameHistory: [
      { kind: "maiden", surname: "van der Ward" },
      { kind: "maiden", surname: "van der Ward" },
      { kind: "birth", surname: "Hale" },
      { kind: "previous", surname: "Cross" },
    ],
  };
  const original = structuredClone(person);
  assert.equal(personDisplayName(person), "Casey Roe (van der Ward)");
  assert.deepEqual(person, original);
  assert.equal(
    personDisplayName({
      name: "Robin Roe",
      aliases: "Robin Vale",
      nameHistory: [{ kind: "birth", surname: "Vale" }],
    }),
    "Robin Roe",
  );
  assert.equal(personDisplayName(null), "");
});

test("explicit full maiden names retain the changed surname in either name order", () => {
  for (const [name, record, surname] of [
    ["Casey Roe", { fullName: "Casey Ward" }, "Ward"],
    ["Marie van Dijk", { fullName: "Marie de la Cruz" }, "de la Cruz"],
    ["Коваль Олена Іванівна", { fullName: "Бондар Олена Іванівна" }, "Бондар"],
    [
      "Alex Roe",
      { fullName: "Taylor van Dijk", givenName: "Taylor" },
      "van Dijk",
    ],
    ["Alex Roe", { fullName: "Ward" }, "Ward"],
  ])
    assert.equal(
      personDisplayName({ name, nameHistory: [{ kind: "maiden", ...record }] }),
      `${name} (${surname})`,
    );
  assert.equal(
    personDisplayName({
      name: "Alex Roe",
      nameHistory: [{ kind: "maiden", fullName: "Taylor Cross" }],
    }),
    "Alex Roe",
  );
});

test("age uses completed birthdays, leap days and infants, with ranges for partial dates", () => {
  assert.deepEqual(ageBounds("2008-10-10", "2026-10-09"), { min: 17, max: 17 });
  assert.deepEqual(ageBounds("2008-10-10", "2026-10-10"), { min: 18, max: 18 });
  assert.deepEqual(ageBounds("2008-02-29", "2026-02-28"), { min: 18, max: 18 });
  assert.deepEqual(ageBounds("2026-10-09", "2026-10-09"), { min: 0, max: 0 });
  assert.deepEqual(ageBounds("2008", "2026-10-09"), { min: 17, max: 18 });
  assert.deepEqual(ageBounds("1932", "2011"), { min: 78, max: 79 });
  assert.deepEqual(ageBounds("2026", "2026-10-09"), { min: 0, max: 0 });
  for (const [birth, at] of [
    ["", "2026-10-09"],
    ["2008", ""],
    ["2027", "2026-10-09"],
    ["2008-02-30", "2026-10-09"],
  ])
    assert.equal(ageBounds(birth, at), null);
});

test("living ages replace the death row, while deceased ages stay tied to the death date in every language", () => {
  const today = "2026-10-09",
    living = { birth: "1988-12-12", lifeStatus: "living" },
    deceased = {
      birth: "1932-03-04",
      death: "2011-11-03",
      lifeStatus: "living",
    };
  for (const [language, livingAge, deathValue] of [
    ["en", "37 years", "11/03/2011 (79 years)"],
    ["uk", "37 років", "03.11.2011 (79 років)"],
    ["ru", "37 лет", "03.11.2011 (79 лет)"],
  ]) {
    setLanguage(language);
    assert.equal(personLifeDetail(living, { today }).value, livingAge);
    assert.equal(personLifeDetail(deceased, { today }).value, deathValue);
    assert.equal(
      personLifeDetail(deceased, { today: "2040-01-01" }).value,
      deathValue,
    );
    assert.ok(personLifeDates(living, { today }).endsWith(livingAge));
  }
  setLanguage("en");
});

test("missing dates and unknown life status do not invent ages or report placeholders", () => {
  setLanguage("en");
  assert.equal(
    personLifeDetail({ birth: "1988-12-12" }, { today: "2026-10-09" }).value,
    "",
  );
  assert.equal(personLifeDetail({ lifeStatus: "living" }).value, "");
  assert.equal(
    personLifeDetail(
      { birth: "1932", lifeStatus: "deceased" },
      { includeUnknown: false },
    ).value,
    "",
  );
  assert.equal(
    personLifeDates({ lifeStatus: "deceased" }, { includeUnknown: false }),
    "",
  );
  assert.equal(
    personLifeDetail({ birth: "1932", death: "2011" }).value,
    "2011 (78–79 years)",
  );
});

test("import, search and printed biography use current names and recorded maiden surnames consistently", () => {
  setLanguage("en");
  state.project = validateImport(sample());
  const jane = state.project.people.find((p) => p.id === "p2");
  assert.equal(personDisplayName(jane), "Jane Doe (Hart)");
  const match = searchIndex(buildSearchIndex(state.project), "name:Hart").find(
    (entry) => entry.id === "p2",
  );
  assert.equal(match.title, "Jane Doe (Hart)");
  const html = renderBiography(personBiography(state.project, "p2"));
  assert.ok(html.includes("Jane Doe (Hart)"));
  assert.ok(html.includes("Age at death"));
  assert.ok(html.includes("81 years"));
  assert.ok(html.includes("<dd>Jane Doe</dd>"));
  assert.equal(jane.name, "Jane Doe");
});
