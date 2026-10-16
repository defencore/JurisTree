import { documentDetailsConfig } from "../core/document-details.js";
import { translate } from "../i18n/index.js";
import { profileRecordError } from "./profile-records.js";

export function normalizeDocumentDetails(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error(translate("ui.documentInvalidDetails"));
  const config = documentDetailsConfig(),
    result = {};
  for (const [key, , type, options] of config.fields) {
    if (value[key] == null || value[key] === "") continue;
    if (
      typeof value[key] !== "string" ||
      value[key].length > 1000 ||
      (type === "select" && !Object.hasOwn(options, value[key]))
    )
      throw Error(translate("ui.documentInvalidDetails"));
    const text = value[key].trim();
    if (text && text !== "unspecified") result[key] = text;
  }
  const error = profileRecordError(config, result);
  if (error) throw Error(error);
  return result;
}

export function documentDetailsFromForm(form) {
  return normalizeDocumentDetails(
    Object.fromEntries(
      documentDetailsConfig().fields.map(([key]) => [
        key,
        form.get("document-" + key) || "",
      ]),
    ),
  );
}

export function documentReference(source) {
  const details = source.details || {};
  return [details.series, details.number, details.registrationNumber]
    .filter(Boolean)
    .join(" · ");
}
