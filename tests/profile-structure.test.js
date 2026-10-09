import test from "node:test";
import assert from "node:assert/strict";
import {
  familyEventTypes,
  recordConfigs,
  sectionInfo,
} from "../src/core/config.js";
import { eventDomain, eventTypesInDomain } from "../src/core/event-domains.js";
import { orderedProfileSections } from "../src/core/profile-groups.js";
import { state } from "../src/core/state.js";
import { sample } from "../src/data/demo.js";
import { collectProfile } from "../src/features/profiles.js";
import { setLanguage } from "../src/i18n/index.js";
import { personBiography } from "../src/model/biography.js";
import { yearOccurrences } from "../src/model/calendar.js";
import { collectProjectEvents } from "../src/model/events.js";
import { profileRecordError } from "../src/model/profile-records.js";
import { validateImport } from "../src/model/validation.js";
import { renderBiography } from "../src/ui/biography.js";

test("mixed saved history migrates once into education, court and custody sections without losing source context", () => {
  const raw = sample(),
    p = raw.people.find((p) => p.id === "p5");
  p.legalRecords = [
    {
      id: "old-custody",
      kind: "imprisonment",
      title: "Custody episode",
      from: "2017",
      to: "2019",
      authority: "Regional Court",
      legalProvision: "Provision 12",
      fineAmount: "0",
      counterpartyId: "p6",
      sourceId: "d1",
      notes: "Archive note",
    },
  ];
  p.events.push({
    id: "old-court",
    category: "legal",
    title: "Court hearing",
    date: "2020-04-10",
    repeat: "annual",
    sourceId: "d1",
    notes: "Hearing notes",
  });
  p.occupations.push({
    id: "old-study",
    kind: "education",
    organization: "Northern College",
    role: "Architecture",
    from: "2001",
    to: "2006",
    location: "Kyiv",
    status: "former",
    income: "0",
    currency: "UAH",
    sourceId: "d1",
    basis: "source",
    verification: "corroborated",
    reportedBy: "Archivist",
    notes: "Original study notes",
  });
  const project = validateImport(raw),
    migrated = project.people.find((p) => p.id === "p5");
  assert.equal(
    migrated.events.some((e) => e.id === "old-court"),
    false,
  );
  assert.equal(
    migrated.occupations.some((e) => e.id === "old-study"),
    false,
  );
  assert.equal(
    migrated.legalRecords.some((e) => e.id === "old-custody"),
    false,
  );
  const custody = migrated.custodyRecords.find((e) => e.id === "old-custody");
  for (const key of [
    "from",
    "to",
    "authority",
    "legalProvision",
    "fineAmount",
    "counterpartyId",
    "sourceId",
    "notes",
  ])
    assert.equal(custody[key], p.legalRecords[0][key]);
  const court = migrated.legalRecords.find((e) => e.id === "old-court");
  assert.equal(court.date, "2020-04-10");
  assert.equal(court.sourceId, "d1");
  assert.equal(court.notes, "Hearing notes");
  const study = migrated.educationRecords.find((e) => e.id === "old-study");
  assert.equal(study.institution, "Northern College");
  assert.equal(study.field, "Architecture");
  assert.equal(study.sourceId, "d1");
  assert.equal(study.verification, "corroborated");
  assert.match(study.notes, /Original study notes\nincome: 0\ncurrency: UAH/);
  assert.deepEqual(validateImport(project), project);
  const events = collectProjectEvents(project).filter(
    (e) => e.recordId === "old-court" || e.recordId === "old-custody",
  );
  assert.ok(events.length > 0);
  assert.ok(events.every((e) => !e.annual && eventDomain(e.type) === "legal"));
  assert.ok(!yearOccurrences(events, "2026").length);
  const invalid = structuredClone(raw);
  invalid.people[4].custodyRecords = {};
  assert.throws(() => validateImport(invalid));
  invalid.people[4].custodyRecords = [{ ...p.legalRecords[0] }];
  assert.throws(() => validateImport(invalid));
});

