import { translate } from "../i18n/index.js";
import { dateExact, partialDate } from "./dates.js";

export function profileRecordError(cfg, record) {
  for (const [key, , type] of cfg.fields) {
    const value = record[key];
    if (value === "" || value == null) continue;
    if (
      (type === "date" && !dateExact(value)) ||
      (type === "period" && !partialDate(value))
    )
      return translate("ui.invalidProfileDate");
    if (type === "number" && !Number.isFinite(Number(value)))
      return translate("ui.invalidProfileNumber");
    if (
      type === "number" &&
      cfg.numericMinimums?.[key] != null &&
      Number(value) < cfg.numericMinimums[key]
    )
      return translate("ui.invalidProfileNumber");
    if (type === "year" && (!/^\d{4}$/.test(value) || Number(value) < 1))
      return translate("ui.invalidProfileYear");
  }
  for (const [start, end] of cfg.dateRanges || []) {
    const from = partialDate(record[start]),
      to = partialDate(record[end]);
    if (from && to && to.max < from.min)
      return cfg.label + translate("ui.endCannotPrecedeStart");
  }
  return "";
}
