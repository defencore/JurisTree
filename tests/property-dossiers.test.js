import test from "node:test";
import assert from "node:assert/strict";
import { fresh } from "../src/model/project.js";
import { validateImport } from "../src/model/validation.js";
import {
  economicAssetGroups,
  propertyInventorySummary,
  estateCategory,
  cashFlowAnalysis,
} from "../src/model/property-analysis.js";
import { propertyRecordError } from "../src/model/property-records.js";
import { propertyLineageError } from "../src/model/property-details.js";
import { propertyRecordDocuments } from "../src/model/property-document-links.js";
import { pruneDocumentLinks } from "../src/model/document-links.js";
import {
  evidenceRegisterCsv,
  evidenceRegisterSelection,
} from "../src/model/evidence-register.js";
import { normalizeDocumentDetails } from "../src/model/document-details.js";
import { createProjectIndex } from "../src/model/project-index.js";
import { sourcePeopleIds } from "../src/model/image-regions.js";
import { propertyWorkspace } from "../src/ui/property-workspace.js";
import { state } from "../src/core/state.js";

const asset = (id, changes = {}) => ({
  id,
  title: id,
  value: 100,
  currency: "USD",
  ownerId: "owner",
  holdingKind: "personal",
  allocations: [],
  rights: [],
  transfers: [],
  claims: [],
  ...changes,
});
const right = (changes) => ({
  id: "right",
  kind: "ownership",
  personId: "owner",
  from: "2000-01-01",
  to: "2020-05-06",
  sharePercent: "100",
  status: "ended",
  ...changes,
});
const payment = (changes) => ({
  id: "payment",
  kind: "rent",
  fromId: "tenant",
  toId: "owner",
  date: "2019-06-01",
  amount: "0.1",
  currency: "USD",
  verification: "corroborated",
  sourceId: "bank",
  ...changes,
});
function fixture() {
  const project = fresh();
  project.people = [
    {
      id: "owner",
      name: "Robin Doe",
      birth: "1950",
      death: "2020-05-06",
      gender: "m",
    },
    { id: "tenant", name: "Alex Roe", birth: "1980", gender: "f" },
  ];
  project.property = [asset("plot", { rights: [right({})] })];
  project.documents = [
    {
      id: "bank",
      title: "Bank statement",
      type: "bank_statement",
      status: "available",
      verification: "corroborated",
      evidence: "official",
      people: [],
      relations: [],
      propertyIds: [],
      attachments: [],
      purposes: [],
    },
  ];
  return project;
}

test("object particulars, encumbrances, payments, claims and custody survive the import boundary together", () => {
  const project = fixture(),
    item = project.property[0];
  Object.assign(item, {
    cadastralNumber: "123:456:789",
    registrationNumber: "REG-501",
    initialOwnerId: "owner",
    acquiredAt: "2000-01",
    acquisitionGrounds: "Purchase deed",
    economicAssetKey: "Riverside",
    countingRole: "primary",
    sourceId: "bank",
    companyName: "Willow Holdings",
    companyNumber: "C-150",
  });
  item.encumbrances = [
    {
      id: "mortgage",
      kind: "mortgage",
      from: "2010",
      to: "2015",
      externalPerson: "Willow Bank",
      reference: "M-15",
      sourceId: "bank",
    },
  ];
  item.cashFlows = [payment({})];
  item.claims = [
    {
      id: "demand",
      kind: "inheritance",
      personId: "tenant",
      status: "potential",
      amount: "200",
      currency: "USD",
      remedy: "Recognize a recorded share",
      risks: "Original deed not obtained",
      limitationNotes: "Refer for review",
      sourceId: "bank",
    },
  ];
  project.documents[0].details = {
    custodian: "Notarial archive",
    copyKind: "certified_copy",
    supportedFact: "Payment and account details",
    acquisitionRoute: "Request with record number",
    inventoryNumber: "INV-12",
    receivedAt: "2026-10-20",
    receivedFrom: "Archive officer",
  };
  project.documents[0].propertyRecordLinks = [
    { propertyId: "plot", kind: "cashFlows", recordId: "payment" },
  ];
  const restored = validateImport(project),
    row = restored.property[0];
  for (const key of [
    "cadastralNumber",
    "registrationNumber",
    "initialOwnerId",
    "acquiredAt",
    "acquisitionGrounds",
    "economicAssetKey",
    "sourceId",
    "companyName",
  ])
    assert.equal(row[key], item[key]);
  assert.equal(row.cashFlows[0].amount, "0.1");
  assert.equal(row.encumbrances[0].reference, "M-15");
  assert.equal(row.claims[0].risks, "Original deed not obtained");
  assert.deepEqual(restored.documents[0].details, project.documents[0].details);
  assert.deepEqual(
    restored.documents[0].propertyRecordLinks,
    project.documents[0].propertyRecordLinks,
  );
});

