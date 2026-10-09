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
      ].join(" "),
    })),
  }));
}

export function profileSectionCount(person, key) {
  const cfg = recordConfigs()[key];
  if (cfg) return (person[cfg.key] || []).length;
  if (key === "biography") return person.biography ? 1 : 0;
  if (key === "interests") return person.hobbies || person.interests ? 1 : 0;
  if (key === "health") return person.health ? 1 : 0;
  return 0;
}
