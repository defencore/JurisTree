import { propertyRecordConfigs } from "../core/property-records.js";
import { translate as t } from "../i18n/index.js";
import { profileRecordError } from "./profile-records.js";

export function propertyRecordError(kind, record) {
  const cfg = propertyRecordConfigs()[kind];
  if (!cfg) return t("ui.invalidProfileRecord");
  const error = profileRecordError(cfg, record);
  if (error) return error;
  if (
    kind === "transfers" &&
    ((record.currency && !/^[A-Z]{3}$/.test(record.currency)) ||
      (record.amount !== "" && record.amount != null && !record.currency))
  )
    return t("ui.propertyCurrencyError");
  const parties =
    kind === "transfers"
      ? [
          ["fromId", "fromExternal"],
          ["toId", "toExternal"],
        ]
      : [["personId", "externalPerson"]];
  if (parties.some(([id, text]) => !!record[id] === !!record[text]?.trim()))
    return t("ui.propertyChooseOneParty");
  if (
    kind === "transfers" &&
    record.kind !== "registration" &&
    record.fromId &&
    record.fromId === record.toId
  )
    return t("ui.propertySameTransferParties");
  if (
    record.sharePercent !== "" &&
    record.sharePercent != null &&
    Number(record.sharePercent) === 0
  )
    return t("ui.propertyPositiveShare");
  return "";
}

/** The archive boundary normalizes each ledger once; dates and observations remain explicitly entered. */
export function normalizePropertyRecords(asset, peopleIds) {
  const data = {};
  for (const [kind, cfg] of Object.entries(propertyRecordConfigs())) {
    const rows = asset[kind] ?? [];
    if (!Array.isArray(rows) || rows.length > 200)
      throw Error(t("ui.tooManyProfileRecords"));
    const seen = new Set();
    data[kind] = rows.map((row) => {
      if (
        !row ||
        typeof row !== "object" ||
        typeof row.id !== "string" ||
        !/^[\w-]{1,100}$/.test(row.id) ||
        seen.has(row.id)
      )
        throw Error(t("ui.invalidProfileRecordIdentifier"));
      seen.add(row.id);
      const record = { id: row.id };
      for (const [key, , type, options] of cfg.fields) {
        let value = String(row[key] ?? "").slice(
          0,
          type === "textarea" ? 5000 : 1500,
        );
        if (key === "currency") value = value.trim().toUpperCase();
        if (type === "select") {
          if (value && !Object.hasOwn(options, value))
            throw Error(t("ui.invalidProfileRecord"));
          value ||= Object.keys(options)[0];
        }
        if (type === "person" && value && !peopleIds.has(value)) {
          const external = {
            personId: "externalPerson",
            fromId: "fromExternal",
            toId: "toExternal",
          }[key];
          if (external && !row[external])
            record[external] = t("ui.personDeleted");
          value = "";
        }
        if (!Object.hasOwn(record, key)) record[key] = value;
      }
      const error = propertyRecordError(kind, record);
      if (error) throw Error(error);
      return record;
    });
  }
  return data;
}

export function propertyRecords(asset) {
  return ["rights", "transfers", "claims"].flatMap((kind) =>
    (asset[kind] || []).map((record) => ({ kind, record })),
  );
}
export function propertyPeople(asset) {
  const configs = propertyRecordConfigs();
  return new Set(
    [
      asset.ownerId,
      ...(asset.allocations || []).map((r) => r.personId),
      ...propertyRecords(asset).flatMap(({ kind, record }) =>
        configs[kind].fields
          .filter(([, , type]) => type === "person")
          .map(([key]) => record[key]),
      ),
    ].filter(Boolean),
  );
}
export function propertySources(asset) {
  return new Set(
    propertyRecords(asset)
      .map(({ record }) => record.sourceId)
      .filter(Boolean),
  );
}

/** Preserve a deleted party's label in the historical record instead of dropping the event. */
export function unlinkPropertyReference(asset, type, id, name = "") {
  for (const { kind, record } of propertyRecords(asset))
    for (const [key, , fieldType] of propertyRecordConfigs()[kind].fields) {
      if (fieldType !== type || record[key] !== id) continue;
      record[key] = "";
      const external = {
        personId: "externalPerson",
        fromId: "fromExternal",
        toId: "toExternal",
      }[key];
      if (external) record[external] = name || t("ui.personDeleted");
      else if (type === "person") {
        const label = propertyRecordConfigs()[kind].fields.find(
          ([field]) => field === key,
        )[1];
        record.notes = [
          record.notes,
          `${label}: ${name || t("ui.personDeleted")}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }
}
