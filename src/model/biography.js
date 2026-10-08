import { recordConfigs } from "../core/config.js";

/** Collect the complete profile independently of workspace filters. */
export function personBiography(project, id) {
  const profile = project.people.find((p) => p.id === id);
  if (!profile) return null;
  const relations = project.relations.filter(
    (r) => r.from === id || r.to === id,
  );
  const property = project.property.filter(
    (a) =>
      a.ownerId === id || a.allocations.some((share) => share.personId === id),
  );
  const sourceIds = new Set([
    ...(profile.bioSourceIds || []),
    ...(profile.healthSourceIds || []),
    ...Object.values(recordConfigs()).flatMap((cfg) =>
      (profile[cfg.key] || []).map((record) => record.sourceId).filter(Boolean),
    ),
  ]);
  const relationIds = new Set(relations.map((r) => r.id));
  const propertyIds = new Set(property.map((a) => a.id));
  const documents = project.documents.filter(
    (d) =>
      sourceIds.has(d.id) ||
      (d.people || []).includes(id) ||
      (d.subjectIds || []).includes(id) ||
      (d.relations || []).some((rid) => relationIds.has(rid)) ||
      (d.propertyIds || []).some((aid) => propertyIds.has(aid)),
  );
  return {
    profile,
    relations,
    property,
    documents,
    groups: project.groups.filter((g) =>
      (profile.groupIds || []).includes(g.id),
    ),
  };
}
