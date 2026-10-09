import { recordConfigs, sectionInfo } from "../core/config.js";

export function collectProfile(form) {
  const data = {};
  for (const section of Object.keys(sectionInfo())) {
    if (recordConfigs()[section]) {
      const cfg = recordConfigs()[section],
        ids = form.getAll(section + "-id");
      if (cfg.overview) {
        data[cfg.overview.field] = String(form.get(cfg.overview.field) || "");
        data[cfg.overview.sourceIds] = form.getAll(cfg.overview.sourceIds);
      }
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
              type !== "source" &&
              r[key].trim() &&
              (type !== "select" ||
                ![
                  "unspecified",
                  ...(section === "timeline" ? ["custom", "none"] : []),
                ].includes(r[key])),
          ),
        );
    } else if (section === "biography") {
      data.biography = String(form.get("biography") || "");
      data.bioSourceIds = form.getAll("bioSourceIds");
    }
  }
  return data;
}
