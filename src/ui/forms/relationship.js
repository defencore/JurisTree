import { relTypes } from "../../core/config.js";
import { $, esc } from "../../core/dom.js";
import {
  collectRelationship,
  relationshipFields,
} from "../../core/relationships.js";
import { translate } from "../../i18n/index.js";
import { typeOptions } from "../components.js";
import { icon } from "../icons.js";
import { bindPersonPickers, renderPersonPicker } from "../person-picker.js";
import { renderRecordFields } from "./profile-record.js";

export function renderRelationshipForm(r, id) {
  const parenthood = ["parent", "adopted", "step_parent"].includes(r.type);
  return `<div id="parenthoodDirectionHint" class="upload-info" ${parenthood ? "" : "hidden"}>${translate("ui.forParenthoodSelectTheParentFirstAndThe")}</div><div class="form-grid">${renderPersonPicker("from", r.from, translate(r.type === "reports_to" ? "ui.subordinatePerson" : "ui.firstPerson"), { labelId: "relationshipFromLabel" })}${renderPersonPicker("to", r.to, translate(r.type === "reports_to" ? "ui.supervisorPerson" : "ui.secondPerson"), { labelId: "relationshipToLabel" })}<label class="field full">${translate("ui.relationshipType")}<select name="type">${typeOptions(relTypes(), r.type)}</select></label></div><p id="biologicalParentsHint" class="hint" ${parenthood ? "" : "hidden"}>${translate("ui.biologicalParentsHint")}</p><p id="subordinationHint" class="hint" ${r.type === "reports_to" ? "" : "hidden"}>${translate("ui.subordinationHint")}</p><p class="hint">${translate("ui.relationshipEvidenceHint")}</p><div id="relationshipFields">${renderRecordFields("relationship", relationshipFields(r.type), r)}</div><label class="field">${translate("ui.whatIsKnownAboutThisRelationship")}<textarea name="notes" maxlength="15000">${esc(r.notes)}</textarea></label><label class="check"><input name="disputed" type="checkbox" ${r.disputed ? "checked" : ""}>${translate("ui.sourcesContradictEachOther")}</label>${id ? `<button type="button" class="btn danger small" data-delete-relation="${id}">${icon("trash")}${translate("ui.deleteRelationship")}</button>` : ""}`;
}

export function bindRelationshipForm() {
  bindPersonPickers($("#modalForm"));
  const input = $('#modalForm [name="type"]');
  input.addEventListener("change", () => {
    const parenthood = ["parent", "adopted", "step_parent"].includes(
      input.value,
    );
    $("#parenthoodDirectionHint").hidden = !parenthood;
    $("#biologicalParentsHint").hidden = !parenthood;
    $("#subordinationHint").hidden = input.value !== "reports_to";
    $("#relationshipFromLabel").textContent = translate(
      input.value === "reports_to" ? "ui.subordinatePerson" : "ui.firstPerson",
    );
    $("#relationshipToLabel").textContent = translate(
      input.value === "reports_to" ? "ui.supervisorPerson" : "ui.secondPerson",
    );
    for (const id of ["relationshipFromLabel", "relationshipToLabel"]) {
      const label = $(`#${id}`);
      label.parentElement
        .querySelector("[data-person-query]")
        .setAttribute(
          "aria-label",
          `${translate("ui.findPersonByName")}: ${label.textContent}`,
        );
    }
    const data = collectRelationship(new FormData($("#modalForm")));
    $("#relationshipFields").innerHTML = renderRecordFields(
      "relationship",
      relationshipFields(input.value),
      data,
    );
  });
}
