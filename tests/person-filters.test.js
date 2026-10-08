import test from "node:test";
import assert from "node:assert/strict";
import { fresh } from "../src/model/project.js";
import {
  emptyPersonFilter,
  normalizePersonFilter,
} from "../src/core/person-filter-fields.js";
import { buildPersonFilterFacts } from "../src/model/person-filter-facts.js";
import {
  evaluatePersonFilter,
  personFilterCsv,
} from "../src/model/person-filters.js";
import { validateImport } from "../src/model/validation.js";
import { sample } from "../src/data/demo.js";
import { setLanguage } from "../src/i18n/index.js";

const today = "2026-12-20";
function fixture() {
  const project = fresh();
  project.people = [
    {
      id: "adult",
      name: "Alex Doe",
      birth: "1986-12-25",
      lifeStatus: "living",
      gender: "m",
      groupIds: ["household"],
      identityDocuments: [
        { id: "passport", kind: "passport", number: "AB123456" },
      ],
      assetRecords: [
        {
          id: "home-1",
          identifier: "HOME-01",
          value: "400",
          sharePercent: "50",
          currency: "USD",
          valuationDate: "2025-01-01",
          status: "held",
        },
        {
          id: "home-2",
          identifier: "HOME-01",
          value: "600",
          sharePercent: "50",
          currency: "USD",
          valuationDate: "2026-01-01",
          status: "held",
        },
        {
          id: "eur",
          value: "100",
          sharePercent: "100",
          currency: "EUR",
          status: "held",
        },
        {
          id: "zero",
          value: "500",
          sharePercent: "0",
          currency: "CAD",
          status: "held",
        },
        { id: "unknown", value: "9000", currency: "USD", status: "held" },
        {
          id: "sold",
          value: "9000",
          sharePercent: "100",
          currency: "USD",
          status: "disposed",
        },
        {
          id: "ended",
          value: "9000",
          sharePercent: "100",
          currency: "USD",
          to: "2025",
        },
        {
          id: "future",
          value: "9000",
          sharePercent: "100",
          currency: "USD",
          from: "2027",
        },
        {
          id: "refuted",
          value: "9000",
          sharePercent: "100",
          currency: "USD",
          verification: "refuted",
        },
      ],
      travelRecords: [
        { id: "past", toCountry: "Canada", status: "completed" },
        { id: "entered", toCountry: "Japan", entryDate: "2026-01-01" },
        {
          id: "planned",
          toCountry: "Spain",
          status: "planned",
          entryDate: "2025-01-01",
        },
        { id: "cancelled", toCountry: "Italy", status: "cancelled" },
        { id: "future", toCountry: "France", entryDate: "2027-01-01" },
      ],
    },
    {
      id: "young",
      name: "Blair Doe",
      birth: "2010-01-01",
      lifeStatus: "living",
      gender: "f",
      groupIds: ["household"],
      identityDocuments: [
        { id: "refuted-id", kind: "nationalId", verification: "refuted" },
      ],
    },
    { id: "uncertain", name: "Casey Doe", birth: "2008", lifeStatus: "living" },
    {
      id: "deceased",
      name: "Drew Doe",
      birth: "1950-06-01",
      death: "2000-06-01",
      lifeStatus: "deceased",
    },
    { id: "unknown", name: "Eden Doe", lifeStatus: "unknown" },
  ];
  project.relations = [
    { id: "parent", from: "adult", to: "young", type: "parent" },
    { id: "adopted", from: "adult", to: "young", type: "adopted" },
    {
      id: "reported",
      from: "adult",
      to: "uncertain",
      type: "parent",
      verification: "unverified",
    },
    { id: "step", from: "adult", to: "unknown", type: "step_parent" },
    {
      id: "wedding",
      from: "adult",
      to: "uncertain",
      type: "spouse",
      fromDate: "2020-01-05",
      status: "current",
    },
    {
      id: "ended",
      from: "young",
      to: "unknown",
      type: "spouse",
      fromDate: "2019-12-25",
      toDate: "2020-12-25",
      status: "ended",
    },
  ];
  project.documents = [
    {
      id: "available",
      people: ["adult"],
      status: "available",
      evidence: "official",
      verification: "corroborated",
      assetId: "scan",
    },
    {
      id: "requested",
      people: ["young"],
      status: "requested",
      evidence: "official",
    },
    {
      id: "refuted",
      people: ["young"],
      status: "available",
      evidence: "official",
      verification: "refuted",
    },
    {
      id: "review",
      people: ["adult"],
      status: "needs_review",
      evidence: "indirect",
      verification: "pending",
    },
  ];
  return project;
}
const query = (rules, rest = {}) => ({
  ...emptyPersonFilter(),
  rules,
  ...rest,
});
const condition = (field, operator, value, extra = {}) => ({
  field,
  operator,
  value,
  ...extra,
});
const ids = (project, rules, extra = {}) =>
  evaluatePersonFilter(project, query(rules, extra), {
    today,
    files: new Map([["scan", {}]]),
  }).matches.map((f) => f.id);

