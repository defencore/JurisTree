import { renderGroupForm } from "../ui/forms/group.js";
import { groupColors } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { uid } from "../core/utils.js";
import { fit } from "../graph/camera.js";
import { roleGroup, roleLabel } from "../model/relationship-labels.js";
import { translate } from "../i18n/index.js";
import { years } from "../model/dates.js";
import { edgeState } from "../model/evidence.js";
import { group, person } from "../model/project.js";
import { commit } from "../services/history.js";
import { avatar } from "../ui/components.js";
import { closeModal, openDialog } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
export function kinGroups(p) {
  const groups = [
    ["parents", translate("ui.parents"), "people"],
    ["children", translate("ui.children"), "tree"],
    ["partners", translate("ui.partners"), "heart"],
    ["other", translate("ui.otherRelationships"), "link"],
  ];
  const rs = appState.project.relations.filter(
    (r) => r.from === p.id || r.to === p.id,
  );
  return groups
    .map(([key, title, ic]) => {
      const list = rs.filter((r) => roleGroup(r, p.id) === key);
      if (!list.length && ["partners", "other"].includes(key)) return "";
      return `<section class="kin-group"><h3 class="kin-head ${key}">${icon(ic)}${title}<span>${list.length}</span><button class="iconbtn small ghost" data-add-kin="${key}" data-kin-person="${p.id}" aria-label="${translate("ui.add2")} ${title}" title="${translate("ui.add2")} ${title}">${icon("plus")}</button></h3>${
        list
          .map((r) => {
            const o = person(r.from === p.id ? r.to : r.from),
              s = edgeState(r);
            return `<div class="kin-row"><button class="kin-person" data-person="${o.id}">${avatar(o)}<span><b>${esc(o.name)}</b><small>${esc(roleLabel(r, p.id))} · ${esc(years(o))}</small></span></button><button class="iconbtn small" data-relation="${r.id}" aria-label="${translate("ui.relationshipDocuments2")} ${esc(o.name)}" title="${s === "official" ? translate("ui.officialSourceAvailable") : s === "missing" ? translate("ui.evidenceMissing") : s === "review" ? translate("ui.needsReview2") : translate("ui.reviewEvidence")}">${icon(s === "official" ? "fileCheck" : s === "missing" ? "fileMissing" : "book")}</button></div>`;
          })
          .join("") ||
        `<p class="kin-empty">${key === "parents" ? translate("ui.noParentsAddedYet") : translate("ui.noChildrenAddedYet")}</p>`
      }</section>`;
    })
    .join("");
}
export function renderGroups() {
  const root = $("#groupList");
  if (!root) return;
  $("#groupSectionLabel").textContent =
    appState.project.purpose === "research"
      ? translate("ui.personGroups")
      : translate("ui.familyGroups");
  root.innerHTML =
    `<button class="family-filter ${!appState.groupFilter ? "active" : ""}" data-group-filter=""><span class="group-dot" style="background:#9b96b1"></span>${icon("groups")}<b>${appState.project.purpose === "research" ? translate("ui.allPeople") : translate("ui.wholeFamily")}</b><small>${appState.project.people.length}</small></button>` +
    appState.project.groups
      .map(
        (g) =>
          `<div class="group-list-row"><button class="family-filter ${appState.groupFilter === g.id ? "active" : ""}" data-group-filter="${g.id}"><span class="group-dot" style="background:${g.color}"></span><b>${esc(g.name)}</b><small>${appState.project.people.filter((p) => (p.groupIds || []).includes(g.id)).length}</small></button><button class="iconbtn small ghost" data-edit-group="${g.id}" title="${translate("ui.editGroup")}" aria-label="${translate("ui.editGroup")} ${esc(g.name)}">${icon("settings")}</button></div>`,
      )
      .join("");
}
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
  const collapsed = g.collapsed && !appState.analysisExpandedGroups.has(id);
  appState.analysisExpandedGroups.delete(id);
  commit(() => {
    g.collapsed = !collapsed;
  });
  fit();
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
