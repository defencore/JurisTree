import { nodeKey, selectedGraphNodes } from "../../model/graph-selection.js";
import { nodePlacementLocked } from "../../model/placement-locks.js";

/** Resolve node identities once so collapsed groups and mixed card types share a layout graph. */
export function layoutInput(
  project,
  shown,
  runtime,
  {
    direct = null,
    relationIds = null,
    documentLinks = true,
    propertyLinks = true,
  } = {},
) {
  const eligible = shown.filter(
      (node) =>
        !direct ||
        (node.kind === "person" && direct.people.has(node.id)) ||
        (node.kind === "group" &&
          node.members.every((id) => direct.people.has(id))),
    ),
    selected = selectedGraphNodes(eligible, runtime),
    hasSelection = Boolean(
      runtime.multiSelection.size ||
      runtime.diagramNodeSelection.size ||
      runtime.diagramLabelSelection?.size,
    ),
    scope =
      hasSelection && runtime.layoutScope !== "visible"
        ? "selected"
        : "visible",
    nodes = (scope === "selected" ? selected : eligible).map((node) => ({
      ...node,
      key: nodeKey(node),
      locked: nodePlacementLocked(project, node.kind, node.id),
    })),
    people = new Map(),
    keys = new Set(nodes.map((node) => node.key));
  for (const node of nodes) {
    if (node.kind === "person") people.set(node.id, node.key);
    else if (node.kind === "group")
      for (const id of node.members) people.set(id, node.key);
  }
  const links = [];
  for (const relation of project.relations) {
    if (
      (relationIds && !relationIds.has(relation.id)) ||
      (direct && !direct.relations.has(relation.id))
    )
      continue;
    let from = people.get(relation.from),
      to = people.get(relation.to);
    if (!from || !to || from === to) continue;
    if (relation.type === "reports_to") [from, to] = [to, from];
    links.push({
      from,
      to,
      type: relation.type,
      key: "r:" + relation.id,
      directed: ["parent", "adopted", "step_parent", "reports_to"].includes(
        relation.type,
      ),
    });
  }
  if (documentLinks)
    for (const document of project.documents)
      if (keys.has("document:" + document.id))
        for (const id of document.people)
          if (people.has(id))
            links.push({
              from: "document:" + document.id,
              to: people.get(id),
              key: "d:" + document.id + ":" + id,
              directed: false,
            });
  if (propertyLinks)
    for (const asset of project.property)
      if (keys.has("property:" + asset.id))
        for (const allocation of asset.allocations || [])
          if (people.has(allocation.personId))
            links.push({
              from: "property:" + asset.id,
              to: people.get(allocation.personId),
              key: "p:" + asset.id + ":" + allocation.personId,
              directed: false,
            });
  return {
    nodes,
    links,
    scope,
    hasSelection,
    selectedCount: selected.length,
    shown,
  };
}
