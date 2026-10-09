import { propertyRecordConfigs } from "../../core/property-records.js";
import { renderRecordFields } from "./profile-record.js";
import { translate as t } from "../../i18n/index.js";

export function propertyRecordForm(kind, record, id) {
  return `<p class="hint">${t("ui.propertyRecordHint")}</p>${renderRecordFields("estate", propertyRecordConfigs()[kind], record)}${id ? `<button type="button" class="btn danger small" data-delete-property-record="${id}" data-property-record-kind="${kind}">${t("ui.deleteRecord")}</button>` : ""}`;
}
export function collectPropertyRecord(form, kind) {
  return Object.fromEntries(
    propertyRecordConfigs()[kind].fields.map(([key]) => [
      key,
      key === "currency"
        ? String(form.get("estate-" + key) || "")
            .trim()
            .toUpperCase()
        : String(form.get("estate-" + key) || "").trim(),
    ]),
  );
}
