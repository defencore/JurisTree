import { esc } from "../../core/dom.js";
import { allocationRow } from "../../features/property.js";
import { translate } from "../../i18n/index.js";
import { personOptions, typeOptions } from "../components.js";
import { icon } from "../icons.js";
export function renderPropertyForm(a, id) {
  return `<label class="field">${translate("ui.title")}<input name="title" value="${esc(a.title)}" placeholder="${translate("ui.houseDepositLand")}" required maxlength="250"></label><label class="field">${translate("ui.owner")}<select name="ownerId">${personOptions(a.ownerId, true)}</select></label><div class="form-grid"><label class="field">${translate("ui.estimatedValue")}<input type="number" min="0" max="1000000000000000" step="0.01" name="value" value="${esc(a.value)}"></label><label class="field">${translate("ui.currency")}<select name="currency">${typeOptions(
    {
      USD: "USD",
      EUR: "EUR",
      UAH: "UAH",
      GBP: "GBP",
    },
    a.currency,
  )}</select></label></div><p class="field-caption">${translate("ui.allocationPlan")}</p><p class="hint">${translate("ui.enterThePlannedSharesTheyDoNotEstablish")}</p><div id="allocationRows">${a.allocations.map(allocationRow).join("")}</div><button type="button" class="btn small" data-add-allocation>${icon("plus")}${translate("ui.addShare")}</button><label class="field" style="margin-top:18px">${translate("ui.notes")}<textarea name="notes" maxlength="15000">${esc(a.notes)}</textarea></label>${id ? `<button type="button" class="btn danger small" data-delete-property="${id}">${icon("trash")}${translate("ui.deleteProperty")}</button>` : ""}`;
}