test("education, dated interests and custody retain complete fields in forms, imports, search-independent biographies and every language", () => {
  const raw = sample(),
    p = raw.people.find((p) => p.id === "p5");
  p.educationRecords = [
    {
      id: "study",
      institution: "Northern University",
      institutionType: "university",
      field: "Architecture",
      qualification: "Master of Architecture",
      from: "2005",
      to: "2010",
      graduatedAt: "2010",
      specialtyCode: "191",
      faculty: "Design",
      studyMode: "Full time",
      admissionReference: "A-2005-14",
      diplomaSeries: "NU",
      diplomaNumber: "2010-1432",
      issuedAt: "2010-06-24",
      sourceId: "d1",
    },
  ];
  p.skillRecords = [
    {
      id: "hobby",
      category: "interest",
      name: "Watercolor painting",
      from: "2015",
      to: "2020",
      timeStatus: "past",
      sourceId: "d1",
    },
  ];
  p.personalRecords = [
    {
      id: "outlook",
      category: "values",
      title: "Community volunteering",
      from: "2021",
      timeStatus: "current",
      basis: "self",
    },
  ];
  p.custodyRecords = [
    {
      id: "custody",
      kind: "imprisonment",
      title: "Sentence record",
      from: "2017-01-03",
      to: "2019-01-03",
      facility: "Northbank Correctional Centre",
      location: "12 River Road",
      country: "Canada",
      caseNumber: "C-2016-143",
      proceedingNumber: "P-2016-417",
      authority: "Regional Court",
      date: "2016-12-20",
      legalProvision: "Charge provision 12",
      convictionProvision: "Judgment provision 14",
      charges: "Recorded charge description",
      sentence: "Two years",
      terms: "Recorded conditions",
      creditedTime: "Three months",
      releasedAt: "2018-10-03",
      releaseGrounds: "Recorded release order",
      decisionReference: "J-2016-19",
      decisionUrl: "https://example.org/judgment",
      sourceId: "d1",
      verification: "pending",
    },
  ];
  state.project = validateImport(raw);
  const profile = state.project.people.find((p) => p.id === "p5");
  const form = new FormData();
  for (const [section, cfg] of Object.entries(recordConfigs()))
    for (const item of profile[cfg.key]) {
      form.append(section + "-id", item.id);
      for (const [key] of cfg.fields)
        form.append(section + "-" + key, item[key]);
    }
  const collected = collectProfile(form);
  for (const key of [
    "educationRecords",
    "skillRecords",
    "personalRecords",
    "custodyRecords",
  ])
    assert.deepEqual(collected[key], profile[key]);
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(state.project, "p5"));
    for (const value of [
      "Northern University",
      "Architecture",
      "Master of Architecture",
      "2005",
      "2010",
      "191",
      "Design",
      "A-2005-14",
      "2010-1432",
      "Watercolor painting",
      "Community volunteering",
      "Northbank Correctional Centre",
      "P-2016-417",
      "Charge provision 12",
      "Judgment provision 14",
      "Recorded release order",
      "J-2016-19",
    ])
      assert.ok(html.includes(value), value);
    assert.match(html, /data-biography-section="custody"/);
  }
  setLanguage("en");
  const events = collectProjectEvents(state.project);
  assert.ok(
    events.some((e) => e.type === "skill" && e.date === "2020" && !e.annual),
  );
  assert.ok(
    events.some((e) => e.type === "personal" && e.date === "2021" && !e.annual),
  );
  const cfg = recordConfigs();
  assert.equal(
    profileRecordError(cfg.education, { from: "2005", graduatedAt: "2010" }),
    "",
  );
  assert.ok(
    profileRecordError(cfg.education, { from: "2011", graduatedAt: "2010" }),
  );
  assert.ok(profileRecordError(cfg.custody, { from: "2020", to: "2019" }));
  assert.ok(
    profileRecordError(cfg.custody, {
      from: "2020-04-02",
      releasedAt: "2020-04-01",
    }),
  );
  assert.ok(
    profileRecordError(cfg.custody, { decisionUrl: "javascript:alert(1)" }),
  );
  assert.ok(profileRecordError(cfg.personal, { from: "2022", to: "2021" }));
});

test("all section and date categories are distinct and memorials never receive celebration milestone badges", () => {
  const sections = orderedProfileSections();
  assert.equal(new Set(sections).size, sections.length);
  assert.deepEqual(Object.keys(sectionInfo()), sections);
  for (const key of Object.keys(recordConfigs()))
    assert.ok(sections.includes(key));
  for (const type of Object.keys(familyEventTypes()))
    assert.ok(eventDomain(type), type);
  const family = Object.keys(eventTypesInDomain(familyEventTypes(), "family"));
  assert.ok(
    !family.some((key) =>
      ["legal", "custody", "sanction", "testimony", "finance"].includes(key),
    ),
  );
  const events = yearOccurrences(
    [
      { id: "birthday", type: "birth", date: "2000-04-12", annual: true },
      {
        id: "remembered-birthday",
        type: "birth",
        date: "2000-04-12",
        annual: true,
        memorial: true,
      },
      { id: "memorial", type: "memorial", date: "2000-04-12", annual: true },
      { id: "death", type: "death", date: "2000-04-12", annual: true },
      { id: "wedding", type: "anniversary", date: "2000-04-12", annual: true },
    ],
    "2025",
  );
  assert.deepEqual(
    events
      .filter((e) => e.jubilee)
      .map((e) => e.id)
      .sort(),
    ["birthday", "wedding"],
  );
});
