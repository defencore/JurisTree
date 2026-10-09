import { recordConfigs } from "../core/config.js";

export function profileRecordTarget(project, { personId, section, recordId }) {
  const profile = project.people.find((person) => person.id === personId);
  const config = recordConfigs()[section];
  const record =
    config && profile?.[config.key]?.find((record) => record.id === recordId);
  return record &&
    config.fields.some(
      ([key, , type]) => key === "sourceId" && type === "source",
    )
    ? { profile, record, config, section }
    : null;
}

export function sourceRecordLinks(project, sourceId) {
  return project.people.flatMap((profile) =>
    Object.entries(recordConfigs()).flatMap(([section, config]) =>
      (profile[config.key] || [])
        .filter((record) => record.sourceId === sourceId)
        .map((record) => ({ profile, record, config, section })),
    ),
  );
}

export function recordSourceType(section, record) {
  if (record.kind === "award" || record.awardName) return "award";
  if (section === "death") return "death_notice";
  if (section === "military") return "archive";
  return "other";
}
