import { esc } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { getLocale, translate as t } from "../../i18n/index.js";
import { groupIsCollapsed } from "../../model/graph-view.js";
import { icon } from "../icons.js";

export function renderGroupVisibilityForm() {
  return `<section id="groupVisibility"><p class="hint">${t("ui.groupVisibilityHint")}</p><div class="group-visibility-actions"><button type="button" class="btn small" data-action="expand-all-groups">${icon("unfold")}${t("ui.expandAllGroups")}</button><button type="button" class="btn small" data-action="collapse-all-groups">${icon("fold")}${t("ui.collapseAllGroups")}</button></div><div class="search"><input id="groupVisibilitySearch" placeholder="${t("ui.findGroup")}" aria-label="${t("ui.findGroup")}"></div><div class="group-visibility-list">${[
    ...state.project.groups,
  ]
    .sort((a, b) => a.name.localeCompare(b.name, getLocale()))
    .map(
      (group) =>
        `<label class="group-visibility-row" data-visibility-group="${group.id}"><input type="checkbox" data-group-expanded="${group.id}" ${groupIsCollapsed(group) ? "" : "checked"}><span class="group-dot" style="background:${group.color}"></span><b>${esc(group.name)}</b><small>${state.project.people.filter((person) => person.groupIds?.includes(group.id)).length}</small></label>`,
    )
    .join(
      "",
    )}</div><p class="hint" id="groupVisibilityEmpty" hidden>${t("ui.noMatchingGroups")}</p></section>`;
}

export function syncGroupVisibility() {
  const host = document.querySelector("#groupVisibility");
  if (!host) return;
  for (const input of host.querySelectorAll("[data-group-expanded]")) {
    const group = state.project.groups.find(
      (group) => group.id === input.dataset.groupExpanded,
    );
    input.checked = !!group && !groupIsCollapsed(group);
    input.disabled = state.analysisBusy || !group;
  }
  for (const [action, collapsed] of [
    ["expand-all-groups", false],
    ["collapse-all-groups", true],
  ])
    host.querySelector(`[data-action="${action}"]`).disabled =
      state.analysisBusy ||
      !state.project.groups.some(
        (group) => groupIsCollapsed(group) !== collapsed,
      );
}

export function bindGroupVisibilityForm() {
  const search = document.querySelector("#groupVisibilitySearch");
  search.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase(getLocale());
    let count = 0;
    for (const row of document.querySelectorAll("[data-visibility-group]")) {
      row.hidden = !row
        .querySelector("b")
        .textContent.toLocaleLowerCase(getLocale())
        .includes(query);
      if (!row.hidden) count++;
    }
    document.querySelector("#groupVisibilityEmpty").hidden = count > 0;
  });
  syncGroupVisibility();
}
