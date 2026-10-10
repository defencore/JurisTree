import { translate } from "../../i18n/index.js";

/** Bound imported values and validate identifiers across all top-level collections. */
export function importContext(raw) {
  const ids = new Set();
  const list = (key, limit, optional = false) => {
    const value = raw[key] ?? (optional ? [] : null);
    if (!Array.isArray(value) || value.length > limit)
      throw Error(`${translate("ui.invalidList")} ` + key);
    return value.map((v) => {
      if (
        !v ||
        typeof v !== "object" ||
        typeof v.id !== "string" ||
        !/^[\w-]{1,100}$/.test(v.id) ||
        ids.has(v.id)
      )
        throw Error(translate("ui.invalidOrDuplicateIdentifiers"));
      ids.add(v.id);
      return v;
    });
  };
  return { list };
}
export const str = (value, maximum = 16000) =>
  String(value ?? "").slice(0, maximum);
export const arr = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string").slice(0, 2500)
    : [];
export const pos = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= 100000
    ? value
    : 40;
