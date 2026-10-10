export const nodeKey = (node) => node.kind + ":" + node.id;

/** The same explicit selection is used for layouts, alignment and placement locks. */
export function selectedGraphNodes(nodes, runtime) {
  return nodes.filter((node) =>
    node.kind === "person"
      ? runtime.multiSelection.has(node.id)
      : runtime.diagramNodeSelection.has(nodeKey(node)) ||
        (node.kind === "group" &&
          node.members.length > 0 &&
          node.members.every((id) => runtime.multiSelection.has(id))),
  );
}

export function clearGraphItems(runtime) {
  runtime.multiSelection.clear();
  runtime.diagramNodeSelection.clear();
  runtime.diagramLabelSelection.clear();
  runtime.diagramConnectionKey = "";
  runtime.diagramPointIndex = -1;
  runtime.diagramAddPoint = false;
  runtime.graphSelectionAnchor = "";
}

export function toggleGraphNode(runtime, kind, id) {
  if (kind !== "person") {
    const key = kind + ":" + id;
    if (runtime.diagramNodeSelection.has(key))
      runtime.diagramNodeSelection.delete(key);
    else runtime.diagramNodeSelection.add(key);
  } else {
    const anchor = runtime.graphSelectionAnchor;
    if (
      !runtime.multiSelection.size &&
      anchor &&
      anchor !== id &&
      runtime.selected?.kind === "person" &&
      runtime.selected.id === anchor
    )
      runtime.multiSelection.add(anchor);
    if (runtime.multiSelection.has(id)) runtime.multiSelection.delete(id);
    else runtime.multiSelection.add(id);
  }
  runtime.graphSelectionAnchor = "";
}
