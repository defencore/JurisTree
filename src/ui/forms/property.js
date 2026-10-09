import { esc } from "../../core/dom.js";
import { propertyMetadataFields } from "../../core/property-records.js";
import { state as appState } from "../../core/state.js";
import { translate } from "../../i18n/index.js";
import { personOptions } from "../components.js";
import { icon } from "../icons.js";

export function renderPropertyForm(a, id) {
  return `<label class="field">${translate("ui.title")}<input name="title" value="${esc(a.title)}" placeholder="${translate("ui.houseDepositLand")}" required maxlength="250"></label><label class="field">${translate("ui.propertyReferenceOwner")}<select name="ownerId">${personOptions(a.ownerId, true)}</select></label><div class="form-grid"><label class="field">${translate("ui.estimatedValue")}<input type="number" min="0" max="1000000000000000" step="0.01" name="value" value="${esc(a.value)}"></label><label class="field">${translate("ui.currency")}<input name="currency" value="${esc(a.currency)}" maxlength="3" placeholder="USD, EUR, UAH, CAD"></label></div>${propertyMetadataFields()
    .map(
      (key) =>
        `<label class="field">${translate({ identifier: "ui.assetIdentifier", country: "ui.country", location: "ui.place" }[key])}<input name="${key}" value="${esc(a[key])}" maxlength="1500"></label>`,
    )
    .join(
      "",
    )}<p class="field-caption">${translate("ui.allocationPlan")}</p><p class="hint">${translate("ui.enterThePlannedSharesTheyDoNotEstablish")}</p><div id="allocationRows">${a.allocations.map(allocationRow).join("")}</div><button type="button" class="btn small" data-add-allocation>${icon("plus")}${translate("ui.addShare")}</button><label class="field" style="margin-top:18px">${translate("ui.notes")}<textarea name="notes" maxlength="15000">${esc(a.notes)}</textarea></label>${id ? `<button type="button" class="btn danger small" data-delete-property="${id}">${icon("trash")}${translate("ui.deleteProperty")}</button>` : ""}`;
}

export function allocationRow(
  a = {
    personId: appState.project.people[0]?.id,
    percent: "",
  },
) {
  return `<div class="allocation-editor"><select name="allocation-person">${personOptions(a.personId)}</select><input type="number" name="allocation-percent" min="0" max="100" step="0.01" value="${esc(a.percent)}" placeholder="%" aria-label="${translate("ui.percentageShare")}"><button type="button" class="iconbtn" data-remove-allocation aria-label="${translate("ui.removeShare")}">${icon("x")}</button></div>`;
}
