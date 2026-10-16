import test from "node:test";
import assert from "node:assert/strict";
import {
  documentCatalog,
  documentCategories,
  documentTypes,
} from "../src/core/document-catalog.js";
import { documentDetailsConfig } from "../src/core/document-details.js";
import { state } from "../src/core/state.js";
import { setLanguage } from "../src/i18n/index.js";
import { sample } from "../src/data/demo.js";
import { normalizeDocumentDetails } from "../src/model/document-details.js";
import {
  normalizeDocumentLinks,
  pruneDocumentLinks,
} from "../src/model/document-links.js";
import { documentMatches } from "../src/model/document-library.js";
import { validateImport } from "../src/model/validation.js";
import { personBiography } from "../src/model/biography.js";
import { createProjectIndex } from "../src/model/project-index.js";
import { linkedDocs } from "../src/model/evidence.js";
import {
  personImageItems,
  sourcePeopleIds,
} from "../src/model/image-regions.js";
import {
  recordSources,
  sourceRecordLinks,
} from "../src/model/source-record-links.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";
import { commit, undo, redo } from "../src/services/history.js";
import { usedBlobs } from "../src/services/blobs.js";
import { renderBiography } from "../src/ui/biography.js";
import { groupedDocuments } from "../src/ui/document-catalog.js";

function fixture() {
  const project = sample();
  project.people = project.people.slice(0, 2);
  project.people.forEach((person) => {
    person.groupIds = [];
    person.residences = [
      {
        id: "address-" + person.id,
        address: "12 Willow Lane",
        from: "2000",
        to: "2010",
        sourceId: "primary",
      },
    ];
  });
  project.groups = [];
  project.relations = [];
  project.property = [];
  const template = project.documents[0];
  const document = (id, type, date) => ({
    ...template,
    id,
    title: id,
    type,
    date,
    people: [],
    subjectIds: [],
    relations: [],
    propertyIds: [],
    attachments: [],
    purposes: [],
  });
  const shared = document("shared", "residence_extract", "2010-02-12");
  shared.details = {
    number: "DL-42",
    issuedBy: "Willow Community",
    registryName: "Community register",
    registrationDate: "2010-02",
    copyKind: "certified_copy",
    originalLocation: "Family folder A",
  };
  shared.recordLinks = project.people.map((person) => ({
    personId: person.id,
    section: "residences",
    recordId: "address-" + person.id,
  }));
  shared.attachments = [
    {
      assetId: "shared-pdf",
      filename: "Residence.pdf",
      mime: "application/pdf",
      size: 12,
      caption: "Extract",
      description: "",
      inscription: "",
      regions: [],
    },
    {
      assetId: "shared-image",
      filename: "Residence.png",
      mime: "image/png",
      size: 12,
      caption: "Page 1",
      description: "",
      inscription: "",
      regions: [],
    },
  ];
  project.documents = [
    document("primary", "archive", "2001"),
    shared,
    document("tax", "tax_card", ""),
  ];
  return { project: validateImport(project), target: shared.recordLinks[0] };
}

test("the document catalogue has distinct property, residence, tax, bank and civil categories in every language", () => {
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const catalog = documentCatalog(),
      categories = documentCategories();
    assert.equal(Object.keys(categories).length, 9);
    assert.ok(Object.keys(catalog).length > 55);
    for (const [key, item] of Object.entries(catalog)) {
      assert.ok(categories[item.category]);
      assert.equal(documentTypes()[key], item.label);
      assert.ok(item.icon && !item.label.startsWith("ui."));
    }
    assert.equal(catalog.ownership.category, "property");
    assert.equal(catalog.bank_account.category, "financial");
    assert.equal(catalog.residence_extract.category, "residence");
    assert.notEqual(
      catalog.tax_card.label,
      catalog.tax_registration_form.label,
    );
    assert.ok(
      documentDetailsConfig().fields.every(
        ([, label]) => label && !label.startsWith("ui."),
      ),
    );
  }
  setLanguage("en");
});

test("optional particulars retain partial dates, copy certification and identifiers without inferring evidence", () => {
  const { project } = fixture(),
    source = project.documents[1];
  assert.deepEqual(
    validateImport(JSON.parse(JSON.stringify(project))).documents[1],
    source,
  );
  assert.deepEqual(normalizeDocumentDetails(), {});
  assert.deepEqual(
    normalizeDocumentDetails({ copyKind: "unspecified", number: " 42 " }),
    { number: "42" },
  );
  const before = source.evidence;
  source.details.copyKind = "original";
  assert.equal(validateImport(project).documents[1].evidence, before);
  for (const value of [
    null,
    [],
    { number: 42 },
    { copyKind: "official" },
    { number: "x".repeat(1001) },
    { validFrom: "2020", validUntil: "2019" },
    { registrationDate: "2020-02-31" },
    { certifiedAt: "yesterday" },
  ])
    assert.throws(() => normalizeDocumentDetails(value));
});