test("filters combine life, age, sources and recorded family facts without treating unknowns as negatives", () => {
  setLanguage("en");
  const project = fixture();
  assert.deepEqual(
    ids(project, [
      condition("life", "eq", "living"),
      condition("age", "between", "30", { max: "45" }),
    ]),
    ["adult"],
  );
  assert.deepEqual(ids(project, [condition("life", "eq", "deceased")]), [
    "deceased",
  ]);
  assert.deepEqual(ids(project, [condition("minor", "eq", "true")]), ["young"]);
  assert.deepEqual(ids(project, [condition("age", "gte", "18")]), [
    "adult",
    "deceased",
  ]);
  assert.deepEqual(
    ids(project, [condition("age", "between", "17", { max: "18" })]),
    ["uncertain"],
  );
  assert.ok(
    !ids(project, [condition("age", "ne", "17")]).includes("uncertain"),
  );
  assert.deepEqual(ids(project, [condition("age", "missing", "")]), [
    "unknown",
  ]);
  assert.deepEqual(ids(project, [condition("documents", "gte", "1")]), [
    "adult",
  ]);
  assert.deepEqual(ids(project, [condition("identityDocuments", "gte", "1")]), [
    "adult",
  ]);
  assert.deepEqual(
    ids(project, [
      condition("identityDocuments", "eq", "0"),
      condition("life", "eq", "living"),
    ]),
    ["young", "uncertain"],
  );
  assert.deepEqual(ids(project, [condition("files", "gte", "1")]), ["adult"]);
  assert.deepEqual(
    ids(project, [
      condition("sources", "gte", "1"),
      condition("documents", "eq", "0"),
    ]),
    ["young"],
  );
  assert.deepEqual(ids(project, [condition("children", "eq", "1")]), ["adult"]);
  assert.deepEqual(ids(project, [condition("adopted", "eq", "true")]), [
    "young",
  ]);
  assert.deepEqual(
    ids(
      project,
      [condition("minor", "eq", "true"), condition("life", "eq", "deceased")],
      { match: "any" },
    ),
    ["young", "deceased"],
  );
  const report = evaluatePersonFilter(project, query([]), {
    today,
    groupId: "household",
  });
  assert.equal(report.total, 2);
  assert.equal(report.summary.living, 2);
  assert.equal(report.summary.minors, 1);
});

test("upcoming dates cross the year boundary, include both wedding partners and handle leap birthdays", () => {
  const project = fixture();
  assert.deepEqual(ids(project, [condition("birthday", "lte", "15")]), [
    "adult",
    "young",
  ]);
  assert.deepEqual(ids(project, [condition("anniversary", "lte", "16")]), [
    "adult",
    "uncertain",
  ]);
  const deceased = buildPersonFilterFacts(project, today).find(
    (f) => f.id === "deceased",
  );
  assert.equal(deceased.birthday, null);
  assert.deepEqual(deceased.age, { min: 50, max: 50 });
  const leap = fresh();
  leap.people = [
    { id: "leap", name: "Leap Doe", birth: "2000-02-29", lifeStatus: "living" },
  ];
  const facts = buildPersonFilterFacts(leap, "2027-02-27");
  assert.equal(facts[0].birthday, 1);
  assert.equal(facts[0].birthdayDate, "2027-02-28");
});

