import { withKinshipIndex } from "./kinship-index.js";

export function ancestorPaths(id) {
  return withKinshipIndex((index) => indexedAncestorPaths(id, index));
}
function indexedAncestorPaths(id, index) {
  if (index.ancestors.has(id)) return index.ancestors.get(id);
  const paths = new Map([
      [
        id,
        {
          id,
          distance: 0,
          people: [id],
          relations: [],
        },
      ],
    ]),
    queue = [paths.get(id)];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor];
    for (const r of index.parents.get(current.id) || []) {
      const next = {
        id: r.from,
        distance: current.distance + 1,
        people: [...current.people, r.from],
        relations: [...current.relations, r.id],
      };
      if (!paths.has(next.id) || paths.get(next.id).distance > next.distance) {
        paths.set(next.id, next);
        queue.push(next);
      }
    }
  }
  index.ancestors.set(id, paths);
  return paths;
}
export function familyPath(from, to) {
  return withKinshipIndex((index) => indexedFamilyPath(from, to, index));
}
function indexedFamilyPath(from, to, index) {
  const queue = [
      {
        id: from,
        people: [from],
        relations: [],
        steps: [],
      },
    ],
    seen = new Set();
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const node = queue[cursor];
    if (node.id === to) return node;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    for (const r of index.family.get(node.id) || []) {
      const id = r.from === node.id ? r.to : r.from;
      if (seen.has(id)) continue;
      const step = ["parent", "adopted"].includes(r.type)
        ? r.from === node.id
          ? "child"
          : "parent"
        : r.type === "spouse"
          ? "partner"
          : "sibling";
      queue.push({
        id,
        people: [...node.people, id],
        relations: [...node.relations, r.id],
        steps: [...node.steps, step],
      });
    }
  }
  return null;
}
