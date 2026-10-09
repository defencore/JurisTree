import { recordConfigs, sectionInfo } from "./config.js";
import { profileGroups } from "./profile-groups.js";

/** Shared metadata for section discovery, editing and complete profiles. */
export function profileCatalog() {
  const configs = recordConfigs();
  return profileGroups().map((group) => ({
    ...group,
    sections: group.sections.map((key) => ({
      key,
      label: sectionInfo()[key][0],
      icon: sectionInfo()[key][1],
      search: [
        group.label,
        sectionInfo()[key][0],
        ...(configs[key]?.fields || []).map(([, label]) => label),
        ...(configs[key]?.groups || []).map(({ label }) => label),
        ...(configs[key]?.fields || []).flatMap(([, , type, options]) =>
          type === "select" ? Object.values(options) : [],
        ),
        configs[key]?.sectionHint || "",
        configs[key]?.overview?.label || "",
      ].join(" "),
    })),
  }));
}

export function profileOverviewCount(person, cfg) {
  return Number(
    !!cfg.overview &&
      (!!person[cfg.overview.field]?.trim() ||
        !!person[cfg.overview.sourceIds]?.length),
  );
}

export function profileSectionCount(person, key) {
  const cfg = recordConfigs()[key];
  if (cfg)
    return (person[cfg.key] || []).length + profileOverviewCount(person, cfg);
  if (key === "biography") return person.biography ? 1 : 0;
  return 0;
}
