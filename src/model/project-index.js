import { recordConfigs } from "../core/config.js";
import { propertyPeople, propertySources } from "./property-records.js";

function append(map, id, item) {
  if (!map.has(id)) map.set(id, []);
  map.get(id).push(item);
}
function associate(map, key, ids) {
  if (!map.has(key)) map.set(key, new Set());
  for (const id of ids) map.get(key).add(id);
}

/** Index entity references and complete profiles in project order, independently of UI filters. */
export function createProjectIndex(project) {
  const index = { project };
  for (const key of ["people", "relations", "documents", "property", "groups"])
    index[key] = new Map(project[key].map((item) => [item.id, item]));
  for (const key of [
    "peopleDocs",
    "relationDocs",
    "propertyDocs",
    "profileDocs",
    "personRelations",
    "personProperty",
    "testimony",
  ])
    index[key] = new Map();

  const sourcePeople = new Map(),
    propertyBySource = new Map(),
    assetPeople = new Map(),
    configs = Object.values(recordConfigs());
  for (const relation of project.relations)
    for (const id of new Set([relation.from, relation.to]))
      append(index.personRelations, id, relation);
  for (const asset of project.property) {
    const ids = propertyPeople(asset);
    assetPeople.set(asset.id, ids);
    for (const id of ids) append(index.personProperty, id, asset);
    for (const source of propertySources(asset)) {
      associate(propertyBySource, source, [asset.id]);
      associate(sourcePeople, source, ids);
    }
  }
  for (const person of project.people) {
    const sources = [
      ...(person.bioSourceIds || []),
      ...(person.healthSourceIds || []),
      ...configs.flatMap((cfg) =>
        (person[cfg.key] || []).map((r) => r.sourceId),
      ),
    ].filter(Boolean);
    for (const source of sources) associate(sourcePeople, source, [person.id]);
    for (const record of person.witnessRecords || []) {
      if (!record.witnessId) continue;
      append(index.testimony, record.witnessId, {
        personId: person.id,
        personName: person.name,
        record,
      });
      if (record.sourceId)
        associate(sourcePeople, record.sourceId, [record.witnessId]);
    }
  }
  for (const document of project.documents) {
    const propertyIds = new Set([
      ...(document.propertyIds || []),
      ...(propertyBySource.get(document.id) || []),
    ]);
    for (const [key, ids] of [
      ["peopleDocs", document.people || []],
      ["relationDocs", document.relations || []],
      ["propertyDocs", propertyIds],
    ])
      for (const id of new Set(ids)) append(index[key], id, document);
    const profileIds = new Set([
      ...(document.people || []),
      ...(document.subjectIds || []),
      ...(sourcePeople.get(document.id) || []),
    ]);
    for (const id of document.relations || []) {
      const relation = index.relations.get(id);
      if (relation) {
        profileIds.add(relation.from);
        profileIds.add(relation.to);
      }
    }
    for (const id of propertyIds)
      for (const personId of assetPeople.get(id) || [])
        profileIds.add(personId);
    for (const id of profileIds) append(index.profileDocs, id, document);
  }
  return index;
}
