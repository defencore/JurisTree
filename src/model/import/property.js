import { propertyMetadataFields } from "../../core/property-records.js";
import { translate } from "../../i18n/index.js";
import { normalizePropertyRecords } from "../property-records.js";
import { str, pos } from "./schema.js";

export function normalizeImportedProperty(a, peopleIds) {
  const currency = String(a.currency || "")
    .trim()
    .toUpperCase();
  if (
    (currency && !/^[A-Z]{3}$/.test(currency)) ||
    (a.value !== "" && a.value != null && !currency)
  )
    throw Error(translate("ui.propertyCurrencyError"));
  const allocations = Array.isArray(a.allocations)
    ? a.allocations
        .filter((x) => x && peopleIds.has(x.personId))
        .map((x) => ({
          personId: x.personId,
          percent: Number(x.percent),
        }))
    : [];
  if (
    allocations.some(
      (x) => !Number.isFinite(x.percent) || x.percent < 0 || x.percent > 100,
    ) ||
    allocations.reduce((s, x) => s + x.percent, 0) > 100.001 ||
    new Set(allocations.map((x) => x.personId)).size !== allocations.length
  )
    throw Error(translate("ui.invalidPropertyShares"));
  const value = a.value === "" || a.value == null ? "" : Number(a.value);
  if (value !== "" && (!Number.isFinite(value) || value < 0))
    throw Error(translate("ui.invalidPropertyValue"));
  return {
    id: a.id,
    title: str(a.title, 250) || translate("ui.property"),
    ownerId: peopleIds.has(a.ownerId) ? a.ownerId : "",
    currency,
    ...Object.fromEntries(
      propertyMetadataFields().map((key) => [key, str(a[key], 1500)]),
    ),
    ...normalizePropertyRecords(a, peopleIds),
    value,
    notes: str(a.notes),
    allocations,
    x: pos(a.x),
    y: pos(a.y),
  };
}
