import { recordConfigs } from "../core/config.js";
import { relationshipLabel } from "./relationship-labels.js";

export function profileReferenceLabel(project, type, id) {
  if (!id) return "";
  if (type === "person")
    return project.people.find((p) => p.id === id)?.name || "";
  if (type === "source")
    return project.documents.find((d) => d.id === id)?.title || "";
  if (type === "relationship") {
    const r = project.relations.find((r) => r.id === id);
    if (!r) return "";
    const name = (id) => project.people.find((p) => p.id === id)?.name || "";
    return `${name(r.from)} — ${name(r.to)} (${relationshipLabel(r)})`;
  }
  return "";
}

export function unlinkProfileReferences(project, type, ids) {
  const removed = new Set(ids);
  for (const p of project.people)
    for (const cfg of Object.values(recordConfigs()))
      for (const record of p[cfg.key] || [])
        for (const [key, , fieldType] of cfg.fields)
          if (fieldType === type && removed.has(record[key])) record[key] = "";
}

export function normalizeProfileReferences(project) {
  const targets = {
    person: new Set(project.people.map((p) => p.id)),
    source: new Set(project.documents.map((d) => d.id)),
    relationship: new Set(project.relations.map((r) => r.id)),
  };
  for (const p of project.people)
    for (const cfg of Object.values(recordConfigs()))
      for (const record of p[cfg.key] || [])
        for (const [key, , type] of cfg.fields)
          if (targets[type] && record[key] && !targets[type].has(record[key]))
            record[key] = "";
}
