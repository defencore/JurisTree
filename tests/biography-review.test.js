import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultReviewPeriod,
  reviewBiography,
} from "../src/model/biography-review.js";

const options = {
  today: "2026-10-09",
  from: "2020-01-01",
  to: "2020-12-31",
  minimumDays: 1,
};
const period = (id, from, to, extra = {}) => ({ id, from, to, ...extra });

test("review merges independent adjacent and overlapping periods and finds inclusive leap-year gaps", () => {
  const person = {
    occupations: [period("job", "2020-01-10", "2020-02-28")],
    educationRecords: [period("college", "2020-02-29", "2020-04-01")],
    residences: [period("home", "2020-03-10", "2020-06-30")],
    militaryRecords: [
      period("service", "2020-09-01", "2020-12-31", { kind: "service" }),
    ],
  };
  const before = structuredClone(person);
  const report = reviewBiography(person, options);
  assert.deepEqual(report.gaps, [
    { from: "2020-01-01", to: "2020-01-09", days: 9 },
    { from: "2020-07-01", to: "2020-08-31", days: 62 },
  ]);
  assert.equal(report.coverage[0].records.length, 3);
  assert.equal(report.coverage.length, 2);
  assert.deepEqual(
    reviewBiography(person, { ...options, minimumDays: 30 }).gaps,
    [report.gaps[1]],
  );
  assert.deepEqual(person, before);
  assert.equal(reviewBiography({}, options).gaps[0].days, 366);
});

test("review requires explicit ongoing status, excludes refuted and future periods, and filters corroboration", () => {
  const person = {
    occupations: [
      period("missing-end", "2020-01-01", ""),
      period("current", "2020-04-01", "", {
        status: "current",
        verification: "pending",
      }),
      period("checked", "2020-02-01", "2020-02-29", {
        verification: "corroborated",
      }),
      period("refuted", "2020-01-01", "2020-12-31", {
        verification: "refuted",
      }),
      period("future", "2027-01-01", "", { status: "current" }),
    ],
    militaryRecords: [
      period("award", "2020-01-01", "2020-12-31", { kind: "award" }),
    ],
  };
  const all = reviewBiography(person, options);
  assert.deepEqual(
    all.coverage.flatMap((r) => r.records.map((r) => r.recordId)),
    ["checked", "current"],
  );
  assert.deepEqual(
    all.incomplete.map((r) => r.recordId),
    ["missing-end"],
  );
  assert.ok(all.pending.some((r) => r.recordId === "current"));
  assert.ok(!all.pending.some((r) => r.recordId === "refuted"));
  const checked = reviewBiography(person, { ...options, mode: "corroborated" });
  assert.deepEqual(
    checked.coverage.flatMap((r) => r.records.map((r) => r.recordId)),
    ["checked"],
  );
  assert.deepEqual(
    checked.gaps.map((g) => g.days),
    [31, 306],
  );
});

test("review uses conservative year boundaries and does not count isolated life events as continuous coverage", () => {
  const person = {
    occupations: [period("approximate", "2019", "2021")],
    pregnancyRecords: [period("pregnancy", "2020-01-01", "2020-12-31")],
    contacts: [period("contact", "2020-01-01", "2020-12-31")],
  };
  const report = reviewBiography(person, {
    ...options,
    from: "2019-01-01",
    to: "2021-12-31",
  });
  assert.deepEqual(
    report.coverage.map(({ from, to }) => ({ from, to })),
    [{ from: "2019-12-31", to: "2021-01-01" }],
  );
  assert.deepEqual(
    report.gaps.map((r) => r.days),
    [364, 364],
  );
  assert.equal(report.incomplete[0].recordId, "approximate");
  assert.equal(
    reviewBiography({ contacts: person.contacts }, options).gaps[0].days,
    366,
  );
});

test("review bounds the period by lifetime and today and chooses an explicit default for adults and minors", () => {
  assert.deepEqual(defaultReviewPeriod({ birth: "2000-02-29" }, "2026-10-09"), {
    from: "2018-02-28",
    to: "2026-10-09",
  });
  assert.deepEqual(defaultReviewPeriod({ birth: "2018-05-14" }, "2026-10-09"), {
    from: "2018-05-14",
    to: "2026-10-09",
  });
  assert.deepEqual(defaultReviewPeriod({ birth: "2000" }, "2026-10-09"), {
    from: "2018-12-31",
    to: "2026-10-09",
  });
  assert.equal(defaultReviewPeriod({}, options.today).from, "");
  const report = reviewBiography(
    { birth: "2020-03-01", death: "2020-08-01" },
    options,
  );
  assert.equal(report.from, "2020-03-01");
  assert.equal(report.to, "2020-08-01");
  assert.equal(report.gaps[0].days, 154);
  assert.equal(
    reviewBiography({}, { ...options, to: "2029-01-01" }).to,
    options.today,
  );
  for (const patch of [
    { from: "" },
    { from: "2020-02-30" },
    { to: "2019-12-31" },
    { minimumDays: 0 },
    { minimumDays: "1.5" },
    { mode: "unknown" },
  ])
    assert.throws(
      () => reviewBiography({}, { ...options, ...patch }),
      RangeError,
    );
  assert.throws(() => reviewBiography({ death: "2019" }, options), RangeError);
});
