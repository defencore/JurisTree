import { recordConfigs, sectionInfo } from "../core/config.js";
import { translate } from "../i18n/index.js";
import { dateExact, partialDate } from "./dates.js";
import { collectProfile } from "./profile-form.js";
import { profileRecordError } from "./profile-records.js";

export function chronologyError(p) {
  const birth = partialDate(p.birth),
    death = partialDate(p.death);
  if (
    birth &&
    death &&
    !birth.approximate &&
    !death.approximate &&
    death.max < birth.min
  )
    return translate("ui.deathCannotPrecedeBirth");
  for (const [key, label] of [
    ["residences", translate("ui.residence")],
    ["occupations", translate("ui.workEducation")],
  ])
    for (const record of p[key] || []) {
      for (const v of [record.from, record.to])
        if (/^\d{4}-\d{2}-\d{2}$/.test(v || "") && !dateExact(v))
          return label + translate("ui.enterAValidDate");
      const from = partialDate(record.from),
        to = partialDate(record.to);
      if (
        from &&
        to &&
        !from.approximate &&
        !to.approximate &&
        to.max < from.min
      )
        return label + translate("ui.endCannotPrecedeStart");
    }
  for (const pet of p.pets || []) {
    const from = partialDate(pet.birth),
      to = partialDate(pet.death);
    if (from && to && !from.approximate && !to.approximate && to.max < from.min)
      return translate("ui.petDeathCannotPrecedeBirth");
  }
  return "";
}
export function profileFormError(form, p) {
  const data = collectProfile(form, p);
  for (const [section, cfg] of Object.entries(recordConfigs())) {
    const limit = cfg.maximumRecords || 200;
    if (form.getAll(section + "-id").length > limit)
      return translate("ui.profileSectionRecordLimit", { limit });
    for (const record of data[cfg.key] || []) {
      const error = profileRecordError(cfg, record);
      if (error) return sectionInfo()[section][0] + ": " + error;
    }
  }
  for (const key of ["birthDate", "deathDate"])
    if (form.get(key) && !partialDate(form.get(key)))
      return translate("ui.enterAValidBirthOrDeathDate");
  return chronologyError({
    ...p,
    ...data,
    birth: form.get("birthDate") || "",
    death: form.get("deathDate") || "",
  });
}
