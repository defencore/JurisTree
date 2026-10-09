import { normalizeProfileReferences } from "./profile-references.js";
import {
  defaultScopes,
  normalizeModePurposes,
} from "../core/workspace-modes.js";
import {
  evidenceTypes,
  groupColors,
  recordConfigs,
  relTypes,
  sectionInfo,
  statusTypes,
  types,
} from "../core/config.js";
import { normalizeGraphView } from "../core/graph-view.js";
import { normalizePersonFilter } from "../core/person-filter-fields.js";
import {
  isProfessionalRelationship,
  professionalFieldKeys,
} from "../core/professional-relationships.js";
import { propertyMetadataFields } from "../core/property-records.js";
import {
  relationshipConfig,
  relationshipFields,
} from "../core/relationships.js";
import { sourceEvidence, sourceVerificationConfig } from "../core/sources.js";
import { safeUrl, uid } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { dateExact, partialDate } from "./dates.js";
import { collectProfile } from "./profile-form.js";
import { migrateProfileHistory } from "./profile-migrations.js";
import {
  migrateProfileActivities,
  migrateProfileSectionKeys,
} from "./profile-activities.js";
import { profileRecordError } from "./profile-records.js";
import { fresh } from "./project.js";
import { MAP_VIEW_LIMIT, normalizeMapView } from "./map-views.js";
import {
  normalizePropertyRecords,
  propertyRecords,
} from "./property-records.js";

