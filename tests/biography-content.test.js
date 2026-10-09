import test from "node:test";
import assert from "node:assert/strict";
import { recordConfigs } from "../src/core/config.js";
import { state } from "../src/core/state.js";
import { setLanguage, translate } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { collectProfile } from "../src/model/profile-form.js";
import { fresh } from "../src/model/project.js";
import { validateImport } from "../src/model/validation.js";
import { renderBiography } from "../src/ui/biography.js";
import { renderProfileRecord } from "../src/ui/forms/profile-record.js";

function project() {
  const p = fresh();
  p.people = [
    {
      id: "a",
      name: "Alex Doe",
      claims: [{ id: "claim", statement: "Recorded account" }],
      appearanceRecords: [{ id: "appearance", weightKg: "0" }],
    },
    { id: "b", name: "Robin Doe" },
  ];
  p.relations = [{ id: "r", from: "a", to: "b", type: "sibling" }];
  p.property = [
    {
      id: "property",
      title: "Family home",
      ownerId: "a",
      rights: [{ id: "right", kind: "ownership", personId: "a" }],
    },
  ];
  return validateImport(p);
}

test("biographies omit missing text, dates, basic unknowns and implicit verification, including undated property records", () => {
  state.project = project();
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "a"));
    for (const key of [
      "noInformationYet",
      "datesNotSpecified",
      "deathDateUnknown",
      "dateUnknown",
      "notSpecified",
      "pendingVerification",
      "lifeStatusUnknown",
      "noDigitalCopyAttachedYet",
    ])
      assert.ok(!html.includes(translate("ui." + key)), `${language}: ${key}`);
    assert.ok(html.includes("Alex Doe"));
    assert.ok(html.includes("Robin Doe"));
    assert.ok(html.includes("Recorded account"));
    assert.ok(html.includes("Family home"));
    assert.ok(html.includes("<dd>0</dd>"));
    assert.ok(!html.includes('data-biography-section="biography"'));
    assert.ok(!html.includes('data-person-status="unknown"'));
  }
  setLanguage("en");
});

test("explicit verification and partial life dates remain visible without implying missing information", () => {
  state.project = project();
  const p = state.project.people[0];
  p.claims[0].verification = "pending";
  p.birth = "1974";
  p.lifeStatus = "deceased";
  state.project = validateImport(state.project);
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "a"));
    assert.ok(html.includes(translate("ui.pendingVerification")));
    assert.ok(html.includes("1974"));
    assert.ok(html.includes(translate("ui.deceased")));
    assert.ok(!html.includes(translate("ui.deathDateUnknown")));
  }
  assert.equal(state.project.people[0].claims[0].verification, "pending");
  setLanguage("en");
});

test("optional choices start unspecified and explicitly chosen values alone are enough to retain a record", () => {
  state.project = project();
  for (const [section, cfg] of Object.entries(recordConfigs())) {
    if (!cfg.extended) continue;
    for (const [key, , type, options] of cfg.fields)
      if (type === "select")
        assert.equal(
          Object.keys(options)[0],
          "unspecified",
          `${section}.${key}`,
        );
  }
  const cfg = recordConfigs().appearance,
    form = new FormData();
  form.set("appearance-id", "appearance");
  for (const [key, , type] of cfg.fields)
    form.set("appearance-" + key, type === "select" ? "unspecified" : "");
  assert.deepEqual(collectProfile(form).appearanceRecords, []);
  form.set("appearance-glasses", "no");
  assert.equal(collectProfile(form).appearanceRecords.length, 1);
  assert.equal(collectProfile(form).appearanceRecords[0].glasses, "no");
  const html = renderProfileRecord("claims");
  assert.ok(html.includes('<option value="unspecified" selected>'));
  assert.ok(!html.includes('<option value="pending" selected>'));
});
