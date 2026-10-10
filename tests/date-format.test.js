import test from "node:test";
import assert from "node:assert/strict";
import {
  dateExact,
  dateInputValue,
  displayDate,
  displayDateTime,
  partialDate,
} from "../src/model/dates.js";
import { setLanguage } from "../src/i18n/index.js";
import { relationshipPeriod } from "../src/model/relationship-labels.js";

test("complete dates use the same day/month/year format in every language and keep historical precision", () => {
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    assert.equal(displayDate("2024-02-29"), "29.02.2024");
    assert.equal(displayDate("0099-01-02"), "02.01.0099");
    assert.equal(displayDate("1932"), "1932");
    assert.equal(displayDate(""), "");
    assert.equal(displayDate("circa 1932"), "circa 1932");
    assert.equal(displayDate("2026-02-29"), "2026-02-29");
    assert.equal(
      displayDateTime(new Date(2026, 0, 2, 3, 4).toISOString()),
      "02.01.2026 03:04",
    );
  }
  setLanguage("en");
});

test("entered dates normalize to canonical values without accepting rollover, ambiguous dates or invented precision", () => {
  assert.equal(dateInputValue(" 29.02.2024 "), "2024-02-29");
  assert.equal(dateInputValue("2024-02-29"), "2024-02-29");
  assert.equal(dateInputValue("1932"), "1932");
  assert.equal(dateInputValue(""), "");
  for (const value of [
    "29.02.2026",
    "31.04.2026",
    "01/02/2026",
    "1.2.2026",
    "00.01.2026",
  ]) {
    assert.equal(dateExact(dateInputValue(value)), "");
    assert.equal(partialDate(dateInputValue(value)), null);
  }
});

test("relationship periods show explicitly entered endpoints beneath an independently rendered title", () => {
  setLanguage("en");
  assert.equal(
    relationshipPeriod({ fromDate: "2024-02-29", toDate: "2025-04-30" }),
    "From 29.02.2024 — To 30.04.2025",
  );
  assert.equal(relationshipPeriod({ fromDate: "1932" }), "From 1932");
  assert.equal(relationshipPeriod({ toDate: "2025-04-30" }), "To 30.04.2025");
  assert.equal(relationshipPeriod({}), "");
});
