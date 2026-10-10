import { pruneImageTargets } from "./image-regions.js";
import { importContext, str, pos } from "./import/schema.js";
import { normalizeImportedPerson } from "./import/people.js";
import { normalizeImportedRelationship } from "./import/relations.js";
import { normalizeImportedProperty } from "./import/property.js";
import { normalizeImportedDocument } from "./import/documents.js";
import { normalizePlacementLocks } from "./placement-locks.js";
import { normalizeDiagram } from "./diagram.js";
import { MAX_ATTACHMENT_FILES } from "../core/attachments.js";
import { projectAttachmentIds } from "./source-attachments.js";
import { normalizeProfileReferences } from "./profile-references.js";
import { defaultScopes } from "../core/workspace-modes.js";
import { groupColors, recordConfigs, sectionInfo } from "../core/config.js";
import { normalizeGraphView } from "../core/graph-view.js";
import { normalizePersonFilter } from "../core/person-filter-fields.js";
import { translate } from "../i18n/index.js";
import { migrateProfileSectionKeys } from "./profile-activities.js";
import { fresh } from "./project.js";
import { MAP_VIEW_LIMIT, normalizeMapView } from "./map-views.js";
import { propertyRecords } from "./property-records.js";

export function validateImport(raw) {
  if (!raw || raw.format !== "juristree" || raw.version !== 1)
    throw Error(translate("ui.unsupportedJuristreeArchive"));
  const p = fresh();
  for (const k of [
    "title",
    "purpose",
    "jurisdiction",
    "subjectId",
    "claimantId",
    "updatedAt",
  ])
    if (typeof raw[k] === "string") p[k] = raw[k].slice(0, 1500);
  if (!defaultScopes[p.purpose]) p.purpose = "family";
  p.demo = !!raw.demo;
  const { list } = importContext(raw);
  p.groups = list("groups", 150, true).map((g) => ({
    id: g.id,
    name: str(g.name, 150) || translate("ui.familyGroup"),
    color: /^#[0-9a-f]{6}$/i.test(g.color) ? g.color : groupColors[0],
    notes: str(g.notes, 5000),
    collapsed: !!g.collapsed,
    x: Number.isFinite(g.x) ? pos(g.x) : null,
    y: Number.isFinite(g.y) ? pos(g.y) : null,
  }));
  p.personFilterViews = list("personFilterViews", 20, true).map((view) => {
    const name = str(view.name, 150).trim();
    if (!name) throw Error(translate("ui.filterNameRequired"));
    try {
      const query = normalizePersonFilter(view.query);
      if (
        query.rules.some(
          (r) =>
            r.field === "section" &&
            !Object.hasOwn(recordConfigs(), r.value) &&
            !["missing", "known"].includes(r.operator),
        )
      )
        throw Error("Invalid profile filter section");
      return { id: view.id, name, query };
    } catch {
      throw Error(translate("ui.filterInvalidCondition"));
    }
  });
  const groupIds = new Set(p.groups.map((g) => g.id));
  p.people = list("people", 600).map((v) =>
    normalizeImportedPerson(v, groupIds),
  );
  const peopleIds = new Set(p.people.map((x) => x.id));
  p.relations = list("relations", 2500).map((r) =>
    normalizeImportedRelationship(r, peopleIds),
  );
  const relIds = new Set(p.relations.map((r) => r.id));
  p.graphView = normalizeGraphView(raw.graphView || {}, relIds);
  p.property = list("property", 500).map((a) =>
    normalizeImportedProperty(a, peopleIds),
  );
  const assetIds = new Set(p.property.map((a) => a.id));
  const documentContext = {
    peopleIds,
    relIds,
    assetIds,
    legacyDefault: !Object.hasOwn(raw, "modeVisibilityVersion"),
  };
  p.documents = list("documents", 1200).map((d) =>
    normalizeImportedDocument(d, documentContext),
  );
  if (projectAttachmentIds(p).size > MAX_ATTACHMENT_FILES)
    throw Error(
      translate("ui.projectAttachmentLimit", { limit: MAX_ATTACHMENT_FILES }),
    );
  const docIds = new Set(p.documents.map((d) => d.id));
  for (const asset of p.property)
    for (const { record } of propertyRecords(asset))
      if (record.sourceId && !docIds.has(record.sourceId)) record.sourceId = "";
  for (const person of p.people) {
    for (const key of ["bioSourceIds", "healthSourceIds"])
      person[key] = person[key].filter((id) => docIds.has(id));
  }
  normalizeProfileReferences(p);
  pruneImageTargets(p);
  const indegrees = new Map(p.people.map((x) => [x.id, 0])),
    children = new Map(p.people.map((x) => [x.id, []]));
  for (const r of p.relations)
    if (["parent", "adopted", "step_parent"].includes(r.type)) {
      indegrees.set(r.to, indegrees.get(r.to) + 1);
      children.get(r.from).push(r.to);
    }
  const queue = [...indegrees].filter(([, v]) => !v).map(([id]) => id);
  let processed = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    processed++;
    for (const child of children.get(id)) {
      indegrees.set(child, indegrees.get(child) - 1);
      if (!indegrees.get(child)) queue.push(child);
    }
  }
  if (processed !== p.people.length)
    throw Error(translate("ui.parentRelationshipsCreateAGenerationCycle"));
  p.scopePreferences = {};
  for (const purpose of Object.keys(defaultScopes)) {
    const value = raw.scopePreferences?.[purpose];
    if (Array.isArray(value))
      p.scopePreferences[purpose] = migrateProfileSectionKeys(value).filter(
        (k) => Object.hasOwn(sectionInfo(), k),
      );
  }
  if (!peopleIds.has(p.subjectId)) p.subjectId = "";
  if (!peopleIds.has(p.claimantId)) p.claimantId = "";
  try {
    p.diagram = normalizeDiagram(raw.diagram, p);
  } catch {
    throw Error(translate("ui.invalidDiagramRoutes"));
  }
  try {
    p.placementLocks = normalizePlacementLocks(raw.placementLocks, p);
  } catch {
    throw Error(translate("ui.invalidPlacementLocks"));
  }
  try {
    p.mapViews = list("mapViews", MAP_VIEW_LIMIT, true).map((view) =>
      normalizeMapView(view, p),
    );
  } catch {
    throw Error(translate("ui.invalidMapViews"));
  }
  return p;
}