test("historical and divided cards require an explicit group valuation and never multiply values or claims", () => {
  const project = fixture();
  project.property = [
    asset("old", {
      recordStage: "historical",
      economicAssetKey: "land",
      claims: [{ personId: "owner", kind: "ownership", status: "potential" }],
    }),
    asset("new-a", {
      predecessorId: "old",
      claims: [{ personId: "owner", kind: "ownership", status: "asserted" }],
    }),
    asset("new-b", { predecessorId: "old" }),
  ];
  let summary = propertyInventorySummary(project);
  assert.equal(summary.groups.length, 1);
  assert.deepEqual(summary.totals, {});
  assert.equal(summary.excluded, 1);
  assert.ok(summary.groups[0].issues.includes("assetRepeatedClaims"));
  project.property[0].countingRole = "reference";
  project.property[1].countingRole = "primary";
  project.property[1].value = 200;
  project.property[2].countingRole = "reference";
  summary = propertyInventorySummary(project);
  assert.deepEqual(summary.totals, { USD: 200 });
  project.property[1].recordStage = "historical";
  assert.deepEqual(propertyInventorySummary(project).totals, {});
});

test("matching unlinked cadastral numbers block totals, currencies and corporate assets stay separate, and decimal sums are exact", () => {
  const project = fixture();
  project.property = [
    asset("a", { cadastralNumber: "12:34", value: 0.1 }),
    asset("b", { cadastralNumber: "12:34", value: 0.2 }),
  ];
  assert.ok(
    economicAssetGroups(project).every((g) =>
      g.issues.includes("assetPossibleDuplicate"),
    ),
  );
  assert.deepEqual(propertyInventorySummary(project).totals, {});
  project.property[1].cadastralNumber = "12:35";
  project.property.push(
    asset("corporate", { holdingKind: "company", value: 900, currency: "EUR" }),
    asset("unknown", { holdingKind: "unspecified", value: 50 }),
  );
  const summary = propertyInventorySummary(project);
  assert.deepEqual(summary.totals, { USD: 0.3 });
  assert.deepEqual(summary.corporateTotals, { EUR: 900 });
  assert.deepEqual(summary.unclassifiedTotals, { USD: 50 });
});

test("estate categories respect the date of death, disposal, corporate ownership and imprecise dates", () => {
  const project = fixture(),
    item = project.property[0];
  assert.equal(estateCategory(item, project, "owner"), "atDeath");
  item.rights[0].to = "2010-01-01";
  item.transfers = [
    {
      fromId: "owner",
      rightKind: "ownership",
      date: "2010-01-02",
      verification: "unspecified",
    },
  ];
  assert.equal(estateCategory(item, project, "owner"), "disposed");
  item.rights[0].to = "2020-05-06";
  item.transfers[0].sharePercent = "100";
  assert.equal(estateCategory(item, project, "owner"), "uncertain");
  item.holdingKind = "company";
  assert.equal(estateCategory(item, project, "owner"), "corporate");
  item.holdingKind = "personal";
  project.people[0].death = "2020";
  assert.equal(estateCategory(item, project, "owner"), "uncertain");
  assert.ok(
    propertyLineageError([
      asset("a", { predecessorId: "b" }),
      asset("b", { predecessorId: "a" }),
    ]),
  );
});

