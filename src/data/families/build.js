import { personRecord, formerName, sourceRecord } from "../records.js";
import { ancestralHouseholds } from "./ancestors.js";
import { cousinHouseholds } from "./cousins.js";
import { connectedHouseholds } from "./connections.js";

const branchGroups = [
  ["ancestors", "Doe ancestral line", "#54718a"],
  ["first-cousins", "Doe / Bennett branch", "#688d79"],
  ["second-cousins", "Ellis / Reed branch", "#8a7597"],
  ["third-cousins", "Doe / Mason branch", "#af874c"],
  ["fourth-cousins", "Hart / Brooks branch", "#568e98"],
  ["fifth-cousins", "Charles Doe branch", "#a06f78"],
  ["roe-branch", "Roe / Foster branch", "#6c81a6"],
  ["ward-branch", "Ward branch", "#84945b"],
];

/** Resolve the curated households in two passes so references have one canonical record. */
export function populateDemoFamilies(project) {
  const households = [
    ...ancestralHouseholds,
    ...cousinHouseholds,
    ...connectedHouseholds,
  ];
  const people = new Map(project.people.map((p) => [p.id, p]));
  for (const [group, married, first, second, children] of households) {
    for (const row of [first, second, ...children.filter(Array.isArray)]) {
      if (people.has(row[0]))
        throw Error(`Duplicate household person: ${row[0]}`);
      const p = personRecord(row, group);
      if (row[5]) p.nameHistory = [formerName(p, row[5], married)];
      people.set(p.id, p);
      project.people.push(p);
    }
  }
  const parents = (parentIds, childId) => {
    const child = people.get(childId);
    if (!child) throw Error(`Missing household child: ${childId}`);
    const relations = parentIds.map((from) => ({
      id: `parent-${from}-${childId}`,
      from,
      to: childId,
      type: "parent",
      notes: "",
      disputed: false,
      verification: "confirmed",
    }));
    project.relations.push(...relations);
    project.documents.push(
      sourceRecord({
        id: `birth-${childId}`,
        title: `Birth register entry for ${child.nameHistory?.[0]?.fullName || child.name}`,
        type: "birth",
        status: "available",
        evidence: "official",
        date: child.birth,
        reference: `BR/${child.birth.slice(0, 4)}/${project.documents.length + 101}`,
        people: [childId, ...parentIds],
        subjectIds: [childId],
        relations: relations.map((r) => r.id),
      }),
    );
  };
  for (const [, married, first, second, children] of households) {
    const a = people.get(first[0]),
      b = people.get(second[0]);
    const id = `marriage-${a.id}-${b.id}`;
    project.relations.push({
      id,
      from: a.id,
      to: b.id,
      type: "spouse",
      unionKind: "marriage",
      fromDate: married,
      status: a.death || b.death ? "widowed" : "current",
      verification: "confirmed",
      disputed: false,
      notes: "",
      place: "Ontario, Canada",
      registration: `MR/${married.slice(0, 4)}/${project.documents.length + 101}`,
    });
    project.documents.push(
      sourceRecord({
        id: `source-${id}`,
        title: `Marriage register: ${a.name} and ${b.name}`,
        type: "marriage",
        date: married,
        status: "available",
        evidence: "official",
        people: [a.id, b.id],
        subjectIds: [a.id, b.id],
        relations: [id],
        reference: `MR/${married.slice(0, 4)}/${project.documents.length + 101}`,
      }),
    );
    for (const child of children)
      parents([a.id, b.id], Array.isArray(child) ? child[0] : child);
  }
  parents(["p1", "p2"], "daniel");
  project.groups.push(
    ...branchGroups.map(([id, name, color]) => ({
      id,
      name,
      color,
      notes: "",
      collapsed: false,
      x: null,
      y: null,
    })),
  );
}
