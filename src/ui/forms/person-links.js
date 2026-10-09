import { dateInput } from "../date-input.js";
import { esc } from "../../core/dom.js";
import { newPersonRoles } from "../../core/person-creation.js";
import { state } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { typeOptions } from "../components.js";
import { icon, icons } from "../icons.js";
import { bindPersonPickers, renderPersonPicker } from "../person-picker.js";

function linkRow(personId = "") {
  const roles = Object.fromEntries(
    Object.entries(newPersonRoles).map(([key, role]) => [
      key,
      translate(role.label),
    ]),
  );
  return `<div class="creation-link" data-creation-link><div class="creation-link-fields">${renderPersonPicker("new-link-person", personId, translate("ui.existingPerson"), { empty: true, required: true })}<label class="field">${translate("ui.newPersonRole")}<select name="new-link-role">${typeOptions(roles, "child")}</select></label></div><button type="button" class="iconbtn small creation-link-remove" data-remove-creation-link aria-label="${translate("ui.removeRelationship")}" title="${translate("ui.removeRelationship")}">${icon("trash")}</button><details class="creation-link-details"><summary>${translate("ui.periodAndDetails")}</summary><div class="form-grid"><label class="field">${translate("ui.from")}${dateInput("new-link-fromDate", "", { period: true })}</label><label class="field">${translate("ui.to")}${dateInput("new-link-toDate", "", { period: true })}</label><label class="field full">${translate("ui.verificationStatus")}<select name="new-link-verification">${typeOptions({ unspecified: translate("ui.notSpecified"), confirmed: translate("ui.corroborated"), disputed: translate("ui.disputedRelationship"), unverified: translate("ui.pendingVerification"), refuted: translate("ui.refuted") }, "unspecified")}</select></label><label class="field full">${translate("ui.whatIsKnownAboutThisRelationship")}<textarea name="new-link-notes" maxlength="15000"></textarea></label></div></details></div>`;
}

export function renderCreationLinks(targets) {
  if (!state.project.people.length) return "";
  return `<div class="creation-links" data-creation-links><label class="check creation-links-toggle"><input type="checkbox" name="create-relationships" aria-controls="creationLinksBody">${translate("ui.createRelationshipsNow")}</label><div id="creationLinksBody" hidden><p class="hint">${translate("ui.creationLinksHint")}</p><div data-creation-link-list>${(targets.length ? targets : [""]).map(linkRow).join("")}</div><button type="button" class="btn small" data-add-creation-link>${icon("plus")}${translate("ui.addAnotherRelationship")}</button><p class="hint">${esc(translate("ui.creationLinksDetailsHint"))}</p></div></div>`;
}

export function bindCreationLinks(editor) {
  const root = editor.querySelector("[data-creation-links]");
  if (!root) return;
  const toggle = root.querySelector('[name="create-relationships"]');
  const body = root.querySelector("#creationLinksBody");
  const list = root.querySelector("[data-creation-link-list]");
  bindPersonPickers(root);
  function update() {
    body.hidden = !toggle.checked;
    toggle.setAttribute("aria-expanded", String(toggle.checked));
    body.querySelectorAll("input,select,textarea,button").forEach((el) => {
      el.disabled = !toggle.checked;
    });
  }
  toggle.addEventListener("change", update);
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-add-creation-link]")) {
      list.insertAdjacentHTML("beforeend", linkRow());
      icons();
      bindPersonPickers(root);
      list.lastElementChild.querySelector("[data-person-query]").focus();
    } else if (e.target.closest("[data-remove-creation-link]")) {
      e.target.closest("[data-creation-link]").remove();
      if (!list.children.length) {
        list.insertAdjacentHTML("beforeend", linkRow());
        bindPersonPickers(root);
        toggle.checked = false;
        toggle.focus();
        icons();
      }
    }
    update();
  });
  update();
}
