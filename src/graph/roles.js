import { familyConnection } from "../core/relationships.js";
import { state as appState } from "../core/state.js";
import { roleGroup, roleLabel } from "../model/relationship-labels.js";
import { translate } from "../i18n/index.js";
export function graphRole(id) {
  if (appState.selected?.kind !== "person") return null;
  if (id === appState.selected.id)
    return {
      kind: "self",
      label: translate("ui.selectedPerson"),
      color: "#081f3c",
      bg: "#e7eef6",
    };
  const r = appState.project.relations.find(
    (r) =>
      familyConnection(r) &&
      ["parent", "adopted"].includes(r.type) &&
      ((r.from === appState.selected.id && r.to === id) ||
        (r.to === appState.selected.id && r.from === id)),
  );
  if (!r) return null;
  return roleGroup(r, appState.selected.id) === "parents"
    ? {
        kind: "parent",
        label: roleLabel(r, appState.selected.id),
        color: "#3e516c",
        bg: "#e7eef6",
      }
    : {
        kind: "child",
        label: roleLabel(r, appState.selected.id),
        color: "#28644a",
        bg: "#edf6f0",
      };
}