test("asset filters use latest observations, ownership shares, zero and separate currencies without inferring missing values", () => {
  const project = fixture();
  const fact = buildPersonFilterFacts(project, today)[0];
  assert.deepEqual(fact.assetValue, { USD: 300, EUR: 100, CAD: 0 });
  assert.equal(fact.incompleteAssets, 1);
  const small = fresh();
  small.people = [
    {
      id: "fractional",
      name: "Fractional shares",
      assetRecords: [
        { id: "a", value: "0.1", sharePercent: "100", currency: "USD" },
        { id: "b", value: "0.2", sharePercent: "100", currency: "USD" },
        {
          id: "future-value",
          value: "500",
          sharePercent: "100",
          currency: "USD",
          valuationDate: "2027-01-01",
        },
      ],
    },
  ];
  assert.equal(buildPersonFilterFacts(small, today)[0].assetValue.USD, 0.3);
  assert.deepEqual(
    ids(small, [condition("assetValue", "eq", "0.3", { currency: "USD" })]),
    ["fractional"],
  );
  small.people[0].assetRecords.push({
    id: "non-decimal",
    value: "0xFF",
    sharePercent: "100",
    currency: "EUR",
  });
  assert.equal(
    buildPersonFilterFacts(small, today)[0].assetValue.EUR,
    undefined,
  );
  assert.equal(buildPersonFilterFacts(small, today)[0].incompleteAssets, 1);
  assert.deepEqual(
    ids(project, [condition("assetValue", "gte", "300", { currency: "USD" })]),
    ["adult"],
  );
  assert.deepEqual(
    ids(project, [condition("assetValue", "gte", "301", { currency: "USD" })]),
    [],
  );
  assert.deepEqual(
    ids(project, [condition("assetValue", "eq", "0", { currency: "CAD" })]),
    ["adult"],
  );
  assert.ok(
    !ids(project, [
      condition("assetValue", "ne", "300", { currency: "USD" }),
    ]).includes("unknown"),
  );
});

test("country conditions ignore planned travel and distinguish no information from a recorded nonmatch", () => {
  const project = fixture();
  const fact = buildPersonFilterFacts(project, today)[0];
  assert.deepEqual(fact.visited, ["Canada", "Japan"]);
  assert.deepEqual(ids(project, [condition("visited", "contains", "canada")]), [
    "adult",
  ]);
  assert.deepEqual(ids(project, [condition("visited", "eq", "Spain")]), []);
  assert.deepEqual(ids(project, [condition("visited", "excludes", "Spain")]), [
    "adult",
  ]);
  assert.deepEqual(
    ids(project, [
      condition("visited", "eq", "Canada"),
      condition("visited", "eq", "Japan"),
    ]),
    ["adult"],
  );
  assert.equal(ids(project, [condition("visited", "missing", "")]).length, 4);
});

test("saved queries validate, survive archives, use all-value search and export formula-safe analytical CSV", () => {
  const project = sample();
  project.personFilterViews = [
    {
      id: "saved-analysis",
      name: "Assets and party history",
      query: query(
        [
          condition("assetValue", "gte", "100", { currency: "CAD" }),
          condition("search", "matches", '"Cedar Civic Alliance"'),
        ],
        { sort: "assetsDesc", sortCurrency: "CAD" },
      ),
    },
  ];
  const imported = validateImport(project);
  assert.deepEqual(imported.personFilterViews, project.personFilterViews);
  const report = evaluatePersonFilter(
    imported,
    imported.personFilterViews[0].query,
    { today },
  );
  assert.deepEqual(
    report.matches.map((f) => f.id),
    ["p4"],
  );
  const raw = fixture();
  raw.people[0].name = '=HYPERLINK("https://example.invalid")';
  const csv = personFilterCsv(
    evaluatePersonFilter(raw, query([]), { today }),
    today,
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.invalid"")"'));
  assert.ok(csv.includes("Recorded asset shares USD"));
  for (const invalid of [
    query([condition("age", "between", "25", { max: "18" })]),
    query([condition("age", "gte", "18.5")]),
    query([condition("assetValue", "gte", "50", { currency: "" })]),
    query([condition("life", "eq", "imagined")]),
    query([condition("unknownField", "eq", "1")]),
    query([condition("constructor", "eq", "1")]),
    query([condition("__proto__", "eq", "1")]),
    query(Array.from({ length: 21 }, () => condition("life", "eq", "living"))),
  ])
    assert.throws(() => normalizePersonFilter(invalid));
  imported.personFilterViews[0].query.rules[0].value = "Infinity";
  assert.throws(() => validateImport(imported));
});
