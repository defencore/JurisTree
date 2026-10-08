import { recordConfigs } from "../core/config.js";
import { familyConnection } from "../core/relationships.js";
import { personStatus } from "./person-status.js";
import { collectProjectEvents } from "./events.js";
import { nextAnniversary } from "./dates.js";
import { isOfficial } from "./evidence.js";
import { personAssetValues } from "./person-filter-assets.js";

const pending = (r) =>
  ["pending", "unverified", "inconclusive", "disputed"].includes(
    r.verification,
  );
const retained = (r) => r.verification !== "refuted";
/** Build one index for the entire query; none of these facts infer absent life history. */
export function buildPersonFilterFacts(project, today, files = new Map()) {
  const configs = recordConfigs();
  const byId = new Map(project.people.map((p) => [p.id, p]));
  const docs = new Map(project.people.map((p) => [p.id, new Set()]));
  const docsById = new Map(project.documents.map((d) => [d.id, d]));
  for (const d of project.documents)
    for (const id of [...(d.people || []), ...(d.subjectIds || [])])
      docs.get(id)?.add(d.id);
  const children = new Map(project.people.map((p) => [p.id, new Set()]));
  const adopted = new Set();
  for (const r of project.relations)
    if (
      ["parent", "adopted"].includes(r.type) &&
      familyConnection(r) &&
      byId.has(r.to)
    ) {
      children.get(r.from)?.add(r.to);
      if (r.type === "adopted") adopted.add(r.to);
    }
  const anniversaries = new Map();
  for (const e of collectProjectEvents(project)) {
    if (
      !e.annual ||
      e.type === "birth" ||
      ["refuted", "unverified"].includes(e.verification)
    )
      continue;
    const next = nextAnniversary(e.date, today);
    if (!next || next.years <= 0) continue;
    for (const id of [e.personId, ...(e.relatedPersonIds || [])]) {
      const previous = anniversaries.get(id);
      if (!previous || next.days < previous.days) anniversaries.set(id, next);
    }
  }
  return project.people.map((p) => {
    const section = [],
      records = [];
    for (const [key, cfg] of Object.entries(configs)) {
      const rows = p[cfg.key] || [];
      if (rows.length) section.push(key);
      records.push(...rows);
      for (const r of rows)
        for (const [field, , type] of cfg.fields)
          if (type === "source" && docsById.has(r[field]))
            docs.get(p.id).add(r[field]);
    }
    for (const id of [...(p.bioSourceIds || []), ...(p.healthSourceIds || [])])
      if (docsById.has(id)) docs.get(p.id).add(id);
    const sources = [...docs.get(p.id)].map((id) => docsById.get(id));
    const status = personStatus(p, today);
    const birthday =
      status.life !== "deceased" && status.age
        ? nextAnniversary(p.birth, today)
        : null;
    const visited = (p.travelRecords || [])
      .filter(
        (r) =>
          retained(r) &&
          !["planned", "cancelled"].includes(r.status) &&
          (r.status === "completed" || (r.entryDate && r.entryDate <= today)),
      )
      .map((r) => r.toCountry)
      .filter(Boolean);
    visited.push(
      ...(p.immigrationRecords || [])
        .filter((r) => retained(r) && r.entryDate && r.entryDate <= today)
        .map((r) => r.country)
        .filter(Boolean),
    );
    const asset = personAssetValues(p, today);
    return {
      id: p.id,
      person: p,
      life: status.life,
      age: status.age,
      minor:
        status.age && status.life !== "deceased" && !status.uncertainAge
          ? status.minor
          : null,
      gender: p.gender || "u",
      favorite: !!p.favorite,
      identityDocuments: (p.identityDocuments || []).filter(retained).length,
      documents: sources.filter(
        (d) => d.status === "available" && d.verification !== "refuted",
      ).length,
      sources: sources.length,
      files: sources.filter((d) => d.assetId && files.has(d.assetId)).length,
      official: sources.filter(isOfficial).length,
      pending: records.filter(pending).length + sources.filter(pending).length,
      children: children.get(p.id).size,
      adopted: adopted.has(p.id),
      birthday: birthday?.days ?? null,
      birthdayDate: birthday?.date || "",
      anniversary: anniversaries.get(p.id)?.days ?? null,
      anniversaryDate: anniversaries.get(p.id)?.date || "",
      assetValue: asset.totals,
      assetCount: asset.count,
      incompleteAssets: asset.incomplete,
      accountCount: (p.accountRecords || []).filter(retained).length,
      cryptoCount: (p.cryptoRecords || []).filter(retained).length,
      companyCount: (p.companyRecords || []).filter(retained).length,
      visited,
      residence: (p.residences || [])
        .filter((r) => retained(r) && r.status !== "planned")
        .map((r) => r.country)
        .filter(Boolean),
      citizenship: (p.immigrationRecords || [])
        .filter(
          (r) => retained(r) && ["citizen", "formerCitizen"].includes(r.status),
        )
        .flatMap((r) => [r.country, r.previousCountry])
        .filter(Boolean),
      party: (p.politicalRecords || [])
        .filter(retained)
        .map((r) => r.party)
        .filter(Boolean),
      sanctions: (p.sanctionRecords || [])
        .filter(retained)
        .map((r) => r.kind)
        .filter((k) => k && k !== "unspecified"),
      section,
      group: p.groupIds || [],
    };
  });
}
