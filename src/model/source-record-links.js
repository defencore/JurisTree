import { documentSupportsRecord } from "./document-links.js";
import { sourceImageTargets, targetKey } from "./image-regions.js";
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
  const source = project.documents.find((source) => source.id === sourceId);
  const targets = new Set(
    source ? sourceImageTargets(source).map(targetKey) : [],
  );
  return project.people.flatMap((profile) =>
    Object.entries(recordConfigs()).flatMap(([section, config]) =>
      (profile[config.key] || [])
        .filter(
          (record) =>
            record.sourceId === sourceId ||
            (source &&
              documentSupportsRecord(source, {
                personId: profile.id,
                section,
                recordId: record.id,
              })) ||
            targets.has(
              targetKey({
                kind: "record",
                personId: profile.id,
                section,
                recordId: record.id,
              }),
            ),
        )
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

/** Include every supporting source once, preserving the primary source first. */
export function recordSources(project, target) {
  const primary = profileRecordTarget(project, target)?.record.sourceId;
  const key = targetKey({ kind: "record", ...target });
  const sources = project.documents.filter(
    (source) =>
      source.id === primary ||
      documentSupportsRecord(source, target) ||
      sourceImageTargets(source).some((link) => targetKey(link) === key),
  );
  return sources.sort(
    (a, b) => Number(b.id === primary) - Number(a.id === primary),
  );
}
