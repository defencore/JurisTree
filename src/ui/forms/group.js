import { groupColors } from "../../core/config.js";
import { esc } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { checks } from "../components.js";
import { icon } from "../icons.js";
export function renderGroupForm(g, ids, id) {
  return `<label class="field">${translate("ui.title")}<input name="name" value="${esc(g.name)}" placeholder="${translate("ui.exampleFamilyNames")}" required maxlength="150"></label><label class="field">${translate("ui.groupColor")}<select name="color">${groupColors.map((c, i) => `<option value="${c}" ${g.color === c ? "selected" : ""}>${[translate("ui.purple"), translate("ui.green"), translate("ui.blue"), translate("ui.amber"), translate("ui.pink"), translate("ui.lightBlue")][i]}</option>`).join("")}</select></label><p class="field-caption">${icon("users")}${translate("ui.groupMembers")}</p><p class="hint">${translate("ui.aPersonCanBelongToMultipleFamiliesGrouping")}</p>${checks(appState.project.people, "members", ids, (p) => p.name)}<label class="field">${translate("ui.description")}<textarea name="notes" maxlength="5000">${esc(g.notes)}</textarea></label>${id ? `<div class="profile-actions"><button type="button" class="btn" data-toggle-group="${id}">${icon(g.collapsed ? "unfold" : "fold")}${g.collapsed ? translate("ui.expandOnMap") : translate("ui.collapseOnMap")}</button><button type="button" class="btn danger" data-delete-group="${id}">${icon("trash")}${translate("ui.deleteGroup")}</button></div>` : ""}`;
}