test("cash-flow totals need corroborated sources, preserve decimals and detect duplicates even outside a filtered asset list", () => {
  const project = fixture(),
    item = project.property[0];
  item.cashFlows = [
    payment({}),
    payment({ id: "second", amount: "0.2", transactionKey: "B-2" }),
    payment({ id: "future", date: "2035-01-01", amount: "300" }),
    payment({ id: "no-proof", sourceId: "", amount: "400" }),
  ];
  assert.deepEqual(
    cashFlowAnalysis(project, project.property, "2026-10-27").totals,
    { USD: 0.3 },
  );
  project.property.push(
    asset("duplicate", { cashFlows: [payment({ id: "again" })] }),
  );
  const filtered = cashFlowAnalysis(project, [item], "2026-10-27");
  assert.equal(filtered.rows[0].duplicate, true);
  assert.deepEqual(filtered.totals, { USD: 0.2 });
  project.documents[0].verification = "pending";
  assert.deepEqual(cashFlowAnalysis(project, [item]).totals, {});
  assert.ok(propertyRecordError("cashFlows", payment({ toId: "tenant" })));
  assert.ok(propertyRecordError("cashFlows", payment({ amount: "0" })));
  assert.ok(propertyRecordError("cashFlows", payment({ currency: "" })));
});

test("several sources can support one property fact and deletion prunes only links while preserving documents", () => {
  const project = fixture(),
    item = project.property[0];
  item.cashFlows = [payment({ sourceId: "" })];
  const link = { propertyId: "plot", kind: "cashFlows", recordId: "payment" };
  project.documents[0].propertyRecordLinks = [link];
  project.documents.push({
    ...project.documents[0],
    id: "second-source",
    title: "Receipt",
  });
  assert.equal(
    propertyRecordDocuments(project, item.id, "cashFlows", item.cashFlows[0])
      .length,
    2,
  );
  const index = createProjectIndex(project);
  assert.equal(index.propertyDocs.get("plot").length, 2);
  assert.equal(index.profileDocs.get("owner").length, 2);
  assert.ok(sourcePeopleIds(project, project.documents[0]).includes("owner"));
  item.cashFlows = [];
  pruneDocumentLinks(project);
  assert.equal(project.documents.length, 2);
  assert.deepEqual(project.documents[0].propertyRecordLinks, []);
});

test("the evidence register filters custody facts, validates custody dates and neutralizes spreadsheet formulas", () => {
  const project = fixture();
  project.documents[0].details = {
    custodian: "=UNTRUSTED()",
    supportedFact: "Rent\naccount",
    acquisitionRoute: "Request from archive",
    inventoryNumber: "INV-3",
    copyKind: "original",
  };
  state.project = project;
  const selected = evidenceRegisterSelection(project, {
    docFilter: "Rent archive",
    docShowAll: true,
  });
  assert.equal(selected.docs.length, 1);
  const csv = evidenceRegisterCsv(selected.docs);
  assert.ok(csv.includes('"\'=UNTRUSTED()"'));
  assert.ok(csv.includes("INV-3"));
  assert.throws(() =>
    normalizeDocumentDetails({
      receivedAt: "2020-01-02",
      returnedAt: "2019-01-01",
    }),
  );
  assert.throws(() =>
    validateImport({
      ...project,
      documents: [
        {
          ...project.documents[0],
          propertyRecordLinks: [
            { propertyId: "plot", kind: "invented", recordId: "x" },
          ],
        },
      ],
    }),
  );
});

test("property review includes identity conflicts even when each individual ownership ledger is complete", () => {
  const project = fixture();
  project.property = ["first", "second"].map((id) =>
    asset(id, {
      cadastralNumber: "12:34",
      rights: [
        right({
          to: "",
          status: "current",
          verification: "corroborated",
          sourceId: "bank",
        }),
      ],
    }),
  );
  Object.assign(state, {
    project,
    renderIndex: null,
    propertyDate: "2026-10-27",
    propertyFocus: "",
    propertySearch: "",
    propertySubjectId: "",
    propertyReviewFilter: "review",
    propertyPanel: "inventory",
  });
  assert.equal(
    (propertyWorkspace().match(/class="asset-card"/g) || []).length,
    2,
  );
  project.property[1].cadastralNumber = "12:35";
  assert.equal(
    (propertyWorkspace().match(/class="asset-card"/g) || []).length,
    0,
  );
});
