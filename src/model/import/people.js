import { recordConfigs, types } from "../../core/config.js";
import { uid } from "../../core/utils.js";
import { translate } from "../../i18n/index.js";
import { dateExact, partialDate } from "../dates.js";
import { migrateProfileHistory } from "../profile-migrations.js";
import { migrateProfileActivities } from "../profile-activities.js";
import { profileRecordError } from "../profile-records.js";
import { str, arr, pos } from "./schema.js";
import { chronologyError } from "../profile-validation.js";

export function normalizeImportedPerson(v, groupIds) {
  v = migrateProfileActivities(migrateProfileHistory(v));
  const x = {
    id: v.id,
    name: str(v.name, 150) || translate("ui.unnamed"),
    birth: str(v.birth, 40),
    death: str(v.death, 40),
    aliases: str(v.aliases, 500),
    place: str(v.place, 250),
    notes: str(v.notes, 15000),
    avatarId: str(v.avatarId, 100),
    favorite: v.favorite === true,
    gender: ["m", "f", "u", "x"].includes(v.gender) ? v.gender : "u",
    lifeStatus: v.death
      ? "deceased"
      : ["unknown", "living", "deceased"].includes(v.lifeStatus)
        ? v.lifeStatus
        : "unknown",
    x: pos(v.x),
    y: pos(v.y),
    requirements: Array.isArray(v.requirements)
      ? arr(v.requirements).filter((t) => types()[t])
      : null,
    groupIds: arr(v.groupIds).filter((id) => groupIds.has(id)),
    biography: str(v.biography, 30000),
    bioSourceIds: arr(v.bioSourceIds),
  };
  for (const [, cfg] of Object.entries(recordConfigs())) {
    if (cfg.overview) {
      x[cfg.overview.field] = str(
        v[cfg.overview.field],
        cfg.overview.maximumLength,
      );
      x[cfg.overview.sourceIds] = arr(v[cfg.overview.sourceIds]);
    }
    const records = v[cfg.key] || [];
    if (!Array.isArray(records) || records.length > (cfg.maximumRecords || 200))
      throw Error(translate("ui.tooManyProfileRecords"));
    const seen = new Set();
    x[cfg.key] = records.map((r) => {
      if (!r || typeof r !== "object")
        throw Error(translate("ui.invalidProfileRecord"));
      const id = str(r.id || uid(), 100);
      if (!/^[\w-]{1,100}$/.test(id) || seen.has(id))
        throw Error(translate("ui.invalidProfileRecordIdentifier"));
      seen.add(id);
      const out = {
        id,
      };
      for (const [key, , type, opts] of cfg.fields) {
        let value = str(r[key], type === "textarea" ? 5000 : 1500);
        if (type === "select" && !Object.hasOwn(opts, value))
          value = Object.keys(opts)[0];
        if (type === "date" && value && !dateExact(value))
          throw Error(translate("ui.invalidProfileDate"));
        out[key] = value;
      }
      const recordError = profileRecordError(cfg, out);
      if (recordError) throw Error(recordError);
      return out;
    });
  }
  for (const date of [x.birth, x.death])
    if (date && !partialDate(date))
      throw Error(translate("ui.invalidPersonDate"));
  const error = chronologyError(x);
  if (error) throw Error(error);
  return x;
}
