import { recordConfigs, sectionInfo } from "../core/config.js";

export function collectProfile(form) {
  const data = {};
  for (const section of Object.keys(sectionInfo())) {
    if (recordConfigs()[section]) {
      const cfg = recordConfigs()[section],
        ids = form.getAll(section + "-id");
      data[cfg.key] = ids
        .map((id, index) => {
          const record = {
            id,
          };
          for (const [key] of cfg.fields)
            record[key] = String(form.getAll(section + "-" + key)[index] || "");
          return record;
        })
        .filter((r) =>
          cfg.fields.some(
            ([key, , type]) =>
              !["select", "source"].includes(type) && r[key].trim(),
          ),
        );
    } else if (section === "biography") {
      data.biography = String(form.get("biography") || "");
      data.bioSourceIds = form.getAll("bioSourceIds");
    } else if (section === "interests") {
      data.hobbies = String(form.get("hobbies") || "");
      data.interests = String(form.get("interests") || "");
    } else {
      data.health = String(form.get("health") || "");
      data.healthSourceIds = form.getAll("healthSourceIds");
    }
  }
  return data;
}
