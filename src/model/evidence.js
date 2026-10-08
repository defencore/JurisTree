import { familyConnection } from "../core/relationships.js";
import { sourceEvidence, sourceNeedsReview } from "../core/sources.js";
import { types } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { person, relation } from "./project.js";
import { usedBlobs } from "../services/files.js";
export function sourceInScope(d) {
  return (
    !Array.isArray(d.purposes) ||
    !d.purposes.length ||
    d.purposes.includes(appState.project.purpose)
  );
}
export function linkedDocs(kind, id) {
  if (appState.renderIndex?.project === appState.project)
    return (
      appState.renderIndex[
        kind === "person"
          ? "peopleDocs"
          : kind === "relation"
            ? "relationDocs"
            : "propertyDocs"
      ].get(id) || []
    );
  return appState.project.documents.filter(
    (d) =>
      sourceInScope(d) &&
      (kind === "person"
        ? d.people
        : kind === "relation"
          ? d.relations
          : d.propertyIds || []
      ).includes(id),
  );
}
export function isOfficial(d) {
  return (
    d.status === "available" &&
    sourceEvidence(d) === "official" &&
    !["pending", "refuted", "inconclusive"].includes(d.verification)
  );
}
export function edgeState(r) {
  const ds = linkedDocs("relation", r.id);
  if (r.disputed || ["disputed", "refuted"].includes(r.verification))
    return "conflict";
  if (r.verification === "unverified" || r.type === "unconfirmed")
    return "review";
  if (ds.some(isOfficial)) return "official";
  if (ds.some((d) => sourceNeedsReview(d))) return "review";
  if (
    ds.some((d) => d.status === "available" && sourceEvidence(d) === "indirect")
  )
    return "indirect";
  if (ds.some((d) => d.status === "requested")) return "requested";
  return "missing";
}
export function route() {
  if (
    appState.project.purpose !== "inheritance" ||
    !person(appState.project.subjectId) ||
    !person(appState.project.claimantId)
  )
    return {
      people: [],
      relations: [],
      found: false,
    };
  const queue = [
      {
        id: appState.project.subjectId,
        people: [appState.project.subjectId],
        relations: [],
      },
    ],
    visited = new Set();
  while (queue.length) {
    const curr = queue.shift();
    if (curr.id === appState.project.claimantId)
      return {
        ...curr,
        found: true,
      };
    if (visited.has(curr.id)) continue;
    visited.add(curr.id);
    for (const r of appState.project.relations) {
      if (!familyConnection(r)) continue;
      if (r.from === curr.id || r.to === curr.id) {
        const id = r.from === curr.id ? r.to : r.from;
        if (!visited.has(id))
          queue.push({
            id,
            people: [...curr.people, id],
            relations: [...curr.relations, r.id],
          });
      }
    }
  }
  return {
    people: [],
    relations: [],
    found: false,
  };
}
export function requirements(p) {
  let ts = p.requirements;
  if (!Array.isArray(ts)) {
    ts = ["birth"];
    if (p.death || p.lifeStatus === "deceased") ts.push("death");
    if (p.aliases || p.nameHistory?.length) ts.push("name_change");
    if (
      appState.project.purpose === "inheritance" &&
      p.id === appState.project.subjectId
    )
      ts.push("will", "probate");
  }
  return [...new Set(ts)].map((type) => {
    const ds = linkedDocs("person", p.id).filter(
        (d) => d.type === type && documentSubjects(d).includes(p.id),
      ),
      state = requirementState(ds);
    return {
      type,
      title: types()[type] || type,
      state,
      done: state === "available",
      docIds: ds.map((d) => d.id),
    };
  });
}
export function gaps() {
  const path = route(),
    chosen =
      appState.project.purpose === "inheritance" && path.found
        ? appState.project.people.filter((p) => path.people.includes(p.id))
        : appState.project.people;
  const personGaps = chosen.flatMap((p) =>
    requirements(p)
      .filter((t) => !t.done)
      .map((t) => ({
        kind: "person",
        id: p.id,
        name: p.name,
        ...t,
      })),
  );
  const rs =
    appState.project.purpose === "inheritance" && path.found
      ? appState.project.relations.filter((r) => path.relations.includes(r.id))
      : appState.project.relations.filter(familyConnection);
  const edgeGaps = rs
    .filter((r) => edgeState(r) !== "official")
    .map((r) => ({
      kind: "relation",
      id: r.id,
      name: `${person(r.from)?.name} · ${person(r.to)?.name}`,
      type:
        r.type === "spouse"
          ? "marriage"
          : r.type === "parent"
            ? "birth"
            : "archive",
      title: translate("ui.documentSupportingTheRelationship"),
    }));
  return [...personGaps, ...edgeGaps];
}
export function storageTotal() {
  return usedBlobs().reduce((s, id) => s + appState.blobs.get(id).size, 0);
}
export function hasFile(d) {
  return !!d.assetId && appState.blobs.has(d.assetId);
}
export function documentSubjects(d) {
  if (Array.isArray(d.subjectIds)) return d.subjectIds;
  if (d.type === "birth") {
    const children = (d.relations || [])
      .map(relation)
      .filter((r) => r && ["parent", "adopted"].includes(r.type))
      .map((r) => r.to)
      .filter((id) => (d.people || []).includes(id));
    if (children.length) return [...new Set(children)];
  }
  return d.people || [];
}
export function requirementState(ds) {
  if (ds.some(isOfficial)) return "available";
  if (ds.some((d) => d.status === "needs_review" || d.status === "available"))
    return "review";
  if (ds.some((d) => d.status === "requested")) return "requested";
  return "missing";
}
