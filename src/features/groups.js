import { groupColors } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { fit } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { group } from "../model/lookup.js";
import { groupIsCollapsed } from "../model/graph-view.js";
import { commit } from "../services/history.js";
import { closeModal, openDialog } from "../ui/dialog.js";
import { renderGroupForm } from "../ui/forms/group.js";
import { renderGroups } from "../ui/groups.js";
import {
  renderGroupVisibilityForm,
  bindGroupVisibilityForm,
} from "../ui/forms/group-visibility.js";
import { bindPersonPickers } from "../ui/person-picker.js";

export async function editGroup(id = null) {
  const g = id
    ? group(id)
    : {
        name: "",
        color: groupColors[appState.project.groups.length % groupColors.length],
        notes: "",
      };
  if (!g) return;
  const ids = appState.project.people
    .filter((p) => (p.groupIds || []).includes(id))
    .map((p) => p.id);
  const f = await openDialog(
    id ? translate("ui.familyGroup") : translate("ui.addFamilyGroup"),
    renderGroupForm(g, ids, id),
    {
      wide: true,
      onOpen: () => bindPersonPickers(document.querySelector("#modalForm")),
      validate: (f) =>
        f.get("name").trim() ? "" : translate("ui.enterAGroupName"),
    },
  );
  if (!f) return;
  commit(() => {
    const gid = id || uid(),
      members = f.getAll("members");
    if (id)
      Object.assign(g, {
        name: f.get("name").trim(),
        color: f.get("color"),
        notes: f.get("notes"),
      });
    else
      appState.project.groups.push({
        id: gid,
        name: f.get("name").trim(),
        color: f.get("color"),
        notes: f.get("notes"),
        collapsed: false,
        x: null,
        y: null,
      });
    for (const p of appState.project.people) {
      p.groupIds = (p.groupIds || []).filter((x) => x !== gid);
      if (members.includes(p.id)) p.groupIds.push(gid);
    }
  });
  renderGroups();
  fit();
}
export function toggleGroup(id) {
  const g = group(id);
  if (!g) return;
  closeModal();
  setGroupsCollapsed([id], !groupIsCollapsed(g));
}

export function setGroupsCollapsed(ids, collapsed) {
  if (appState.analysisBusy) return;
  const selected = new Set(ids),
    groups = appState.project.groups.filter((g) => selected.has(g.id));
  if (
    !groups.some(
      (g) => g.collapsed !== collapsed || groupIsCollapsed(g) !== collapsed,
    )
  )
    return;
  for (const g of groups) appState.analysisExpandedGroups.delete(g.id);
  commit(() => {
    for (const g of groups) {
      g.collapsed = collapsed;
      if (collapsed) {
        g.x = null;
        g.y = null;
      }
    }
  });
}

export function openGroupVisibility() {
  return openDialog(translate("ui.manageGroups"), renderGroupVisibilityForm(), {
    footer: false,
    onOpen: bindGroupVisibilityForm,
  });
}
export async function deleteGroup(id) {
  closeModal();
  const f = await openDialog(
    translate("ui.deleteFamilyGroup"),
    `<p class="hint">${translate("ui.peopleDocumentsAndRelationshipsStayInTheTree")}</p>`,
    {
      submit: translate("ui.deleteGroup"),
    },
  );
  if (!f) return;
  commit(() => {
    appState.project.groups = appState.project.groups.filter(
      (g) => g.id !== id,
    );
    appState.project.people.forEach(
      (p) => (p.groupIds = (p.groupIds || []).filter((x) => x !== id)),
    );
    if (appState.groupFilter === id) appState.groupFilter = "";
  });
  fit();
}
