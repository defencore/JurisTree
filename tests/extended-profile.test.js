import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { recordConfigs } from "../src/core/config.js";
import { validateImport } from "../src/model/validation.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { personBiography } from "../src/model/biography.js";
import { collectProfile } from "../src/features/profiles.js";
import { pinchCamera } from "../src/graph/touch.js";
import { setLanguage } from "../src/i18n/index.js";

test("extended records survive import and collection while hidden in the workspace", () => {
  setLanguage("en");
  const model = sample();
  Object.assign(model.people[4], {
    identityDocuments: [
      {
        id: "test-passport",
        kind: "passport",
        passportType: "ordinary",
        series: "DEMO",
        number: "DEMO-ONLY",
        issueDate: "2024-01-01",
        expiryDate: "2034-01-01",
        issuedBy: "Fictional authority",
        sourceId: "d3",
      },
    ],
    immigrationRecords: [
      {
        id: "test-visa",
        country: "Exampleland",
        status: "visa",
        category: "DEMO",
        from: "2024",
        to: "2026",
        sourceId: "d3",
      },
    ],
    taxRecords: [
      {
        id: "test-tax",
        country: "Exampleland",
        year: "2025",
        taxId: "DEMO-NOT-A-TIN",
        income: "0",
        taxPaid: "12.50",
        currency: "USD",
        sourceId: "d3",
      },
    ],
    personalRecords: [
      {
        id: "test-view",
        category: "religion",
        title: "Fictional viewpoint",
        description: "Demo only",
        basis: "self",
        recordedAt: "2026-01-01",
        sourceId: "d3",
      },
    ],
    customFacts: [
      {
        id: "test-fact",
        title: "Custom field",
        value: "Example",
        sourceId: "d3",
      },
    ],
  });
  state.project = validateImport(model);
  const p = state.project.people[4];
  const form = new FormData();
  for (const [section, cfg] of Object.entries(recordConfigs()))
    for (const record of p[cfg.key] || []) {
      form.append(section + "-id", record.id);
      for (const [key] of cfg.fields)
        form.append(section + "-" + key, record[key] || "");
    }
  const collected = collectProfile(form);
  for (const key of [
    "identityDocuments",
    "immigrationRecords",
    "taxRecords",
    "personalRecords",
    "customFacts",
  ])
    assert.deepEqual(collected[key], p[key]);
  assert.equal(collected.taxRecords[0].income, "0");
  assert.ok(
    personBiography(state.project, "p5").documents.some((d) => d.id === "d3"),
  );
});

test("profile validation rejects invalid document chronology, tax years and amounts", () => {
  setLanguage("en");
  const configs = recordConfigs();
  assert.ok(
    profileRecordError(configs.identity, {
      issueDate: "2026-01-01",
      expiryDate: "2025-01-01",
    }),
  );
  assert.ok(
    profileRecordError(configs.immigration, { from: "not a year", to: "2026" }),
  );
  assert.ok(profileRecordError(configs.taxation, { year: "25" }));
  assert.ok(profileRecordError(configs.taxation, { income: "Infinity" }));
  assert.equal(
    profileRecordError(configs.taxation, {
      year: "2025",
      income: "0",
      deductions: "-12.50",
    }),
    "",
  );
  const model = sample();
  model.people[4].taxRecords = [
    { id: "bad-tax", year: "2025", income: "invalid" },
  ];
  assert.throws(() => validateImport(model));
});

test("pinch camera preserves the focal point and clamps zoom", () => {
  const camera = { x: 10, y: 20, z: 1 };
  const start = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
  ];
  const current = [
    { x: 70, y: 140 },
    { x: 270, y: 140 },
  ];
  const next = pinchCamera(camera, start, current);
  assert.equal(next.z, 2);
  assert.equal((170 - next.x) / next.z, (150 - camera.x) / camera.z);
  assert.equal((140 - next.y) / next.z, (100 - camera.y) / camera.z);
  assert.equal(
    pinchCamera(camera, start, [
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
    ]).z,
    2.5,
  );
});

test("demo identities and relationships are explicit fictional placeholders", () => {
  const model = sample();
  assert.ok(model.title.includes("fictional"));
  assert.ok(
    model.people.every(
      (p) => /\b(Doe|Roe)\b/.test(p.name) && p.notes.includes("Fictional"),
    ),
  );
});
