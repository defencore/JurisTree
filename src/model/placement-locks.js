import { validDiagramKeys } from "./diagram.js";

const lists = {
  person: "people",
  document: "documents",
  property: "property",
  group: "groups",
};
const cache = new WeakMap();

export function normalizePlacementLocks(
  raw = { nodes: [], connectors: [] },
  project,
) {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    !Array.isArray(raw.nodes) ||
    !Array.isArray(raw.connectors) ||
    raw.nodes.length > 2450 ||
    raw.connectors.length > 3000 ||
    [...raw.nodes, ...raw.connectors].some(
      (key) => typeof key !== "string" || key.length > 310,
    )
  )
    throw Error("Invalid placement locks");
  const nodes = new Set(
      Object.entries(lists).flatMap(([kind, list]) =>
        project[list].map((item) => kind + ":" + item.id),
      ),
    ),
    connectors = validDiagramKeys(project);
  return {
    nodes: [...new Set(raw.nodes.filter((key) => nodes.has(key)))],
    connectors: [
      ...new Set(raw.connectors.filter((key) => connectors.has(key))),
    ],
  };
}

function lockIndex(project) {
  const previous = cache.get(project);
  if (
    previous?.locks === project.placementLocks &&
    previous.updatedAt === project.updatedAt
  )
    return previous;
  const nodes = new Set(project.placementLocks?.nodes || []),
    connectors = new Set(project.placementLocks?.connectors || []),
    people = new Set(
      project.people
        .filter(
          (p) =>
            nodes.has("person:" + p.id) ||
            p.groupIds?.some((id) => nodes.has("group:" + id)),
        )
        .map((p) => p.id),
    ),
    groups = new Set(
      project.groups
        .filter(
          (g) =>
            nodes.has("group:" + g.id) ||
            project.people.some(
              (p) => people.has(p.id) && p.groupIds?.includes(g.id),
            ),
        )
        .map((g) => g.id),
    );
  const result = {
    locks: project.placementLocks,
    updatedAt: project.updatedAt,
    nodes,
    connectors,
    people,
    groups,
  };
  cache.set(project, result);
  return result;
}

/** A collapsed group cannot translate any fixed member; expand it to move the others. */
export function nodePlacementLocked(project, kind, id) {
  const index = lockIndex(project);
  return kind === "person"
    ? index.people.has(id)
    : kind === "group"
      ? index.groups.has(id)
      : index.nodes.has(kind + ":" + id);
}
export function connectorPlacementLocked(project, key) {
  const index = lockIndex(project);
  return (
    index.connectors.has(key) ||
    (key.startsWith("g:") && index.nodes.has("group:" + key.slice(2)))
  );
}

/** Use the same selection for lock controls in the toolbar and the placement editor. */
export function placementSelection(project, runtime, nodes) {
  const selectedNodes = new Set(),
    connectors = new Set();
  if (runtime.diagramEditing) {
    for (const node of nodes) {
      if (
        (node.kind === "person" && runtime.multiSelection.has(node.id)) ||
        runtime.diagramNodeSelection.has(node.kind + ":" + node.id)
      )
        selectedNodes.add(node.kind + ":" + node.id);
    }
    for (const key of runtime.diagramLabelSelection) connectors.add(key);
    if (
      !runtime.diagramSelecting &&
      !selectedNodes.size &&
      !connectors.size &&
      runtime.diagramConnectionKey
    )
      connectors.add(runtime.diagramConnectionKey);
  } else {
    for (const id of runtime.multiSelection) selectedNodes.add("person:" + id);
  }
  if (
    !selectedNodes.size &&
    !connectors.size &&
    !(runtime.diagramEditing && runtime.diagramSelecting)
  ) {
    const selected = runtime.selected;
    if (selected?.kind === "relation") connectors.add("r:" + selected.id);
    else if (selected && lists[selected.kind])
      selectedNodes.add(selected.kind + ":" + selected.id);
  }
  return normalizePlacementLocks(
    { nodes: [...selectedNodes], connectors: [...connectors] },
    project,
  );
}

/** Materialize the visible anchor before unlocked members move or a saved view is restored. */
export function pinLockedGroupAnchors(project) {
  for (const group of project.groups) {
    if (!group.collapsed || !nodePlacementLocked(project, "group", group.id))
      continue;
    const members = project.people.filter((p) =>
      p.groupIds?.includes(group.id),
    );
    if (!members.length) continue;
    if (!Number.isFinite(group.x))
      group.x = Math.min(...members.map((p) => p.x));
    if (!Number.isFinite(group.y))
      group.y = Math.min(...members.map((p) => p.y));
  }
}
