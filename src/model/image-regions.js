import { propertyPeople } from "./property-records.js";
import { recordConfigs } from "../core/config.js";
import { translate, getLocale } from "../i18n/index.js";
import { personDisplayName } from "./person-display.js";
import { relationshipLabel } from "./relationship-labels.js";
import { displayDate } from "./dates.js";

export const MAX_IMAGE_REGIONS = 200;
const identifier = /^[\w-]{1,100}$/;
const keys = {
  person: ["personId"],
  record: ["personId", "section", "recordId"],
  relation: ["relationId"],
  property: ["propertyId"],
};

export function targetKey(target) {
  return [
    target.kind,
    ...(keys[target.kind] || []).map((key) => target[key]),
  ].join(":");
}

export function normalizeImageRegions(value = []) {
  if (!Array.isArray(value) || value.length > MAX_IMAGE_REGIONS)
    throw Error(translate("ui.invalidImageRegions"));
  const ids = new Set();
  return value.map((region) => {
    if (
      !region ||
      typeof region.id !== "string" ||
      !identifier.test(region.id) ||
      ids.has(region.id)
    )
      throw Error(translate("ui.invalidImageRegions"));
    ids.add(region.id);
    let rect = null;
    if (region.rect != null) {
      const { x, y, width, height } = region.rect;
      if (
        ![x, y, width, height].every(Number.isFinite) ||
        x < 0 ||
        y < 0 ||
        width <= 0 ||
        height <= 0 ||
        x + width > 1.000001 ||
        y + height > 1.000001
      )
        throw Error(translate("ui.invalidImageRegions"));
      rect = { x, y, width, height };
    }
    if (!Array.isArray(region.targets) || region.targets.length > 200)
      throw Error(translate("ui.invalidImageRegions"));
    const seen = new Set();
    const targets = region.targets.map((target) => {
      if (
        !target ||
        !Object.hasOwn(keys, target.kind) ||
        !keys[target.kind].every(
          (key) =>
            typeof target[key] === "string" && identifier.test(target[key]),
        )
      )
        throw Error(translate("ui.invalidImageRegions"));
      const result = {
        kind: target.kind,
        ...Object.fromEntries(
          keys[target.kind].map((key) => [key, target[key]]),
        ),
      };
      const key = targetKey(result);
      if (seen.has(key)) throw Error(translate("ui.invalidImageRegions"));
      seen.add(key);
      return result;
    });
    return {
      id: region.id,
      title: String(region.title || "").slice(0, 500),
      notes: String(region.notes || "").slice(0, 5000),
      rect,
      targets,
    };
  });
}

export function mediaTargetExists(project, target) {
  if (target.kind === "person")
    return project.people.some((p) => p.id === target.personId);
  if (target.kind === "record") {
    const config = recordConfigs()[target.section];
    return (
      !!config &&
      project.people.some(
        (p) =>
          p.id === target.personId &&
          (p[config.key] || []).some((r) => r.id === target.recordId),
      )
    );
  }
  if (target.kind === "relation")
    return project.relations.some((r) => r.id === target.relationId);
  if (target.kind === "property")
    return project.property.some((a) => a.id === target.propertyId);
  return false;
}