test("one document supports several exact profile records and each record retains all sources without duplicate files", () => {
  const { project, target } = fixture(),
    shared = project.documents[1];
  assert.deepEqual(
    recordSources(project, target).map((source) => source.id),
    ["primary", "shared"],
  );
  assert.equal(sourceRecordLinks(project, "shared").length, 2);
  assert.deepEqual(sourcePeopleIds(project, shared), ["p1", "p2"]);
  for (const person of project.people) {
    const biography = personBiography(project, person.id);
    assert.equal(
      biography.documents.filter((source) => source.id === "shared").length,
      1,
    );
    assert.equal(person.residences[0].sourceId, "primary");
    assert.equal(
      personImageItems(project, person.id, {
        section: "residences",
        recordId: "address-" + person.id,
      })[0].file.assetId,
      "shared-image",
    );
  }
  const files = new Map([
    ["shared-pdf", new Blob(["PDF"])],
    ["shared-image", new Blob(["image"])],
  ]);
  assert.deepEqual(usedBlobs(project, files).sort(), [
    "shared-image",
    "shared-pdf",
  ]);
  state.project = project;
  state.renderIndex = null;
  assert.ok(linkedDocs("person", "p2").includes(shared));
  state.renderIndex = createProjectIndex(project);
  assert.ok(linkedDocs("person", "p2").includes(shared));
  state.renderIndex = null;
});

test("explicit document links and particulars participate in person search and combined library search", () => {
  const { project } = fixture(),
    shared = project.documents[1];
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const results = searchIndex(buildSearchIndex(project), '"DL-42"');
    for (const id of ["p1", "p2"])
      assert.ok(
        results.some((result) => result.kind === "person" && result.id === id),
      );
    assert.ok(
      results.some(
        (result) => result.kind === "document" && result.id === "shared",
      ),
    );
    assert.ok(
      documentMatches(project, shared, "DL-42 Willow 02.2010", "residence"),
    );
    assert.ok(!documentMatches(project, shared, "DL-42", "financial"));
    assert.ok(!documentMatches(project, shared, "not recorded"));
  }
  setLanguage("en");
});

test("invalid link shapes are rejected and deletion prunes only missing targets, retaining sources and surviving participants", () => {
  const { project, target } = fixture();
  for (const value of [
    null,
    {},
    [{}],
    [{ ...target, section: "unknown" }],
    [{ ...target, personId: "<script>" }],
    Array(501).fill(target),
  ])
    assert.throws(() => normalizeDocumentLinks(value));
  assert.deepEqual(normalizeDocumentLinks([target, target]), [target]);
  project.people[0].residences = [];
  const attachments = structuredClone(project.documents[1].attachments);
  pruneDocumentLinks(project);
  assert.equal(project.documents[1].recordLinks.length, 1);
  assert.equal(project.documents[1].recordLinks[0].personId, "p2");
  assert.deepEqual(project.documents[1].attachments, attachments);
  project.people.pop();
  assert.deepEqual(validateImport(project).documents[1].recordLinks, []);
});

test("record deletion and its supporting links restore together through undo and redo", () => {
  const { project } = fixture();
  state.project = project;
  state.history = [];
  state.future = [];
  commit(() => {
    state.project.people[0].residences = [];
  });
  assert.equal(state.project.documents[1].recordLinks.length, 1);
  undo();
  assert.equal(state.project.documents[1].recordLinks.length, 2);
  assert.equal(state.project.people[0].residences.length, 1);
  redo();
  assert.equal(state.project.documents[1].recordLinks.length, 1);
  assert.equal(state.project.documents[1].attachments.length, 2);
});

test("biographies group documents by subject, print only entered particulars and place family context before detailed records", () => {
  const { project } = fixture();
  project.relations = [
    {
      id: "marriage",
      type: "spouse",
      from: "p1",
      to: "p2",
      date: "2000",
      status: "current",
    },
  ];
  state.project = project;
  state.blobs = new Map();
  for (const language of ["en", "uk", "ru"]) {
    setLanguage(language);
    const html = renderBiography(personBiography(project, "p1"));
    assert.match(html, /data-document-category="residence"/);
    assert.match(html, /DL-42/);
    assert.ok(
      html.indexOf('data-biography-section="relationships"') <
        html.indexOf('data-biography-section="residences"'),
    );
    assert.match(html, /Family folder A/);
    assert.ok(
      !html.includes(
        documentDetailsConfig().fields.find(
          ([key]) => key === "certifiedBy",
        )[1],
      ),
    );
  }
  const docs = [
    { type: "death", title: "Later", date: "2020" },
    { type: "birth", title: "Earlier", date: "1980-05" },
    { type: "marriage", title: "Undated", date: "" },
    { type: "bank_statement", title: "Bank", date: "2000" },
  ];
  assert.deepEqual(
    groupedDocuments(docs).map((group) => [
      group.key,
      group.documents.map((source) => source.title),
    ]),
    [
      ["civil", ["Earlier", "Later", "Undated"]],
      ["financial", ["Bank"]],
    ],
  );
  setLanguage("en");
});
