import { familyConnection } from "../core/relationships.js";
import { state } from "../core/state.js";

let activeIndex;

/** Share adjacency and ancestry within one calculation or a complete graph render. */
export function withKinshipIndex(calculate) {
  if (activeIndex?.project === state.project) return calculate(activeIndex);
  const previous = activeIndex;
  const index = {
    project: state.project,
    parents: new Map(),
    family: new Map(),
    siblings: [],
    ancestors: new Map(),
  };
  const append = (map, id, relation) => {
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(relation);
  };
  for (const r of state.project.relations) {
    if (!familyConnection(r)) continue;
    append(index.family, r.from, r);
    append(index.family, r.to, r);
    if (["parent", "adopted"].includes(r.type)) append(index.parents, r.to, r);
    if (r.type === "sibling") index.siblings.push(r);
  }
  activeIndex = index;
  try {
    return calculate(index);
  } finally {
    activeIndex = previous;
  }
}
