import test from "node:test";
import assert from "node:assert/strict";
import { sample } from "../src/data/demo.js";
import { state } from "../src/core/state.js";
import { validateImport } from "../src/model/validation.js";
import { kinshipBetween } from "../src/model/kinship.js";
import { setLanguage } from "../src/i18n/index.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";

const cousinCases = [
  ["grace", 1, "p1", "First cousin", "Двоюрідна сестра", "Двоюродная сестра"],
  [
    "lucy",
    2,
    "arthur",
    "Second cousin",
    "Троюрідна сестра",
    "Троюродная сестра",
  ],
  [
    "olivia",
    3,
    "edward",
    "Third cousin",
    "Чотириюрідна сестра",
    "Четвероюродная сестра",
  ],
  [
    "emily",
    4,
    "henry",
    "Fourth cousin",
    "П’ятиюрідна сестра",
    "Пятиюродная сестра",
  ],
  [
    "nathan",
    5,
    "william",
    "Fifth cousin",
    "Шестиюрідний брат",
    "Шестиюродный брат",
  ],
];

test("large demo derives all five cousin degrees from complete ancestry in every language", () => {
  state.project = validateImport(sample());
  for (const [language, column] of [
    ["en", 3],
    ["uk", 4],
    ["ru", 5],
  ]) {
    setLanguage(language);
    for (const row of cousinCases) {
      const [id, degree, ancestor] = row;
      const k = kinshipBetween("p5", id);
      assert.equal(k.kind, "cousin", id);
      assert.equal(k.label, row[column], id);
      assert.equal(k.degree, degree);
      assert.equal(k.removed, 0);
      assert.equal(k.distanceFrom, degree + 1);
      assert.equal(k.distanceTo, degree + 1);
      assert.equal(k.ancestorId, ancestor);
      assert.equal(k.adopted, false);
      assert.equal(
        k.verified,
        false,
        "Jamie's birth register still needs review",
      );
      assert.ok(
        k.relations.every(
          (id) =>
            state.project.relations.find((r) => r.id === id).type === "parent",
        ),
      );
      assert.equal(kinshipBetween(id, "p5").degree, degree);
    }
  }
  setLanguage("en");
  assert.equal(kinshipBetween("p5", "mia").removed, 1);
  assert.equal(kinshipBetween("p5", "p8").kind, "half_sibling");
  assert.equal(kinshipBetween("p5", "p6").adopted, true);
});

test("demo names follow recorded marriage and adoption events without changing children's parentage", () => {
  const project = validateImport(sample());
  const people = new Map(project.people.map((p) => [p.id, p]));
  for (const [id, current, former, change] of [
    ["p2", "Jane Doe", "Jane Hart", "1959-06-15"],
    ["p3", "Jamie Roe", "Jamie Doe", "1995-08-19"],
    ["p6", "Robin Roe", "Robin Vale", "1996-02-12"],
    ["p8", "Casey Roe", "Casey Ward", "2017-07-08"],
    ["grace", "Grace Bennett", "Grace Doe", "2013-07-20"],
    ["lucy", "Lucy Reed", "Lucy Ellis", "2012-09-08"],
  ]) {
    const p = people.get(id);
    assert.equal(p.name, current);
    assert.equal(p.nameHistory[0].fullName, former);
    assert.equal(p.nameHistory[0].from, p.birth);
    assert.equal(p.nameHistory[0].to, change);
    assert.ok(
      project.relations.some(
        (r) =>
          [r.from, r.to].includes(id) &&
          ["spouse", "adopted"].includes(r.type) &&
          r.fromDate === change,
      ),
    );
  }
  for (const p of project.people)
    for (const former of p.nameHistory)
      assert.notEqual(former.fullName, p.name, p.id);
  assert.equal(people.get("p5").name, "Jesse Ward");
  assert.equal(people.get("p7").name, "Taylor Ward");
  assert.equal(people.get("p9").name, "Morgan Blake");
  assert.equal(people.get("p12").name, "Quinn Vale");
  assert.deepEqual(
    project.relations
      .filter((r) => r.type === "parent" && r.to === "p5")
      .map((r) => r.from)
      .sort(),
    ["p3", "p7"],
  );
});

test("demo generations, marriages and source references remain chronologically coherent", () => {
  const project = validateImport(sample());
  assert.equal(project.people.length, 99);
  assert.equal(project.groups.length, 10);
  const people = new Map(project.people.map((p) => [p.id, p]));
  const age = (birth, date) =>
    Number(date.slice(0, 4)) -
    Number(birth.slice(0, 4)) -
    Number(date.slice(5) < birth.slice(5));
  for (const p of project.people) {
    assert.ok(
      p.groupIds.every((id) => project.groups.some((g) => g.id === id)),
    );
    assert.ok(!p.death || p.death > p.birth, p.id);
  }
  for (const r of project.relations) {
    const a = people.get(r.from),
      b = people.get(r.to);
    if (r.type === "parent") {
      const years = age(a.birth, b.birth);
      assert.ok(years >= 18 && years <= 60, `${a.name} -> ${b.name}: ${years}`);
      assert.ok(
        !a.death || a.death >= b.birth,
        `${a.name} died before ${b.name}'s birth`,
      );
    }
    if (r.type === "spouse")
      for (const p of [a, b]) {
        assert.ok(age(p.birth, r.fromDate) >= 18, p.name);
        assert.ok(!p.death || p.death > r.fromDate, p.name);
      }
    if (r.id.startsWith("parent-") || r.id.startsWith("marriage-"))
      assert.ok(
        project.documents.some(
          (d) =>
            d.relations.includes(r.id) &&
            d.evidence === "official" &&
            d.status === "available",
        ),
        r.id,
      );
  }
  assert.ok(project.documents.every((d) => d.reference));
});

test("fictional notice stays in the project title while record values use natural descriptions", () => {
  const project = sample();
  assert.match(project.title, /fictional demo/i);
  function inspect(value, path) {
    if (Array.isArray(value))
      value.forEach((v, i) => inspect(v, `${path}[${i}]`));
    else if (value && typeof value === "object") {
      for (const [key, v] of Object.entries(value))
        if (!/^(id|.*Id|.*Ids|people|relations|from|to)$/.test(key))
          inspect(v, `${path}.${key}`);
    } else if (typeof value === "string")
      assert.doesNotMatch(
        value,
        /\b(demo|test|fictional|example|sample|invented)\b/i,
        path,
      );
  }
  for (const key of ["people", "relations", "documents", "groups", "property"])
    inspect(project[key], key);
  const second = sample();
  project.people[0].name = "Changed locally";
  project.people.find((p) => p.id === "grace").nameHistory[0].fullName =
    "Changed locally";
  assert.equal(second.people[0].name, "John Doe");
  assert.equal(
    second.people.find((p) => p.id === "grace").nameHistory[0].fullName,
    "Grace Doe",
  );
});

test("current surnames, former surnames and branch profile combinations remain searchable", () => {
  const project = validateImport(sample());
  const index = buildSearchIndex(project);
  for (const [query, id] of [
    ['type:person name:"Grace Doe" teacher', "grace"],
    ['type:person name:"Lucy Reed" architect', "lucy"],
    ['type:person name:"Robin Vale" Guitar', "p6"],
    ['type:person name:"Casey Ward"', "p8"],
    ["type:person name:Jesse document:PA7314062", "p5"],
  ])
    assert.ok(
      searchIndex(index, query).some((e) => e.kind === "person" && e.id === id),
      query,
    );
});
