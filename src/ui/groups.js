import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { years } from "../model/dates.js";
import { edgeState } from "../model/evidence.js";
import { person } from "../model/lookup.js";
import { roleGroup, roleLabel } from "../model/relationship-labels.js";
import { avatar } from "./components.js";
import { icon } from "./icons.js";

export function kinGroups(p, { profiles = false } = {}) {
  const groups = [
    ["parents", translate("ui.parents"), "people"],
    ["children", translate("ui.children"), "tree"],
    ["partners", translate("ui.partners"), "heart"],
    ["professional", translate("ui.professionalConnection"), "briefcase"],
    ["other", translate("ui.otherRelationships"), "link"],
  ];
  const rs = appState.project.relations.filter(
    (r) => r.from === p.id || r.to === p.id,
  );
  return groups
    .map(([key, title, ic]) => {
      const list = rs.filter((r) => roleGroup(r, p.id) === key);
      if (!list.length && ["partners", "professional", "other"].includes(key))
        return "";
      return `<section class="kin-group"><h3 class="kin-head ${key}">${icon(ic)}${title}<span>${list.length}</span><button class="iconbtn small ghost" data-add-kin="${key}" data-kin-person="${p.id}" aria-label="${translate("ui.add2")} ${title}" title="${translate("ui.add2")} ${title}">${icon("plus")}</button></h3>${
        list
          .map((r) => {
            const o = person(r.from === p.id ? r.to : r.from),
              s = edgeState(r);
            return `<div class="kin-row"><button class="kin-person" data-${profiles ? "full-profile" : "person"}="${o.id}">${avatar(o)}<span><b>${esc(o.name)}</b><small>${esc(roleLabel(r, p.id))} · ${esc(years(o))}</small></span></button><button class="iconbtn small" data-relation="${r.id}" aria-label="${translate("ui.relationshipDocuments2")} ${esc(o.name)}" title="${s === "official" ? translate("ui.officialSourceAvailable") : s === "missing" ? translate("ui.evidenceMissing") : s === "review" ? translate("ui.needsReview2") : translate("ui.reviewEvidence")}">${icon(s === "official" ? "fileCheck" : s === "missing" ? "fileMissing" : "book")}</button></div>`;
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
