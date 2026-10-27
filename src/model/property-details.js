import { propertyDetailsConfig } from "../core/property-details.js";
import { translate as t } from "../i18n/index.js";
import { profileRecordError } from "./profile-records.js";

export function normalizePropertyDetails(value, peopleIds) {
  const config = propertyDetailsConfig(),
    result = {};
  for (const [key, , type, choices] of config.fields) {
    const text = String(value[key] ?? "").trim();
    if (text.length > (type === "textarea" ? 5000 : 1500))
      throw Error(t("ui.invalidProfileRecord"));
    if (type === "select" && text && !Object.hasOwn(choices, text))
      throw Error(t("ui.invalidProfileRecord"));
    result[key] = type === "select" ? text || "unspecified" : text;
    if (type === "person" && text && !peopleIds.has(text)) {
      result[key] = "";
    }
  }
  if (value.initialOwnerId && !peopleIds.has(value.initialOwnerId))
    result.initialOwnerExternal ||=
      value.initialOwnerExternal || t("ui.personDeleted");
  if (result.initialOwnerId && result.initialOwnerExternal)
    throw Error(t("ui.propertyChooseOneParty"));
  const error = profileRecordError(config, result);
  if (error) throw Error(error);
  return result;
}

export function propertyDetailsFromForm(form, peopleIds) {
  return normalizePropertyDetails(
    Object.fromEntries(
      propertyDetailsConfig().fields.map(([key]) => [
        key,
        form.get("asset-" + key) || "",
      ]),
    ),
    peopleIds,
  );
}

export function propertyLineageError(assets) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  for (const asset of assets) {
    const seen = new Set([asset.id]);
    let previous = asset.predecessorId;
    while (byId.has(previous)) {
      if (seen.has(previous)) return t("ui.assetLineageCycle");
      seen.add(previous);
      previous = byId.get(previous).predecessorId;
    }
  }
  return "";
}