export function mediaTargetLabel(project, target) {
  if (["person", "record"].includes(target.kind)) {
    const person = project.people.find((p) => p.id === target.personId);
    if (!person) return "";
    if (target.kind === "person") return personDisplayName(person);
    const config = recordConfigs()[target.section],
      record = person[config?.key]?.find((r) => r.id === target.recordId);
    return record
      ? [
          personDisplayName(person),
          config.label,
          record.title ||
            record.awardName ||
            record.name ||
            record.institution ||
            record.burialCemetery ||
            record.organization ||
            record.address ||
            record.documentNumber ||
            record.number ||
            `${translate("ui.record")} ${(person[config.key] || []).indexOf(record) + 1}`,
          [
            record.from || record.date || record.awardDate || record.burialDate,
            record.to,
          ]
            .filter(Boolean)
            .map((value) => displayDate(value))
            .join(" — "),
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
  }
  if (target.kind === "relation") {
    const relation = project.relations.find((r) => r.id === target.relationId);
    return relation
      ? [
          project.people.find((p) => p.id === relation.from)?.name,
          relationshipLabel(relation),
          project.people.find((p) => p.id === relation.to)?.name,
        ].join(" · ")
      : "";
  }
  return project.property.find((a) => a.id === target.propertyId)?.title || "";
}

export function mediaTargetOptions(project) {
  const options = project.people.flatMap((p) => [
    { kind: "person", personId: p.id },
    ...Object.entries(recordConfigs()).flatMap(([section, cfg]) =>
      (p[cfg.key] || []).map((r) => ({
        kind: "record",
        personId: p.id,
        section,
        recordId: r.id,
      })),
    ),
  ]);
  options.push(
    ...project.relations.map((r) => ({ kind: "relation", relationId: r.id })),
    ...project.property.map((a) => ({ kind: "property", propertyId: a.id })),
  );
  return options
    .map((target) => ({ target, label: mediaTargetLabel(project, target) }))
    .sort((a, b) => a.label.localeCompare(b.label, getLocale()));
}

export function pruneImageTargets(project) {
  for (const source of project.documents)
    for (const file of source.attachments || [])
      for (const region of file.regions || [])
        region.targets = region.targets.filter((target) =>
          mediaTargetExists(project, target),
        );
}

export function targetPeople(project, target) {
  if (["person", "record"].includes(target.kind)) return [target.personId];
  if (target.kind === "relation") {
    const r = project.relations.find((r) => r.id === target.relationId);
    return r ? [r.from, r.to] : [];
  }
  if (target.kind === "property") {
    const asset = project.property.find(
      (asset) => asset.id === target.propertyId,
    );
    return asset ? [...propertyPeople(asset)] : [];
  }
  return [];
}

/** Explicit image links augment sources without replacing a record's existing provenance. */
export function personImageItems(project, personId, recordTarget = null) {
  const configs = recordConfigs();
  const person = project.people.find((p) => p.id === personId);
  if (!person) return [];
  const record =
    recordTarget &&
    person[configs[recordTarget.section]?.key]?.find(
      (r) => r.id === recordTarget.recordId,
    );
  const sourceIds = new Set(
    Object.values(configs).flatMap((cfg) =>
      (person[cfg.key] || []).map((r) => r.sourceId),
    ),
  );
  const items = [];
  for (const source of project.documents) {
    for (const file of source.attachments || []) {
      if (!file.mime.startsWith("image/")) continue;
      const regions = (file.regions || []).filter((region) =>
        region.targets.some((target) =>
          recordTarget
            ? target.kind === "record" &&
              target.personId === personId &&
              target.section === recordTarget.section &&
              target.recordId === recordTarget.recordId
            : targetPeople(project, target).includes(personId),
        ),
      );
      const direct = recordTarget
        ? record?.sourceId === source.id
        : (source.people || []).includes(personId) ||
          (source.subjectIds || []).includes(personId) ||
          sourceIds.has(source.id) ||
          (person.bioSourceIds || []).includes(source.id);
      if (regions.length)
        items.push(...regions.map((region) => ({ source, file, region })));
      else if (direct) items.push({ source, file, region: null });
    }
  }
  return items;
}

export function sourceImageTargets(source) {
  return (source.attachments || []).flatMap((file) =>
    (file.regions || []).flatMap((region) => region.targets),
  );
}

export function sourcePeopleIds(project, source) {
  return [
    ...new Set([
      ...(source.people || []),
      ...sourceImageTargets(source).flatMap((target) =>
        targetPeople(project, target),
      ),
    ]),
  ];
}
