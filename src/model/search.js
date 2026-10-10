import { mediaTargetLabel } from "./image-regions.js";
import { profileReferenceLabel } from "./profile-references.js";
import { relationshipLabel } from "./relationship-labels.js";
import {
  evidenceTypes,
  recordConfigs,
  relTypes,
  sectionInfo,
  statusTypes,
  types,
} from "../core/config.js";
import { relationshipConfig } from "../core/relationships.js";
import { propertyRecordConfigs } from "../core/property-records.js";
import { propertyPeople, propertyRecords } from "./property-records.js";
import { translate } from "../i18n/index.js";
import { terminologyLabel } from "./search/terminology.js";
import { genders, normalizeSearch } from "./search/query.js";
export {
  normalizeSearch,
  parseSearchQuery,
  searchIndex,
} from "./search/query.js";
import { personBiography } from "./biography.js";
import { createProjectIndex } from "./project-index.js";
import { displayDate } from "./dates.js";
import { personDisplayName, personLifeDates } from "./person-display.js";

function flat(value) {
  if (Array.isArray(value)) return value.flatMap(flat);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(flat);
  return value === "" || value == null ? [] : [String(value)];
}
function countries(value) {
  if (Array.isArray(value)) return value.flatMap(countries);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) =>
    /country|citizenship|nationality|jurisdiction/i.test(key)
      ? flat(item)
      : countries(item),
  );
}

/** Build a local index of stored values, labels and linked context, independent of workspace filters. */
export function buildSearchIndex(project) {
  const configs = recordConfigs(),
    sections = sectionInfo(),
    context = createProjectIndex(project),
    people = context.people;
  const labels = terminologyLabel;
  function recordText(cfg, record) {
    return cfg.fields
      .flatMap(([key, label, type, options]) => {
        const value = record[key];
        if (value === "" || value == null) return [];
        return [
          labels(label),
          value,
          type === "select"
            ? labels(options[value] || value)
            : ["person", "source", "relationship"].includes(type)
              ? profileReferenceLabel(project, type, value)
              : ["date", "period"].includes(type)
                ? displayDate(value)
                : "",
        ];
      })
      .join(" ");
  }
  const describeDocument = (d) =>
    [
      ...flat(d),
      ...d.attachments.flatMap((file) =>
        (file.regions || []).flatMap((region) =>
          region.targets.map((target) => mediaTargetLabel(project, target)),
        ),
      ),
      labels(types()[d.type] || ""),
      labels(statusTypes()[d.status] || ""),
      labels(evidenceTypes()[d.evidence] || ""),
    ].join(" ");
  const describeRelation = (r) =>
    [
      ...flat(r),
      people.get(r.from)?.name,
      people.get(r.to)?.name,
      labels(relTypes()[r.type]),
      recordText(relationshipConfig(), r),
    ].join(" ");
  const describeProperty = (a) =>
    [
      ...flat(a),
      people.get(a.ownerId)?.name,
      ...a.allocations.map((s) => people.get(s.personId)?.name),
      ...[...propertyPeople(a)].map((id) => people.get(id)?.name),
      ...propertyRecords(a).map(({ kind, record }) =>
        recordText(propertyRecordConfigs()[kind], record),
      ),
    ].join(" ");
  const documentText = new Map(
    project.documents.map((d) => [d.id, describeDocument(d)]),
  );
  const relationText = new Map(
    project.relations.map((r) => [r.id, describeRelation(r)]),
  );
  const propertyText = new Map(
    project.property.map((a) => [a.id, describeProperty(a)]),
  );
  const groupMembers = new Map();
  for (const p of project.people)
    for (const id of p.groupIds || []) {
      if (!groupMembers.has(id)) groupMembers.set(id, []);
      groupMembers.get(id).push(p.name);
    }
  const entries = [];
  function add(kind, item, title, subtitle, text, fields = {}) {
    const kindLabel = translate(
      {
        person: "ui.searchPerson",
        document: "ui.searchDocument",
        relation: "ui.searchRelationship",
        property: "ui.searchProperty",
        group: "ui.searchGroup",
      }[kind],
    );
    entries.push({
      kind,
      id: item.id,
      title,
      subtitle,
      kindLabel,
      text: normalizeSearch([title, kind, labels(kindLabel), text].join(" ")),
      fields: Object.fromEntries(
        Object.entries({
          name: title,
          type: kind + " " + labels(kindLabel),
          ...fields,
        }).map(([key, value]) => [key, normalizeSearch(value)]),
      ),
    });
  }
  for (const p of project.people) {
    const bio = personBiography(project, p.id, context);
    const records = Object.entries(configs).flatMap(([key, cfg]) =>
      (p[cfg.key] || []).flatMap((r) => [
        labels(sections[key][0]),
        recordText(cfg, r),
      ]),
    );
    const documents = [
      ...bio.documents.map((d) => documentText.get(d.id)),
      ...(p.identityDocuments || []).map((r) =>
        recordText(configs.identity, r),
      ),
    ].join(" ");
    const gender = Object.keys(genders)
      .filter((term) => genders[term] === (p.gender || "u"))
      .join(" ");
    add(
      "person",
      p,
      personDisplayName(p),
      personLifeDates(p),
      [
        ...flat(p),
        ...records,
        ...bio.testimony.flatMap(({ personName, record }) => [
          personName,
          recordText(configs.witnesses, record),
        ]),
        gender,
        displayDate(p.birth),
        displayDate(p.death),
        documents,
        ...bio.relations.map((r) => relationText.get(r.id)),
        ...bio.property.map((a) => propertyText.get(a.id)),
        ...bio.groups.flatMap(flat),
      ].join(" "),
      {
        name: [
          p.name,
          p.aliases,
          ...(p.nameHistory || []).flatMap((r) => [r.fullName, r.surname]),
        ].join(" "),
        gender,
        genderCode: p.gender || "u",
        document: documents,
        country: countries(p).join(" "),
      },
    );
  }
  for (const d of project.documents)
    add("document", d, d.title, types()[d.type], documentText.get(d.id), {
      document: documentText.get(d.id),
      type: "document " + d.type + " " + labels(types()[d.type]),
      country: countries(d).join(" "),
    });
  for (const r of project.relations)
    add(
      "relation",
      r,
      [people.get(r.from)?.name, people.get(r.to)?.name].join(" ↔ "),
      relationshipLabel(r),
      relationText.get(r.id),
      { type: "relation " + r.type + " " + labels(relTypes()[r.type]) },
    );
  for (const a of project.property)
    add(
      "property",
      a,
      a.title,
      people.get(a.ownerId)?.name || "",
      propertyText.get(a.id),
    );
  for (const g of project.groups)
    add(
      "group",
      g,
      g.name,
      "",
      [...flat(g), ...(groupMembers.get(g.id) || [])].join(" "),
    );
  return entries;
}