export function validateImport(raw) {
  if (!raw || raw.format !== "juristree" || raw.version !== 1)
    throw Error(translate("ui.unsupportedJuristreeArchive"));
  const p = fresh(),
    ids = new Set();
  for (const k of [
    "title",
    "purpose",
    "jurisdiction",
    "subjectId",
    "claimantId",
    "updatedAt",
  ])
    if (typeof raw[k] === "string") p[k] = raw[k].slice(0, 1500);
  if (!defaultScopes[p.purpose]) p.purpose = "family";
  p.demo = !!raw.demo;
  const list = (key, limit, optional = false) => {
      const value = raw[key] ?? (optional ? [] : null);
      if (!Array.isArray(value) || value.length > limit)
        throw Error(`${translate("ui.invalidList")} ` + key);
      return value.map((v) => {
        if (
          !v ||
          typeof v !== "object" ||
          typeof v.id !== "string" ||
          !/^[\w-]{1,100}$/.test(v.id) ||
          ids.has(v.id)
        )
          throw Error(translate("ui.invalidOrDuplicateIdentifiers"));
        ids.add(v.id);
        return v;
      });
    },
    str = (v, n = 16000) => String(v ?? "").slice(0, n),
    arr = (v) =>
      Array.isArray(v)
        ? v.filter((x) => typeof x === "string").slice(0, 2500)
        : [],
    pos = (v) =>
      typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 100000
        ? v
        : 40;
  p.groups = list("groups", 150, true).map((g) => ({
    id: g.id,
    name: str(g.name, 150) || translate("ui.familyGroup"),
    color: groupColors.includes(g.color) ? g.color : groupColors[0],
    notes: str(g.notes, 5000),
    collapsed: !!g.collapsed,
    x: Number.isFinite(g.x) ? pos(g.x) : null,
    y: Number.isFinite(g.y) ? pos(g.y) : null,
  }));
  p.personFilterViews = list("personFilterViews", 20, true).map((view) => {
    const name = str(view.name, 150).trim();
    if (!name) throw Error(translate("ui.filterNameRequired"));
    try {
      const query = normalizePersonFilter(view.query);
      if (
        query.rules.some(
          (r) =>
            r.field === "section" &&
            !Object.hasOwn(recordConfigs(), r.value) &&
            !["missing", "known"].includes(r.operator),
        )
      )
        throw Error("Invalid profile filter section");
      return { id: view.id, name, query };
    } catch {
      throw Error(translate("ui.filterInvalidCondition"));
    }
  });
  const groupIds = new Set(p.groups.map((g) => g.id));
  p.people = list("people", 600).map((v) => {
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
      if (
        !Array.isArray(records) ||
        records.length > (cfg.maximumRecords || 200)
      )
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
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !dateExact(date))
        throw Error(translate("ui.invalidPersonDate"));
    const error = chronologyError(x);
    if (error) throw Error(error);
    return x;
  });
  const peopleIds = new Set(p.people.map((x) => x.id));
  p.relations = list("relations", 2500).map((r) => {
    if (
      !peopleIds.has(r.from) ||
      !peopleIds.has(r.to) ||
      r.from === r.to ||
      !relTypes()[r.type]
    )
      throw Error(translate("ui.invalidRelationship"));
    const details = {};
    const cfg = relationshipConfig();
    for (const [key, , type, options] of cfg.fields) {
      let value = str(r[key], type === "textarea" ? 5000 : 1500);
      if (type === "select" && !Object.hasOwn(options, value))
        value = Object.keys(options)[0];
      details[key] = value;
    }
    const typeFields = relationshipFields(r.type).groups.flatMap(
      (g) => g.fields,
    );
    const unionOptions = typeFields.find((f) => f[0] === "unionKind")?.[3];
    if (
      details.unionKind !== "unspecified" &&
      !unionOptions?.[details.unionKind]
    )
      throw Error(translate("ui.invalidRelationship"));
    if (
      isProfessionalRelationship(r.type) &&
      !Object.hasOwn(
        typeFields.find((f) => f[0] === "status")[3],
        details.status,
      )
    )
      throw Error(translate("ui.invalidRelationship"));
    if (
      !isProfessionalRelationship(r.type) &&
      [...professionalFieldKeys].some(
        (key) => details[key] && details[key] !== "unspecified",
      )
    )
      throw Error(translate("ui.invalidRelationship"));
    const error = profileRecordError(cfg, details);
    if (error) throw Error(error);
    return {
      id: r.id,
      from: r.from,
      to: r.to,
      type: r.type,
      notes: str(r.notes),
      disputed: !!r.disputed,
      ...details,
    };
  });
  const relIds = new Set(p.relations.map((r) => r.id));
  p.graphView = normalizeGraphView(raw.graphView || {}, relIds);
  p.property = list("property", 500).map((a) => {
    const currency = String(a.currency || "")
      .trim()
      .toUpperCase();
    if (
      (currency && !/^[A-Z]{3}$/.test(currency)) ||
      (a.value !== "" && a.value != null && !currency)
    )
      throw Error(translate("ui.propertyCurrencyError"));
    const allocations = Array.isArray(a.allocations)
      ? a.allocations
          .filter((x) => x && peopleIds.has(x.personId))
          .map((x) => ({
            personId: x.personId,
            percent: Number(x.percent),
          }))
      : [];
    if (
      allocations.some(
        (x) => !Number.isFinite(x.percent) || x.percent < 0 || x.percent > 100,
      ) ||
      allocations.reduce((s, x) => s + x.percent, 0) > 100.001 ||
      new Set(allocations.map((x) => x.personId)).size !== allocations.length
    )
      throw Error(translate("ui.invalidPropertyShares"));
    const value = a.value === "" || a.value == null ? "" : Number(a.value);
    if (value !== "" && (!Number.isFinite(value) || value < 0))
      throw Error(translate("ui.invalidPropertyValue"));
    return {
      id: a.id,
      title: str(a.title, 250) || translate("ui.property"),
      ownerId: peopleIds.has(a.ownerId) ? a.ownerId : "",
      currency,
      ...Object.fromEntries(
        propertyMetadataFields().map((key) => [key, str(a[key], 1500)]),
      ),
      ...normalizePropertyRecords(a, peopleIds),
      value,
      notes: str(a.notes),
      allocations,
      x: pos(a.x),
      y: pos(a.y),
    };
  });
  const assetIds = new Set(p.property.map((a) => a.id));
  p.documents = list("documents", 1200).map((d) => {
    if (
      !Object.hasOwn(types(), d.type) ||
      !Object.hasOwn(statusTypes(), d.status) ||
      !Object.hasOwn(evidenceTypes(), d.evidence)
    )
      throw Error(translate("ui.invalidDocumentType"));
    const x = {
      id: d.id,
      type: d.type,
      status: d.status,
      evidence: sourceEvidence(d),
      purposes: normalizeModePurposes(d.purposes, {
        legacyDefault: !Object.hasOwn(raw, "modeVisibilityVersion"),
      }),
      people: [...new Set([...arr(d.people), ...arr(d.subjectIds)])].filter(
        (id) => peopleIds.has(id),
      ),
      subjectIds: Array.isArray(d.subjectIds)
        ? arr(d.subjectIds).filter((id) => peopleIds.has(id))
        : null,
      relations: arr(d.relations).filter((id) => relIds.has(id)),
      propertyIds: arr(d.propertyIds).filter((id) => assetIds.has(id)),
      x: pos(d.x),
      y: pos(d.y),
      size: Number(d.size) || 0,
    };
    for (const k of [
      "title",
      "assetId",
      "filename",
      "mime",
      "source",
      "repository",
      "reference",
      "sourceUrl",
      "accessedAt",
      "language",
      "date",
      "notes",
      "transcription",
    ])
      x[k] = str(d[k], k === "transcription" ? 30000 : 16000);
    for (const [key, , type, options] of sourceVerificationConfig().fields) {
      let value = str(d[key], type === "textarea" ? 5000 : 1500);
      if (type === "select" && !Object.hasOwn(options, value))
        value = Object.keys(options)[0];
      x[key] = value;
    }
    const sourceError = profileRecordError(sourceVerificationConfig(), x);
    if (sourceError) throw Error(sourceError);
    if (x.sourceUrl && !safeUrl(x.sourceUrl))
      throw Error(translate("ui.unsupportedSourceLink"));
    return x;
  });
  const docIds = new Set(p.documents.map((d) => d.id));
  for (const asset of p.property)
    for (const { record } of propertyRecords(asset))
      if (record.sourceId && !docIds.has(record.sourceId)) record.sourceId = "";
  for (const person of p.people) {
    for (const key of ["bioSourceIds", "healthSourceIds"])
      person[key] = person[key].filter((id) => docIds.has(id));
  }
  normalizeProfileReferences(p);
  const indegrees = new Map(p.people.map((x) => [x.id, 0])),
    children = new Map(p.people.map((x) => [x.id, []]));
  for (const r of p.relations)
    if (["parent", "adopted", "step_parent"].includes(r.type)) {
      indegrees.set(r.to, indegrees.get(r.to) + 1);
      children.get(r.from).push(r.to);
    }
  const queue = [...indegrees].filter(([, v]) => !v).map(([id]) => id);
  let processed = 0;
  while (queue.length) {
    const id = queue.shift();
    processed++;
    for (const child of children.get(id)) {
      indegrees.set(child, indegrees.get(child) - 1);
      if (!indegrees.get(child)) queue.push(child);
    }
  }
  if (processed !== p.people.length)
    throw Error(translate("ui.parentRelationshipsCreateAGenerationCycle"));
  p.scopePreferences = {};
  for (const purpose of Object.keys(defaultScopes)) {
    const value = raw.scopePreferences?.[purpose];
    if (Array.isArray(value))
      p.scopePreferences[purpose] = migrateProfileSectionKeys(value).filter(
        (k) => Object.hasOwn(sectionInfo(), k),
      );
  }
  if (!peopleIds.has(p.subjectId)) p.subjectId = "";
  if (!peopleIds.has(p.claimantId)) p.claimantId = "";
  try {
    p.mapViews = list("mapViews", MAP_VIEW_LIMIT, true).map((view) =>
      normalizeMapView(view, p),
    );
  } catch {
    throw Error(translate("ui.invalidMapViews"));
  }
  return p;
}
export function chronologyError(p) {
  const birth = partialDate(p.birth),
    death = partialDate(p.death);
  if (birth && death && death.max < birth.min)
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
      if (from && to && to.max < from.min)
        return label + translate("ui.endCannotPrecedeStart");
    }
  for (const pet of p.pets || []) {
    const from = partialDate(pet.birth),
      to = partialDate(pet.death);
    if (from && to && to.max < from.min)
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
    if (form.get(key) && !dateExact(form.get(key)))
      return translate("ui.enterAValidBirthOrDeathDate");
  return chronologyError({
    ...p,
    ...collectProfile(form, p),
    birth: form.get("birthDate") || form.get("birthYear") || "",
    death: form.get("deathDate") || form.get("deathYear") || "",
  });
}
